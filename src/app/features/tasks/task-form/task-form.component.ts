import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isEditMode = false;
  taskId: string | null = null;
  formSubmitted = false;
  today = new Date().toISOString().split('T')[0];
  tags: string[] = [];
  availableDependencies: Task[] = [];
  selectedDependencies: Task[] = [];
  private destroy$ = new Subject<void>();

  // Form field validation states
  fieldStates: { [key: string]: { touched: boolean; dirty: boolean; valid: boolean } } = {
    title: { touched: false, dirty: false, valid: false },
    description: { touched: false, dirty: false, valid: false },
    priority: { touched: false, dirty: false, valid: false },
    status: { touched: false, dirty: false, valid: false },
    dueDate: { touched: false, dirty: false, valid: false },
    tags: { touched: false, dirty: false, valid: false },
    dependsOn: { touched: false, dirty: false, valid: false }
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
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      status: ['pending' as TaskStatus, Validators.required],
      priority: ['medium' as TaskPriority, Validators.required],
      dueDate: ['', [Validators.required, this.futureDateValidator()]],
      tags: [''],
      dependsOn: [[]]
    });
  }

  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return date < today ? { pastDate: true } : null;
    };
  }

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      this.isEditMode = true;
      this.taskId = taskId;
      this.loadTask(taskId);
    }
    this.loadDependencies();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.errorMessage = '';
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

    // Monitor tags input
    this.taskForm.get('tags')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && typeof value === 'string' && value.endsWith(',')) {
          const newTag = value.slice(0, -1).trim();
          if (newTag && !this.tags.includes(newTag)) {
            this.tags.push(newTag);
            this.taskForm.patchValue({ tags: '' }, { emitEvent: false });
          }
        }
      });
  }

  private loadTask(taskId: string): void {
    this.taskService.getTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate.split('T')[0],
            tags: '',
            dependsOn: task.dependsOn || []
          });
          this.tags = task.tags || [];
          this.updateSelectedDependencies(task.dependsOn || []);
        },
        error: () => {
          this.router.navigate(['/tasks']);
        }
      });
  }

  private loadDependencies(): void {
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.availableDependencies = tasks.filter(task => 
          !this.isEditMode || task.id !== this.taskId
        );
      });
  }

  private updateSelectedDependencies(dependencyIds: string[]): void {
    this.selectedDependencies = this.availableDependencies.filter(task => 
      dependencyIds.includes(task.id)
    );
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

  async onSubmit(): Promise<void> {
    if (this.isSubmitting || this.taskForm.invalid) {
      this.markFormFieldsAsTouched();
      return;
    }

    this.formSubmitted = true;
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.taskForm.value;
      
      const taskData: Partial<Task> = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: formValue.dueDate,
        tags: this.tags,
        dependsOn: this.selectedDependencies.map(dep => dep.id)
      };

      if (this.isEditMode && this.taskId) {
        await firstValueFrom(this.taskService.updateTask(this.taskId, taskData));
      } else {
        await firstValueFrom(this.taskService.createTask(taskData as Task));
      }

      await this.router.navigate(['/tasks']);
    } catch (error) {
      this.errorMessage = this.isEditMode 
        ? 'Failed to update task. Please try again.'
        : 'Failed to create task. Please try again.';
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

  isFieldInvalid(fieldName: string): boolean {
    const control = this.taskForm.get(fieldName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

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

  onCancel(): void {
    this.router.navigate(['/tasks']);
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  removeDependency(taskId: string): void {
    const currentDeps = this.taskForm.get('dependsOn')?.value || [];
    const updatedDeps = currentDeps.filter((id: string) => id !== taskId);
    this.taskForm.patchValue({ dependsOn: updatedDeps });
    this.selectedDependencies = this.selectedDependencies.filter(d => d.id !== taskId);
  }

  isDependencySelected(taskId: string): boolean {
    return this.selectedDependencies.some(d => d.id === taskId);
  }

  onDependenciesChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedIds = Array.from(select.selectedOptions).map(option => option.value);
    this.updateSelectedDependencies(selectedIds);
  }
} 