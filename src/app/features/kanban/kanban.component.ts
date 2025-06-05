import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';

interface KanbanColumn {
  id: Task['status'];
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss']
})
export class KanbanComponent implements OnInit {
  columns: KanbanColumn[] = [
    { id: 'pending', title: 'To Do', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'completed', title: 'Done', tasks: [] }
  ];

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    // Initialize sample tasks if storage is empty
    this.taskService.initializeSampleTasks();
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        // Reset all columns
        this.columns.forEach(column => column.tasks = []);
        
        // Distribute tasks to appropriate columns
        tasks.forEach(task => {
          const column = this.columns.find(col => col.id === task.status);
          if (column) {
            column.tasks.push(task);
          }
        });
      },
      error: (error: Error) => {
        console.error('Error loading tasks:', error);
        // Here you could show a user-friendly error message
      }
    });
  }

  getConnectedColumns(): string[] {
    return this.columns.map(column => column.id);
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status
      const task = event.container.data[event.currentIndex];
      const newStatus = event.container.id as Task['status'];
      
      this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
        error: (error: Error) => {
          console.error('Error updating task status:', error);
          // Revert the move if the update fails
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          // Here you could show a user-friendly error message
        }
      });
    }
  }
} 