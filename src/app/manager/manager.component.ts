import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LiveStatusBarComponent } from '../shared/live-status-bar/live-status-bar.component';

interface ManagedClient {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Suspended' | 'Flagged';
  riskProfile: 'Conservative' | 'Balanced' | 'Aggressive';
}

interface PendingApproval {
  id: string;
  clientName: string;
  clientId: string;
  type: string;
  amount: number;
  flagReason: string;
  timestamp: Date;
}

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LiveStatusBarComponent],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  // Manager Metadata
  managerName = signal('Sarah Jenkins');
  managerRole = signal('Senior Wealth Executive');
  managerEmail = signal('manager@wealthsync.com');

  // Managed Clients
  clients = signal<ManagedClient[]>([
    { id: 'USR-001', name: 'John Doe', email: 'john.doe@wealthsync.com', balance: 2459203.18, status: 'Active', riskProfile: 'Balanced' },
    { id: 'USR-002', name: 'Alice Smith', email: 'alice.smith@wealthsync.com', balance: 425000.00, status: 'Active', riskProfile: 'Conservative' },
    { id: 'USR-003', name: 'Bob Jones', email: 'bob.jones@wealthsync.com', balance: 12500.00, status: 'Suspended', riskProfile: 'Conservative' },
    { id: 'USR-005', name: 'Charlie Brown', email: 'charlie.brown@wealthsync.com', balance: 3200.00, status: 'Flagged', riskProfile: 'Balanced' }
  ]);

  // Transaction Approvals Queue
  approvals = signal<PendingApproval[]>([
    { id: 'APP-701', clientName: 'Alice Smith', clientId: 'USR-002', type: 'Wire Outflow', amount: 150000.00, flagReason: 'High Volume Limit Exceeded', timestamp: new Date(Date.now() - 3600000) },
    { id: 'APP-702', clientName: 'Charlie Brown', clientId: 'USR-005', type: 'Brokerage Buy', amount: 120000.00, flagReason: 'Account Flagged Warning Lock', timestamp: new Date(Date.now() - 3600000 * 3) }
  ]);

  // Communications Form
  messageForm: FormGroup = this.fb.group({
    clientId: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(5)]]
  });

  // Toasts
  toasts = signal<{ id: number; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);
  private toastIdCounter = 0;

  // Computeds
  totalAUM = computed(() => {
    return this.clients().reduce((sum, c) => sum + c.balance, 0);
  });

  avgClientAUM = computed(() => {
    const list = this.clients();
    return list.length ? this.totalAUM() / list.length : 0;
  });

  flaggedApprovalsCount = computed(() => {
    return this.approvals().length;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('ws_user_name');
      const email = localStorage.getItem('ws_user_email');
      const role = localStorage.getItem('ws_user_role');

      if (name) this.managerName.set(name);
      if (email) this.managerEmail.set(email);
      if (role) this.managerRole.set(role);
      
      // Load and sync all clients from ws_users_list
      const savedUsersList = localStorage.getItem('ws_users_list');
      if (savedUsersList) {
        try {
          const allUsers: any[] = JSON.parse(savedUsersList);
          const clientUsers = allUsers
            .filter(u => u.role.includes('Client'))
            .map((u, index) => {
              // Map default or existing risk profile
              const profiles: ('Conservative' | 'Balanced' | 'Aggressive')[] = ['Balanced', 'Conservative', 'Aggressive'];
              const riskProfile = profiles[index % profiles.length];
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                balance: u.balance,
                status: u.status as any,
                riskProfile: riskProfile
              };
            });
          this.clients.set(clientUsers);
        } catch (e) {
          console.error('Failed to sync ws_users_list in Wealth Manager dashboard', e);
        }
      } else {
        // Seed default Alice Smith balance changes if ws_users_list does not exist yet
        const aliceBalance = localStorage.getItem('ws_client_balance');
        if (aliceBalance) {
          this.clients.update(curr => 
            curr.map(c => c.id === 'USR-002' ? { ...c, balance: Number(aliceBalance) } : c)
          );
        }
      }
    }
  }

  // Approvals actions
  approveTransaction(approvalId: string): void {
    const item = this.approvals().find(a => a.id === approvalId);
    if (!item) return;

    // Remove from list
    this.approvals.update(curr => curr.filter(a => a.id !== approvalId));
    this.addToast(`Transaction ${approvalId} for $${item.amount.toLocaleString()} has been APPROVED`, 'success');

    // Sync balance reduction
    const client = this.clients().find(c => c.id === item.clientId);
    if (client) {
      const newBalance = Math.max(0, client.balance - item.amount);
      this.clients.update(curr => 
        curr.map(c => c.id === item.clientId ? { ...c, balance: newBalance } : c)
      );
      if (typeof window !== 'undefined') {
        if (item.clientId === 'USR-002') {
          localStorage.setItem('ws_client_balance', String(newBalance));
        }

        // Sync to ws_users_list
        const storedUsers = localStorage.getItem('ws_users_list');
        if (storedUsers) {
          try {
            const allUsers = JSON.parse(storedUsers);
            const updatedUsers = allUsers.map((u: any) => u.id === item.clientId ? { ...u, balance: newBalance } : u);
            localStorage.setItem('ws_users_list', JSON.stringify(updatedUsers));
          } catch (e) {
            console.error('Failed to update ws_users_list on transaction approval', e);
          }
        }
      }
    }
  }

  rejectTransaction(approvalId: string): void {
    const item = this.approvals().find(a => a.id === approvalId);
    if (!item) return;

    this.approvals.update(curr => curr.filter(a => a.id !== approvalId));
    this.addToast(`Transaction ${approvalId} for $${item.amount.toLocaleString()} has been REJECTED`, 'error');
  }

  // Message dispatcher
  onSendMessage(): void {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const { clientId, message } = this.messageForm.value;
    const client = this.clients().find(c => c.id === clientId);
    if (!client) return;

    this.addToast(`Secure message dispatched to ${client.name}`, 'success');
    this.messageForm.get('message')?.reset();
  }

  onLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ws_user_email');
      localStorage.removeItem('ws_user_role');
      localStorage.removeItem('ws_user_name');
    }
    this.router.navigate(['/login']);
  }

  // Toasts Manager
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
