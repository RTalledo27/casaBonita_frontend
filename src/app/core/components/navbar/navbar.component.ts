import { Component } from '@angular/core';
import { AuthService, UserResource } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { UserSessionService } from '../../services/user-session.service';
import { PermissionSyncService } from '../../services/permission-sync.service';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';
import { NotificationsPanelComponent } from '../notifications-panel/notifications-panel.component';
import { LucideAngularModule, User, Clock } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    LangSwitcherComponent,
    ThemeSwitcherComponent,
    TranslateModule,
    NotificationsPanelComponent,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  user: UserResource | null = null;
  menuOpen = false;
  refreshingPermissions = false;
  readonly UserIcon = User;
  readonly ClockIcon = Clock;

  constructor(
    private auth: AuthService,
    private router: Router,
    public notifications: NotificationService,
    private toast: ToastService,
    public sessionService: UserSessionService,
    private permissionSync: PermissionSyncService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((u: UserResource | null) => {
      this.user = u;
      
      // Conectar al canal de notificaciones cuando el usuario inicia sesión
      if (u?.id) {
        console.log('🔌 Conectando al canal de notificaciones del usuario:', u.id);
        
        // Iniciar polling de notificaciones (cada 30 segundos)
        this.notifications.startPolling();
        
        // Conectar WebSocket (si está habilitado)
        this.notifications.connectToUserChannel(u.id);
        
        // Cargar notificaciones iniciales
        this.notifications.getNotifications({ per_page: 20 }).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    // Detener polling y desconectar WebSocket
    this.notifications.stopPolling();
    
    if (this.user?.id) {
      this.notifications.disconnectFromUserChannel(this.user.id);
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.menuOpen = false;
  }

  logout(): void {
    // Detener notificaciones antes de cerrar sesión
    this.notifications.stopPolling();
    if (this.user?.id) {
      this.notifications.disconnectFromUserChannel(this.user.id);
    }
    
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleNotifications() {
    
  }

  refreshPermissions(): void {
    if (this.refreshingPermissions) return;
    
    this.refreshingPermissions = true;
    this.permissionSync.forceSync();
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.refreshingPermissions = false;
    }, 1000);
  }
}
