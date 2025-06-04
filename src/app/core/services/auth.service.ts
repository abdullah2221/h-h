import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'taskflow_users';
  private readonly TOKEN_KEY = 'taskflow_token';
  private readonly CURRENT_USER_KEY = 'taskflow_current_user';
  private currentUserSubject: BehaviorSubject<User | null>;

  constructor(private router: Router) {
    // Initialize current user from local storage
    const storedUser = localStorage.getItem(this.CURRENT_USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Register a new user
  register(name: string, email: string, password: string): Observable<AuthResponse> {
    // Get existing users from local storage
    const users = this.getUsers();
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return throwError(() => new Error('Email already registered'));
    }

    // Create new user
    const newUser: User = {
      id: this.generateId(),
      name,
      email
    };

    // Store user data (including password) in local storage
    const userData = {
      ...newUser,
      password // In a real app, you would hash the password
    };
    users.push(userData);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    // Simulate API delay and return success response
    return of({
      user: newUser,
      token: this.generateToken()
    }).pipe(
      delay(500),
      tap(() => {
        // After registration, redirect to login page
        this.router.navigate(['/login']);
      })
    );
  }

  // Login user
  login(email: string, password: string): Observable<AuthResponse> {
    // Get users from local storage
    const users = this.getUsers();
    
    // Find user with matching email and password
    const userData = users.find(user => 
      user.email === email && user.password === password
    );

    if (!userData) {
      return throwError(() => new Error('Invalid email or password'));
    }

    // Create user object without password
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email
    };

    // Generate token and create response
    const response: AuthResponse = {
      user,
      token: this.generateToken()
    };

    // Simulate API delay
    return of(response).pipe(
      delay(500),
      tap(authResponse => {
        // Store token and user in local storage
        localStorage.setItem(this.TOKEN_KEY, authResponse.token);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(authResponse.user));
        this.currentUserSubject.next(authResponse.user);
      })
    );
  }

  // Logout user
  logout(): void {
    // Clear local storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // Get all users from local storage
  private getUsers(): any[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  // Generate a unique ID for new users
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Generate a token
  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }
} 