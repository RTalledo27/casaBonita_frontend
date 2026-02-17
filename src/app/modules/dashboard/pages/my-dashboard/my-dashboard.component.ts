import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Calendar,
  Check,
  FileText,
  AlertCircle,
  BarChart3,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  Monitor,
  Headphones,
  Shield,
  Settings
} from 'lucide-angular';
import { AuthService, User } from '../../../../core/services/auth.service';
import { EmployeeService } from '../../../humanResources/services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface AdvisorDashboard {
  employee: any;
  period: {
    month: number;
    year: number;
    label: string;
  };
  sales_summary: {
    count: number;
    total_amount: number;
    goal: number;
    achievement_percentage: number;
  };
  earnings_summary: {
    base_salary: number;
    commissions: number;
    bonuses: number;
    total_estimated: number;
  };
  performance: {
    ranking?: number;
    total_advisors: number;
    is_eligible_for_ranking: boolean;
  };
  recent_contracts: Array<{
    contract_number: string;
    total_price: number;
    sign_date: string;
    client_name: string;
  }>;
  bonuses?: {
    bonuses: any[];
    total_bonuses: number;
    total_amount: number;
    by_type: any;
    by_status: any;
    pending_approval: number;
  };
}

@Component({
  selector: 'app-my-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    LucideAngularModule
  ],
  templateUrl: './my-dashboard.component.html',
})
export class MyDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  // Icons
  trendingUp = TrendingUp;
  dollarSign = DollarSign;
  target = Target;
  award = Award;
  calendar = Calendar;
  check = Check;
  fileText = FileText;
  alertCircle = AlertCircle;
  barChart3 = BarChart3;
  users = Users;
  briefcase = Briefcase;
  arrowUpRight = ArrowUpRight;
  arrowDownRight = ArrowDownRight;
  clock = Clock;
  star = Star;
  monitor = Monitor;
  headphones = Headphones;
  shield = Shield;
  settings = Settings;

  Math = Math;

  // State
  dashboard = signal<AdvisorDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  currentUser = signal<User | null>(null);
  isAdvisor = signal(false);
  hasEmployee = signal(false);

  // Period selectors
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  availableMonths = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  ngOnInit(): void {
    this.initializeYears();
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);

    if (user?.employee_id) {
      this.hasEmployee.set(true);
      // Detect advisor by employee_type
      const advisorTypes = ['asesor_inmobiliario', 'vendedor'];
      this.isAdvisor.set(advisorTypes.includes(user.employee_type || ''));
      this.loadDashboard();
    } else {
      this.loading.set(false);
      this.error.set('No se encontró información de empleado vinculada a tu usuario.');
    }
  }

  initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear; year++) {
      this.availableYears.push(year);
    }
  }

  onPeriodChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const user = this.currentUser();
    if (!user?.employee_id) return;

    this.loading.set(true);
    this.error.set(null);

    this.employeeService
      .getAdvisorDashboard(user.employee_id, this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set('Error al cargar los datos del dashboard.');
          this.toastService.error('Error al cargar dashboard');
          this.loading.set(false);
        },
      });
  }

  getUserGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getEmployeeInitials(): string {
    const user = this.currentUser();
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (percentage >= 80) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (percentage >= 60) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  }

  getAchievementBadge(percentage: number): { label: string; class: string; icon: string } {
    if (percentage >= 100)
      return { label: 'Meta Cumplida', class: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', icon: '🏆' };
    if (percentage >= 80)
      return { label: 'Casi Ahí', class: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', icon: '🔥' };
    if (percentage >= 50)
      return { label: 'En Progreso', class: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: '📈' };
    return { label: 'Por Mejorar', class: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: '💪' };
  }

  getRemainingContracts(): number {
    const d = this.dashboard();
    if (!d) return 0;
    return Math.max(0, d.sales_summary.goal - d.sales_summary.count);
  }

  getCurrentMonthLabel(): string {
    const monthObj = this.availableMonths.find(m => m.value === this.selectedMonth);
    return monthObj ? monthObj.label : '';
  }

  getEmployeeTypeLabel(): string {
    const type = this.currentUser()?.employee_type;
    switch (type) {
      case 'asesor_inmobiliario': return 'Asesor Inmobiliario';
      case 'vendedor': return 'Vendedor';
      case 'administrativo': return 'Administrativo';
      case 'gerente': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      default: return 'Empleado';
    }
  }
}
