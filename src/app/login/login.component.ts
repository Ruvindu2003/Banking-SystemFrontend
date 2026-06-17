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
      
      let targetRoute = '/dashboard';
      let userRole = 'Standard Client';
      let userName = 'John Doe';
      
      if (email === 'admin@wealthsync.com') {
        targetRoute = '/admin';
        userRole = 'Super Admin';
        userName = 'Admin System Executive';
      } else if (email === 'manager@wealthsync.com') {
        targetRoute = '/manager';
        userRole = 'Wealth Manager';
        userName = 'Sarah Jenkins';
      } else if (email === 'client@wealthsync.com' || email === 'demo@wealthsync.com') {
        targetRoute = '/dashboard';
        userRole = 'Premium Client';
        userName = 'Alice Smith';
      } else {
        targetRoute = '/dashboard';
        userRole = 'Standard Client';
        // Capitalize split email name
        const rawName = email.split('@')[0];
        userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('ws_user_email', email);
        localStorage.setItem('ws_user_role', userRole);
        localStorage.setItem('ws_user_name', userName);
        
        // Also seed initial balance for the client if they are a client
        if (targetRoute === '/dashboard') {
          const initialBalance = userRole === 'Premium Client' ? '425000' : '12500';
          localStorage.setItem('ws_client_balance', initialBalance);
        }
      }

      this.loginSuccess.set(true);
      this.isLoading.set(false);
      
      setTimeout(() => {
        this.router.navigate([targetRoute]);
      }, 1500);
    }, 1200);
  }
}
