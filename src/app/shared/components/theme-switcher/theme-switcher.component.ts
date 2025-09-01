import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
})
export class ThemeSwitcherComponent {
  constructor(public theme: ThemeService) {}

  toggleTheme() {
    this.theme.toggle();
  }
}
