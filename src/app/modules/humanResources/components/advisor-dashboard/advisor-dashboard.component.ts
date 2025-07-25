import { Component, signal } from '@angular/core';
; import { ActivatedRoute,  } from '@angular/router';
import { ArrowLeft, Award, Calendar, Check, DollarSign, FileText, LucideAngularModule, Target, TrendingUp } from 'lucide-angular';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Employee } from '../../models/employee';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


export interface AdvisorDashboard {
  employee: Employee;
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
  };
  recent_contracts: Array<{
    contract_number: string;
    total_price: number;
    sign_date: string;
    client_name: string;
  }>;
}


@Component({
  selector: 'app-advisor-dashboard',
  imports: [TranslateModule, CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './advisor-dashboard.component.html',
  styleUrl: './advisor-dashboard.component.scss',
})
export class AdvisorDashboardComponent {

  constructor(private route: ActivatedRoute, private employeeService: EmployeeService, private toastService: ToastService) { }

  // Icons
  arrowLeft = ArrowLeft;
  trendingUp = TrendingUp;
  dollarSign = DollarSign;
  target = Target;
  award = Award;
  calendar = Calendar;

  check = Check;
  fileText = FileText;

  // Math for template
  Math = Math;

  // Period selection properties
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
  employeeId: number = 0;

  // Signals
  dashboard = signal<AdvisorDashboard | null>(null);
  loading = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId = +id;
      this.initializeYears();
      this.loadDashboard(this.employeeId);
    }
  }

  initializeYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let year = currentYear - 2; year <= currentYear; year++) {
      this.availableYears.push(year);
    }
  }

  onPeriodChange() {
    if (this.employeeId) {
      this.loadDashboard(this.employeeId);
    }
  }

  loadDashboard(id: number) {
    this.loading.set(true);

    this.employeeService
      .getAdvisorDashboard(id, this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.loading.set(false);
          console.log(dashboard);
        },
        error: (error) => {
          console.error('Error loading advisor dashboard:', error);
          this.toastService.error('Error al cargar dashboard del asesor');
          this.loading.set(false);
        },
      });
  }

 

  getEmployeeInitials(name: string | undefined): string {
    if (!name) return "N/A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (percentage >= 80) return "bg-gradient-to-r from-yellow-500 to-orange-500"
    if (percentage >= 60) return "bg-gradient-to-r from-blue-500 to-indigo-500"
    return "bg-gradient-to-r from-red-500 to-pink-500"
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 100) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    if (percentage >= 60) return "text-blue-600"
    return "text-red-600"
  }
}
