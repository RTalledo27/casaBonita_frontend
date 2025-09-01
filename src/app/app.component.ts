import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./core/layouts/layout/layout.component";
import { ToastContainerComponent } from './shared/components/toast-container/toast-container/toast-container.component';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from "./shared/components/lang-switcher/lang-switcher.component";
import { PusherTestComponent } from "./core/services/pusher-test/pusher-test.component";
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'casaBonita_frontend';
  constructor(private theme: ThemeService) {
    // Forzar la inicialización del tema
    console.log('ThemeService initialized, current theme:', this.theme.isDark ? 'dark' : 'light');
  }
}
