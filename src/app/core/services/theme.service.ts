import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _isDark = false;

  constructor(@Inject(DOCUMENT) private doc: Document) {
    const stored = localStorage.getItem('theme');
    this._isDark = stored === 'dark';
    // Apply theme immediately and also ensure DOM is ready
    this.applyClass();
    queueMicrotask(() => this.applyClass());
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
    const html = this.doc.documentElement;
    if (this._isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
