import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface SavingsGoal {
  name: string;
  current: number;
  target: number;
  color: string;
}

interface ClientTransaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: Date;
  status: 'Complete' | 'Pending' | 'Flagged';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Profile Information Signals
  userName = signal('Alice Smith');
  userRole = signal('Premium Client');
  userEmail = signal('client@wealthsync.com');
  accountNumber = signal('WS-ACC-99203');
  
  // Financial Signals
  balance = signal(425000.00);
  creditLimit = signal(50000.00);
  creditUsed = signal(1254.80);
  monthlyInvestments = signal(8540.00);

  // Goals
  goals = signal<SavingsGoal[]>([
    { name: 'Swiss Chalet Fund', current: 154000, target: 250000, color: 'bg-primary' },
    { name: 'Venture Capital Allocation', current: 85000, target: 100000, color: 'bg-accent' },
    { name: 'Tesla Roadster II Deposit', current: 35000, target: 50000, color: 'bg-blue-500' }
  ]);

  // Transactions
  transactions = signal<ClientTransaction[]>([
    { id: 'TX-901', name: 'J.P. Sterling Investment', category: 'Investment', amount: -25000.00, date: new Date(Date.now() - 3600000 * 2), status: 'Complete' },
    { id: 'TX-902', name: 'Dividend Payout US30', category: 'Income', amount: 4890.50, date: new Date(Date.now() - 3600000 * 24), status: 'Complete' },
    { id: 'TX-903', name: 'Private Jet Charter Co', category: 'Travel', amount: -8500.00, date: new Date(Date.now() - 3600000 * 48), status: 'Complete' },
    { id: 'TX-904', name: 'Bespoke Tailoring London', category: 'Shopping', amount: -2450.00, date: new Date(Date.now() - 3600000 * 72), status: 'Complete' }
  ]);

  // Toast System
  toasts = signal<{ id: number; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);
  private toastIdCounter = 0;

  // Forms
  transferForm: FormGroup = this.fb.group({
    payeeName: ['', [Validators.required, Validators.minLength(3)]],
    accountNum: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,15}$/)]],
    amount: ['', [Validators.required, Validators.min(10)]]
  });

  goalForm: FormGroup = this.fb.group({
    goalName: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]]
  });

  // Modals
  isTransferModalOpen = signal(false);
  isGoalModalOpen = signal(false);

  constructor() {
    // Load Client details from LocalStorage if they exist (allows sync with Admin changes)
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('ws_user_email');
      const role = localStorage.getItem('ws_user_role');
      const name = localStorage.getItem('ws_user_name');
      const savedBalance = localStorage.getItem('ws_client_balance');

      if (email) this.userEmail.set(email);
      if (role) this.userRole.set(role);
      if (name) this.userName.set(name);
      
      if (savedBalance) {
        this.balance.set(Number(savedBalance));
      } else {
        // Fallback standard vs premium default seed balance
        const defaultBal = role === 'Premium Client' ? 425000.00 : 12500.00;
        this.balance.set(defaultBal);
        localStorage.setItem('ws_client_balance', String(defaultBal));
      }
    }
  }

  // Actions
  onLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ws_user_email');
      localStorage.removeItem('ws_user_role');
      localStorage.removeItem('ws_user_name');
    }
    this.router.navigate(['/login']);
  }

  openTransferModal(): void {
    this.transferForm.reset();
    this.isTransferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
  }

  onTransferSubmit(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const { payeeName, accountNum, amount } = this.transferForm.value;
    const numericAmount = Number(amount);

    if (this.balance() < numericAmount) {
      this.addToast('Insufficient funds for this transfer request', 'error');
      return;
    }

    // Process local transfer
    const updatedBalance = this.balance() - numericAmount;
    this.balance.set(updatedBalance);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_client_balance', String(updatedBalance));
      this.syncBalanceToUsersList(updatedBalance);
    }

    // Add to transaction log
    const newTx: ClientTransaction = {
      id: `TX-${900 + this.transactions().length + 1}`,
      name: `Transfer to ${payeeName}`,
      category: 'Transfer',
      amount: -numericAmount,
      date: new Date(),
      status: numericAmount >= 100000 ? 'Flagged' : 'Complete'
    };

    this.transactions.update(curr => [newTx, ...curr]);
    this.closeTransferModal();

    if (newTx.status === 'Flagged') {
      this.addToast('Transfer placed. High-value transfer flagged for manager validation.', 'warning');
    } else {
      this.addToast(`Successfully transferred $${numericAmount.toLocaleString()} to ${payeeName}`, 'success');
    }
  }

  openGoalModal(): void {
    this.goalForm.reset({
      goalName: this.goals().length ? this.goals()[0].name : ''
    });
    this.isGoalModalOpen.set(true);
  }

  closeGoalModal(): void {
    this.isGoalModalOpen.set(false);
  }

  onGoalSubmit(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const { goalName, amount } = this.goalForm.value;
    const numericAmount = Number(amount);

    if (this.balance() < numericAmount) {
      this.addToast('Insufficient funds to credit savings target', 'error');
      return;
    }

    // Deduct from balance
    const updatedBalance = this.balance() - numericAmount;
    this.balance.set(updatedBalance);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_client_balance', String(updatedBalance));
      this.syncBalanceToUsersList(updatedBalance);
    }

    // Add progress to goal
    this.goals.update(currGoals =>
      currGoals.map(g => g.name === goalName ? { ...g, current: Math.min(g.target, g.current + numericAmount) } : g)
    );

    // Add transaction log
    const newTx: ClientTransaction = {
      id: `TX-${900 + this.transactions().length + 1}`,
      name: `Savings Credit: ${goalName}`,
      category: 'Savings',
      amount: -numericAmount,
      date: new Date(),
      status: 'Complete'
    };

    this.transactions.update(curr => [newTx, ...curr]);
    this.closeGoalModal();
    this.addToast(`Credited $${numericAmount.toLocaleString()} to ${goalName}`, 'success');
  }

  private syncBalanceToUsersList(newBalance: number): void {
    if (typeof window !== 'undefined') {
      const email = this.userEmail().toLowerCase();
      const storedUsers = localStorage.getItem('ws_users_list');
      if (storedUsers) {
        try {
          const allUsers = JSON.parse(storedUsers);
          const updatedUsers = allUsers.map((u: any) => u.email.toLowerCase() === email ? { ...u, balance: newBalance } : u);
          localStorage.setItem('ws_users_list', JSON.stringify(updatedUsers));
        } catch (e) {
          console.error('Failed to sync updated balance to ws_users_list', e);
        }
      }
    }
  }

  // Toasts
  addToast(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info'): void {
    const id = this.toastIdCounter++;
    this.toasts.update(current => [...current, { id, message, type }]);
    
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
