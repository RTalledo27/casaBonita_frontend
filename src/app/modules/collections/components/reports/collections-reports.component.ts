import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timer, timeout, retryWhen, delayWhen, catchError, of, take } from 'rxjs';
import { Activity, AlertCircle, AlertTriangle, ArrowLeft, BarChart3, Calendar, CheckCircle, Clock, Download, DownloadIcon, FileSpreadsheet, FileText, Filter, LucideAngularModule, PieChart, Settings, Target, TrendingDown, TrendingUp, UsersIcon,DollarSign, Eye } from 'lucide-angular';
import { ChartConfiguration, Chart, ChartEvent, ActiveElement, LegendItem, LegendElement, TooltipItem, ScriptableContext } from 'chart.js';

import { ExportService } from '../../services/export.service';
import { CollectionsSimplifiedService, PaymentScheduleReport } from '../../services/collections-simplified.service';
import { AdvancedReportsService } from '../../services/advanced-reports.service';

// Advanced filters interface
interface AdvancedFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  amountRange?: {
    minAmount: number;
    maxAmount: number;
  };
  status?: string[];
  clientType?: string;
  paymentMethod?: string;
  collector?: string;
  riskLevel?: string;
  contractType?: string;
  region?: string;
  includePartialPayments?: boolean;
  groupBy?: 'client' | 'collector' | 'region' | 'contract_type';
  sortBy?: 'amount' | 'date' | 'client_name' | 'overdue_days';
  sortOrder?: 'asc' | 'desc';
}

@Component({
  selector: 'app-collections-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <!-- Header -->
      <div class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-700/60 shadow-lg">
        <div class="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 truncate">
                Reportes de Cobranzas
              </h1>
              <p class="text-slate-600 dark:text-slate-400 mt-1 text-xs sm:text-sm lg:text-base">Análisis detallado y métricas de rendimiento</p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button 
                (click)="toggleAdvancedFilters()"
                class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <lucide-angular [img]="FilterIcon" class="w-3 h-3 sm:w-4 sm:h-4"></lucide-angular>
                <span class="hidden xs:inline">Filtros</span>
                <span class="sm:hidden">Avanzados</span>
                <span class="hidden sm:inline">Avanzados</span>
              </button>
              
              <button 
                (click)="exportReport()"
                [disabled]="!reportData()"
                class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <lucide-angular [img]="DownloadIcon" class="w-3 h-3 sm:w-4 sm:h-4"></lucide-angular>
                <span class="hidden xs:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <!-- Filters Section -->
        <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg mb-6 sm:mb-8">
          <div class="p-4 sm:p-6">
            <form [formGroup]="filterForm" class="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6">
              <!-- Date From -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  <lucide-angular [img]="CalendarIcon" class="w-4 h-4 inline mr-2"></lucide-angular>
                  Fecha Desde
                </label>
                <input
                  type="date"
                  formControlName="date_from"
                  class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <!-- Date To -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  <lucide-angular [img]="CalendarIcon" class="w-4 h-4 inline mr-2"></lucide-angular>
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  formControlName="date_to"
                  class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <!-- Status Filter -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  <lucide-angular [img]="ActivityIcon" class="w-4 h-4 inline mr-2"></lucide-angular>
                  Estado
                </label>
                <select
                  formControlName="status"
                  class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Todos los estados</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>

              <!-- Report Type -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  <lucide-angular [img]="BarChart3Icon" class="w-4 h-4 inline mr-2"></lucide-angular>
                  Tipo de Reporte
                </label>
                <select
                  formControlName="report_type"
                  class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="summary">Resumen</option>
                  <option value="detailed">Detallado</option>
                  <option value="overdue">Vencidos</option>
                  <option value="efficiency">Eficiencia</option>
                </select>
              </div>
            </form>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                (click)="generateReport()"
                [disabled]="isLoading()"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <lucide-angular [img]="BarChart3Icon" class="w-4 h-4"></lucide-angular>
                <span>{{ isLoading() ? 'Generando...' : 'Generar Reporte' }}</span>
              </button>
              
              <button
                (click)="resetFilters()"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-8 text-center">
          <div class="flex flex-col items-center space-y-4">
            <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div class="space-y-2">
              <p class="text-lg font-medium text-slate-900 dark:text-slate-100">{{ loadingMessage() || 'Generando reporte...' }}</p>
              <div class="w-64 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="loadingProgress()"
                ></div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">{{ loadingProgress() }}% completado</p>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage()" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"></lucide-angular>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error al generar reporte</h3>
              <p class="text-red-700 dark:text-red-300 mb-4">{{ errorMessage() }}</p>
              <div class="flex gap-3">
                <button
                  (click)="retryLastOperation()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
                <button
                  (click)="clearError()"
                  class="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-transparent border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div *ngIf="reportData() && !isLoading()" class="space-y-6 sm:space-y-8">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <!-- Total Amount Card -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-6 cursor-pointer hover:shadow-lg transition-all duration-200" (click)="showAmountBreakdown('Total')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-700 dark:text-blue-300">Monto Total</p>
                  <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{{ formatCurrency(reportData()?.total_amount || 0) }}</p>
                  <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">{{ reportData()?.total_schedules || 0 }} cronogramas</p>
                </div>
                <lucide-angular [img]="DollarSignIcon" class="w-8 h-8 text-blue-600 dark:text-blue-400"></lucide-angular>
              </div>
            </div>

            <!-- Paid Amount Card -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/60 dark:border-green-800/60 p-6 cursor-pointer hover:shadow-lg transition-all duration-200" (click)="showAmountBreakdown('Cobrado')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-700 dark:text-green-300">Cobrado</p>
                  <p class="text-2xl font-bold text-green-900 dark:text-green-100">{{ formatCurrency(reportData()?.paid_amount || 0) }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ reportData()?.paid_schedules || 0 }} pagados</p>
                </div>
                <lucide-angular [img]="CheckCircleIcon" class="w-8 h-8 text-green-600 dark:text-green-400"></lucide-angular>
              </div>
            </div>

            <!-- Pending Amount Card -->
            <div class="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/60 dark:border-yellow-800/60 p-6 cursor-pointer hover:shadow-lg transition-all duration-200" (click)="showAmountBreakdown('Pendiente')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pendiente</p>
                  <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{{ formatCurrency(reportData()?.pending_amount || 0) }}</p>
                  <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{{ reportData()?.pending_schedules || 0 }} pendientes</p>
                </div>
                <lucide-angular [img]="ClockIcon" class="w-8 h-8 text-yellow-600 dark:text-yellow-400"></lucide-angular>
              </div>
            </div>

            <!-- Overdue Amount Card -->
            <div class="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200/60 dark:border-red-800/60 p-6 cursor-pointer hover:shadow-lg transition-all duration-200" (click)="showAmountBreakdown('Vencido')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-red-700 dark:text-red-300">Vencido</p>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-100">{{ formatCurrency(reportData()?.overdue_amount || 0) }}</p>
                  <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ reportData()?.overdue_schedules || 0 }} vencidos</p>
                </div>
                <lucide-angular [img]="AlertCircleIcon" class="w-8 h-8 text-red-600 dark:text-red-400"></lucide-angular>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <!-- Status Distribution Chart -->
            <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Distribución por Estado</h3>
                <lucide-angular [img]="PieChartIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
              </div>
              <div class="relative h-64">
                <canvas #statusChart></canvas>
              </div>
            </div>

            <!-- Amount Distribution Chart -->
            <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Distribución de Montos</h3>
                <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
              </div>
              <div class="relative h-64">
                <canvas #amountChart></canvas>
              </div>
            </div>

            <!-- Trends Chart -->
            <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Tendencias Mensuales</h3>
                <lucide-angular [img]="TrendingUpIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
              </div>
              <div class="relative h-64">
                <canvas #trendsChart></canvas>
              </div>
            </div>

            <!-- Aging Analysis Chart -->
            <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Análisis de Antigüedad</h3>
                <lucide-angular [img]="ActivityIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
              </div>
              <div class="relative h-64">
                <canvas #agingChart></canvas>
              </div>
            </div>
          </div>

          <!-- Detailed Table -->
          <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Detalle de Cronogramas</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contrato</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lote</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Vencimiento</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Días Vencido</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  <tr *ngFor="let schedule of reportData()?.schedules || []; trackBy: trackByScheduleId" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ schedule.contract_number }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {{ schedule.client_name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {{ schedule.contract_number || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusClass(schedule.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {{ getStatusLabel(schedule.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatCurrency(schedule.amount) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {{ formatDate(schedule.due_date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      <span [class]="getDaysOverdueClass(schedule.days_overdue)">
                        {{ schedule.days_overdue || 0 }} días
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        (click)="viewScheduleDetails(schedule)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <lucide-angular [img]="EyeIcon" class="w-4 h-4"></lucide-angular>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
  EyeIcon = Eye;

  // Chart references
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amountChart', { static: false }) amountChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart', { static: false }) trendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('agingChart', { static: false }) agingChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  statusChart?: Chart;
  amountChart?: Chart;
  trendsChart?: Chart;
  agingChart?: Chart;

  // Services
  private fb = inject(FormBuilder);
  private collectionsService = inject(CollectionsSimplifiedService);
  private exportService = inject(ExportService);
  private advancedReportsService = inject(AdvancedReportsService);

  // Component state
  private destroy$ = new Subject<void>();
  
  // Reactive state
  reportData = signal<PaymentScheduleReport | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  loadingMessage = signal('');
  loadingProgress = signal(0);

  // Form
  filterForm: FormGroup;

  // Advanced filters
  showAdvancedFilters = signal(false);
  advancedFilters = signal<AdvancedFilters>({});

  constructor() {
    this.filterForm = this.fb.group({
      date_from: [''],
      date_to: [''],
      status: [''],
      report_type: ['summary']
    });
  }

  ngOnInit() {
    this.setupFormSubscriptions();
    this.setDefaultDates();
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
   * Sets up form subscriptions for reactive updates
   */
  private setupFormSubscriptions() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Auto-generate report on form changes if needed
      });
  }

  /**
   * Sets default date range (current month)
   */
  private setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm.patchValue({
      date_from: firstDay.toISOString().split('T')[0],
      date_to: lastDay.toISOString().split('T')[0]
    });
  }

  /**
   * Generates the collections report
   */
  generateReport() {
    if (!this.validateFilters()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.loadingMessage.set('Generando reporte de cobranzas...');
    this.loadingProgress.set(0);

    const filters = this.filterForm.value;

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.loadingProgress.update(progress => {
        const newProgress = progress + 10;
        if (newProgress >= 90) {
          clearInterval(progressInterval);
        }
        return Math.min(newProgress, 90);
      });
    }, 200);

    this.collectionsService.getPaymentScheduleReport(filters)
      .pipe(
        timeout(30000),
        retryWhen(errors => 
          errors.pipe(
            delayWhen(() => timer(2000)),
            take(3)
          )
        ),
        catchError(error => {
          console.error('Error generating report:', error);
          this.errorMessage.set('Error al generar el reporte. Por favor, intente nuevamente.');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: any) => {
          clearInterval(progressInterval);
          this.loadingProgress.set(100);
          
          setTimeout(() => {
            this.isLoading.set(false);
            if (data) {
              this.reportData.set(this.processReportData(data));
              this.createCharts();
            }
          }, 500);
        },
        error: (error: any) => {
          clearInterval(progressInterval);
          this.isLoading.set(false);
          this.errorMessage.set('Error al generar el reporte');
          console.error('Report generation error:', error);
        }
      });
  }

  /**
   * Resets all filters to default values
   */
  resetFilters() {
    this.filterForm.reset();
    this.setDefaultDates();
    this.reportData.set(null);
    this.errorMessage.set('');
    this.destroyCharts();
  }

  /**
   * Creates all charts after data is loaded
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
   * Creates the status distribution chart
   */
  private createStatusChart() {
    if (!this.statusChartRef?.nativeElement) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    const statusData = {
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
    };

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: statusData,
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
        },
        onClick: (event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const labels = ['Pagado', 'Pendiente', 'Vencido'];
            this.showStatusBreakdown(labels[index]);
          }
        }
      }
    });
  }

  /**
   * Creates the amount distribution chart
   */
  private createAmountChart() {
    if (!this.amountChartRef?.nativeElement) return;

    const ctx = this.amountChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const report = this.reportData();
    if (!report) return;

    const amountData = {
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
        borderWidth: 2
      }]
    };

    this.amountChart = new Chart(ctx, {
      type: 'bar',
      data: amountData,
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
        },
        onClick: (event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const categories = ['Total', 'Cobrado', 'Pendiente', 'Vencido'];
            this.showAmountBreakdown(categories[index]);
          }
        }
      }
    });
  }

  /**
   * Creates the aging analysis chart
   */
  private createAgingChart() {
    if (!this.agingChartRef?.nativeElement) return;

    const ctx = this.agingChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Mock aging data - replace with real data
    const agingData = {
      labels: ['0-30 días', '31-60 días', '61-90 días', '91-120 días', '120+ días'],
      datasets: [{
        label: 'Monto Vencido',
        data: [50000, 30000, 20000, 15000, 10000],
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
    };

    this.agingChart = new Chart(ctx, {
      type: 'doughnut',
      data: agingData,
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
        },
        onClick: (event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const ranges = ['0-30', '31-60', '61-90', '91-120', '120+'];
            this.showAgingBreakdown(ranges[index]);
          }
        }
      }
    });
  }

  /**
   * Creates the trends chart showing monthly collection trends
   */
  private createTrendsChart() {
    if (!this.trendsChartRef?.nativeElement) return;

    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Mock trends data - replace with real data
    const trendsData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Cobrado',
          data: [120000, 150000, 180000, 160000, 200000, 220000],
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Vencido',
          data: [80000, 70000, 60000, 75000, 65000, 55000],
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.trendsChart = new Chart(ctx, {
      type: 'line',
      data: trendsData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
              color: this.isDarkMode() ? '#e2e8f0' : '#475569'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'line'>) => {
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
              color: this.isDarkMode() ? '#334155' : '#e2e8f0'
            }
          }
        }
      }
    });
  }

  /**
   * Shows detailed breakdown for status segments
   */
  showStatusBreakdown(status: string) {
    const report = this.reportData();
    if (!report) return;

    let message = '';
    switch (status) {
      case 'Pagado':
        message = `Estado: ${status}\nCronogramas: ${report.paid_schedules}\nMonto: ${this.formatCurrency(report.paid_amount)}\nPorcentaje: ${this.getPaymentRate()}%`;
        break;
      case 'Pendiente':
        message = `Estado: ${status}\nCronogramas: ${report.pending_schedules}\nMonto: ${this.formatCurrency(report.pending_amount)}\nDías promedio: ${this.getAverageDaysOverdue()} días`;
        break;
      case 'Vencido':
        message = `Estado: ${status}\nCronogramas: ${report.overdue_schedules}\nMonto: ${this.formatCurrency(report.overdue_amount)}\nDías promedio vencido: ${this.getAverageDaysOverdue()} días`;
        break;
      default:
        message = `Información no disponible para: ${status}`;
    }

    alert(message);
  }

  /**
   * Shows detailed breakdown for amount segments
   */
  showAmountBreakdown(category: string) {
    const report = this.reportData();
    if (!report) return;

    let message = '';
    switch (category) {
      case 'Total':
        message = `Categoría: ${category}\nCronogramas: ${report.total_schedules}\nMonto: ${this.formatCurrency(report.total_amount)}\nPromedio por cronograma: ${this.formatCurrency(report.total_amount / report.total_schedules)}`;
        break;
      case 'Cobrado':
        message = `Categoría: ${category}\nCronogramas: ${report.paid_schedules}\nMonto: ${this.formatCurrency(report.paid_amount)}\nTasa de cobro: ${this.getPaymentRate()}%`;
        break;
      case 'Pendiente':
        message = `Categoría: ${category}\nCronogramas: ${report.pending_schedules}\nMonto: ${this.formatCurrency(report.pending_amount)}\nPorcentaje del total: ${((report.pending_amount / report.total_amount) * 100).toFixed(1)}%`;
        break;
      case 'Vencido':
        message = `Categoría: ${category}\nCronogramas: ${report.overdue_schedules}\nMonto: ${this.formatCurrency(report.overdue_amount)}\nPorcentaje del total: ${((report.overdue_amount / report.total_amount) * 100).toFixed(1)}%`;
        break;
      default:
        message = `Información no disponible para: ${category}`;
    }

    alert(message);
  }

  /**
   * Shows detailed breakdown for aging segments
   */
  showAgingBreakdown(range: string) {
    // Mock aging breakdown - replace with real data
    const agingData = {
      '0-30': { schedules: 45, amount: 50000 },
      '31-60': { schedules: 32, amount: 30000 },
      '61-90': { schedules: 28, amount: 20000 },
      '91-120': { schedules: 15, amount: 15000 },
      '120+': { schedules: 12, amount: 10000 }
    };

    const data = agingData[range as keyof typeof agingData];
    if (data) {
      const message = `Rango de días: ${range}\nCronogramas: ${data.schedules}\nMonto: ${this.formatCurrency(data.amount)}\nPromedio por cronograma: ${this.formatCurrency(data.amount / data.schedules)}`;
      alert(message);
    }
  }

  /**
   * Gets the payment rate percentage
   */
  getPaymentRate(): string {
    const report = this.reportData();
    if (!report || report.total_amount === 0) return '0.0';
    
    const rate = (report.paid_amount / report.total_amount) * 100;
    return rate.toFixed(1);
  }

  /**
   * Gets average days overdue
   */
  getAverageDaysOverdue(): number {
    // Mock calculation - replace with real data
    return 45;
  }

  /**
   * Formats currency values
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formats date values
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-GT');
  }

  /**
   * Gets status label with proper formatting
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'overdue': 'Vencido',
      'partial': 'Parcial'
    };
    return statusMap[status] || status;
  }

  /**
   * Gets CSS class for status badge
   */
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'paid': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'partial': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }

  /**
   * Gets CSS class for days overdue
   */
  getDaysOverdueClass(days: number | undefined): string {
    const daysOverdue = days || 0;
    if (daysOverdue === 0) return 'text-green-600 dark:text-green-400';
    if (daysOverdue <= 30) return 'text-yellow-600 dark:text-yellow-400';
    if (daysOverdue <= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  /**
   * Track by function for schedule list
   */
  trackByScheduleId(index: number, schedule: any): any {
    return schedule.id || index;
  }

  /**
   * Views schedule details
   */
  viewScheduleDetails(schedule: any) {
    // Implement schedule details view
    console.log('View schedule details:', schedule);
  }

  /**
   * Exports the current report
   */
  exportReport() {
    if (!this.reportData()) {
      alert('No hay datos para exportar');
      return;
    }

    const filters = this.filterForm.value;
    const filename = `reporte_cobranzas_${filters.date_from}_${filters.date_to}`;
    
    this.exportService.exportToExcel(this.reportData()!.schedules, filename);
  }

  /**
   * Retries the last failed operation
   */
  retryLastOperation() {
    this.clearError();
    this.generateReport();
  }

  /**
   * Clears the current error message
   */
  clearError() {
    this.errorMessage.set('');
  }

  /**
   * Checks if dark mode is enabled
   */
  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  /**
   * Toggles the advanced filters panel
   */
  toggleAdvancedFilters() {
    this.showAdvancedFilters.update(show => !show);
  }

  /**
   * Handles advanced filters changes
   */
  onAdvancedFiltersChange(filters: AdvancedFilters) {
    this.advancedFilters.set(filters);
    this.generateAdvancedReport();
  }

  /**
   * Generates report with advanced filters
   */
  generateAdvancedReport() {
    if (!this.validateFilters()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.loadingMessage.set('Aplicando filtros avanzados...');
    this.loadingProgress.set(0);

    const filters = {
      ...this.filterForm.value,
      ...this.advancedFilters()
    };

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.loadingProgress.update(progress => {
        const newProgress = progress + 10;
        if (newProgress >= 90) {
          clearInterval(progressInterval);
        }
        return Math.min(newProgress, 90);
      });
    }, 200);

    this.advancedReportsService.getAdvancedReport(filters)
      .pipe(
        timeout(30000),
        retryWhen(errors => 
          errors.pipe(
            delayWhen(() => timer(2000)),
            take(3)
          )
        ),
        catchError(error => {
          console.error('Error generating advanced report:', error);
          this.errorMessage.set('Error al generar el reporte avanzado. Por favor, intente nuevamente.');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          clearInterval(progressInterval);
          this.loadingProgress.set(100);
          
          setTimeout(() => {
            this.isLoading.set(false);
            if (data) {
              this.reportData.set(data);
              this.createCharts();
            }
          }, 500);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isLoading.set(false);
          this.errorMessage.set('Error al generar el reporte avanzado');
          console.error('Advanced report error:', error);
        }
      });
  }

  /**
   * Processes report data for display
   */
  private processReportData(data: any): PaymentScheduleReport {
    return {
      contract_id: data.contract_id || '',
      contract_number: data.contract_number || '',
      client_name: data.client_name || '',
      lot_name: data.lot_name || '',
      total_schedules: data.total_schedules || 0,
      paid_schedules: data.paid_schedules || 0,
      pending_schedules: data.pending_schedules || 0,
      overdue_schedules: data.overdue_schedules || 0,
      total_amount: data.total_amount || 0,
      paid_amount: data.paid_amount || 0,
      pending_amount: data.pending_amount || 0,
      overdue_amount: data.overdue_amount || 0,
      payment_rate: data.payment_rate || 0,

      schedules: data.schedules || []
    };
  }

  /**
   * Validation methods
   */
  private validateFilters(): boolean {
    const filters = this.filterForm.value;
    const advanced = this.advancedFilters();
    
    // Validate date range
    if (filters.date_from && filters.date_to) {
      const fromDate = new Date(filters.date_from);
      const toDate = new Date(filters.date_to);
      
      if (fromDate > toDate) {
        this.showValidationErrors(['La fecha de inicio no puede ser mayor que la fecha final']);
        return false;
      }
    }
    
    // Validate amount range
    if (advanced.amountRange) {
      const { minAmount, maxAmount } = advanced.amountRange;
      if (minAmount && maxAmount && minAmount > maxAmount) {
        this.showValidationErrors(['El monto mínimo no puede ser mayor que el monto máximo']);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Shows validation errors to the user
   */
  private showValidationErrors(errors: string[]) {
    const errorMessage = errors.join('\n');
    this.errorMessage.set(errorMessage);
  }

  /**
   * Destroys all chart instances
   */
  private destroyCharts() {
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = undefined;
    }
    if (this.amountChart) {
      this.amountChart.destroy();
      this.amountChart = undefined;
    }
    if (this.trendsChart) {
      this.trendsChart.destroy();
      this.trendsChart = undefined;
    }
    if (this.agingChart) {
      this.agingChart.destroy();
      this.agingChart = undefined;
    }
  }
}