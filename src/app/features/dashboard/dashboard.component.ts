import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  };

  private subscription: Subscription = new Subscription();

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.subscription.add(
      this.taskService.getTaskStats().subscribe(stats => {
        this.stats = stats;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
} 