import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-angular';

import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { AdvancedReportsService, CollectorEfficiency, TrendData } from '../../services/advanced-reports.service';

interface DashboardMetrics {
  totalSchedules: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  pendingAmount: number;
  collectionRate: number;
  overdueRate: number;
  avgDaysOverdue: number;
  activeCollectors: number;
  topCollector: string;
  monthlyGrowth: number;
  weeklyTarget: number;
  weeklyAchievement: number;
}

@Component({
  selector: 'app-collections-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
  <!-- Header -->
  <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl mb-6">
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
    
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between p-6">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200">
          Dashboard de Cobranzas
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">Métricas clave y análisis en tiempo real</p>
      </div>
      
      <div class="flex items-center gap-3 mt-4 md:mt-0">
        <div class="text-right">
          <p class="text-sm text-slate-500 dark:text-slate-400">Última actualización</p>
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ getCurrentTime() }}</p>
        </div>
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    <!-- Collection Rate -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
      <div class="relative flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Tasa de Cobranza</p>
          <p class="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">{{ metrics().collectionRate.toFixed(1) }}%</p>
          <div class="flex items-center mt-2">
            <lucide-angular [img]="TrendingUpIcon" class="w-4 h-4 text-green-500 mr-1"></lucide-angular>
            <span class="text-sm font-semibold text-green-600">+{{ metrics().monthlyGrowth.toFixed(1) }}%</span>
            <span class="text-xs text-slate-500 ml-1">vs mes anterior</span>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow">
          <lucide-angular [img]="TargetIcon" class="w-6 h-6"></lucide-angular>
        </div>
      </div>
    </div>

    <!-- Total Amount -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
      <div class="relative flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Cartera Total</p>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{{ formatCurrency(metrics().totalAmount) }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ metrics().totalSchedules }} cronogramas</p>
        </div>
        <div class="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
          <lucide-angular [img]="DollarSignIcon" class="w-6 h-6"></lucide-angular>
        </div>
      </div>
    </div>

    <!-- Overdue Rate -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5"></div>
      <div class="relative flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Tasa de Morosidad</p>
          <p class="text-3xl font-extrabold text-red-600 dark:text-rose-400 mt-1">{{ metrics().overdueRate.toFixed(1) }}%</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ formatCurrency(metrics().overdueAmount) }}</p>
        </div>
        <div class="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow">
          <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6"></lucide-angular>
        </div>
      </div>
    </div>

    <!-- Active Collectors -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5"></div>
      <div class="relative flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Cobradores Activos</p>
          <p class="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{{ metrics().activeCollectors }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Top: {{ metrics().topCollector }}</p>
        </div>
        <div class="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow">
          <lucide-angular [img]="UsersIcon" class="w-6 h-6"></lucide-angular>
        </div>
      </div>
    </div>
  </div>

  <!-- Performance Indicators -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Weekly Target Progress -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
      <h3 class="relative text-lg font-bold mb-4 flex items-center gap-2">
        <lucide-angular [img]="TargetIcon" class="w-5 h-5 text-amber-600 dark:text-amber-400"></lucide-angular>
        <span>Meta Semanal</span>
      </h3>
      
      <div class="relative">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Progreso</span>
          <span class="text-sm font-bold text-slate-900 dark:text-white">
            {{ ((metrics().weeklyAchievement / metrics().weeklyTarget) * 100).toFixed(1) }}%
          </span>
        </div>
        
        <div class="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
          <div 
            class="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            [style.width.%]="(metrics().weeklyAchievement / metrics().weeklyTarget) * 100"
          ></div>
        </div>
        
        <div class="flex justify-between mt-2">
          <span class="text-xs text-slate-500">{{ formatCurrency(metrics().weeklyAchievement) }}</span>
          <span class="text-xs text-slate-500">{{ formatCurrency(metrics().weeklyTarget) }}</span>
        </div>
      </div>
    </div>

    <!-- Average Days Overdue -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
      <h3 class="relative text-lg font-bold mb-4 flex items-center gap-2">
        <lucide-angular [img]="ClockIcon" class="w-5 h-5 text-orange-600 dark:text-orange-400"></lucide-angular>
        <span>Días Promedio Vencido</span>
      </h3>
      
      <div class="relative text-center">
        <p class="text-4xl font-extrabold text-orange-600 dark:text-orange-400">{{ metrics().avgDaysOverdue.toFixed(0) }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">días promedio</p>
        
        <div class="mt-4 flex items-center justify-center">
          @if (metrics().avgDaysOverdue <= 30) {
            <div class="flex items-center text-green-600">
              <lucide-angular [img]="CheckCircleIcon" class="w-4 h-4 mr-1"></lucide-angular>
              <span class="text-sm font-semibold">Excelente</span>
            </div>
          } @else if (metrics().avgDaysOverdue <= 60) {
            <div class="flex items-center text-yellow-600">
              <lucide-angular [img]="ClockIcon" class="w-4 h-4 mr-1"></lucide-angular>
              <span class="text-sm font-semibold">Moderado</span>
            </div>
          } @else {
            <div class="flex items-center text-red-600">
              <lucide-angular [img]="AlertTriangleIcon" class="w-4 h-4 mr-1"></lucide-angular>
              <span class="text-sm font-semibold">Crítico</span>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg p-6">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
      <h3 class="relative text-lg font-bold mb-4 flex items-center gap-2">
        <lucide-angular [img]="ActivityIcon" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></lucide-angular>
        <span>Acciones Rápidas</span>
      </h3>
      
      <div class="space-y-3">
        <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all group">
          <lucide-angular [img]="BarChart3Icon" class="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform"></lucide-angular>
          <span class="text-sm font-medium text-slate-900 dark:text-white">Ver Reportes</span>
          <lucide-angular [img]="ArrowUpRightIcon" class="w-3 h-3 text-slate-400 ml-auto"></lucide-angular>
        </button>
        
        <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all group">
          <lucide-angular [img]="UsersIcon" class="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform"></lucide-angular>
          <span class="text-sm font-medium text-slate-900 dark:text-white">Gestionar Cobradores</span>
          <lucide-angular [img]="ArrowUpRightIcon" class="w-3 h-3 text-slate-400 ml-auto"></lucide-angular>
        </button>
        
        <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 transition-all group">
          <lucide-angular [img]="AlertTriangleIcon" class="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform"></lucide-angular>
          <span class="text-sm font-medium text-slate-900 dark:text-white">Cuentas Críticas</span>
          <lucide-angular [img]="ArrowUpRightIcon" class="w-3 h-3 text-slate-400 ml-auto"></lucide-angular>
        </button>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  @if (isLoading()) {
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-slate-600 dark:text-slate-400">Cargando métricas del dashboard...</p>
    </div>
  }

  <!-- Error State -->
  @if (errorMessage()) {
    <div class="relative overflow-hidden rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/80 dark:bg-red-900/20 p-4 flex items-center gap-3 shadow">
      <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5 text-red-600 dark:text-rose-400"></lucide-angular>
      <p class="text-red-800 dark:text-rose-200 font-medium">{{ errorMessage() }}</p>
    </div>
  }
</div>
  `
})
export class CollectionsDashboardComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly advancedReportsService = inject(AdvancedReportsService);
  private readonly destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  CalendarIcon = Calendar;
  TargetIcon = Target;
  ActivityIcon = Activity;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  ArrowUpRightIcon = ArrowUpRight;
  ArrowDownRightIcon = ArrowDownRight;

  // Signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  rawData = signal<any>(null);
  collectorData = signal<CollectorEfficiency[]>([]);
  trendData = signal<TrendData[]>([]);

  // Computed metrics
  metrics = computed(() => {
    const data = this.rawData();
    const collectors = this.collectorData();
    const trends = this.trendData();
    
    if (!data) {
      return {
        totalSchedules: 0,
        totalAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        pendingAmount: 0,
        collectionRate: 0,
        overdueRate: 0,
        avgDaysOverdue: 0,
        activeCollectors: 0,
        topCollector: 'N/A',
        monthlyGrowth: 0,
        weeklyTarget: 100000,
        weeklyAchievement: 0
      };
    }

    const collectionRate = data.total_amount > 0 ? (data.paid_amount / data.total_amount) * 100 : 0;
    const overdueRate = data.total_amount > 0 ? (data.overdue_amount / data.total_amount) * 100 : 0;
    
    // Calculate monthly growth from trends
    let monthlyGrowth = 0;
    if (trends.length >= 2) {
      const current = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      if (previous.predicted > 0) {
        monthlyGrowth = ((current.predicted - previous.predicted) / previous.predicted) * 100;
      }
    }

    // Find top collector
    let topCollector = 'N/A';
    if (collectors.length > 0) {
      const top = collectors.reduce((prev, current) => 
        (prev.efficiency > current.efficiency) ? prev : current
      );
      topCollector = top.topPerformers?.[0]?.name || 'N/A';
    }

    return {
      totalSchedules: data.total_schedules || 0,
      totalAmount: data.total_amount || 0,
      paidAmount: data.paid_amount || 0,
      overdueAmount: data.overdue_amount || 0,
      pendingAmount: data.pending_amount || 0,
      collectionRate,
      overdueRate,
      avgDaysOverdue: data.avg_days_overdue || 0,
      activeCollectors: collectors.length,
      topCollector,
      monthlyGrowth,
      weeklyTarget: 100000, // This should come from settings
      weeklyAchievement: data.paid_amount * 0.25 || 0 // Approximate weekly from monthly
    };
  });

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.loadDashboardData();
    }, 5 * 60 * 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dateFrom = firstDayOfMonth.toISOString().split('T')[0];
    const dateTo = lastDayOfMonth.toISOString().split('T')[0];

    // Load multiple data sources in parallel
    forkJoin({
      summary: this.collectionsService.getPaymentScheduleReport({
        due_date_from: dateFrom,
        due_date_to: dateTo,
        status: ''
      }),
      collectors: this.advancedReportsService.getCollectorEfficiency({
        dateFrom: dateFrom,
        dateTo: dateTo
      }),
      trends: this.advancedReportsService.getTrendAnalysis('monthly', {
        dateFrom: dateFrom,
        dateTo: dateTo
      })
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.rawData.set(data.summary);
        this.collectorData.set(data.collectors);
        // Convert MonthlyTrend to TrendData format
        const trendData: TrendData[] = data.trends.map(trend => ({
          month: trend.month,
          predicted: trend.paidAmount,
          confidence: 0.85 // Default confidence
        }));
        this.trendData.set(trendData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.errorMessage.set('Error al cargar los datos del dashboard');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}