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

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Observable<Task> {
    const tasks = this.tasksSubject.value;
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    return of(newTask).pipe(
      tap(() => this.saveTasks([...tasks, newTask]))
    );
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const tasks = this.tasksSubject.value;
    const updatedTask = tasks.find(task => task.id === id);
    
    if (!updatedTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const finalTask = { ...updatedTask, ...updates };
    
    return of(finalTask).pipe(
      tap(() => {
        const updatedTasks = tasks.map(task => 
          task.id === id ? finalTask : task
        );
        this.saveTasks(updatedTasks);
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    const tasks = this.tasksSubject.value;
    const taskExists = tasks.some(task => task.id === id);
    
    if (!taskExists) {
      throw new Error(`Task with id ${id} not found`);
    }

    return of(void 0).pipe(
      tap(() => {
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
} 