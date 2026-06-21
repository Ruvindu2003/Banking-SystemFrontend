import { Injectable, signal, effect } from '@angular/core';

export type ThemePreset = 'emerald' | 'sapphire' | 'amethyst' | 'carbon';
export type CardStyle = 'glass' | 'flat' | 'neon';

const THEME_KEY = 'ws_admin_theme';
const CARD_STYLE_KEY = 'ws_admin_card_style';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<ThemePreset>('emerald');
  readonly cardStyle = signal<CardStyle>('glass');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme && this.isTheme(savedTheme)) {
        this.currentTheme.set(savedTheme);
      }

      const savedCardStyle = localStorage.getItem(CARD_STYLE_KEY);
      if (savedCardStyle && this.isCardStyle(savedCardStyle)) {
        this.cardStyle.set(savedCardStyle);
      }

      effect(() => {
        const theme = this.currentTheme();
        document.documentElement.className = `theme-${theme}`;
        localStorage.setItem(THEME_KEY, theme);
        localStorage.setItem(CARD_STYLE_KEY, this.cardStyle());
      });
    }
  }

  setTheme(theme: ThemePreset): void {
    this.currentTheme.set(theme);
  }

  setCardStyle(style: CardStyle): void {
    this.cardStyle.set(style);
  }

  reset(): void {
    this.currentTheme.set('emerald');
    this.cardStyle.set('glass');
  }

  private isTheme(value: string): value is ThemePreset {
    return ['emerald', 'sapphire', 'amethyst', 'carbon'].includes(value);
  }

  private isCardStyle(value: string): value is CardStyle {
    return ['glass', 'flat', 'neon'].includes(value);
  }
}
