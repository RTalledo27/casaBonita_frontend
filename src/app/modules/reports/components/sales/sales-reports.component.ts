import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, FileText, Users, Download, ChevronDown, Calendar, User, Building, Filter, X, TrendingUp, DollarSign, BarChart, Info } from 'lucide-angular';
import { SalesReportService, ExportService } from '../../services';
import { ExportFormat } from '../../models';
import { EmployeeService } from '../../../humanResources/services/employee.service';
import { TeamService } from '../../../humanResources/services/team.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastService } from '../../../../core/services/toast.service';
import { TooltipPopoverComponent } from '../../../../shared/components/tooltip-popover/tooltip-popover.component';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BaseChartDirective,
    LucideAngularModule,
    TooltipPopoverComponent,
  ],
  templateUrl: './sales-reports.component.html',
  styleUrl: './sales-reports.component.scss',
})
export class SalesReportsComponent implements OnInit {
  // Reactive state using Signals
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  isExporting = signal<boolean>(false);
  showExportMenu = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // Data collections as signals
  advisors = signal<any[]>([]);
  offices = signal<any[]>([]);
  salesData = signal<any[]>([]);

  // Dashboard data
  dashboardData = signal<any>(null);

  // Dynamic year list
  availableYears = Array.from(
    { length: new Date().getFullYear() - 2024 + 2 },
    (_, i) => 2024 + i
  );

  // Form for filters
  filtersForm: FormGroup;

  // Chart data signals
  advisorChartData = signal<ChartConfiguration['data'] | undefined>(undefined);
  advisorChartOptions = signal<ChartConfiguration['options'] | undefined>(undefined);
  advisorChartType = signal<ChartType>('bar');
  trendChartData = signal<ChartConfiguration['data'] | undefined>(undefined);
  trendChartOptions = signal<ChartConfiguration['options'] | undefined>(undefined);
  trendChartType = signal<ChartType>('line');

  // Summary signals computed from dashboard data
  totalSales = computed(() => this.dashboardData()?.summary?.total_sales || 0);
  totalRevenue = computed(() => this.dashboardData()?.summary?.total_revenue || 0);
  averageSale = computed(() => this.dashboardData()?.summary?.average_sale || 0);
  salesGrowth = computed(() => this.dashboardData()?.summary?.sales_growth || 0);

  constructor(
    private fb: FormBuilder,
    private salesReportService: SalesReportService,
    private exportService: ExportService,
    private employeeService: EmployeeService,
    private teamService: TeamService,
    private toast: ToastService,
  ) {
    this.filtersForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      year: [new Date().getFullYear()],
      month: [new Date().getMonth() + 1],
      advisorId: [''],
      officeId: [''],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.restoreFilters();
    this.loadDashboardData();
  }

  private loadInitialData(): void {
    forkJoin({
      advisors: this.employeeService.getAllEmployees().pipe(map(res => res.data)),
      offices: this.teamService.getTeams().pipe(map(res => res.data))
    }).subscribe(res => {
      this.advisors.set(res.advisors || []);
      this.offices.set(res.offices || []);
    });
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    const filters = {
      startDate: this.filtersForm.value.startDate || undefined,
      endDate: this.filtersForm.value.endDate || undefined,
      advisorId: this.filtersForm.value.advisorId || undefined,
    };

    this.salesReportService.getDashboard(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData.set(response.data);
          this.updateCharts(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateCharts(data: any): void {
    // Update advisor chart
    if (data.top_performers && data.top_performers.length > 0) {
      const labels = data.top_performers.map((p: any) => p.employee_name || p.name);
      const values = data.top_performers.map((p: any) => p.total_revenue || p.sales || 0);

      this.advisorChartData.set({
        labels: labels,
        datasets: [{
          label: 'Ventas por Asesor',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      });
    }

    // Update trend chart
    if (data.trends && data.trends.length > 0) {
      const labels = data.trends.map((t: any) => t.period || t.month);
      const values = data.trends.map((t: any) => t.revenue || t.sales || 0);

      this.trendChartData.set({
        labels: labels,
        datasets: [{
          label: 'Tendencia de Ventas',
          data: values,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      });
    }
  }

  applyFilters(): void {
    if (!this.validateFilters()) {
      return;
    }
    this.persistFilters();
    this.loadDashboardData();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.filtersForm.patchValue({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    this.persistFilters();
    this.loadDashboardData();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.applyFilters();
  }

  // Export helper wrappers - each sends different report_type
  exportMonthlyIncome(): void {
    const year = Number(this.filtersForm.value.year) || new Date().getFullYear();
    const filters = {
      startDate: this.filtersForm.value.startDate || undefined,
      endDate: this.filtersForm.value.endDate || undefined,
      advisor_id: this.filtersForm.value.advisorId || undefined,
      office_id: this.filtersForm.value.officeId || undefined,
    };
    this.isExporting.set(true);
    this.exportService.exportMonthlyIncome(year, filters).subscribe({
      next: (blob) => {
        const filename = `ingresos_mensuales_${year}`;
        this.exportService.downloadExcel(blob, filename);
        this.toast.success('Excel de Ingresos Mensuales generado');
        this.isExporting.set(false);
      },
      error: (err) => {
        this.toast.error('Error al exportar ingresos mensuales');
        this.isExporting.set(false);
      }
    });
  }

  exportDetailedSales(): void {
    const year = Number(this.filtersForm.value.year) || new Date().getFullYear();
    const month = Number(this.filtersForm.value.month) || (new Date().getMonth() + 1);

    const filters: any = {
      year,
      month,
      startDate: this.filtersForm.value.startDate || undefined,
      endDate: this.filtersForm.value.endDate || undefined,
      advisor_id: this.filtersForm.value.advisorId || undefined,
      office_id: this.filtersForm.value.officeId || undefined,
    };
    this.isExporting.set(true);
    this.exportService.exportDetailedSales(filters).subscribe({
      next: (blob) => {
        const period = `${year}-${String(month).padStart(2, '0')}`;
        const filename = `ventas_detalladas_${period}`;
        this.exportService.downloadExcel(blob, filename);
        this.toast.success('Excel de Ventas Detalladas generado');
        this.isExporting.set(false);
      },
      error: (err) => {
        this.toast.error('Error al exportar ventas detalladas');
        this.isExporting.set(false);
      }
    });
  }

  exportClientDetails(): void {
    const year = Number(this.filtersForm.value.year) || new Date().getFullYear();
    const month = Number(this.filtersForm.value.month) || (new Date().getMonth() + 1);
    const filters = {
      startDate: this.filtersForm.value.startDate || undefined,
      endDate: this.filtersForm.value.endDate || undefined,
      advisor_id: this.filtersForm.value.advisorId || undefined,
      year,
      month,
    };
    this.isExporting.set(true);
    this.exportService.exportClientDetails(filters).subscribe({
      next: (blob) => {
        const period = `${year}-${String(month).padStart(2, '0')}`;
        const filename = `detalles_clientes_${period}`;
        this.exportService.downloadExcel(blob, filename);
        this.toast.success('Excel de Detalles de Clientes generado');
        this.isExporting.set(false);
      },
      error: (err) => {
        this.toast.error('Error al exportar detalles de clientes');
        this.isExporting.set(false);
      }
    });
  }

  exportReport(format: string): void {
    const filters = {
      ...this.filtersForm.value,
      report_type: 'basic'
    };
    this.performExport(format as ExportFormat, filters, 'sales_report');
  }

  private performExport(format: ExportFormat, filters: any, baseFilename: string): void {
    this.isExporting.set(true);

    // Use SalesReportService which calls the correct endpoint
    this.salesReportService.exportSalesReport(filters, format).subscribe({
      next: (blob) => {
        const filename = `${baseFilename}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        this.isExporting.set(false);
        this.showExportMenu.set(false);
        this.toast.success(`Exportación ${format.toUpperCase()} generada`);
      },
      error: (err) => {
        this.toast.error('Error al exportar reporte');
        this.isExporting.set(false);
      }
    });
  }

  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  private validateFilters(): boolean {
    const { startDate, endDate, year, month } = this.filtersForm.value;
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (s > e) {
        this.toast.error('La fecha inicio no puede ser mayor que la fecha fin');
        return false;
      }
    }
    const y = Number(year);
    const m = Number(month);
    if (!(y >= 2000 && y <= 2100)) {
      this.toast.error('Año inválido');
      return false;
    }
    if (!(m >= 1 && m <= 12)) {
      this.toast.error('Mes inválido');
      return false;
    }
    return true;
  }

  private persistFilters(): void {
    const data = this.filtersForm.value;
    try {
      localStorage.setItem('reports_filters', JSON.stringify(data));
    } catch { }
  }

  private restoreFilters(): void {
    try {
      const raw = localStorage.getItem('reports_filters');
      if (raw) {
        const data = JSON.parse(raw);
        this.filtersForm.patchValue(data);
      }
    } catch { }
  }

  // Icons
  fileTextIcon = FileText;
  usersIcon = Users;
  downloadIcon = Download;
  chevronDownIcon = ChevronDown;
  calendarIcon = Calendar;
  userIcon = User;
  buildingIcon = Building;
  filterIcon = Filter;
  xIcon = X;
  trendingUpIcon = TrendingUp;
  dollarSignIcon = DollarSign;
  barChartIcon = BarChart;
  infoIcon = Info;
}
