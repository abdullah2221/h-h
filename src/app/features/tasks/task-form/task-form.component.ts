import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task.model';

type TaskPriority = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'in-progress' | 'completed';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isEditMode = false;
  taskId: string | null = null;
  formSubmitted = false;
  today = new Date().toISOString().split('T')[0];
  private destroy$ = new Subject<void>();

  // Form field validation states
  fieldStates: { [key: string]: { touched: boolean; dirty: boolean; valid: boolean } } = {
    title: { touched: false, dirty: false, valid: false },
    description: { touched: false, dirty: false, valid: false },
    priority: { touched: false, dirty: false, valid: false },
    status: { touched: false, dirty: false, valid: false },
    dueDate: { touched: false, dirty: false, valid: false }
  };

  // Priority and status options
  readonly priorityOptions = [
    { value: 'high', label: 'High', icon: 'priority-high' },
    { value: 'medium', label: 'Medium', icon: 'priority-medium' },
    { value: 'low', label: 'Low', icon: 'priority-low' }
  ];

  readonly statusOptions = [
    { value: 'pending', label: 'Pending', icon: 'status-pending' },
    { value: 'in-progress', label: 'In Progress', icon: 'status-progress' },
    { value: 'completed', label: 'Completed', icon: 'status-completed' }
  ];

  constructor(
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupRouteSubscription();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      priority: ['', [Validators.required]],
      status: ['', [Validators.required]],
      dueDate: ['', [
        Validators.required,
        this.futureDateValidator()
      ]]
    });
  }

  private setupFormSubscriptions(): void {
    // Monitor form value changes
    this.taskForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.updateFieldStates();
        this.errorMessage = ''; // Clear error message on valid changes
      });

    // Monitor individual field changes
    Object.keys(this.fieldStates).forEach(fieldName => {
      const control = this.taskForm.get(fieldName);
      if (control) {
        control.statusChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.updateFieldState(fieldName, control);
          });
      }
    });
  }

  private setupRouteSubscription(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.isEditMode = true;
          this.taskId = params['id'];
          this.loadTask();
        }
      });
  }

  private updateFieldStates(): void {
    Object.keys(this.fieldStates).forEach(fieldName => {
      const control = this.taskForm.get(fieldName);
      if (control) {
        this.updateFieldState(fieldName, control);
      }
    });
  }

  private updateFieldState(fieldName: string, control: AbstractControl): void {
    this.fieldStates[fieldName] = {
      touched: control.touched || false,
      dirty: control.dirty || false,
      valid: control.valid || false
    };
  }

  private futureDateValidator(): Validators {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { pastDate: true };
      }
      return null;
    };
  }

  private loadTask(): void {
    if (!this.taskId) return;

    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          const task = tasks.find(t => t.id === this.taskId);
          if (task) {
            this.taskForm.patchValue({
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate.split('T')[0]
            });
          } else {
            this.handleError('Task not found');
          }
        },
        error: (error) => this.handleError('Failed to load task')
      });
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting || this.taskForm.invalid) {
      this.markFormFieldsAsTouched();
      return;
    }

    this.formSubmitted = true;
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const taskData: TaskFormData = this.taskForm.value;
      
      if (this.isEditMode && this.taskId) {
        await this.taskService.updateTask(this.taskId, taskData).toPromise();
      } else {
        await this.taskService.addTask(taskData as Omit<Task, 'id' | 'createdAt'>).toPromise();
      }

      this.showSuccessMessage();
      await this.navigateToTaskList();
    } catch (error) {
      this.handleError(
        this.isEditMode 
          ? 'Failed to update task. Please try again.'
          : 'Failed to create task. Please try again.'
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormFieldsAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach(fieldName => {
      const control = this.taskForm.get(fieldName);
      control?.markAsTouched();
      this.updateFieldState(fieldName, control!);
    });
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    if (message === 'Task not found') {
      setTimeout(() => this.navigateToTaskList(), 2000);
    }
  }

  private showSuccessMessage(): void {
    // You could implement a toast notification here
    console.log('Task saved successfully');
  }

  async navigateToTaskList(): Promise<void> {
    await this.router.navigate(['/tasks']);
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength} characters`;
    if (errors['pastDate']) return 'Due date must be in the future';
    return 'Invalid input';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.taskForm.get(fieldName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Task' : 'Create Task';
  }
} 