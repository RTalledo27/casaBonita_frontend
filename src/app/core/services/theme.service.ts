import { Injectable } from '@angular/core';
import { Moon, Sun } from 'lucide-angular';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _isDark = false;
  Sun = Sun;
  Moon = Moon;
  constructor() {
    const stored = localStorage.getItem('theme');
    this._isDark = stored === 'dark';
    this.applyClass();
  }

  toggle(): void {
    this._isDark = !this._isDark;
    localStorage.setItem('theme', this._isDark ? 'dark' : 'light');
    this.applyClass();
  }

  get isDark(): boolean {
    return this._isDark;
  }

  private applyClass(): void {
    const html = document.documentElement;
    if (this._isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

}
