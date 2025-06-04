import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" *ngIf="currentUser">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">Your App</a>
        <div class="navbar-menu">
          <div class="navbar-end">
            <div class="navbar-item">
              <span class="user-name">Welcome, {{ currentUser.name }}</span>
              <button class="logout-button" (click)="logout()">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background: white;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar-brand {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
    }

    .navbar-end {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .navbar-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      color: #475569;
      font-weight: 500;
    }

    .logout-button {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #dc2626;
      }
    }

    main {
      padding-top: 4rem;
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}
