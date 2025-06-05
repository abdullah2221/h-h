import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTaskView: 'list' | 'kanban';
  defaultSortField: string;
  defaultSortDirection: 'asc' | 'desc';
  showCompletedTasks: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly STORAGE_KEY = 'user_preferences';
  private defaultPreferences: UserPreferences = {
    theme: 'system',
    defaultTaskView: 'list',
    defaultSortField: 'dueDate',
    defaultSortDirection: 'asc',
    showCompletedTasks: true
  };
  
  private preferencesSubject = new BehaviorSubject<UserPreferences>(this.defaultPreferences);
  preferences$ = this.preferencesSubject.asObservable();
  
  constructor() {
    this.loadPreferences();
  }
  
  private loadPreferences(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        this.preferencesSubject.next({
          ...this.defaultPreferences,
          ...preferences
        });
      } catch (error) {
        console.error('Failed to parse preferences:', error);
      }
    }
  }
  
  updatePreferences(updates: Partial<UserPreferences>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...updates };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    this.preferencesSubject.next(updated);
  }
  
  resetToDefaults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.preferencesSubject.next(this.defaultPreferences);
  }
}