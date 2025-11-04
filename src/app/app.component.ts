import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./core/layouts/layout/layout.component";
import { ToastContainerComponent } from './shared/components/toast-container/toast-container/toast-container.component';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from "./shared/components/lang-switcher/lang-switcher.component";
import { PusherTestComponent } from "./core/services/pusher-test/pusher-test.component";
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { PermissionSyncService } from './core/services/permission-sync.service';

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
export class AppComponent implements OnInit {
  title = 'casaBonita_frontend';
  
  constructor(
    private theme: ThemeService,
    private authService: AuthService,
    private permissionSync: PermissionSyncService
  ) {
    // Forzar la inicialización del tema
    console.log('ThemeService initialized, current theme:', this.theme.isDark ? 'dark' : 'light');
  }

  ngOnInit(): void {
    // DESACTIVADO: El polling automático está causando problemas
    // Solo se usará el botón manual de refresh en el navbar
    console.log('⚠️ Automatic permission sync is DISABLED. Use manual refresh button.');
    
    // NO iniciar el polling automáticamente
    // if (this.authService.isAuthenticated()) {
    //   this.permissionSync.startSync();
    //   console.log('🔄 Permission sync service started');
    // }

    // NO escuchar cambios de autenticación
    // this.authService.currentUser$.subscribe(user => {
    //   if (user) {
    //     this.permissionSync.startSync();
    //   } else {
    //     this.permissionSync.stopSync();
    //   }
    // });
  }
}
