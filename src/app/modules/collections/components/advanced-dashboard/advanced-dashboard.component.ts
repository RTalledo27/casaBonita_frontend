import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { 
  LucideAngularModule, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  Target,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Award
} from 'lucide-angular';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { InteractiveChartsComponent } from '../interactive-charts/interactive-charts.component';

export interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: any;
  color: string;
  description: string;
  target?: number;
  unit?: string;
}

export interface DashboardData {
  totalSchedules: number;
  activeContracts: number;
  paidThisMonth: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
  collectionEfficiency: number;
  averagePaymentTime: number;
  monthlyGrowth: number;
  riskScore: number;
}

@Component({
  selector: 'app-advanced-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, InteractiveChartsComponent],
  template: `
    <div class="space-y-6">
      <!-- Dashboard Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200">
            Dashboard de Cobranzas Simplificadas
          </h1>
          <p class="text-slate-600 dark:text-slate-400 mt-2">
            Métricas en tiempo real para gestión de cronogramas de pago
          </p>
          <div class="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <lucide-angular [img]="ClockIcon" class="w-4 h-4"></lucide-angular>
            <span>Última actualización: {{ getLastUpdateTime() }}</span>
            @if (isAutoRefreshEnabled()) {
              <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-actualización activa</span>
              </div>
            }
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            (click)="toggleAutoRefresh()"
            [class]="isAutoRefreshEnabled() ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium border shadow hover:shadow-lg transition"
            title="Auto-actualización"
          >
            <lucide-angular [img]="ZapIcon" class="w-4 h-4"></lucide-angular>
            <span>{{ isAutoRefreshEnabled() ? 'Auto ON' : 'Auto OFF' }}</span>
          </button>
          
          <button
            (click)="refreshDashboard()"
            [disabled]="isLoading()"
            class="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <lucide-angular [img]="RefreshCwIcon" [class]="isLoading() ? 'w-4 h-4 animate-spin' : 'w-4 h-4'"></lucide-angular>
            <span>Actualizar</span>
          </button>
          
          <button
            (click)="exportDashboard()"
            class="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 shadow hover:shadow-lg transition"
          >
            <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <!-- KPI Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (kpi of kpiMetrics(); track kpi.title) {
          <div class="group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg hover:shadow-xl transition-all duration-300">
            <!-- Gradient Background -->
            <div [class]="'absolute inset-0 bg-gradient-to-br opacity-5 ' + kpi.color"></div>
            
            <!-- Content -->
            <div class="relative p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <div [class]="'p-2 rounded-xl shadow ' + kpi.color">
                      <lucide-angular [img]="kpi.icon" class="w-5 h-5 text-white"></lucide-angular>
                    </div>
                    <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400">{{ kpi.title }}</h3>
                  </div>
                  
                  <div class="space-y-2">
                    <div class="text-2xl font-bold text-slate-900 dark:text-white">
                      {{ formatKPIValue(kpi.value, kpi.unit) }}
                    </div>
                    
                    @if (kpi.target) {
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        Meta: {{ formatKPIValue(kpi.target, kpi.unit) }}
                      </div>
                      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          [class]="'h-1.5 rounded-full transition-all duration-500 ' + (getProgressColor(+kpi.value, kpi.target))"
                          [style.width.%]="getProgressPercentage(+kpi.value, kpi.target)"
                        ></div>
                      </div>
                    }
                  </div>
                </div>
                
                <!-- Change Indicator -->
                <div [class]="'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ' + getChangeColorClass(kpi.changeType)">
                  <lucide-angular 
                    [img]="kpi.changeType === 'increase' ? ArrowUpRightIcon : kpi.changeType === 'decrease' ? ArrowDownRightIcon : ActivityIcon" 
                    class="w-3 h-3"
                  ></lucide-angular>
                  <span>{{ getAbsoluteValue(kpi.change) }}%</span>
                </div>
              </div>
              
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-3">{{ kpi.description }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Performance Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Collection Performance -->
        <div class="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Rendimiento de Cobranzas</h3>
                <p class="text-slate-600 dark:text-slate-400 text-sm mt-1">Análisis de eficiencia y tendencias</p>
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  (click)="toggleChartsView()"
                  class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
                  title="Alternar Vista"
                >
                  <lucide-angular [img]="showDetailedCharts() ? PieChartIcon : BarChart3Icon" class="w-4 h-4"></lucide-angular>
                </button>
                
                <button
                  (click)="viewFullAnalytics()"
                  class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
                  title="Ver Análisis Completo"
                >
                  <lucide-angular [img]="EyeIcon" class="w-4 h-4"></lucide-angular>
                </button>
              </div>
            </div>
            
            <!-- Performance Metrics -->
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ getCollectionRate() }}%</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Tasa de Cobro</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ getAveragePaymentDays() }}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Días Promedio</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ getEfficiencyScore() }}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Score Eficiencia</div>
              </div>
            </div>
            
            <!-- Charts Integration -->
            @if (showDetailedCharts()) {
              <app-interactive-charts 
                [reportData]="null" 
                [refreshTrigger]="refreshTrigger()"
              ></app-interactive-charts>
            } @else {
              <div class="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div class="text-center">
                  <lucide-angular [img]="BarChart3Icon" class="w-12 h-12 text-slate-400 mx-auto mb-3"></lucide-angular>
                  <p class="text-slate-600 dark:text-slate-400">Vista simplificada de métricas</p>
                  <button
                    (click)="toggleChartsView()"
                    class="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    Ver gráficos detallados
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Risk & Alerts Panel -->
        <div class="space-y-6">
          
          <!-- Risk Score -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
            
            <div class="relative p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow">
                  <lucide-angular [img]="ShieldIcon" class="w-5 h-5"></lucide-angular>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Score de Riesgo</h3>
              </div>
              
              <div class="text-center">
                <div [class]="'text-4xl font-bold mb-2 ' + getRiskScoreColor()">
                  {{ getRiskScore() }}
                </div>
                <div class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {{ getRiskLevel() }}
                </div>
                
                <!-- Risk Gauge -->
                <div class="relative w-32 h-16 mx-auto mb-4">
                  <div class="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-t-full"></div>
                  <div class="absolute inset-1 bg-white dark:bg-slate-900 rounded-t-full"></div>
                  <div 
                    class="absolute bottom-0 left-1/2 w-1 h-14 bg-slate-800 dark:bg-white origin-bottom transform -translate-x-0.5 transition-transform duration-500"
                    [style.transform]="'translateX(-50%) rotate(' + getRiskAngle() + 'deg)'"
                  ></div>
                </div>
                
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Basado en morosidad y tendencias de pago
                </p>
              </div>
            </div>
          </div>

          <!-- Active Alerts -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
            
            <div class="relative p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                    <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5"></lucide-angular>
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white">Alertas Activas</h3>
                </div>
                
                <span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium">
                  {{ getActiveAlertsCount() }}
                </span>
              </div>
              
              <div class="space-y-3">
                @for (alert of getActiveAlerts(); track alert.id) {
                  <div [class]="'flex items-start gap-3 p-3 rounded-lg ' + getAlertBgClass(alert.type)">
                    <lucide-angular 
                      [img]="getAlertIcon(alert.type)" 
                      [class]="'w-4 h-4 mt-0.5 ' + getAlertIconClass(alert.type)"
                    ></lucide-angular>
                    <div class="flex-1 min-w-0">
                      <p [class]="'text-sm font-medium ' + getAlertTextClass(alert.type)">
                        {{ alert.title }}
                      </p>
                      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {{ alert.description }}
                      </p>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-4">
                    <lucide-angular [img]="CheckCircleIcon" class="w-8 h-8 text-green-500 mx-auto mb-2"></lucide-angular>
                    <p class="text-sm text-slate-600 dark:text-slate-400">No hay alertas activas</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
            
            <div class="relative p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
                  <lucide-angular [img]="ZapIcon" class="w-5 h-5"></lucide-angular>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Acciones Rápidas</h3>
              </div>
              
              <div class="space-y-2">
                <button
                  (click)="generateReport()"
                  class="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition"
                >
                  <lucide-angular [img]="BarChart3Icon" class="w-4 h-4 text-blue-600 dark:text-blue-400"></lucide-angular>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Generar Reporte</span>
                </button>
                
                <button
                  (click)="viewOverduePayments()"
                  class="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition"
                >
                  <lucide-angular [img]="AlertTriangleIcon" class="w-4 h-4 text-red-600 dark:text-red-400"></lucide-angular>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Ver Pagos Vencidos</span>
                </button>
                
                <button
                  (click)="exportData()"
                  class="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition"
                >
                  <lucide-angular [img]="DownloadIcon" class="w-4 h-4 text-green-600 dark:text-green-400"></lucide-angular>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Exportar Datos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      @if (isLoading()) {
        <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span class="text-slate-700 dark:text-slate-300 font-medium">Actualizando dashboard...</span>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdvancedDashboardComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  TargetIcon = Target;
  UsersIcon = Users;
  ClockIcon = Clock;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  ActivityIcon = Activity;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  FilterIcon = Filter;
  DownloadIcon = Download;
  EyeIcon = Eye;
  ArrowUpRightIcon = ArrowUpRight;
  ArrowDownRightIcon = ArrowDownRight;
  ZapIcon = Zap;
  ShieldIcon = Shield;
  AwardIcon = Award;

  // Signals
  isLoading = signal(false);
  dashboardData = signal<DashboardData | null>(null);
  kpiMetrics = signal<KPIMetric[]>([]);
  showDetailedCharts = signal(false);
  isAutoRefreshEnabled = signal(false);
  refreshTrigger = signal(0);
  lastUpdateTime = signal(new Date());

  ngOnInit() {
    this.loadDashboardData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadDashboardData() {
    this.isLoading.set(true);
    
    try {
      const data = await this.collectionsService.getDashboardData().toPromise();
      
      if (data) {
        const dashboardData: DashboardData = {
          totalSchedules: data.active_schedules,
          activeContracts: data.active_contracts || 0,
          paidThisMonth: data.paid_this_month,
          pendingAmount: data.pending_amount,
          overdueAmount: data.overdue_amount,
          paymentRate: data.payment_rate,
          collectionEfficiency: this.calculateCollectionEfficiency(data),
          averagePaymentTime: data.average_payment_time || 15,
          monthlyGrowth: data.monthly_growth || 5.2,
          riskScore: this.calculateRiskScore(data)
        };
        
        this.dashboardData.set(dashboardData);
        this.updateKPIMetrics(dashboardData);
        this.lastUpdateTime.set(new Date());
        this.refreshTrigger.set(this.refreshTrigger() + 1);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private calculateCollectionEfficiency(data: any): number {
    const total = data.paid_this_month + data.pending_amount + data.overdue_amount;
    return total > 0 ? Math.round((data.paid_this_month / total) * 100) : 0;
  }

  private calculateRiskScore(data: any): number {
    const total = data.paid_this_month + data.pending_amount + data.overdue_amount;
    const overdueRatio = total > 0 ? (data.overdue_amount / total) : 0;
    const paymentRateScore = data.payment_rate / 100;
    
    // Risk score: 0-100 (lower is better)
    const riskScore = Math.round((overdueRatio * 60) + ((1 - paymentRateScore) * 40));
    return Math.min(100, Math.max(0, riskScore));
  }

  private updateKPIMetrics(data: DashboardData) {
    const metrics: KPIMetric[] = [
      {
        title: 'Cronogramas Activos',
        value: data.totalSchedules,
        change: 8.2,
        changeType: 'increase',
        icon: this.CalendarIcon,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        description: 'Total de cronogramas de pago activos',
        target: 150
      },
      {
        title: 'Cobrado Este Mes',
        value: data.paidThisMonth,
        change: 12.5,
        changeType: 'increase',
        icon: this.DollarSignIcon,
        color: 'bg-gradient-to-br from-green-500 to-green-600',
        description: 'Monto total cobrado en el mes actual',
        unit: 'currency'
      },
      {
        title: 'Tasa de Cobro',
        value: data.paymentRate,
        change: 3.1,
        changeType: 'increase',
        icon: this.TargetIcon,
        color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        description: 'Porcentaje de pagos realizados a tiempo',
        target: 85,
        unit: 'percentage'
      },
      {
        title: 'Eficiencia de Cobranza',
        value: data.collectionEfficiency,
        change: 5.7,
        changeType: 'increase',
        icon: this.AwardIcon,
        color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        description: 'Eficiencia general del proceso de cobranza',
        target: 90,
        unit: 'percentage'
      },
      {
        title: 'Monto Vencido',
        value: data.overdueAmount,
        change: 2.3,
        changeType: 'decrease',
        icon: this.AlertTriangleIcon,
        color: 'bg-gradient-to-br from-red-500 to-red-600',
        description: 'Total de pagos vencidos pendientes',
        unit: 'currency'
      },
      {
        title: 'Tiempo Promedio de Pago',
        value: data.averagePaymentTime,
        change: 1.8,
        changeType: 'decrease',
        icon: this.ClockIcon,
        color: 'bg-gradient-to-br from-orange-500 to-orange-600',
        description: 'Días promedio para recibir pagos',
        target: 10,
        unit: 'days'
      },
      {
        title: 'Crecimiento Mensual',
        value: data.monthlyGrowth,
        change: 15.2,
        changeType: 'increase',
        icon: this.TrendingUpIcon,
        color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        description: 'Crecimiento en cobranzas vs mes anterior',
        unit: 'percentage'
      },
      {
        title: 'Contratos Activos',
        value: data.activeContracts,
        change: 4.1,
        changeType: 'increase',
        icon: this.UsersIcon,
        color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        description: 'Número de contratos con cronogramas activos'
      }
    ];
    
    this.kpiMetrics.set(metrics);
  }

  private setupAutoRefresh() {
    interval(30000) // Refresh every 30 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isAutoRefreshEnabled()) {
          this.loadDashboardData();
        }
      });
  }

  // Public methods
  refreshDashboard() {
    this.loadDashboardData();
  }

  toggleAutoRefresh() {
    this.isAutoRefreshEnabled.set(!this.isAutoRefreshEnabled());
  }

  toggleChartsView() {
    this.showDetailedCharts.set(!this.showDetailedCharts());
  }

  exportDashboard() {
    // Implementation for exporting dashboard
    console.log('Exporting dashboard...');
  }

  viewFullAnalytics() {
    // Implementation for viewing full analytics
    console.log('Opening full analytics view...');
  }

  generateReport() {
    // Implementation for generating report
    console.log('Generating report...');
  }

  viewOverduePayments() {
    // Implementation for viewing overdue payments
    console.log('Viewing overdue payments...');
  }

  exportData() {
    // Implementation for exporting data
    console.log('Exporting data...');
  }

  // Utility methods
  formatKPIValue(value: string | number, unit?: string): string {
    if (typeof value === 'string') return value;
    
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'PEN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} días`;
      default:
        return value.toLocaleString();
    }
  }

  getProgressPercentage(value: number, target: number): number {
    return Math.min(100, (value / target) * 100);
  }

  getAbsoluteValue(value: number): number {
    return Math.abs(value);
  }

  getProgressColor(value: number, target: number): string {
    const percentage = (value / target) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getChangeColorClass(changeType: 'increase' | 'decrease' | 'neutral'): string {
    switch (changeType) {
      case 'increase':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'decrease':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  }

  getLastUpdateTime(): string {
    return this.lastUpdateTime().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getCollectionRate(): number {
    return this.dashboardData()?.paymentRate || 0;
  }

  getAveragePaymentDays(): number {
    return this.dashboardData()?.averagePaymentTime || 0;
  }

  getEfficiencyScore(): number {
    return this.dashboardData()?.collectionEfficiency || 0;
  }

  getRiskScore(): number {
    return this.dashboardData()?.riskScore || 0;
  }

  getRiskLevel(): string {
    const score = this.getRiskScore();
    if (score <= 30) return 'Riesgo Bajo';
    if (score <= 60) return 'Riesgo Medio';
    return 'Riesgo Alto';
  }

  getRiskScoreColor(): string {
    const score = this.getRiskScore();
    if (score <= 30) return 'text-green-600 dark:text-green-400';
    if (score <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  getRiskAngle(): number {
    const score = this.getRiskScore();
    return -90 + (score * 1.8); // Convert 0-100 to -90 to 90 degrees
  }

  getActiveAlertsCount(): number {
    return this.getActiveAlerts().length;
  }

  getActiveAlerts(): any[] {
    // Mock alerts - in real app this would come from API
    const data = this.dashboardData();
    if (!data) return [];

    const alerts = [];
    
    if (data.overdueAmount > 50000) {
      alerts.push({
        id: 1,
        type: 'error',
        title: 'Alto monto vencido',
        description: `S/ ${data.overdueAmount.toLocaleString()} en pagos vencidos`
      });
    }
    
    if (data.paymentRate < 70) {
      alerts.push({
        id: 2,
        type: 'warning',
        title: 'Baja tasa de cobro',
        description: `Tasa actual: ${data.paymentRate}% (meta: 85%)`
      });
    }
    
    if (data.riskScore > 60) {
      alerts.push({
        id: 3,
        type: 'error',
        title: 'Score de riesgo elevado',
        description: `Score actual: ${data.riskScore}/100`
      });
    }

    return alerts;
  }

  getAlertIcon(type: string): any {
    switch (type) {
      case 'error':
        return this.XCircleIcon;
      case 'warning':
        return this.AlertTriangleIcon;
      default:
        return this.CheckCircleIcon;
    }
  }

  getAlertBgClass(type: string): string {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-green-50 dark:bg-green-900/20';
    }
  }

  getAlertIconClass(type: string): string {
    switch (type) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  }

  getAlertTextClass(type: string): string {
    switch (type) {
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-green-700 dark:text-green-300';
    }
  }
}