import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Award
} from 'lucide-angular';
import { Subject, takeUntil, forkJoin, interval } from 'rxjs';
import { AdvancedReportsService, DashboardMetrics, CollectorEfficiency, TrendData } from '../../services/advanced-reports.service';

interface KPICard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend: 'up' | 'down' | 'stable';
}

interface QuickStat {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-enhanced-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
<div class="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
  <!-- Header Section -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Dashboard de Cobranzas
      </h1>
      <p class="text-slate-600 dark:text-slate-300">
        Métricas en tiempo real y análisis de rendimiento
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <lucide-angular [img]="ActivityIcon" class="w-4 h-4 text-green-500"></lucide-angular>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">En vivo</span>
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      
      <button 
        (click)="refreshData()"
        [disabled]="loading()"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
      >
        <lucide-angular [img]="ActivityIcon" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-angular>
        Actualizar
      </button>
    </div>
  </div>

  <!-- KPI Cards Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    @for (kpi of kpiCards(); track kpi.title) {
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between mb-4">
          <div [class]="getIconClasses(kpi.color)">
            <lucide-angular [img]="kpi.icon" class="w-6 h-6"></lucide-angular>
          </div>
          <div class="flex items-center gap-1 text-sm font-medium" [class]="getTrendClasses(kpi.trend)">
            <lucide-angular [img]="kpi.trend === 'up' ? TrendingUpIcon : TrendingDownIcon" class="w-4 h-4"></lucide-angular>
            <span>{{ kpi.change }}%</span>
          </div>
        </div>
        
        <div class="space-y-1">
          <h3 class="text-2xl font-bold text-slate-900 dark:text-white">{{ kpi.value }}</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ kpi.title }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-500">{{ kpi.changeLabel }}</p>
        </div>
      </div>
    }
  </div>

  <!-- Quick Stats Row -->
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    @for (stat of quickStats(); track stat.label) {
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
        <div class="flex justify-center mb-2">
          <div [class]="stat.color">
            <lucide-angular [img]="stat.icon" class="w-5 h-5"></lucide-angular>
          </div>
        </div>
        <div class="text-lg font-semibold text-slate-900 dark:text-white">{{ stat.value }}</div>
        @if (stat.subValue) {
          <div class="text-xs text-slate-500 dark:text-slate-400">{{ stat.subValue }}</div>
        }
        <div class="text-xs text-slate-600 dark:text-slate-300 mt-1">{{ stat.label }}</div>
      </div>
    }
  </div>

  <!-- Performance Overview -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Top Performers -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center gap-2 mb-6">
        <lucide-angular [img]="AwardIcon" class="w-5 h-5 text-yellow-500"></lucide-angular>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Top Performers</h3>
      </div>
      
      <div class="space-y-4">
        @for (collector of topCollectors(); track collector.collector_id; let i = $index) {
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {{ i + 1 }}
              </div>
              <div>
                <div class="font-medium text-slate-900 dark:text-white">{{ collector.collector_name }}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">{{ collector.total_assigned }} cuentas asignadas</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-semibold text-green-600 dark:text-green-400">{{ collector.collection_rate }}%</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">eficiencia</div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Recent Trends -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center gap-2 mb-6">
        <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-blue-500"></lucide-angular>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Tendencias Recientes</h3>
      </div>
      
      <div class="space-y-4">
        @for (trend of recentTrends(); track trend.period) {
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{{ trend.period }}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">{{ trend.accounts_resolved }} cuentas resueltas</div>
            </div>
            <div class="text-right">
              <div class="font-semibold" [class]="trend.collection_rate >= 80 ? 'text-green-600 dark:text-green-400' : trend.collection_rate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'">
                {{ formatCurrency(trend.collected_amount) }}
              </div>
              <div class="text-sm" [class]="trend.collection_rate >= 80 ? 'text-green-600 dark:text-green-400' : trend.collection_rate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'">
                {{ trend.collection_rate }}% efectividad
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- Alerts and Notifications -->
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center gap-2 mb-6">
      <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5 text-orange-500"></lucide-angular>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Alertas y Notificaciones</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (alert of alerts(); track alert.id) {
        <div class="p-4 rounded-lg border-l-4" [class]="getAlertClasses(alert.type)">
          <div class="flex items-start gap-3">
            <lucide-angular [img]="getAlertIcon(alert.type)" class="w-5 h-5 mt-0.5" [class]="getAlertIconColor(alert.type)"></lucide-angular>
            <div class="flex-1">
              <h4 class="font-medium text-slate-900 dark:text-white mb-1">{{ alert.title }}</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">{{ alert.message }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-500 mt-2">{{ alert.time }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  </div>

  <!-- Loading Overlay -->
  @if (loading()) {
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center gap-3">
        <lucide-angular [img]="ActivityIcon" class="w-6 h-6 text-blue-500 animate-spin"></lucide-angular>
        <span class="text-slate-900 dark:text-white font-medium">Actualizando datos...</span>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class EnhancedDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private advancedReportsService = inject(AdvancedReportsService);

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  ClockIcon = Clock;
  TargetIcon = Target;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  CalendarIcon = Calendar;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  ActivityIcon = Activity;
  ZapIcon = Zap;
  AwardIcon = Award;

  // Signals
  loading = signal(false);
  dashboardMetrics = signal<DashboardMetrics | null>(null);
  collectorEfficiency = signal<CollectorEfficiency[]>([]);
  trendData = signal<TrendData[]>([]);
  realTimeData = signal<any>(null);

  // Computed properties
  kpiCards = computed(() => {
    const metrics = this.dashboardMetrics();
    if (!metrics) return [];

    return [
      {
        title: 'Cartera Total',
        value: this.formatCurrency(metrics.total_portfolio),
        change: metrics.trend_vs_last_month,
        changeLabel: 'vs mes anterior',
        icon: this.DollarSignIcon,
        color: 'blue' as const,
        trend: metrics.trend_vs_last_month > 0 ? 'up' as const : 'down' as const
      },
      {
        title: 'Cobrado Este Mes',
        value: this.formatCurrency(metrics.collected_this_month),
        change: metrics.collection_rate,
        changeLabel: 'tasa de cobranza',
        icon: this.CheckCircleIcon,
        color: 'green' as const,
        trend: metrics.collection_rate >= 80 ? 'up' as const : 'down' as const
      },
      {
        title: 'Cuentas Vencidas',
        value: this.formatCurrency(metrics.overdue_amount),
        change: -15, // This should come from comparison
        changeLabel: 'reducción',
        icon: this.AlertTriangleIcon,
        color: 'red' as const,
        trend: 'up' as const
      },
      {
        title: 'Cobradores Activos',
        value: metrics.active_collectors.toString(),
        change: 5,
        changeLabel: 'disponibles',
        icon: this.UsersIcon,
        color: 'purple' as const,
        trend: 'stable' as const
      }
    ];
  });

  quickStats = computed(() => {
    const metrics = this.dashboardMetrics();
    const realTime = this.realTimeData();
    if (!metrics) return [];

    return [
      {
        label: 'Tasa Cobranza',
        value: `${metrics.collection_rate}%`,
        icon: this.TargetIcon,
        color: 'text-blue-500'
      },
      {
        label: 'Tiempo Promedio',
        value: `${metrics.avg_resolution_time}d`,
        icon: this.ClockIcon,
        color: 'text-green-500'
      },
      {
        label: 'Top Performer',
        value: metrics.top_performer.name,
        subValue: `${metrics.top_performer.efficiency}%`,
        icon: this.AwardIcon,
        color: 'text-yellow-500'
      },
      {
        label: 'Llamadas Hoy',
        value: realTime?.active_calls?.toString() || '0',
        icon: this.ActivityIcon,
        color: 'text-purple-500'
      },
      {
        label: 'Pagos Hoy',
        value: realTime?.payments_today?.toString() || '0',
        icon: this.DollarSignIcon,
        color: 'text-green-500'
      },
      {
        label: 'En Línea',
        value: realTime?.online_collectors?.toString() || '0',
        icon: this.ZapIcon,
        color: 'text-blue-500'
      }
    ];
  });

  topCollectors = computed(() => {
    return this.collectorEfficiency()
      .sort((a, b) => b.efficiency_score - a.efficiency_score)
      .slice(0, 5);
  });

  recentTrends = computed(() => {
    return this.trendData().slice(-5);
  });

  alerts = signal([
    {
      id: 1,
      type: 'warning',
      title: 'Cuentas Críticas',
      message: '15 cuentas requieren atención inmediata',
      time: 'Hace 5 minutos'
    },
    {
      id: 2,
      type: 'success',
      title: 'Meta Alcanzada',
      message: 'Cobrador Juan Pérez superó su meta mensual',
      time: 'Hace 1 hora'
    },
    {
      id: 3,
      type: 'info',
      title: 'Reporte Disponible',
      message: 'Reporte mensual de octubre listo para descarga',
      time: 'Hace 2 horas'
    }
  ]);

  ngOnInit() {
    this.loadDashboardData();
    this.startRealTimeUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.loading.set(true);
    
    const filters = {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    };

    forkJoin({
      dashboard: this.advancedReportsService.getDashboardMetrics(filters),
      efficiency: this.advancedReportsService.getCollectorEfficiency(filters),
      trends: this.advancedReportsService.getTrendAnalysis('monthly', filters),
      realTime: this.advancedReportsService.getRealTimeMetrics()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.dashboardMetrics.set(data.dashboard);
        this.collectorEfficiency.set(data.efficiency);
        this.trendData.set(data.trends);
        this.realTimeData.set(data.realTime);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading.set(false);
      }
    });
  }

  startRealTimeUpdates() {
    // Update real-time metrics every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.advancedReportsService.getRealTimeMetrics()
          .pipe(takeUntil(this.destroy$))
          .subscribe(data => this.realTimeData.set(data));
      });
  }

  refreshData() {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getIconClasses(color: string): string {
    const classes = {
      blue: 'w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center',
      green: 'w-12 h-12 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center',
      yellow: 'w-12 h-12 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-lg flex items-center justify-center',
      red: 'w-12 h-12 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center',
      purple: 'w-12 h-12 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center'
    };
    return classes[color as keyof typeof classes] || classes.blue;
  }

  getTrendClasses(trend: string): string {
    return trend === 'up' 
      ? 'text-green-600 dark:text-green-400'
      : trend === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-600 dark:text-slate-400';
  }

  getAlertClasses(type: string): string {
    const classes = {
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-400',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400',
      error: 'bg-red-50 dark:bg-red-900/20 border-red-400'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  getAlertIcon(type: string): any {
    const icons = {
      warning: this.AlertTriangleIcon,
      success: this.CheckCircleIcon,
      info: this.ActivityIcon,
      error: this.AlertTriangleIcon
    };
    return icons[type as keyof typeof icons] || this.ActivityIcon;
  }

  getAlertIconColor(type: string): string {
    const colors = {
      warning: 'text-yellow-500',
      success: 'text-green-500',
      info: 'text-blue-500',
      error: 'text-red-500'
    };
    return colors[type as keyof typeof colors] || 'text-blue-500';
  }
}