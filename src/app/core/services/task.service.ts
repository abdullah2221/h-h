import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.loadTasks();
  }

  private loadTasks(): void {
    const tasks = localStorage.getItem(this.STORAGE_KEY);
    if (tasks) {
      this.tasksSubject.next(JSON.parse(tasks));
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTask(id: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === id))
    );
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Observable<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    return of(newTask).pipe(
      tap(() => {
        const tasks = this.tasksSubject.value;
        this.saveTasks([...tasks, newTask]);
      })
    );
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const tasks = this.tasksSubject.value;
    const currentTask = tasks.find(task => task.id === id);
    
    if (!currentTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = { ...currentTask, ...updates };
    
    return of(updatedTask).pipe(
      tap(() => {
        const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
        this.saveTasks(updatedTasks);
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return of(void 0).pipe(
      tap(() => {
        const tasks = this.tasksSubject.value;
        this.saveTasks(tasks.filter(task => task.id !== id));
      })
    );
  }

  getTaskStats(): Observable<{
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  }> {
    return this.tasks$.pipe(
      map(tasks => ({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        mediumPriority: tasks.filter(t => t.priority === 'medium').length,
        lowPriority: tasks.filter(t => t.priority === 'low').length
      }))
    );
  }

  getCurrentTasks(): Task[] {
    return this.tasksSubject.value;
  }

  importTasks(tasks: Task[]): void {
    this.saveTasks(tasks);
  }

  // Helper method to add some sample tasks if the storage is empty
  initializeSampleTasks(): void {
    if (this.tasksSubject.value.length === 0) {
      const sampleTasks: Task[] = [
        {
          id: crypto.randomUUID(),
          title: 'Complete Project Setup',
          description: 'Set up the initial project structure and dependencies',
          status: 'completed',
          priority: 'high',
          dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          tags: ['setup', 'initialization'],
          dependsOn: []
        },
        {
          id: crypto.randomUUID(),
          title: 'Implement Task Management',
          description: 'Create the core task management functionality',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          tags: ['feature', 'core'],
          dependsOn: []
        },
        {
          id: crypto.randomUUID(),
          title: 'Design User Interface',
          description: 'Create wireframes and implement the UI components',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
          createdAt: new Date().toISOString(),
          tags: ['design', 'ui'],
          dependsOn: []
        }
      ];
      this.saveTasks(sampleTasks);
    }
  }
}