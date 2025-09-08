import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { 
  LucideAngularModule, 
  Filter, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  ArrowLeft,
  FileText,
  AlertTriangle
} from 'lucide-angular';
import { CollectionsSimplifiedService, PaymentScheduleReport } from '../../services/collections-simplified.service';
import { PaymentSchedule } from '../../models/payment-schedule';

@Component({
  selector: 'app-collections-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
   <div class="p-6 space-y-6">
  <!-- Header -->
  <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl">
    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 pointer-events-none"></div>
    <div class="flex items-center justify-between p-5 relative">
      <div class="flex items-center gap-4">
        <button
          routerLink="/collections/dashboard"
          class="group p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition"
          title="Volver"
        >
          <lucide-angular [img]="ArrowLeftIcon" class="w-5 h-5 group-hover:scale-110 transition"></lucide-angular>
        </button>

        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200">
            Reportes de Cronogramas
          </h1>
          <p class="text-slate-600 dark:text-slate-400 mt-1">Análisis y reportes de estado de pagos</p>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          (click)="exportReport()"
          [disabled]="isLoading()"
          class="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 rounded-xl transition"></div>
          <lucide-angular [img]="DownloadIcon" class="w-4 h-4 relative z-10"></lucide-angular>
          <span class="relative z-10">Exportar Reporte</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl">
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>

    <div class="flex items-center justify-between p-5">
      <h2 class="text-lg font-bold flex items-center gap-2">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow">
          <lucide-angular [img]="FilterIcon" class="w-5 h-5"></lucide-angular>
        </span>
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Filtros de Reporte
        </span>
      </h2>

      <button
        (click)="resetFilters()"
        class="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
      >
        Restablecer
      </button>
    </div>

    <div class="px-5 pb-5">
      <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date From -->
        <div class="group">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha Desde</label>
          <div class="relative">
            <lucide-angular [img]="CalendarIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
            <input
              type="date"
              formControlName="date_from"
              class="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
            >
          </div>
        </div>

        <!-- Date To -->
        <div class="group">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha Hasta</label>
          <div class="relative">
            <lucide-angular [img]="CalendarIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
            <input
              type="date"
              formControlName="date_to"
              class="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
            >
          </div>
        </div>

        <!-- Status -->
        <div class="group">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estado</label>
          <div class="relative">
            <lucide-angular [img]="PieChartIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
            <select
              formControlName="status"
              class="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition appearance-none"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
          </div>
        </div>

        <!-- Report Type -->
        <div class="group">
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo de Reporte</label>
          <div class="relative">
            <lucide-angular [img]="BarChart3Icon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
            <select
              formControlName="report_type"
              class="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition appearance-none"
            >
              <option value="summary">Resumen</option>
              <option value="detailed">Detallado</option>
              <option value="overdue">Solo Vencidos</option>
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
          </div>
        </div>
      </form>

      <div class="mt-5 flex justify-end">
        <button
          (click)="generateReport()"
          [disabled]="isLoading()"
          class="group relative inline-flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 rounded-xl transition"></div>

          @if (isLoading()) {
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Generando…</span>
          } @else {
            <lucide-angular [img]="BarChart3Icon" class="w-4 h-4"></lucide-angular>
            <span>Generar Reporte</span>
          }
        </button>
      </div>
    </div>
  </div>

  <!-- Report Results -->
  @if (reportData()) {
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Schedules -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div class="relative flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Cronogramas</p>
              <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{{ reportData()!.total_schedules }}</p>
            </div>
            <div class="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
              <lucide-angular [img]="FileTextIcon" class="w-6 h-6"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Total Amount -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
          <div class="relative flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Monto Total</p>
              <p class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{{ formatCurrency(reportData()!.total_amount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow">
              <lucide-angular [img]="DollarSignIcon" class="w-6 h-6"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Paid Amount -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5"></div>
          <div class="relative flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Monto Pagado</p>
              <p class="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1">{{ formatCurrency(reportData()!.paid_amount) }}</p>
              <div class="flex items-center mt-1">
                <lucide-angular [img]="TrendingUpIcon" class="w-3 h-3 text-green-500 mr-1"></lucide-angular>
                <span class="text-xs font-semibold text-green-600 dark:text-green-400">{{ getPaymentRate() }}%</span>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow">
              <lucide-angular [img]="TrendingUpIcon" class="w-6 h-6"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Overdue Amount -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5"></div>
          <div class="relative flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Monto Vencido</p>
              <p class="text-2xl font-extrabold text-red-600 dark:text-rose-400 mt-1">{{ formatCurrency(reportData()!.overdue_amount) }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ getOverdueCount() }} cuotas</p>
            </div>
            <div class="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow">
              <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6"></lucide-angular>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Distribution & Trend -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Status Breakdown -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
          <h3 class="relative text-lg font-bold mb-4 flex items-center gap-2">
            <lucide-angular [img]="PieChartIcon" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></lucide-angular>
            <span>Distribución por Estado</span>
          </h3>

          <div class="space-y-4 relative">
            @for (status of getStatusBreakdown(); track status.name) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div [class]="'w-3.5 h-3.5 rounded ring-1 ring-black/5 ' + status.color"></div>
                  <span class="text-sm font-medium text-slate-900 dark:text-white">{{ status.label }}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ status.count }}</p>
                  <p class="text-xs text-slate-500">{{ formatCurrency(status.amount) }}</p>
                </div>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
                <div
                  [class]="'h-2 rounded-full ' + status.color"
                  [style.width.%]="status.percentage"
                ></div>
              </div>
            }
          </div>
        </div>

        <!-- Monthly Trend (placeholder) -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
          <h3 class="relative text-lg font-bold mb-4 flex items-center gap-2">
            <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-angular>
            <span>Tendencia Mensual</span>
          </h3>
          <div class="relative text-center py-10 text-slate-500 dark:text-slate-400">
            Funcionalidad de tendencia mensual próximamente
          </div>
        </div>
      </div>

      <!-- Detailed Table -->
      @if (filterForm.get('report_type')?.value === 'detailed' && reportData()!.schedules) {
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl">
          <div class="px-6 py-4 border-b border-slate-200/70 dark:border-slate-700/60">
            <h3 class="text-lg font-bold">Detalle de Cronogramas</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/80 backdrop-blur">
                <tr class="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th class="px-6 py-3 font-semibold">Contrato</th>
                  <th class="px-6 py-3 font-semibold">Fecha Vencimiento</th>
                  <th class="px-6 py-3 font-semibold">Monto</th>
                  <th class="px-6 py-3 font-semibold">Estado</th>
                  <th class="px-6 py-3 font-semibold">Días Vencido</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 dark:divide-slate-700/60">
                @for (schedule of reportData()!.schedules!; track schedule.schedule_id) {
                  <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{{ schedule.contract_id }}</td>
                    <td class="px-6 py-4 text-sm text-slate-800 dark:text-slate-200">{{ formatDate(schedule.due_date) }}</td>
                    <td class="px-6 py-4 text-sm text-slate-900 dark:text-white">{{ formatCurrency(schedule.amount) }}</td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      @if (schedule.status === 'vencido') {
                        <span class="text-red-600 dark:text-rose-400 font-semibold">{{ getDaysOverdue(schedule.due_date) }} días</span>
                      } @else {
                        <span class="text-slate-400">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  } @else if (!isLoading()) {
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl p-12 text-center">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
      <lucide-angular [img]="BarChart3Icon" class="w-16 h-16 mx-auto mb-4 text-slate-400"></lucide-angular>
      <h3 class="text-lg font-bold mb-1">Generar Reporte</h3>
      <p class="text-slate-600 dark:text-slate-400">Configura los filtros y haz clic en “Generar Reporte” para ver los resultados</p>
    </div>
  }

  <!-- Error Message -->
  @if (errorMessage()) {
    <div class="relative overflow-hidden rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/80 dark:bg-red-900/20 p-4 flex items-center gap-3 shadow">
      <div class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10"></div>
      <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5 text-red-600 dark:text-rose-400 relative"></lucide-angular>
      <p class="text-red-800 dark:text-rose-200 font-medium relative">{{ errorMessage() }}</p>
    </div>
  }
</div>

  `
})
export class CollectionsReportsComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Icons
  FilterIcon = Filter;
  DownloadIcon = Download;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  ArrowLeftIcon = ArrowLeft;
  FileTextIcon = FileText;
  AlertTriangleIcon = AlertTriangle;

  // Signals
  reportData = signal<PaymentScheduleReport | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Form
  filterForm: FormGroup;

  constructor() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      date_from: [firstDayOfMonth.toISOString().split('T')[0]],
      date_to: [lastDayOfMonth.toISOString().split('T')[0]],
      status: [''],
      report_type: ['summary']
    });
  }

  ngOnInit() {
    // Watch for filter changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Auto-generate report when filters change (optional)
        // this.generateReport();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateReport() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const filters = this.filterForm.value;
    const reportType = filters.report_type;
    
    let reportObservable;
    
    // Select the appropriate report method based on type
    switch (reportType) {
      case 'summary':
        reportObservable = this.collectionsService.getPaymentSummaryReport(filters);
        break;
      case 'detailed':
        reportObservable = this.collectionsService.getOverdueAnalysisReport(filters);
        break;
      case 'overdue':
        reportObservable = this.collectionsService.getAgingReport(filters);
        break;
      default:
        reportObservable = this.collectionsService.getCollectionEfficiencyReport(filters);
    }
    
    reportObservable
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error generating report:', error);
          this.errorMessage.set('Error al generar el reporte');
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          // Handle different response formats from different report endpoints
          let report: PaymentScheduleReport | null = null;
          if (response && response.success) {
            report = response.data;
          } else if (response) {
            report = response;
          }
          this.reportData.set(report);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  resetFilters() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm.reset({
      date_from: firstDayOfMonth.toISOString().split('T')[0],
      date_to: lastDayOfMonth.toISOString().split('T')[0],
      status: '',
      report_type: 'summary'
    });
    
    this.reportData.set(null);
  }

  exportReport() {
    if (!this.reportData()) {
      return;
    }

    // Create CSV content
    const report = this.reportData()!;
    let csvContent = 'Reporte de Cronogramas de Pago\n\n';
    
    // Summary
    csvContent += 'Resumen\n';
    csvContent += `Total Cronogramas,${report.total_schedules}\n`;
    csvContent += `Monto Total,${report.total_amount}\n`;
    csvContent += `Monto Pagado,${report.paid_amount}\n`;
    csvContent += `Monto Pendiente,${report.pending_amount}\n`;
    csvContent += `Monto Vencido,${report.overdue_amount}\n`;
    csvContent += `Cronogramas Vencidos,${Math.round((report.overdue_amount || 0) / ((report.total_amount || 1) / (report.total_schedules || 1)))}\n\n`;
    
    // Detailed data if available
    if (report.schedules && report.schedules.length > 0) {
      csvContent += 'Detalle de Cronogramas\n';
      csvContent += 'Contrato,Fecha Vencimiento,Monto,Estado,Días Vencido\n';
      
      report.schedules.forEach((schedule: PaymentSchedule) => {
        const daysOverdue = schedule.status === 'vencido' ? this.getDaysOverdue(schedule.due_date) : 0;
        csvContent += `${schedule.contract_id},${schedule.due_date},${schedule.amount},${schedule.status},${daysOverdue}\n`;
      });
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_cronogramas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getPaymentRate(): string {
    const report = this.reportData();
    if (!report || report.total_amount === 0) {
      return '0.0';
    }
    return ((report.paid_amount / report.total_amount) * 100).toFixed(1);
  }

  getStatusBreakdown() {
    const report = this.reportData();
    if (!report) return [];

    const total = report.total_schedules;
    const paidCount = this.getPaidCount();
    const pendingCount = this.getPendingCount();
    const overdueCount = this.getOverdueCount();
    
    return [
      {
        name: 'paid',
        label: 'Pagado',
        count: paidCount,
        amount: report.paid_amount,
        percentage: total > 0 ? (paidCount / total) * 100 : 0,
        color: 'bg-green-500'
      },
      {
        name: 'pending',
        label: 'Pendiente',
        count: pendingCount,
        amount: report.pending_amount,
        percentage: total > 0 ? (pendingCount / total) * 100 : 0,
        color: 'bg-yellow-500'
      },
      {
        name: 'overdue',
        label: 'Vencido',
        count: overdueCount,
        amount: report.overdue_amount,
        percentage: total > 0 ? (overdueCount / total) * 100 : 0,
        color: 'bg-red-500'
      }
    ];
  }

  getPaidCount(): number {
    const report = this.reportData();
    if (!report) return 0;
    return Math.round((report.paid_amount || 0) / ((report.total_amount || 1) / (report.total_schedules || 1)));
  }

  getPendingCount(): number {
    const report = this.reportData();
    if (!report) return 0;
    return Math.round((report.pending_amount || 0) / ((report.total_amount || 1) / (report.total_schedules || 1)));
  }

  getOverdueCount(): number {
    const report = this.reportData();
    if (!report) return 0;
    return Math.round((report.overdue_amount || 0) / ((report.total_amount || 1) / (report.total_schedules || 1)));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatMonth(monthString: string): string {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
      case 'vencido':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
      case 'pendiente':
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  getDaysOverdue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}