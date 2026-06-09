import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Signalling state
  showPassword = signal(false);
  isLoading = signal(false);
  loginError = signal<string | null>(null);
  loginSuccess = signal(false);

  // Form Group
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(val => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set(null);

    // Simulate backend communication
    setTimeout(() => {
      const { email, password } = this.loginForm.value;
      
      // Basic mock authentication demo
      if (email === 'demo@wealthsync.com' && password === 'password123') {
        this.loginSuccess.set(true);
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      } else if (email !== 'demo@wealthsync.com') {
        // Allow user to log in anyway for demo purposes, but show notice for specific mock user
        this.loginSuccess.set(true);
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      } else {
        this.loginError.set('Invalid email or password. Hint: Use demo@wealthsync.com and password123');
        this.isLoading.set(false);
      }
    }, 1200);
  }
}
