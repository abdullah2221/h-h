import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <button class="notifications-trigger" (click)="toggleNotifications()">
        <i class="material-icons">notifications</i>
        <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </button>

      <div class="notifications-dropdown" *ngIf="isOpen">
        <div class="notifications-header">
          <h3>Notifications</h3>
          <button class="mark-all-read" (click)="markAllAsRead()" *ngIf="unreadCount > 0">
            Mark all as read
          </button>
        </div>

        <div class="notifications-list">
          <div *ngIf="notifications.length === 0" class="no-notifications">
            No notifications
          </div>
          
          <div *ngFor="let notification of notifications" 
               class="notification-item"
               [class.unread]="!notification.read"
               [class.type-{{notification.type}}]="true">
            <div class="notification-content">
              <p class="message">{{ notification.message }}</p>
              <span class="timestamp">{{ notification.timestamp | date:'short' }}</span>
            </div>
            <button class="mark-read" *ngIf="!notification.read" (click)="markAsRead(notification)">
              <i class="material-icons">check</i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: relative;
    }

    .notifications-trigger {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      position: relative;
      color: #4b5563;
      border-radius: 0.375rem;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #2563eb;
      }
    }

    .notification-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      transform: translate(50%, -50%);
    }

    .notifications-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 320px;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      margin-top: 0.5rem;
      z-index: 50;
    }

    .notifications-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
      }
    }

    .mark-all-read {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;

      &:hover {
        background: #eff6ff;
      }
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;

      &.unread {
        background: #f9fafb;
      }

      &.type-success {
        border-left: 4px solid #10b981;
      }

      &.type-warning {
        border-left: 4px solid #f59e0b;
      }

      &.type-error {
        border-left: 4px solid #ef4444;
      }

      &.type-info {
        border-left: 4px solid #3b82f6;
      }
    }

    .notification-content {
      flex: 1;

      .message {
        margin: 0 0 0.25rem;
        color: #111827;
        font-size: 0.875rem;
      }

      .timestamp {
        color: #6b7280;
        font-size: 0.75rem;
      }
    }

    .mark-read {
      background: none;
      border: none;
      color: #6b7280;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 0.25rem;

      &:hover {
        background: #f3f4f6;
        color: #2563eb;
      }
    }

    .no-notifications {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isOpen = false;
  unreadCount = 0;
  
  ngOnInit() {
    // Simulate some notifications
    this.notifications = [
      {
        id: 1,
        message: 'New task assigned: "Complete project documentation"',
        type: 'info',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        message: 'Task "Update user interface" completed',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: 3,
        message: 'Deadline approaching for "Implement authentication"',
        type: 'warning',
        timestamp: new Date(Date.now() - 7200000),
        read: true
      }
    ];
    this.updateUnreadCount();
  }
  
  toggleNotifications() {
    this.isOpen = !this.isOpen;
  }
  
  markAsRead(notification: Notification) {
    notification.read = true;
    this.updateUnreadCount();
  }
  
  markAllAsRead() {
    this.notifications.forEach(notification => notification.read = true);
    this.updateUnreadCount();
      }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }
}