import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, interval, of } from 'rxjs';
import { startWith, switchMap, tap, catchError } from 'rxjs/operators';
import { LucideAngularModule, TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, Clock, Target, Activity } from 'lucide-angular';
import { CollectionsDashboardService } from '../../services/collections-dashboard.service';
import { CollectionMetrics, CollectionTrends, DelinquentClient, CollectorPerformance, DashboardKPI } from '../../models/collection-metrics';
import { AlertsService } from '../../services/alerts.service';
import { CollectorsService } from '../../services/collectors.service';

@Component({
  selector: 'app-collections-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard de Cobranzas</h1>
          <p class="text-gray-600 mt-1">Resumen general del estado de cobranzas</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="refreshDashboard()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="Activity" class="w-4 h-4"></lucide-angular>
            <span>{{ isLoading() ? 'Actualizando...' : 'Actualizar' }}</span>
          </button>
          <select 
            [(ngModel)]="selectedPeriod"
            (ngModelChange)="onPeriodChange($event)"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current_month">Mes Actual</option>
            <option value="last_month">Mes Anterior</option>
            <option value="current_quarter">Trimestre Actual</option>
            <option value="current_year">Año Actual</option>
          </select>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (kpi of kpis(); track kpi.title) {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">{{ kpi.title }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ kpi.value }}</p>
                @if (kpi.change !== undefined) {
                  <div class="flex items-center mt-2">
                    <lucide-angular 
                      [img]="kpi.change >= 0 ? TrendingUp : TrendingDown" 
                      [class]="kpi.change >= 0 ? 'w-4 h-4 text-green-500' : 'w-4 h-4 text-red-500'"
                    ></lucide-angular>
                    <span [class]="kpi.change >= 0 ? 'text-green-600 text-sm ml-1' : 'text-red-600 text-sm ml-1'">
                      {{ kpi.change >= 0 ? '+' : '' }}{{ kpi.change }}%
                    </span>
                  </div>
                }
              </div>
              <div [class]="kpi.iconColor + ' p-3 rounded-lg'">
                <lucide-angular [img]="kpi.icon" class="w-6 h-6 text-white"></lucide-angular>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Collection Trends Chart -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Tendencias de Cobranza</h3>
            <select 
              [(ngModel)]="trendsChartType"
              class="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="amount">Monto</option>
              <option value="count">Cantidad</option>
              <option value="rate">Tasa de Cobranza</option>
            </select>
          </div>
          @if (collectionTrends(); as trends) {
            <div class="h-64">
              <!-- Placeholder for chart - would integrate with Chart.js or similar -->
              <div class="flex items-center justify-center h-full bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <div class="text-center">
                  <lucide-angular [img]="TrendingUp" class="w-8 h-8 text-gray-400 mx-auto mb-2"></lucide-angular>
                  <p class="text-gray-500">Gráfico de Tendencias</p>
                  <p class="text-sm text-gray-400">{{ trends.monthly_data.length }} meses de datos</p>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Status Distribution -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
          @if (collectionTrends()?.status_distribution; as distribution) {
            <div class="space-y-3">
              @for (status of getStatusDistributionArray(distribution); track status.name) {
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div [class]="getStatusColor(status.name) + ' w-3 h-3 rounded-full'"></div>
                    <span class="text-sm font-medium text-gray-700">{{ getStatusLabel(status.name) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-semibold text-gray-900">{{ status.count }}</span>
                    <span class="text-xs text-gray-500 ml-1">({{ status.percentage }}%)</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Tables Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Delinquent Clients -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Clientes Morosos Principales</h3>
            <button 
              routerLink="/collections/accounts-receivable"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          @if (topDelinquentClients(); as clients) {
            <div class="space-y-3">
              @for (client of clients; track client.client_id) {
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">{{ client.client_name }}</p>
                    <p class="text-sm text-gray-600">{{ client.overdue_accounts }} cuentas vencidas</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-red-600">{{ client.total_overdue | currency:'PEN':'symbol':'1.2-2' }}</p>
                    <p class="text-xs text-gray-500">{{ client.days_overdue }} días</p>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-gray-500">
                  <lucide-angular [img]="Users" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-angular>
                  <p>No hay clientes morosos</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Collector Performance -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Rendimiento de Cobradores</h3>
            <button 
              routerLink="/collections/collectors"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          @if (collectorPerformance(); as collectors) {
            <div class="space-y-3">
              @for (collector of collectors; track collector.collector_id) {
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">{{ collector.collector_name }}</p>
                    <p class="text-sm text-gray-600">{{ collector.assigned_accounts }} cuentas asignadas</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-green-600">{{ collector.collection_rate }}%</p>
                    <p class="text-xs text-gray-500">{{ collector.amount_collected | currency:'PEN':'symbol':'1.0-0' }}</p>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-gray-500">
                  <lucide-angular [img]="Users" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-angular>
                  <p>No hay datos de cobradores</p>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Recent Alerts -->
      @if (recentAlerts().length > 0) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Alertas Recientes</h3>
            <button 
              routerLink="/collections/alerts"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todas
            </button>
          </div>
          <div class="space-y-3">
            @for (alert of recentAlerts(); track alert.alert_id) {
              <div class="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <lucide-angular [img]="AlertTriangle" class="w-5 h-5 text-yellow-600"></lucide-angular>
                  <div>
                    <p class="font-medium text-gray-900">{{ alert.title }}</p>
                    <p class="text-sm text-gray-600">{{ alert.description }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span [class]="getAlertPriorityClass(alert.priority) + ' px-2 py-1 rounded-full text-xs font-medium'">
                    {{ getAlertPriorityLabel(alert.priority) }}
                  </span>
                  <p class="text-xs text-gray-500 mt-1">{{ alert.created_at | date:'short' }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class CollectionsDashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(CollectionsDashboardService);
  private readonly alertsService = inject(AlertsService);
  private readonly collectorsService = inject(CollectorsService);
  private readonly destroy$ = new Subject<void>();

  // Icons
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Users = Users;
  readonly DollarSign = DollarSign;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly Target = Target;
  readonly Activity = Activity;

  // Signals
  isLoading = signal(false);
  collectionMetrics = signal<CollectionMetrics | null>(null);
  collectionTrends = signal<CollectionTrends | null>(null);
  topDelinquentClients = signal<DelinquentClient[]>([]);
  collectorPerformance = signal<CollectorPerformance[]>([]);
  recentAlerts = signal<any[]>([]);

  // Form controls
  selectedPeriod = 'current_month';
  trendsChartType = 'amount';

  // Computed values
  kpis = computed(() => {
    const metrics = this.collectionMetrics();
    if (!metrics) return [];

    return [
      {
        title: 'Total por Cobrar',
        value: this.formatCurrency(metrics.total_receivable),
        change: metrics.receivable_change_percentage,
        icon: DollarSign,
        iconColor: 'bg-blue-500'
      },
      {
        title: 'Vencidas',
        value: this.formatCurrency(metrics.overdue_amount),
        change: metrics.overdue_change_percentage,
        icon: AlertTriangle,
        iconColor: 'bg-red-500'
      },
      {
        title: 'Tasa de Cobranza',
        value: `${metrics.collection_rate}%`,
        change: metrics.collection_rate_change,
        icon: Target,
        iconColor: 'bg-green-500'
      },
      {
        title: 'Cobradores Activos',
        value: metrics.active_collectors.toString(),
        icon: Users,
        iconColor: 'bg-purple-500'
      }
    ];
  });

  ngOnInit(): void {
    this.loadDashboardData().subscribe();
    
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadDashboardData()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    return forkJoin({
      metrics: this.dashboardService.getMetrics(),
      trends: this.dashboardService.getTrends(this.selectedPeriod),
      delinquentClients: this.dashboardService.getTopDelinquent(),
      collectorPerformance: this.dashboardService.getCollectorEffectiveness(),
      alerts: this.alertsService.getActiveAlerts()
    })
    .pipe(
      tap((data) => {
        this.collectionMetrics.set(data.metrics.data);
        this.collectionTrends.set(data.trends.data);
        this.topDelinquentClients.set(data.delinquentClients.data);
        this.collectorPerformance.set(data.collectorPerformance.data);
        this.recentAlerts.set(data.alerts.data);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntil(this.destroy$)
    );
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadDashboardData();
  }

  getStatusDistributionArray(distribution: any): Array<{name: string, count: number, percentage: number}> {
    if (!distribution) return [];
    
    const total = Object.values(distribution).reduce((sum: number, count: any) => sum + count, 0);
    
    return Object.entries(distribution).map(([name, count]: [string, any]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-500',
      'overdue': 'bg-red-500',
      'paid': 'bg-green-500',
      'partial': 'bg-blue-500',
      'cancelled': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'overdue': 'Vencida',
      'paid': 'Pagada',
      'partial': 'Parcial',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getAlertPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-blue-100 text-blue-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getAlertPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}