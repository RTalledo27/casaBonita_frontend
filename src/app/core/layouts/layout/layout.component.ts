import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ToastNotificationsComponent } from '../../components/toast-notifications/toast-notifications.component';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, ToastNotificationsComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  sidebarService = inject(SidebarService);

  /** Close mobile sidebar on Escape key */
  @HostListener('document:keydown.escape')
  onEscape() {
    this.sidebarService.closeMobile();
  }
}
