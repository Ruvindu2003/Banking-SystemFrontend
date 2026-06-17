import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface MockUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Suspended' | 'Flagged';
  role: string;
}

interface MockTransaction {
  id: string;
  userId: string;
  userName: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer';
  amount: number;
  status: 'Complete' | 'Failed' | 'Blocked' | 'Pending';
  timestamp: Date;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {
  private readonly fb = inject(FormBuilder);

  // Customization States
  currentTheme = signal<'emerald' | 'sapphire' | 'amethyst' | 'carbon'>('emerald');
  cardStyle = signal<'glass' | 'flat' | 'neon'>('glass');
  
  // Widget visibility states
  showStats = signal(true);
  showChart = signal(true);
  showUsers = signal(true);
  showSimulator = signal(true);
  showLogs = signal(true);

  // System security settings toggles
  maintenanceMode = signal(false);
  mfaEnforced = signal(true);
  flagHighTransactions = signal(true);

  // User Management
  users = signal<MockUser[]>([
    { id: 'USR-001', name: 'John Doe', email: 'john.doe@wealthsync.com', balance: 2459203.18, status: 'Active', role: 'Super Admin' },
    { id: 'USR-002', name: 'Alice Smith', email: 'alice.smith@wealthsync.com', balance: 425000.00, status: 'Active', role: 'Premium Client' },
    { id: 'USR-003', name: 'Bob Jones', email: 'bob.jones@wealthsync.com', balance: 12500.00, status: 'Suspended', role: 'Standard Client' },
    { id: 'USR-004', name: 'Sarah Jenkins', email: 'sarah.jenkins@wealthsync.com', balance: 5670000.00, status: 'Active', role: 'Wealth Manager' },
    { id: 'USR-005', name: 'Charlie Brown', email: 'charlie.brown@wealthsync.com', balance: 3200.00, status: 'Flagged', role: 'Standard Client' }
  ]);

  searchQuery = signal('');
  statusFilter = signal<string>('all');

  // Transactions Log
  transactions = signal<MockTransaction[]>([
    { id: 'TXN-101', userId: 'USR-001', userName: 'John Doe', type: 'Deposit', amount: 50000.00, status: 'Complete', timestamp: new Date(Date.now() - 3600000 * 2) },
    { id: 'TXN-102', userId: 'USR-004', userName: 'Sarah Jenkins', type: 'Transfer', amount: 15000.00, status: 'Complete', timestamp: new Date(Date.now() - 3600000 * 5) },
    { id: 'TXN-103', userId: 'USR-003', userName: 'Bob Jones', type: 'Withdrawal', amount: 1200.00, status: 'Complete', timestamp: new Date(Date.now() - 3600000 * 12) },
    { id: 'TXN-104', userId: 'USR-005', userName: 'Charlie Brown', type: 'Transfer', amount: 120000.00, status: 'Blocked', timestamp: new Date(Date.now() - 3600000 * 24) }
  ]);

  // Simulation Form
  simForm: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    type: ['Deposit', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]]
  });

  // User Add Form
  userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['Standard Client', Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
    status: ['Active', Validators.required]
  });

  // Toasts
  toasts = signal<{ id: number; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);
  private toastIdCounter = 0;

  // Modals
  isAddUserModalOpen = signal(false);

  // Computeds
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    
    return this.users().filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(query) || 
                            u.email.toLowerCase().includes(query) || 
                            u.id.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || u.status === filter;
      return matchesSearch && matchesFilter;
    });
  });

  clientsList = computed(() => {
    return this.filteredUsers().filter(u => u.role.includes('Client'));
  });

  staffList = computed(() => {
    return this.filteredUsers().filter(u => u.role.includes('Manager') || u.role.includes('Admin'));
  });

  totalAssets = computed(() => {
    return this.users().reduce((sum, u) => sum + u.balance, 0);
  });

  avgBalance = computed(() => {
    const uList = this.users();
    return uList.length ? this.totalAssets() / uList.length : 0;
  });

  activeUsersCount = computed(() => {
    return this.users().filter(u => u.status === 'Active').length;
  });

  flaggedUsersCount = computed(() => {
    return this.users().filter(u => u.status !== 'Active').length;
  });

  constructor() {
    // Load config from LocalStorage if present
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ws_admin_theme');
      if (savedTheme) this.currentTheme.set(savedTheme as any);

      const savedCardStyle = localStorage.getItem('ws_admin_card_style');
      if (savedCardStyle) this.cardStyle.set(savedCardStyle as any);

      const savedStats = localStorage.getItem('ws_admin_show_stats');
      if (savedStats) this.showStats.set(savedStats === 'true');

      const savedChart = localStorage.getItem('ws_admin_show_chart');
      if (savedChart) this.showChart.set(savedChart === 'true');

      const savedUsers = localStorage.getItem('ws_admin_show_users');
      if (savedUsers) this.showUsers.set(savedUsers === 'true');

      const savedSim = localStorage.getItem('ws_admin_show_simulator');
      if (savedSim) this.showSimulator.set(savedSim === 'true');

      const savedLogs = localStorage.getItem('ws_admin_show_logs');
      if (savedLogs) this.showLogs.set(savedLogs === 'true');

      // Load/Seed Users List
      const savedUsersList = localStorage.getItem('ws_users_list');
      if (savedUsersList) {
        try {
          this.users.set(JSON.parse(savedUsersList));
        } catch (e) {
          console.error('Failed to parse ws_users_list', e);
        }
      } else {
        localStorage.setItem('ws_users_list', JSON.stringify(this.users()));
      }
    }

    // Effect to auto-save configs & users list
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ws_admin_theme', this.currentTheme());
        localStorage.setItem('ws_admin_card_style', this.cardStyle());
        localStorage.setItem('ws_admin_show_stats', String(this.showStats()));
        localStorage.setItem('ws_admin_show_chart', String(this.showChart()));
        localStorage.setItem('ws_admin_show_users', String(this.showUsers()));
        localStorage.setItem('ws_admin_show_simulator', String(this.showSimulator()));
        localStorage.setItem('ws_admin_show_logs', String(this.showLogs()));
        localStorage.setItem('ws_users_list', JSON.stringify(this.users()));
      }
    });
  }

  // Theme & card management
  setTheme(theme: 'emerald' | 'sapphire' | 'amethyst' | 'carbon'): void {
    this.currentTheme.set(theme);
    this.addToast(`Theme changed to ${theme.toUpperCase()}`, 'info');
  }

  setCardStyle(style: 'glass' | 'flat' | 'neon'): void {
    this.cardStyle.set(style);
    this.addToast(`Card style changed to ${style.toUpperCase()}`, 'info');
  }

  // Widget Toggles
  toggleWidget(widget: 'stats' | 'chart' | 'users' | 'simulator' | 'logs'): void {
    if (widget === 'stats') this.showStats.update(v => !v);
    if (widget === 'chart') this.showChart.update(v => !v);
    if (widget === 'users') this.showUsers.update(v => !v);
    if (widget === 'simulator') this.showSimulator.update(v => !v);
    if (widget === 'logs') this.showLogs.update(v => !v);
    this.addToast(`Toggled dashboard card`, 'info');
  }

  resetLayout(): void {
    this.currentTheme.set('emerald');
    this.cardStyle.set('glass');
    this.showStats.set(true);
    this.showChart.set(true);
    this.showUsers.set(true);
    this.showSimulator.set(true);
    this.showLogs.set(true);
    this.addToast('Dashboard customisation reset to defaults', 'success');
  }

  // Actions
  changeUserStatus(userId: string, newStatus: 'Active' | 'Suspended' | 'Flagged'): void {
    this.users.update(current => 
      current.map(u => u.id === userId ? { ...u, status: newStatus } : u)
    );
    this.addToast(`User ${userId} status set to ${newStatus}`, 'warning');
    
    // Add audit log
    this.addAuditLog(userId, 'System Admin', 'Status Update', 0, `Changed user status to ${newStatus}`);
  }

  adjustBalance(userId: string, changeAmount: number): void {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;
    
    const newBalance = Math.max(0, user.balance + changeAmount);
    this.users.update(current =>
      current.map(u => u.id === userId ? { ...u, balance: newBalance } : u)
    );
    this.addToast(`Balance of ${user.name} adjusted by $${changeAmount.toLocaleString()}`, 'success');
    this.addAuditLog(userId, user.name, changeAmount >= 0 ? 'Deposit' : 'Withdrawal', Math.abs(changeAmount), 'Manual balance adjustments by Admin');
  }

  deleteUser(userId: string): void {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;

    this.users.update(current => current.filter(u => u.id !== userId));
    this.addToast(`Account for ${user.name} deleted successfully`, 'error');
    
    // Add audit log
    this.addAuditLog(userId, user.name, 'Withdrawal', user.balance, `Account deleted, final balance liquidated: $${user.balance.toFixed(2)}`);
  }

  openAddUserModal(): void {
    this.userForm.reset({
      role: 'Standard Client',
      balance: 0,
      status: 'Active'
    });
    this.isAddUserModalOpen.set(true);
  }

  closeAddUserModal(): void {
    this.isAddUserModalOpen.set(false);
  }

  onAddUserSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { name, email, role, balance, status } = this.userForm.value;
    const isManager = role.includes('Manager');
    const newId = isManager ? `MGR-0${this.users().length + 1}` : `USR-0${this.users().length + 1}`;
    
    const newUser: MockUser = {
      id: newId,
      name,
      email,
      role,
      balance: isManager ? 0 : Number(balance),
      status
    };

    this.users.update(current => [...current, newUser]);
    this.closeAddUserModal();

    if (isManager) {
      this.addToast(`New wealth manager ${name} registered successfully`, 'success');
      this.addAuditLog(newId, name, 'Status Update', 0, `Wealth manager registered successfully`);
    } else {
      this.addToast(`New client ${name} registered successfully`, 'success');
      this.addAuditLog(newId, name, 'Deposit', Number(balance), `Account registered with initial deposit: $${Number(balance).toLocaleString()}`);
    }
  }

  // Simulate Transactions
  onSimulateSubmit(): void {
    if (this.simForm.invalid) {
      this.simForm.markAllAsTouched();
      return;
    }

    const { userId, type, amount } = this.simForm.value;
    const userIndex = this.users().findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      this.addToast('Invalid user selected for simulation', 'error');
      return;
    }

    const user = this.users()[userIndex];
    const numericAmount = Number(amount);
    
    // Transaction checks
    let status: 'Complete' | 'Failed' | 'Blocked' = 'Complete';
    let message = '';
    let toastType: 'success' | 'error' | 'warning' = 'success';

    if (this.maintenanceMode()) {
      status = 'Failed';
      message = 'System in maintenance mode. Transaction cancelled.';
      toastType = 'error';
    } else if (type === 'Withdrawal' && user.balance < numericAmount) {
      status = 'Failed';
      message = `Insufficient funds. Available: $${user.balance.toLocaleString()}`;
      toastType = 'error';
    } else if (user.status === 'Suspended') {
      status = 'Blocked';
      message = 'Account suspended. Transactions blocked.';
      toastType = 'error';
    } else if (this.flagHighTransactions() && numericAmount >= 100000) {
      status = 'Blocked';
      message = 'Transaction flagged by high-volume security rules.';
      toastType = 'warning';
      
      // Auto flag user
      this.users.update(curr => 
        curr.map(u => u.id === userId ? { ...u, status: 'Flagged' } : u)
      );
    }

    // Process balance update if complete
    if (status === 'Complete') {
      const balanceChange = type === 'Deposit' ? numericAmount : -numericAmount;
      this.users.update(curr => 
        curr.map(u => u.id === userId ? { ...u, balance: Math.max(0, u.balance + balanceChange) } : u)
      );
      message = `${type} of $${numericAmount.toLocaleString()} complete for ${user.name}.`;
    }

    // Add to transaction logs
    const newTxn: MockTransaction = {
      id: `TXN-${100 + this.transactions().length + 1}`,
      userId,
      userName: user.name,
      type,
      amount: numericAmount,
      status,
      timestamp: new Date()
    };

    this.transactions.update(current => [newTxn, ...current]);
    this.addToast(message || `${type} processed: ${status}`, toastType);
    
    // Reset inputs
    this.simForm.get('amount')?.reset();
  }

  // Helper additions
  private addAuditLog(userId: string, userName: string, type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Status Update', amount: number, details: string): void {
    // Audit logs are stored in transaction log for simplicity in the mock dashboard
    const newTxn: MockTransaction = {
      id: `AUD-${Math.floor(Math.random() * 900) + 100}`,
      userId,
      userName,
      type: type === 'Status Update' ? 'Transfer' : type as any,
      amount,
      status: 'Complete',
      timestamp: new Date()
    };
    this.transactions.update(current => [newTxn, ...current]);
  }

  // Toasts Manager
  addToast(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info'): void {
    const id = this.toastIdCounter++;
    this.toasts.update(current => [...current, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
