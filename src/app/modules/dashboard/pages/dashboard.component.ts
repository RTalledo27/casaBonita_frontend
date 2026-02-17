import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Home } from 'lucide-angular';
import { AuthService, User } from '../../../core/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonModule,
    RouterLink,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  private authService = inject(AuthService);
  private sub?: Subscription;

  user: User | null = null;
  home = Home;

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(u => this.user = u);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  getUserGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  navigateAndExpand(route: string, moduleName: string) {
    this.navigationService.expandModule(moduleName);
    setTimeout(() => this.router.navigate([route]), 50);
  }
}
