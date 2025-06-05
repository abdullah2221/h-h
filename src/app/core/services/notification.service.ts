import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();
  
  addNotification(message: string, type: 'info' | 'warning' | 'success' | 'error'): void {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const current = this.notifications.value;
    this.notifications.next([...current, newNotification]);
  }
  
  markAsRead(id: string): void {
    const current = this.notifications.value;
    const updated = current.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    this.notifications.next(updated);
  }
  
  clearAll(): void {
    this.notifications.next([]);
  }
}