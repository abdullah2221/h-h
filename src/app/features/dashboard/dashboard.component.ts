import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  highPriority: number;
  upcomingTasks: Task[];
  recentTasks: Task[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    upcomingTasks: [],
    recentTasks: []
  };

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.updateDashboardStats(tasks);
      });
  }

  private updateDashboardStats(tasks: Task[]): void {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate basic stats
    this.stats.total = tasks.length;
    this.stats.completed = tasks.filter(task => task.status === 'completed').length;
    this.stats.pending = tasks.filter(task => task.status === 'pending').length;
    this.stats.inProgress = tasks.filter(task => task.status === 'in-progress').length;
    this.stats.highPriority = tasks.filter(task => task.priority === 'high').length;

    // Get upcoming tasks (due within 30 days, not completed)
    this.stats.upcomingTasks = tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.status !== 'completed' && 
               dueDate >= now && 
               dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Get recent activity (last 5 tasks by creation date)
    this.stats.recentTasks = [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  getPriorityColor(priority: TaskPriority): string {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[priority];
  }

  getStatusColor(status: TaskStatus): string {
    const colors = {
      'completed': '#10b981',
      'in-progress': '#f59e0b',
      'pending': '#ef4444'
    };
    return colors[status];
  }

  getStatusIcon(status: TaskStatus): string {
    const icons = {
      'completed': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'in-progress': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
      'pending': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
    };
    return icons[status];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  navigateToTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  navigateToCreateTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  navigateToAllTasks(): void {
    this.router.navigate(['/tasks']);
  }
} 