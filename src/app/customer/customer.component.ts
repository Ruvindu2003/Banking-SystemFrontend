import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LiveStatusService } from '../services/live-status.service';
import { LiveStatusBarComponent } from '../shared/live-status-bar/live-status-bar.component';

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

interface ChatMessage {
  sender: 'client' | 'advisor';
  text: string;
  time: Date;
}

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LiveStatusBarComponent],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);
  protected readonly live = inject(LiveStatusService);
  protected readonly Date = Date;

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

  // Card Customization Signals
  isCardFlipped = signal(false);
  cardColorTheme = signal<'emerald' | 'sapphire' | 'amethyst' | 'carbon'>('emerald');
  cardType = signal<'credit' | 'debit'>('credit');

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

  // Advanced Filtering Signals
  searchQuery = signal('');
  selectedCategory = signal('all');
  sortBy = signal<'date' | 'amount-desc' | 'amount-asc'>('date');

  // computed filtered and sorted transactions
  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const sort = this.sortBy();

    let list = this.transactions().filter(tx => {
      const matchesSearch = tx.name.toLowerCase().includes(query) || tx.id.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || tx.category.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    });

    if (sort === 'date') {
      list = [...list].sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (sort === 'amount-desc') {
      list = [...list].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sort === 'amount-asc') {
      list = [...list].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    }

    return list;
  });

  // Settings Toggles
  mfaEnabled = signal(true);
  pushAlerts = signal(true);
  emailAlerts = signal(false);

  // Advisor Live Chat Signal
  chatMessages = signal<ChatMessage[]>([
    { sender: 'advisor', text: 'Hello! I am Sarah, your dedicated private wealth advisor. How can I help you manage your assets today?', time: new Date(Date.now() - 3600000 * 3) }
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

  createGoalForm: FormGroup = this.fb.group({
    newGoalName: ['', [Validators.required, Validators.minLength(3)]],
    targetAmount: ['', [Validators.required, Validators.min(100)]],
    goalColor: ['bg-primary', Validators.required]
  });

  loanForm: FormGroup = this.fb.group({
    loanAmount: [25000, [Validators.required, Validators.min(1000), Validators.max(500000)]],
    loanTerm: [24, [Validators.required, Validators.min(6), Validators.max(72)]],
    interestRate: [5.5, [Validators.required]]
  });

  profileForm: FormGroup = this.fb.group({
    editName: ['', [Validators.required, Validators.minLength(2)]],
    editEmail: ['', [Validators.required, Validators.email]]
  });

  chatForm: FormGroup = this.fb.group({
    messageText: ['', [Validators.required, Validators.minLength(1)]]
  });

  // Modals / Sections toggles
  isTransferModalOpen = signal(false);
  isGoalModalOpen = signal(false);
  isCreateGoalModalOpen = signal(false);
  activeTab = signal<'portfolio' | 'simulator' | 'settings'>('portfolio');

  // Computeds for Loan Simulation
  monthlyPayment = computed(() => {
    const P = this.loanForm.get('loanAmount')?.value || 0;
    const annualR = this.loanForm.get('interestRate')?.value || 5.5;
    const r = annualR / 12 / 100;
    const n = this.loanForm.get('loanTerm')?.value || 12;

    if (r === 0) return P / n;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  totalPayback = computed(() => {
    const n = this.loanForm.get('loanTerm')?.value || 12;
    return this.monthlyPayment() * n;
  });

  totalInterest = computed(() => {
    const P = this.loanForm.get('loanAmount')?.value || 0;
    return Math.max(0, this.totalPayback() - P);
  });

  constructor() {
    // Load Client details from LocalStorage if they exist
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('ws_user_email');
      const role = localStorage.getItem('ws_user_role');
      const name = localStorage.getItem('ws_user_name');
      const savedBalance = localStorage.getItem('ws_client_balance');

      if (email) {
        this.userEmail.set(email);
        this.profileForm.get('editEmail')?.setValue(email);
      }
      if (role) this.userRole.set(role);
      if (name) {
        this.userName.set(name);
        this.profileForm.get('editName')?.setValue(name);
      }
      
      if (savedBalance) {
        this.balance.set(Number(savedBalance));
      } else {
        const defaultBal = role === 'Premium Client' ? 425000.00 : 12500.00;
        this.balance.set(defaultBal);
        localStorage.setItem('ws_client_balance', String(defaultBal));
      }

      // Sync active theme configuration from admin settings if saved
      const savedTheme = localStorage.getItem('ws_admin_theme');
      if (savedTheme && ['emerald', 'sapphire', 'amethyst', 'carbon'].includes(savedTheme)) {
        this.cardColorTheme.set(savedTheme as 'emerald' | 'sapphire' | 'amethyst' | 'carbon');
        this.theme.setTheme(savedTheme as 'emerald' | 'sapphire' | 'amethyst' | 'carbon');
      }
    }
  }

  // Navigation / Actions
  onLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ws_user_email');
      localStorage.removeItem('ws_user_role');
      localStorage.removeItem('ws_user_name');
    }
    this.router.navigate(['/login']);
  }

  setTab(tab: 'portfolio' | 'simulator' | 'settings'): void {
    this.activeTab.set(tab);
  }

  toggleCardFlip(): void {
    this.isCardFlipped.update(v => !v);
  }

  setCardTheme(theme: 'emerald' | 'sapphire' | 'amethyst' | 'carbon'): void {
    this.cardColorTheme.set(theme);
    this.theme.setTheme(theme);
    this.addToast(`Card style preset updated to ${theme.toUpperCase()}`, 'info');
  }

  setPortalTheme(theme: 'emerald' | 'sapphire' | 'amethyst' | 'carbon'): void {
    this.theme.setTheme(theme);
    this.cardColorTheme.set(theme);
    this.addToast(`Portal theme applied: ${theme.toUpperCase()}`, 'success');
  }

  setCardType(type: 'credit' | 'debit'): void {
    this.cardType.set(type);
    this.addToast(`Switched active view to ${type.toUpperCase()} Card`, 'info');
  }

  // Modals actions
  openTransferModal(): void {
    this.transferForm.reset({
      payeeName: '',
      accountNum: '',
      amount: ''
    });
    this.isTransferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
  }

  openGoalModal(): void {
    this.goalForm.reset({
      goalName: this.goals().length ? this.goals()[0].name : '',
      amount: ''
    });
    this.isGoalModalOpen.set(true);
  }

  closeGoalModal(): void {
    this.isGoalModalOpen.set(false);
  }

  openCreateGoalModal(): void {
    this.createGoalForm.reset({
      newGoalName: '',
      targetAmount: '',
      goalColor: 'bg-primary'
    });
    this.isCreateGoalModalOpen.set(true);
  }

  closeCreateGoalModal(): void {
    this.isCreateGoalModalOpen.set(false);
  }

  // Submit operations
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

    const updatedBalance = this.balance() - numericAmount;
    this.balance.set(updatedBalance);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_client_balance', String(updatedBalance));
      this.syncBalanceToUsersList(updatedBalance);
    }

    const newTx: ClientTransaction = {
      id: `TX-${900 + this.transactions().length + 1}`,
      name: `Transfer to ${payeeName}`,
      category: 'Transfer',
      amount: -numericAmount,
      date: new Date(),
      status: numericAmount >= 100000 ? 'Flagged' : 'Complete'
    };

    this.transactions.update(curr => [newTx, ...curr]);
    this.live.touchSync();
    this.closeTransferModal();

    if (newTx.status === 'Flagged') {
      this.addToast('Transfer placed. High-value transfer flagged for manager validation.', 'warning');
    } else {
      this.addToast(`Successfully transferred $${numericAmount.toLocaleString()} to ${payeeName}`, 'success');
    }
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

    const updatedBalance = this.balance() - numericAmount;
    this.balance.set(updatedBalance);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_client_balance', String(updatedBalance));
      this.syncBalanceToUsersList(updatedBalance);
    }

    this.goals.update(currGoals =>
      currGoals.map(g => g.name === goalName ? { ...g, current: Math.min(g.target, g.current + numericAmount) } : g)
    );

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

  onCreateGoalSubmit(): void {
    if (this.createGoalForm.invalid) {
      this.createGoalForm.markAllAsTouched();
      return;
    }

    const { newGoalName, targetAmount, goalColor } = this.createGoalForm.value;

    const newGoal: SavingsGoal = {
      name: newGoalName,
      current: 0,
      target: Number(targetAmount),
      color: goalColor
    };

    this.goals.update(curr => [...curr, newGoal]);
    this.closeCreateGoalModal();
    this.addToast(`Goal "${newGoalName}" has been successfully created!`, 'success');
  }

  onApplyLoan(): void {
    if (this.loanForm.invalid) {
      return;
    }

    const amount = this.loanForm.get('loanAmount')?.value;
    const term = this.loanForm.get('loanTerm')?.value;

    this.addToast(`Loan Request of $${amount.toLocaleString()} submitted. Verifying credit history...`, 'info');

    setTimeout(() => {
      if (amount > 250000 && this.userRole() !== 'Premium Client') {
        this.addToast(`Request Flagged: Wealth Advisor review required for loans exceeding $250,000 for standard accounts.`, 'warning');
      } else {
        // Credit the loan to account balance
        const updatedBalance = this.balance() + amount;
        this.balance.set(updatedBalance);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ws_client_balance', String(updatedBalance));
          this.syncBalanceToUsersList(updatedBalance);
        }

        // Add Transaction
        const newTx: ClientTransaction = {
          id: `TX-${900 + this.transactions().length + 1}`,
          name: `Loan Payout: Approved ${term}-Mo Term`,
          category: 'Income',
          amount: amount,
          date: new Date(),
          status: 'Complete'
        };
        this.transactions.update(curr => [newTx, ...curr]);

        this.addToast(`Congratulations! Your loan request has been auto-approved and credited to your vault.`, 'success');
      }
    }, 1500);
  }

  onProfileSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { editName, editEmail } = this.profileForm.value;
    
    // Sync to state
    this.userName.set(editName);
    this.userEmail.set(editEmail);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_user_name', editName);
      localStorage.setItem('ws_user_email', editEmail);

      // Sync into users list
      const storedUsers = localStorage.getItem('ws_users_list');
      if (storedUsers) {
        try {
          const allUsers = JSON.parse(storedUsers);
          const updatedUsers = allUsers.map((u: any) => u.id === 'USR-002' || u.email.toLowerCase() === editEmail.toLowerCase() ? { ...u, name: editName, email: editEmail } : u);
          localStorage.setItem('ws_users_list', JSON.stringify(updatedUsers));
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.addToast('Profile records updated successfully', 'success');
  }

  // Advisor Live Chat Messaging
  onSendChatMessage(): void {
    if (this.chatForm.invalid) {
      return;
    }

    const userText = this.chatForm.get('messageText')?.value;
    const clientMsg: ChatMessage = {
      sender: 'client',
      text: userText,
      time: new Date()
    };

    this.chatMessages.update(curr => [...curr, clientMsg]);
    this.chatForm.reset();

    // Trigger automated reply from Sarah after delay
    setTimeout(() => {
      let replyText = "Thank you for reaching out. I've noted your query regarding your accounts and will review your file shortly. Let's arrange a secure call if you need immediate assistance.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('loan') || lower.includes('mortgage') || lower.includes('credit')) {
        replyText = `Regarding credit requests: I see you looked into our ${this.loanForm.get('interestRate')?.value}% loan simulation. For large portfolios, we can structure custom private credit options starting from 3.8% APR. Let me know if you would like me to draft an offer.`;
      } else if (lower.includes('transfer') || lower.includes('wire') || lower.includes('send')) {
        replyText = "Note that large outbound wire transfers (over $100,000) are flagged for security. I review and approve these periodically during market hours to secure your deposits.";
      } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('sarah')) {
        replyText = "Hello! Yes, I'm here monitoring your portfolio alerts. Is there a specific trade or asset transfer you require support with today?";
      }

      const advisorMsg: ChatMessage = {
        sender: 'advisor',
        text: replyText,
        time: new Date()
      };

      this.chatMessages.update(curr => [...curr, advisorMsg]);
      this.addToast("Sarah Jenkins dispatched a reply.", "info");
    }, 1200);
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
