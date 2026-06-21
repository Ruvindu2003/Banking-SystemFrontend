import { Injectable, OnDestroy, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LiveStatusService implements OnDestroy {
  readonly now = signal(new Date());
  readonly lastSync = signal(new Date());
  readonly marketPulse = signal(12.4);
  readonly activeConnections = signal(847);

  readonly syncLabel = computed(() => {
    this.now();
    const seconds = Math.floor((Date.now() - this.lastSync().getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  });

  private tickId?: ReturnType<typeof setInterval>;
  private pulseId?: ReturnType<typeof setInterval>;

  constructor() {
    if (typeof window === 'undefined') return;

    this.tickId = setInterval(() => {
      this.now.set(new Date());
    }, 1000);

    this.pulseId = setInterval(() => {
      this.lastSync.set(new Date());
      this.marketPulse.update(v =>
        Math.max(10, Math.min(15, +(v + (Math.random() - 0.48) * 0.08).toFixed(2)))
      );
      this.activeConnections.update(v =>
        Math.max(800, Math.min(900, v + Math.floor(Math.random() * 7) - 3))
      );
    }, 4000);
  }

  touchSync(): void {
    this.lastSync.set(new Date());
  }

  ngOnDestroy(): void {
    if (this.tickId) clearInterval(this.tickId);
    if (this.pulseId) clearInterval(this.pulseId);
  }
}
