import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Angular Material Modules
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get f() { return this.loginForm.controls; }

  public getErrorMessage(field: string, errors: any): string {
    if (errors['required']) {
      return `${field} is required`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      return `${field} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      // No longer using MessageService from PrimeNG
      console.error('Please check the form for errors');
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        // Handle successful login, e.g., navigate
        console.log('Login successful');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        // Handle login error
        console.error('Login failed:', error);
        this.loading = false;
        // You might want to add a Material-based way to show errors to the user
      }
    });
  }

  // Social login methods - Keep if planning to integrate with Material Design
  loginWithGoogle() {
    console.info('Coming Soon', 'Google login will be available soon!');
  }

  loginWithFacebook() {
    console.info('Coming Soon', 'Facebook login will be available soon!');
  }

  loginWithGithub() {
    console.info('Coming Soon', 'GitHub login will be available soon!');
  }
} 