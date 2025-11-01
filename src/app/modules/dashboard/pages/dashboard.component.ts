import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
  import { DollarSign, FileText, Home, LucideAngularModule, Package, TrendingUp, Users } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceWidgetComponent } from '../components/finance-widget/finance-widget.component';
import { DashboardCardComponent } from '../../../shared/components/dashboard-card/dashboard-card.component';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true, // <--- Componente standalone
  imports: [
    LucideAngularModule,
    CommonModule,
    RouterLink,
    TranslateModule,
    FinanceWidgetComponent,
    DashboardCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private router = inject(Router);
  private navigationService = inject(NavigationService);
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

  // Método para navegar y expandir el módulo en el sidebar
  navigateAndExpand(route: string, moduleName: string) {
    // Emitir evento para expandir el módulo en el sidebar
    this.navigationService.expandModule(moduleName);
    
    // Navegar a la ruta con un pequeño delay para que se vea la animación
    setTimeout(() => {
      this.router.navigate([route]);
    }, 50);
  }
}
