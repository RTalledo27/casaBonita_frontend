import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {
  SalesReportService,
  PaymentScheduleService,
  ProjectedReportService
} from '../../services';
import {
  SalesReportSummary,
  PaymentScheduleSummary,
  FinancialProjection
} from '../../models';
import { ProjectionService, RevenueProjection } from '../../../../core/services/projection.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard de Reportes</h1>
        <p class="text-gray-600 dark:text-gray-400">Análisis completo de ventas, pagos y proyecciones financieras</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Ventas</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ salesSummary?.totalSales | number }}</p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 flex items-center">
            <span [class]="'text-sm font-medium flex items-center gap-1 ' + (growthRate >= 0 ? 'text-green-600' : 'text-red-600')">
              {{ growthRate >= 0 ? '+' : '' }}{{ growthRate | number:'1.1-1' }}%
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">{{ trend }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">S/. {{ salesSummary?.totalRevenue | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span [class]="'text-sm font-medium ' + (growthRate >= 0 ? 'text-green-600' : 'text-red-600')">
              {{ growthRate >= 0 ? '+' : '' }}{{ growthRate | number:'1.1-1' }}%
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">crecimiento promedio</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pagos Pendientes</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">S/. {{ paymentSummary?.totalPending | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-red-600 font-medium">S/. {{ paymentSummary?.totalOverdue | number:'1.0-0' }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">vencidos</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Eficiencia Cobranza</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ paymentSummary?.collectionEfficiency | number:'1.1-1' }}%</p>
            </div>
            <div class="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-green-600 font-medium">+3.1%</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">vs mes anterior</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Sales Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 h-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ventas por Mes</h3>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="salesChartData"
              [options]="salesChartOptions"
              [type]="salesChartType">
            </canvas>
          </div>
        </div>

        <!-- Revenue Projection Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 h-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Proyección Mensual de Ingresos</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4" *ngIf="revenueProjection">
            📊 Basado en {{ revenueProjection.historical_data.length }} meses históricos | 
            🎯 Confianza: {{ (revenueProjection.regression_quality.r_squared * 100) | number:'1.0-0' }}% | 
            📈 Tendencia: {{ revenueProjection.summary.trend }}
          </p>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="revenueChartData"
              [options]="revenueChartOptions"
              [type]="revenueChartType">
            </canvas>
          </div>
          <div class="mt-4 space-y-2" *ngIf="revenueProjection">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-xs text-gray-700 dark:text-gray-300">
                <span class="font-semibold">Contexto:</span> 
                {{ getSeasonalContext() }}
              </p>
            </div>
            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p class="text-xs text-gray-700 dark:text-gray-300">
                <span class="font-semibold">Cómo se calcula:</span> 
                La proyección usa regresión lineal analizando la tendencia de los últimos {{ revenueProjection.historical_data.length }} meses. 
                Si las ventas suben consistentemente, la proyección será al alza. Si bajan, será a la baja. 
                La confianza de {{ (revenueProjection.regression_quality.r_squared * 100) | number:'1.0-0' }}% indica qué tan predecibles son los datos históricos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a 
          routerLink="/reports/sales"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">Reportes de Ventas</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Análisis detallado de ventas por asesor, oficina y período</p>
            </div>
            <svg class="w-6 h-6 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>

        <a 
          routerLink="/reports/payment-schedule"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600">Cronogramas de Pagos</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Gestión de cuotas, vencimientos y estados de pago</p>
            </div>
            <svg class="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>

        <a 
          routerLink="/reports/projected"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600">Reportes Proyectados</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Análisis financiero y proyecciones de crecimiento</p>
            </div>
            <svg class="w-6 h-6 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>

        <a 
          routerLink="/reports/export-manager"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600">Exportar Reportes</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Generar y descargar reportes en Excel, PDF o CSV</p>
            </div>
            <svg class="w-6 h-6 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>
      </div>
    </div>
  `
})
export class ReportsDashboardComponent implements OnInit {
  salesSummary: SalesReportSummary | null = null;
  paymentSummary: PaymentScheduleSummary | null = null;
  financialProjection: FinancialProjection | null = null;
  revenueProjection: RevenueProjection | null = null;
  growthRate: number = 0;
  trend: string = 'Calculando...';

  // Chart configurations
  salesChartType: ChartType = 'line';
  salesChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ventas',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  revenueChartType: ChartType = 'bar';
  revenueChartData: ChartConfiguration['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        label: 'Ingresos Reales',
        data: [0],
        backgroundColor: 'rgba(34, 197, 94, 0.75)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: 'Proyección Basada en Tendencia',
        data: [0],
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
        borderDash: [8, 4],
        borderRadius: 4
      }
    ]
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const formattedValue = 'S/.' + (value / 1000).toFixed(0) + 'K';
            return label + ': ' + formattedValue;
          },
          afterLabel: function (context: any) {
            if (context.dataset.label === 'Proyectado' && context.parsed.y > 0) {
              return '(Calculado con regresión lineal)';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return 'S/.     ' + (Number(value) / 1000) + 'K';
          },
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  constructor(
    private salesReportService: SalesReportService,
    private paymentScheduleService: PaymentScheduleService,
    private projectedReportService: ProjectedReportService,
    private projectionService: ProjectionService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Set date range to capture all data (2024-2025)
    const filters = {
      startDate: '2024-01-01',
      endDate: '2025-12-31'
    };

    // Load sales dashboard data from backend
    this.salesReportService.getDashboard(filters).subscribe({
      next: (response) => {

        // Map backend response to frontend model
        if (response.success && response.data) {
          const data = response.data;

          this.salesSummary = {
            totalSales: parseFloat(data.summary?.total_sales || 0),
            totalRevenue: parseFloat(data.summary?.total_revenue || 0),
            totalAmount: parseFloat(data.summary?.total_revenue || 0),
            averageAmount: parseFloat(data.summary?.average_sale || 0),
            averageSale: parseFloat(data.summary?.average_sale || 0),
            salesGrowth: parseFloat(data.summary?.sales_growth || 0),
            uniqueClients: parseFloat(data.summary?.unique_clients || 0),
            activeEmployees: parseFloat(data.summary?.active_employees || 0),
            salesByStatus: {
              active: 0,
              cancelled: 0,
              completed: 0
            },
            salesByOffice: [],
            topAdvisors: []
          };


          // Update charts with real data
          this.updateChartsWithRealData(data);
        }
      },
      error: (error) => {
        console.error('❌ Error loading sales dashboard:', error);
        // Fallback to mock data if needed
        this.loadMockData();
      }
    });

    // Load payment summary
    this.paymentScheduleService.getPaymentScheduleSummary().subscribe({
      next: (response: any) => {
        // Backend returns { success, data: { summary, status_breakdown, upcoming_payments, overdue_summary } }
        const data = response?.data || response;
        const summary = data?.summary || {};
        const statusBreakdown = data?.status_breakdown || {};
        const overdueSummary = data?.overdue_summary || {};

        this.paymentSummary = {
          totalPending: summary.pending_amount || 0,
          totalOverdue: overdueSummary.total_amount || summary.overdue_amount || 0,
          collectionEfficiency: summary.paid_amount && summary.total_amount
            ? Math.round((summary.paid_amount / summary.total_amount) * 100)
            : 0,
          totalPaid: summary.paid_amount || 0,
          totalScheduled: summary.total_schedules || summary.total_amount || 0,
          paymentsByStatus: {
            pending: statusBreakdown.pending || statusBreakdown.pendiente || 0,
            paid: statusBreakdown.paid || statusBreakdown.pagado || 0,
            overdue: statusBreakdown.overdue || statusBreakdown.vencido || 0,
            partial: statusBreakdown.partial || 0
          },
          upcomingPayments: data?.upcoming_payments || [],
          overduePayments: []
        };
      },
      error: (error) => {
        console.error('❌ Error loading payment summary:', error);
        // Set default values when there's an error
        this.paymentSummary = {
          totalPending: 0,
          totalOverdue: 0,
          collectionEfficiency: 0,
          totalPaid: 0,
          totalScheduled: 0,
          paymentsByStatus: {
            pending: 0,
            paid: 0,
            overdue: 0,
            partial: 0
          },
          upcomingPayments: [],
          overduePayments: []
        };
      }
    });

    // Load financial projection
    this.projectedReportService.getFinancialProjections({ period: 'monthly' }).subscribe({
      next: (projections: FinancialProjection[]) => {
        this.financialProjection = projections.length > 0 ? projections[0] : null;
      },
      error: (error: any) => {
        console.error('Error loading financial projection:', error);
      }
    });
  }

  private updateChartsWithRealData(data: any): void {

    // Update sales trend chart with real data
    if (data.trends && data.trends.length > 0) {

      // Format labels and extract sales data
      const labels = data.trends.map((trend: any) => {
        const period = trend.period || trend.date || '';
        // Format YYYY-MM to "MMM YYYY" (e.g., "2025-06" -> "Jun 2025")
        if (period.match(/^\d{4}-\d{2}$/)) {
          const [year, month] = period.split('-');
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return `${monthNames[parseInt(month) - 1]} ${year}`;
        }
        return period;
      });

      const salesData = data.trends.map((trend: any) => {
        const salesCount = parseFloat(trend.sales_count || trend.total_sales || trend.sales || 0);
        return salesCount;
      });


      this.salesChartData = {
        labels: labels,
        datasets: [
          {
            label: 'Ventas',
            data: salesData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    } else {
    }

    // Load real revenue projection from backend using linear regression (MONTHLY)
    this.projectionService.getRevenueProjection(6, 12).subscribe({
      next: (projectionResponse) => {
        if (projectionResponse.success && projectionResponse.data) {
          const projection = projectionResponse.data;
          this.revenueProjection = projection;

          // Update growth rate and trend in dashboard cards
          this.growthRate = projection.growth_analysis.average_growth_rate;
          this.trend = projection.summary.trend;


          const currentPeriod = projection.current_month || projection.current_quarter;
          if (currentPeriod) {
          }

          // Build chart data from real monthly data
          const labels: string[] = [];
          const actualData: number[] = [];
          const projectedData: number[] = [];

          // Helper function to format month label
          const formatMonthLabel = (m: any) => {
            return m.month_label || m.quarter_label || 'N/A';
          };

          // Add historical months
          projection.historical_data.forEach(m => {
            labels.push(formatMonthLabel(m));
            actualData.push(m.total_revenue);
            projectedData.push(0); // No projection for past
          });

          // Add current month (partial) if available
          if (currentPeriod) {
            labels.push(formatMonthLabel(currentPeriod));
            actualData.push(currentPeriod.actual_revenue);
            const projectedEnd = (currentPeriod as any).projected_month_end || (currentPeriod as any).projected_quarter_end || 0;
            projectedData.push(projectedEnd);
          }

          // Add future projections
          projection.projections.forEach(p => {
            labels.push(formatMonthLabel(p));
            actualData.push(0); // No actual data yet
            projectedData.push(p.projected_revenue);
          });


          this.revenueChartData = {
            labels: labels,
            datasets: [
              {
                label: 'Ingresos Reales',
                data: actualData,
                backgroundColor: 'rgba(34, 197, 94, 0.75)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
                borderRadius: 4
              },
              {
                label: 'Proyección Basada en Tendencia',
                data: projectedData,
                backgroundColor: 'rgba(168, 85, 247, 0.75)',
                borderColor: 'rgb(168, 85, 247)',
                borderWidth: 2,
                borderDash: [8, 4],
                borderRadius: 4
              }
            ]
          };

          // Log insights

        } else {
          console.error('❌ Failed to get projection data');
          this.loadFallbackRevenueChart(data);
        }
      },
      error: (error) => {
        console.error('❌ Error loading revenue projection:', error);
        this.loadFallbackRevenueChart(data);
      }
    });
  }

  private loadFallbackRevenueChart(data: any): void {
    if (data.summary) {
      const currentRevenue = parseFloat(data.summary.total_revenue || 0);
      const projectedRevenue = currentRevenue * 1.15;

      this.revenueChartData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Actual',
            data: [currentRevenue * 0.8, currentRevenue * 0.9, currentRevenue, currentRevenue * 1.1],
            backgroundColor: 'rgba(34, 197, 94, 0.8)'
          },
          {
            label: 'Proyectado',
            data: [projectedRevenue * 0.8, projectedRevenue * 0.9, projectedRevenue, projectedRevenue * 1.1],
            backgroundColor: 'rgba(168, 85, 247, 0.8)'
          }
        ]
      };
    }
  }

  private loadMockData(): void {
    // Fallback mock data
    this.salesSummary = {
      totalSales: 0,
      totalRevenue: 0,
      totalAmount: 0,
      averageAmount: 0,
      averageSale: 0,
      salesGrowth: 0,
      uniqueClients: 0,
      activeEmployees: 0,
      salesByStatus: {
        active: 0,
        cancelled: 0,
        completed: 0
      },
      salesByOffice: [],
      topAdvisors: []
    };
  }

  getSeasonalContext(): string {
    if (!this.revenueProjection) return '';

    const seasonal = this.revenueProjection.seasonal_factors;
    const current = this.revenueProjection.current_month || this.revenueProjection.current_quarter;
    const summary = this.revenueProjection.summary;

    if (!current) return 'Calculando patrones estacionales...';

    // Find high and low seasons
    let highSeason = '';
    let lowSeason = '';
    let maxFactor = 0;
    let minFactor = 999;

    for (const [period, factor] of Object.entries(seasonal)) {
      if (factor > maxFactor) {
        maxFactor = factor;
        highSeason = period;
      }
      if (factor < minFactor) {
        minFactor = factor;
        lowSeason = period;
      }
    }

    const currentLabel = (current as any).month_label || (current as any).quarter_label || 'Período actual';
    const projectedEnd = (current as any).projected_month_end || (current as any).projected_quarter_end || 0;
    const periodType = (current as any).month_label ? 'mes' : 'trimestre';

    if (highSeason && lowSeason) {
      return `${highSeason} es temporada ALTA (${(maxFactor * 100).toFixed(0)}% del promedio). ` +
        `${lowSeason} es temporada BAJA (${(minFactor * 100).toFixed(0)}% del promedio). ` +
        `Actualmente en ${currentLabel}: $${(current.actual_revenue / 1000).toFixed(0)}K en ${current.progress_percentage.toFixed(0)}% del ${periodType}, ` +
        `proyección al final: $${(projectedEnd / 1000).toFixed(0)}K.`;
    }

    return `Actualmente en ${currentLabel}: $${(current.actual_revenue / 1000).toFixed(0)}K registrados (${current.progress_percentage.toFixed(0)}% del ${periodType} completado).`;
  }
}
