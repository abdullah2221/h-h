import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private checkInterval: any;
  private readonly REMINDER_THRESHOLD_HOURS = 24; // Remind about tasks due within 24 hours
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {}
  
  startReminderChecks(): void {
    // Check for upcoming tasks every hour
    this.checkInterval = setInterval(() => this.checkUpcomingTasks(), 3600000);
    
    // Also check immediately on startup
    this.checkUpcomingTasks();
  }
  
  stopReminderChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
  
  private checkUpcomingTasks(): void {
    this.taskService.getTasks().subscribe(tasks => {
      const now = new Date();
      const reminderThreshold = new Date(now.getTime() + this.REMINDER_THRESHOLD_HOURS * 3600000);
      
      // Find tasks that are due soon and not completed
      const upcomingTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= reminderThreshold;
      });
      
      // Send notifications for upcoming tasks
      upcomingTasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        const hoursLeft = Math.round((dueDate.getTime() - now.getTime()) / 3600000);
        
        this.notificationService.addNotification(
          `Task "${task.title}" is due in ${hoursLeft} hours!`,
          'warning'
        );
      });
    });
  }
}