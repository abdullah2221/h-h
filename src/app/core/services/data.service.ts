import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private taskService: TaskService) {}
  
  exportTasks(): string {
    const tasks = this.taskService.getCurrentTasks();
    return JSON.stringify(tasks);
  }
  
  importTasks(jsonData: string): boolean {
    try {
      const tasks = JSON.parse(jsonData) as Task[];
      this.taskService.importTasks(tasks);
      return true;
    } catch (error) {
      console.error('Failed to import tasks:', error);
      return false;
    }
  }
}