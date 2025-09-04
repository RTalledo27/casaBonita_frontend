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
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button 
            routerLink="/collections/dashboard"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <lucide-angular [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-angular>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Reportes de Cronogramas</h1>
            <p class="text-gray-600 mt-1">Análisis y reportes de estado de pagos</p>
          </div>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="exportReport()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <lucide-angular [img]="FilterIcon" class="w-5 h-5 mr-2"></lucide-angular>
            Filtros de Reporte
          </h2>
          <button 
            (click)="resetFilters()"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Restablecer
          </button>
        </div>
        
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
            <input
              type="date"
              formControlName="date_from"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
            <input
              type="date"
              formControlName="date_to"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              formControlName="status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <!-- Report Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
            <select
              formControlName="report_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summary">Resumen</option>
              <option value="detailed">Detallado</option>
              <option value="overdue">Solo Vencidos</option>
            </select>
          </div>
        </form>

        <div class="mt-4 flex justify-end">
          <button 
            (click)="generateReport()"
            [disabled]="isLoading()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            @if (isLoading()) {
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generando...</span>
            } @else {
              <lucide-angular [img]="BarChart3Icon" class="w-4 h-4"></lucide-angular>
              <span>Generar Reporte</span>
            }
          </button>
        </div>
      </div>

      <!-- Report Results -->
      @if (reportData()) {
        <div class="space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Schedules -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Cronogramas</p>
                  <p class="text-2xl font-bold text-gray-900 mt-1">{{ reportData()!.total_schedules }}</p>
                </div>
                <div class="bg-blue-500 p-3 rounded-lg">
                  <lucide-angular [img]="FileTextIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
              </div>
            </div>

            <!-- Total Amount -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Monto Total</p>
                  <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(reportData()!.total_amount) }}</p>
                </div>
                <div class="bg-green-500 p-3 rounded-lg">
                  <lucide-angular [img]="DollarSignIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
              </div>
            </div>

            <!-- Paid Amount -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Monto Pagado</p>
                  <p class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(reportData()!.paid_amount) }}</p>
                  <div class="flex items-center mt-1">
                    <lucide-angular [img]="TrendingUpIcon" class="w-3 h-3 text-green-500 mr-1"></lucide-angular>
                    <span class="text-xs text-green-600">{{ getPaymentRate() }}%</span>
                  </div>
                </div>
                <div class="bg-green-500 p-3 rounded-lg">
                  <lucide-angular [img]="TrendingUpIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
              </div>
            </div>

            <!-- Overdue Amount -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Monto Vencido</p>
                  <p class="text-2xl font-bold text-red-600 mt-1">{{ formatCurrency(reportData()!.overdue_amount) }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getOverdueCount() }} cuotas</p>
                </div>
                <div class="bg-red-500 p-3 rounded-lg">
                  <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Distribution -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Status Breakdown -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <lucide-angular [img]="PieChartIcon" class="w-5 h-5 mr-2"></lucide-angular>
                Distribución por Estado
              </h3>
              <div class="space-y-4">
                @for (status of getStatusBreakdown(); track status.name) {
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <div [class]="'w-4 h-4 rounded ' + status.color"></div>
                      <span class="text-sm font-medium text-gray-900">{{ status.label }}</span>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-semibold text-gray-900">{{ status.count }}</p>
                      <p class="text-xs text-gray-500">{{ formatCurrency(status.amount) }}</p>
                    </div>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      [class]="'h-2 rounded-full ' + status.color"
                      [style.width.%]="status.percentage"
                    ></div>
                  </div>
                }
              </div>
            </div>

            <!-- Monthly Trend -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 mr-2"></lucide-angular>
                Tendencia Mensual
              </h3>
              <div class="text-center py-8 text-gray-500">
                <p>Funcionalidad de tendencia mensual próximamente</p>
              </div>
            </div>
          </div>

          <!-- Detailed Table -->
          @if (filterForm.get('report_type')?.value === 'detailed' && reportData()!.schedules) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Detalle de Cronogramas</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Vencido</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (schedule of reportData()!.schedules!; track schedule.schedule_id) {
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ schedule.contract_id }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ formatDate(schedule.due_date) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ formatCurrency(schedule.amount) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          @if (schedule.status === 'vencido') {
                            <span class="text-red-600 font-medium">{{ getDaysOverdue(schedule.due_date) }} días</span>
                          } @else {
                            <span class="text-gray-500">-</span>
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
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <lucide-angular [img]="BarChart3Icon" class="w-16 h-16 mx-auto mb-4 text-gray-400"></lucide-angular>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Generar Reporte</h3>
          <p class="text-gray-600">Configura los filtros y haz clic en "Generar Reporte" para ver los resultados</p>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5 text-red-600"></lucide-angular>
          <p class="text-red-800">{{ errorMessage() }}</p>
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