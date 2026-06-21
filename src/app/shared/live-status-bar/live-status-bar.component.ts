import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveStatusService } from '../../services/live-status.service';

@Component({
  selector: 'app-live-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      <span class="flex items-center gap-1.5 text-primary">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        Live
      </span>

      <span class="font-mono text-slate-300 normal-case tracking-normal">
        {{ live.now() | date:'mediumTime' }}
      </span>

      <span>Synced {{ live.syncLabel() }}</span>

      @if (showMarket()) {
        <span class="text-accent">
          Growth Index {{ live.marketPulse() }}%
        </span>
      }

      @if (showConnections()) {
        <span>{{ live.activeConnections() }} sessions</span>
      }

      @if (label()) {
        <span class="ml-auto text-slate-500 normal-case tracking-normal">{{ label() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveStatusBarComponent {
  protected readonly live = inject(LiveStatusService);
  readonly label = input<string>('');
  readonly showMarket = input(true);
  readonly showConnections = input(false);
}
