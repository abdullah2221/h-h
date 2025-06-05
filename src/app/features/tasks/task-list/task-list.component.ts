import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  searchQuery = '';
  statusFilter: 'all' | TaskStatus = 'all';
  priorityFilter: 'all' | TaskPriority = 'all';
  sortBy: 'dueDate' | 'priority' | 'title' = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'asc';
  stats: TaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  };
  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks(): void {
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = tasks;
        this.updateStats();
        this.applyFilters();
      });
  }

  updateStats(): void {
    this.stats = {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      highPriority: this.tasks.filter(t => t.priority === 'high').length,
      mediumPriority: this.tasks.filter(t => t.priority === 'medium').length,
      lowPriority: this.tasks.filter(t => t.priority === 'low').length
    };
  }

  applyFilters(): void {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesSearch = !this.searchQuery || 
        task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.statusFilter === 'all' || task.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'all' || task.priority === this.priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    this.sortTasks();
  }

  sortTasks(): void {
    this.filteredTasks.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.sortTasks();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortTasks();
  }

  getPriorityColor(priority: TaskPriority): string {
    const colors = {
      high: '#c62828',
      medium: '#ef6c00',
      low: '#2e7d32'
    };
    return colors[priority];
  }

  getStatusColor(status: TaskStatus): string {
    const colors = {
      'pending': '#f57c00',
      'in-progress': '#1976d2',
      'completed': '#2e7d32'
    };
    return colors[status];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
          }
        });
    }
  }
}