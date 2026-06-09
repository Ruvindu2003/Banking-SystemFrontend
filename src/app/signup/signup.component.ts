import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State signals
  showPassword = signal(false);
  isLoading = signal(false);
  signupError = signal<string | null>(null);
  signupSuccess = signal(false);
  
  // Password strength signal: 0 (very weak) to 4 (strong)
  passwordStrength = signal(0);
  passwordStrengthLabel = signal('Very Weak');
  passwordStrengthClass = signal('bg-red-500 w-1/4');

  // Form Group
  signupForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  ngOnInit(): void {
    // Monitor password input to dynamically update strength score
    this.signupForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.calculatePasswordStrength(val || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Custom password matching validator
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear error if they now match (ensure other errors are not overwritten)
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(val => !val);
  }

  calculatePasswordStrength(password: string): void {
    let score = 0;
    if (!password) {
      score = 0;
    } else {
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
    }

    this.passwordStrength.set(score);

    switch (score) {
      case 0:
      case 1:
        this.passwordStrengthLabel.set('Weak');
        this.passwordStrengthClass.set('bg-red-500 w-1/4');
        break;
      case 2:
        this.passwordStrengthLabel.set('Fair');
        this.passwordStrengthClass.set('bg-orange-500 w-2/4');
        break;
      case 3:
        this.passwordStrengthLabel.set('Good');
        this.passwordStrengthClass.set('bg-yellow-500 w-3/4');
        break;
      case 4:
        this.passwordStrengthLabel.set('Strong');
        this.passwordStrengthClass.set('bg-primary w-full shadow-[0_0_10px_rgba(13,183,107,0.5)]');
        break;
    }
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.signupError.set(null);

    // Simulate backend user registration
    setTimeout(() => {
      this.signupSuccess.set(true);
      this.isLoading.set(false);
      
      // Auto redirect to Login page after a short success display
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    }, 1500);
  }
}
