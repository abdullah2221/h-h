import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  stats: TaskStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0
  };

  tagDistribution: { name: string; count: number; percentage: number }[] = [];

  get completionRate(): number {
    return this.stats.total ? Math.round((this.stats.completed / this.stats.total) * 100) : 0;
  }
  
  constructor(private taskService: TaskService) {}
  
  ngOnInit() {
    this.loadTaskStats();
  }
  
  ngOnDestroy() {
    // Cleanup code if needed
  }
  
  private loadTaskStats() {
    this.taskService.getTasks().subscribe(tasks => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);

      // Reset stats
      this.stats = {
        total: tasks.length,
        completed: 0,
        inProgress: 0,
        pending: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0
      };

      // Calculate tag distribution
      this.updateTagStats(tasks);
    });
  }

  updateTagStats(tasks: Task[]): void {
    const tagCounts = new Map<string, number>();
    
    tasks.forEach(task => {
      // Safely handle optional tags
      task.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert tag counts to distribution
    this.tagDistribution = Array.from(tagCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / this.stats.total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }
}