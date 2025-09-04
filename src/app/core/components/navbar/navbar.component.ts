import { Component } from '@angular/core';
import { AuthService, UserResource } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    LangSwitcherComponent,
    ThemeSwitcherComponent,
    TranslateModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  user: UserResource | null = null;
  unreadCount = 0;
  menuOpen = false;
  refreshingPermissions = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifications: NotificationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((u) => (this.user = u));
    this.notifications.unreadCount$.subscribe((c) => (this.unreadCount = c));
    this.notifications.init();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleNotifications() {
    
  }

  async refreshPermissions(): Promise<void> {
    if (this.refreshingPermissions) return;
    
    this.refreshingPermissions = true;
    try {
      await this.auth.refreshUser();
      this.toast.success('Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing permissions:', error);
      this.toast.error('Error al actualizar permisos');
    } finally {
      this.refreshingPermissions = false;
    }
  }
}
