import { Component } from '@angular/core';
import { AuthService, UserResource } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
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

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifications: NotificationService
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
}
