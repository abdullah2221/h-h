import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit {
  pendingTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completedTasks: Task[] = [];
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.loadTasks();
  }
  
  loadTasks(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.pendingTasks = tasks.filter(task => task.status === 'pending');
      this.inProgressTasks = tasks.filter(task => task.status === 'in-progress');
      this.completedTasks = tasks.filter(task => task.status === 'completed');
    });
  }
  
  updateTaskStatus(task: Task, newStatus: 'pending' | 'in-progress' | 'completed'): void {
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        // Refresh the task lists
        this.loadTasks();
        
        // Show notification based on the new status
        if (newStatus === 'completed') {
          this.notificationService.addNotification(
            `Task "${task.title}" marked as complete!`, 
            'success'
          );
        } else if (newStatus === 'in-progress') {
          this.notificationService.addNotification(
            `Task "${task.title}" moved to In Progress`, 
            'info'
          );
        } else {
          this.notificationService.addNotification(
            `Task "${task.title}" moved to Pending`, 
            'info'
          );
        }
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.notificationService.addNotification(
          'Failed to update task status', 
          'error'
        );
      }
    });
  }
}