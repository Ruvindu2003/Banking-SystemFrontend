import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-hompage',
  imports: [CommonModule, RouterLink],
  templateUrl: './hompage.component.html',
  styleUrls: ['./hompage.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HompageComponent {
  data = signal<any>(null);
  private readonly api = inject(ApiService);
  @ViewChild('heroVideo') private heroVideo?: ElementRef<HTMLVideoElement>;

  constructor() {
    this.api.getTodo().subscribe((res) => this.data.set(res));
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const video = this.heroVideo?.nativeElement;

    if (!video) {
      return;
    }

    const startPlayback = async (): Promise<void> => {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;

      try {
        await video.play();
      } catch {
        // Chrome can defer media start until the tab is focused or the user interacts.
      }
    };

    const restartPlayback = async (): Promise<void> => {
      video.currentTime = 0;
      await startPlayback();
    };

    video.addEventListener('ended', restartPlayback);
    video.addEventListener('canplay', () => void startPlayback());
    video.addEventListener('loadeddata', () => void startPlayback());
    window.addEventListener('focus', () => void startPlayback());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void startPlayback();
      }
    });

    void startPlayback();
  }
}
