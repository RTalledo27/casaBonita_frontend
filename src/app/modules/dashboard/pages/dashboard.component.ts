import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
  import { DollarSign, FileText, Home, LucideAngularModule, Package, TrendingUp, Users } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceWidgetComponent } from '../components/finance-widget/finance-widget.component';
import { DashboardCardComponent } from '../../../shared/components/dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true, // <--- Componente standalone
  imports: [
    LucideAngularModule,
    CommonModule,
    TranslateModule,
    FinanceWidgetComponent,
    DashboardCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  user: any;

  // Icons
  users = Users;
  fileText = FileText;
  dollarSign = DollarSign;
  trendingUp = TrendingUp;
  package = Package;
  home = Home;

  // Mock data - En producción esto vendría de servicios
  dashboardData = {
    totalClients: 120,
    totalUsers: 8,
    activeContracts: 45,
    pendingPayments: 20,
    totalLots: 150,
    availableLots: 85,
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.user$;
  }

  getUserGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
