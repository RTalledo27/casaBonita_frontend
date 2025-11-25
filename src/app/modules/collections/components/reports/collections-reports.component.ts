import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, BarChart3, Calendar,
  CheckCircle, Clock, Download, FileSpreadsheet, Filter, LucideAngularModule,
  PieChart, TrendingUp, TrendingDown, DollarSign, Search, ChevronLeft, ChevronRight
} from 'lucide-angular';
import {
  Chart, TooltipItem, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Title, Tooltip, Legend,
  DoughnutController, BarController, LineController
} from 'chart.js';

// Register Chart.js components
Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Title, Tooltip, Legend,
  DoughnutController, BarController, LineController
);

import { ExportService } from '../../services/export.service';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { PaymentSchedule } from '../../models/payment-schedule';

// Report summary interface
interface ReportSummary {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  total_schedules: number;
  paid_schedules: number;
  pending_schedules: number;
  overdue_schedules: number;
  schedules: PaymentSchedule[];
}

type QuickFilterType = 'today' | 'week' | 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-collections-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './collections-reports.component.html',
  styleUrls: ['./collections-reports.component.scss']
})
export class CollectionsReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  // Lucide icons
  FilterIcon = Filter;
  DownloadIcon = Download;
  CalendarIcon = Calendar;
  ActivityIcon = Activity;
  BarChart3Icon = BarChart3;
  ArrowLeftIcon = ArrowLeft;
  AlertTriangleIcon = AlertTriangle;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  PieChartIcon = PieChart;
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  FileSpreadsheetIcon = FileSpreadsheet;
  SearchIcon = Search;
  ChevronLeftIcon = ChevronLeft;
  ChevronRightIcon = ChevronRight;

  // Chart references
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amountChart') amountChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart') trendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('agingChart') agingChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private statusChart?: Chart;
  private amountChart?: Chart;
  private trendsChart?: Chart;
  private agingChart?: Chart;

  // Services
  private fb = inject(FormBuilder);
  private collectionsService = inject(CollectionsSimplifiedService);
  private exportService = inject(ExportService);

  // Component state
  private destroy$ = new Subject<void>();

  // Reactive state
  reportData = signal<ReportSummary | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  loadingMessage = signal('');
  loadingProgress = signal(0);
  selectedQuickFilter = signal<QuickFilterType>('month');

  // Pagination and search
  currentPage = signal(1);
  itemsPerPage = signal(20);
  searchTerm = signal('');

  // Computed values for KPIs
  collectionEfficiency = computed(() => {
    const data = this.reportData();
    if (!data || !data.total_amount || data.total_amount === 0) return 0;
    return (data.paid_amount / data.total_amount) * 100;
  });

  averageCollectionDays = computed(() => {
    const data = this.reportData();
    if (!data) return 0;

    const overdueSchedules = data.schedules.filter(s => s.status === 'vencido' ||
      (s.status === 'pendiente' && new Date(s.due_date) < new Date()));

    if (overdueSchedules.length === 0) return 0;

    const totalDays = overdueSchedules.reduce((sum, s) => {
      const dueDate = new Date(s.due_date);
      const today = new Date();
      const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, days);
    }, 0);

    return Math.round(totalDays / overdueSchedules.length);
  });

  // Filtered and paginated schedules
  filteredSchedules = computed(() => {
    const data = this.reportData();
    if (!data) return [];

    let schedules = data.schedules;
    const reportType = this.filterForm.get('report_type')?.value;
    const search = this.searchTerm().toLowerCase();

    // Filter by report type
    if (reportType === 'overdue') {
      const today = new Date();
      schedules = schedules.filter(s => {
        const dueDate = new Date(s.due_date);
        return (s.status === 'pendiente' || s.status === 'vencido') && dueDate < today;
      });
    }

    // Filter by search term
    if (search) {
      schedules = schedules.filter(s =>
        s.contract_number?.toLowerCase().includes(search) ||
        s.client_name?.toLowerCase().includes(search) ||
        s.lot_number?.toLowerCase().includes(search)
      );
    }

    return schedules;
  });

  paginatedSchedules = computed(() => {
    const schedules = this.filteredSchedules();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return schedules.slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.filteredSchedules().length;
    const perPage = this.itemsPerPage();
    return Math.ceil(total / perPage);
  });

  showTable = computed(() => {
    const reportType = this.filterForm.get('report_type')?.value;
    return reportType === 'detailed' || reportType === 'overdue';
  });

  // Form
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      date_from: [''],
      date_to: [''],
      status: [''],
      report_type: ['summary']
    });
  }

  ngOnInit() {
    this.setDefaultDates();

    // Listen to report type changes to update table visibility
    this.filterForm.get('report_type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Just trigger change detection - table visibility will update automatically
        // via the showTable() computed signal
        if (this.reportData()) {
          // Reset to first page when switching between types
          this.currentPage.set(1);
        }
      });
  }

  ngAfterViewInit() {
    // Charts will be created when data is loaded
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  /**
   * Set default date range (current month)
   */
  private setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.filterForm.patchValue({
      date_from: firstDay.toISOString().split('T')[0],
      date_to: lastDay.toISOString().split('T')[0]
    });
  }

  /**
   * Apply quick filter
   */
  applyQuickFilter(filter: QuickFilterType) {
    this.selectedQuickFilter.set(filter);
    const now = new Date();
    let dateFrom: Date;
    let dateTo = now;

    switch (filter) {
      case 'today':
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        dateFrom = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
        dateTo = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        dateTo = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    this.filterForm.patchValue({
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0]
    });

    this.generateReport();
  }

  /**
   * Generate report
   */
  generateReport() {
    const formValue = this.filterForm.value;

    if (!formValue.date_from || !formValue.date_to) {
      this.errorMessage.set('Por favor selecciona un rango de fechas');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.loadingMessage.set('Generando reporte...');
    this.loadingProgress.set(0);
    this.currentPage.set(1); // Reset to first page

    // Simulate progress
    const progressInterval = setInterval(() => {
      const current = this.loadingProgress();
      if (current < 90) {
        this.loadingProgress.set(current + 10);
      }
    }, 200);

    const params = {
      due_date_from: formValue.date_from,
      due_date_to: formValue.date_to,
      ...(formValue.status && { status: formValue.status })
    };

    this.collectionsService.getPaymentScheduleReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.loadingProgress.set(100);

          if (response.success && response.data) {
            const processedData = this.processReportData(response.data);
            setTimeout(() => {
              this.reportData.set(processedData);
              this.isLoading.set(false);
              this.createCharts();
            }, 300);
          } else {
            this.isLoading.set(false);
            this.errorMessage.set('No se pudo procesar la respuesta del servidor');
          }
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'Error al generar el reporte. Por favor, intenta nuevamente.'
          );
        }
      });
  }

  /**
   * Process report data from API response
   */
  private processReportData(data: any): ReportSummary {
    const summary = data.summary || data;
    const schedules = data.schedules || [];

    return {
      total_amount: summary.total_amount || 0,
      paid_amount: summary.paid_amount || 0,
      pending_amount: summary.pending_amount || 0,
      overdue_amount: summary.overdue_amount || 0,
      total_schedules: summary.total_schedules || 0,
      paid_schedules: summary.by_status?.pagado?.count || 0,
      pending_schedules: summary.by_status?.pendiente?.count || 0,
      overdue_schedules: summary.by_status?.vencido?.count || 0,
      schedules: schedules
    };
  }

  /**
   * Reset filters
   */
  resetFilters() {
    this.filterForm.reset();
    this.setDefaultDates();
    this.reportData.set(null);
    this.errorMessage.set('');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.destroyCharts();
  }

  /**
   * Export report
   */
  exportReport() {
    const data = this.reportData();
    if (!data) return;

    this.exportService.exportToExcel(data.schedules, 'reporte-cobranzas');
  }

  /**
   * Export to PDF
   */
  exportToPDF() {
    console.log('Exporting to PDF...');
  }

  /**
   * Pagination methods
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage() - 1);
  }

  /**
   * Search handler
   */
  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1); // Reset to first page on search
  }

  /**
   * Retry last operation
   */
  retryLastOperation() {
    this.generateReport();
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorMessage.set('');
  }

  /**
   * Creates all charts
   */
  private createCharts() {
    setTimeout(() => {
      this.createStatusChart();
      this.createAmountChart();
      this.createTrendsChart();
      this.createAgingChart();
    }, 100);
  }

  /**
   * Destroy all charts
   */
  private destroyCharts() {
    this.statusChart?.destroy();
    this.amountChart?.destroy();
    this.trendsChart?.destroy();
    this.agingChart?.destroy();
  }

  /**
   * Create status distribution chart
   */
  private createStatusChart() {
    if (!this.statusChartRef?.nativeElement) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Pendiente', 'Vencido'],
        datasets: [{
          data: [report.paid_amount, report.pending_amount, report.overdue_amount],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              color: this.isDarkMode() ? '#e2e8f0' : '#475569'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                const label = context.label || '';
                const value = this.formatCurrency(context.parsed);
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create amount distribution chart
   */
  private createAmountChart() {
    if (!this.amountChartRef?.nativeElement) return;

    const ctx = this.amountChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    this.amountChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total', 'Cobrado', 'Pendiente', 'Vencido'],
        datasets: [{
          label: 'Monto',
          data: [report.total_amount, report.paid_amount, report.pending_amount, report.overdue_amount],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = this.formatCurrency(context.parsed.y);
                return `Monto: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
              color: this.isDarkMode() ? '#94a3b8' : '#64748b'
            },
            grid: {
              color: this.isDarkMode() ? '#334155' : '#e2e8f0'
            }
          },
          x: {
            ticks: {
              color: this.isDarkMode() ? '#94a3b8' : '#64748b'
            },
            grid: {
              color: this.isDarkMode() ? '#334155' : '#e2e8f0'
            }
          }
        }
      }
    });
  }

  /**
   * Create trends chart with real data
   */
  private createTrendsChart() {
    if (!this.trendsChartRef?.nativeElement) return;

    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    // Process real data - group schedules by month
    const monthlyData = new Map<string, { paid: number; pending: number; overdue: number }>();

    report.schedules.forEach(schedule => {
      const month = new Date(schedule.due_date).toLocaleString('es', { month: 'short', year: '2-digit' });

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { paid: 0, pending: 0, overdue: 0 });
      }

      const data = monthlyData.get(month)!;
      const amount = parseFloat(schedule.amount?.toString() || '0');

      if (schedule.status === 'pagado') {
        data.paid += amount;
      } else if (schedule.status === 'pendiente') {
        data.pending += amount;
      } else if (schedule.status === 'vencido') {
        data.overdue += amount;
      }
    });

    // Sort by date and get last 6 months
    const sortedMonths = Array.from(monthlyData.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    const labels = sortedMonths.map(([month]) => month);
    const paidData = sortedMonths.map(([, data]) => data.paid);
    const pendingData = sortedMonths.map(([, data]) => data.pending);

    this.trendsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [
          {
            label: 'Cobrado',
            data: paidData.length > 0 ? paidData : [0],
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Pendiente',
            data: pendingData.length > 0 ? pendingData : [0],
            borderColor: 'rgba(251, 191, 36, 1)',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              color: this.isDarkMode() ? '#e2e8f0' : '#475569'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const value = this.formatCurrency(context.parsed.y);
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
              color: this.isDarkMode() ? '#94a3b8' : '#64748b'
            },
            grid: {
              color: this.isDarkMode() ? '#334155' : '#e2e8f0'
            }
          },
          x: {
            ticks: {
              color: this.isDarkMode() ? '#94a3b8' : '#64748b'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Create aging analysis chart with real data
   */
  private createAgingChart() {
    if (!this.agingChartRef?.nativeElement) return;

    const ctx = this.agingChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    // Process real data - analyze overdue schedules by age ranges
    const agingRanges = {
      '0-30 días': 0,
      '31-60 días': 0,
      '61-90 días': 0,
      '91-120 días': 0,
      '+120 días': 0
    };

    report.schedules.forEach(schedule => {
      // Only analyze pending and overdue schedules
      if (schedule.status === 'pendiente' || schedule.status === 'vencido') {
        const dueDate = new Date(schedule.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = parseFloat(schedule.amount?.toString() || '0');

        if (daysOverdue < 0) {
          // Not yet due, count in 0-30
          agingRanges['0-30 días'] += amount;
        } else if (daysOverdue <= 30) {
          agingRanges['0-30 días'] += amount;
        } else if (daysOverdue <= 60) {
          agingRanges['31-60 días'] += amount;
        } else if (daysOverdue <= 90) {
          agingRanges['61-90 días'] += amount;
        } else if (daysOverdue <= 120) {
          agingRanges['91-120 días'] += amount;
        } else {
          agingRanges['+120 días'] += amount;
        }
      }
    });

    const labels = Object.keys(agingRanges);
    const data = Object.values(agingRanges);
    const hasData = data.some(v => v > 0);

    this.agingChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: hasData ? labels : ['Sin datos'],
        datasets: [{
          data: hasData ? data : [1],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(168, 85, 247, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              color: this.isDarkMode() ? '#e2e8f0' : '#475569'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                if (!hasData) return 'Sin datos';
                const label = context.label || '';
                const value = this.formatCurrency(context.parsed);
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Check if dark mode is enabled
   */
  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get status class for badge
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'vencido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado': return 'Pagado';
      case 'pendiente': return 'Pendiente';
      case 'vencido': return 'Vencido';
      default: return status;
    }
  }

  /**
   * Get days overdue class
   */
  getDaysOverdueClass(days: number): string {
    if (days === 0) return 'text-slate-600 dark:text-slate-400';
    if (days <= 15) return 'text-yellow-600 dark:text-yellow-400';
    if (days <= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400 font-bold';
  }

  /**
   * Track by function for schedules
   */
  trackByScheduleId(index: number, schedule: PaymentSchedule): number {
    return schedule.schedule_id;
  }
}