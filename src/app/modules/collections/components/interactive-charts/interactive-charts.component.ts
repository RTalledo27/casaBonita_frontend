import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity,
  DollarSign,
  Calendar,
  Target,
  Maximize2,
  Download,
  RefreshCw
} from 'lucide-angular';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { PaymentScheduleReport } from '../../models/payment-schedule';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';

// Register Chart.js components
Chart.register(...registerables);

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface ChartMetrics {
  totalSchedules: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
  monthlyTrends: { month: string; paid: number; pending: number; overdue: number }[];
}

@Component({
  selector: 'app-interactive-charts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Charts Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200">
            Análisis Visual de Cronogramas
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mt-1">Métricas interactivas y tendencias de pago</p>
        </div>
        
        <div class="flex gap-2">
          <button
            (click)="refreshCharts()"
            [disabled]="isLoading()"
            class="group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Actualizar Gráficos"
          >
            <lucide-angular [img]="RefreshCwIcon" [class]="isLoading() ? 'w-4 h-4 animate-spin' : 'w-4 h-4'"></lucide-angular>
          </button>
          
          <button
            (click)="exportChartsAsImages()"
            [disabled]="isLoading()"
            class="group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Exportar Gráficos"
          >
            <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- Main Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <!-- Status Distribution Chart -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
                  <lucide-angular [img]="PieChartIcon" class="w-4 h-4"></lucide-angular>
                </div>
                <span>Distribución por Estado</span>
              </h3>
              
              <button
                (click)="toggleChartFullscreen('status')"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
                title="Pantalla Completa"
              >
                <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
            
            <div class="relative h-64">
              <canvas #statusChart class="w-full h-full"></canvas>
            </div>
            
            <!-- Status Legend -->
            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-slate-600 dark:text-slate-400">Pagado</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="text-slate-600 dark:text-slate-400">Pendiente</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-slate-600 dark:text-slate-400">Vencido</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Trends Chart -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow">
                  <lucide-angular [img]="ActivityIcon" class="w-4 h-4"></lucide-angular>
                </div>
                <span>Tendencia Mensual</span>
              </h3>
              
              <button
                (click)="toggleChartFullscreen('trends')"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
                title="Pantalla Completa"
              >
                <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
            
            <div class="relative h-64">
              <canvas #trendsChart class="w-full h-full"></canvas>
            </div>
            
            <!-- Trend Indicators -->
            <div class="mt-4 flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <lucide-angular [img]="TrendingUpIcon" class="w-4 h-4 text-green-500"></lucide-angular>
                <span class="text-slate-600 dark:text-slate-400">Tasa de Cobro: {{ getPaymentRate() }}%</span>
              </div>
              <div class="text-slate-500 dark:text-slate-400">
                Últimos 6 meses
              </div>
            </div>
          </div>
        </div>

        <!-- Amount Comparison Chart -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg lg:col-span-2 xl:col-span-1">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow">
                  <lucide-angular [img]="BarChart3Icon" class="w-4 h-4"></lucide-angular>
                </div>
                <span>Comparación de Montos</span>
              </h3>
              
              <button
                (click)="toggleChartFullscreen('amounts')"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
                title="Pantalla Completa"
              >
                <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
            
            <div class="relative h-64">
              <canvas #amountChart class="w-full h-full"></canvas>
            </div>
            
            <!-- Amount Summary -->
            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div class="text-green-600 dark:text-green-400 font-semibold">{{ formatCurrency(metrics()?.paidAmount || 0) }}</div>
                <div class="text-slate-600 dark:text-slate-400">Cobrado</div>
              </div>
              <div class="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div class="text-red-600 dark:text-red-400 font-semibold">{{ formatCurrency(metrics()?.overdueAmount || 0) }}</div>
                <div class="text-slate-600 dark:text-slate-400">Vencido</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Payment Performance Chart -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow">
                  <lucide-angular [img]="TargetIcon" class="w-4 h-4"></lucide-angular>
                </div>
                <span>Rendimiento de Cobros</span>
              </h3>
            </div>
            
            <div class="relative h-64">
              <canvas #performanceChart class="w-full h-full"></canvas>
            </div>
            
            <!-- Performance Indicators -->
            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Eficiencia de Cobro</span>
                <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{ getCollectionEfficiency() }}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  [style.width.%]="getCollectionEfficiency()"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Aging Analysis Chart -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
          
          <div class="relative p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow">
                  <lucide-angular [img]="CalendarIcon" class="w-4 h-4"></lucide-angular>
                </div>
                <span>Análisis de Antigüedad</span>
              </h3>
            </div>
            
            <div class="relative h-64">
              <canvas #agingChart class="w-full h-full"></canvas>
            </div>
            
            <!-- Aging Legend -->
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-slate-600 dark:text-slate-400">0-30 días</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="text-slate-600 dark:text-slate-400">31-60 días</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                <span class="text-slate-600 dark:text-slate-400">61-90 días</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-slate-600 dark:text-slate-400">+90 días</span>
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
              <span class="text-slate-700 dark:text-slate-300 font-medium">Actualizando gráficos...</span>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InteractiveChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly destroy$ = new Subject<void>();

  // Input data
  @Input() reportData: PaymentScheduleReport | null = null;
  @Input() refreshTrigger: number = 0;

  // Chart references
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart', { static: false }) trendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amountChart', { static: false }) amountChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart', { static: false }) performanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('agingChart', { static: false }) agingChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private statusChart: Chart | null = null;
  private trendsChart: Chart | null = null;
  private amountChart: Chart | null = null;
  private performanceChart: Chart | null = null;
  private agingChart: Chart | null = null;

  // Icons
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  TrendingUpIcon = TrendingUp;
  ActivityIcon = Activity;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  TargetIcon = Target;
  Maximize2Icon = Maximize2;
  DownloadIcon = Download;
  RefreshCwIcon = RefreshCw;

  // Signals
  isLoading = signal(false);
  metrics = signal<ChartMetrics | null>(null);

  ngOnInit() {
    this.loadMetrics();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private async loadMetrics() {
    this.isLoading.set(true);
    
    try {
      const dashboardData = await this.collectionsService.getDashboardData().toPromise();
      
      if (dashboardData) {
        this.metrics.set({
          totalSchedules: dashboardData.active_schedules,
          paidAmount: dashboardData.paid_this_month,
          pendingAmount: dashboardData.pending_amount,
          overdueAmount: dashboardData.overdue_amount,
          paymentRate: dashboardData.payment_rate,
          monthlyTrends: this.generateMonthlyTrends(dashboardData)
        });
        
        // Reinitialize charts with new data
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private generateMonthlyTrends(data: any): { month: string; paid: number; pending: number; overdue: number }[] {
    // Generate mock monthly trends data - in real app this would come from API
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      paid: Math.random() * 50000 + 20000,
      pending: Math.random() * 30000 + 10000,
      overdue: Math.random() * 15000 + 5000
    }));
  }

  private initializeCharts() {
    this.destroyCharts();
    
    if (this.metrics()) {
      this.createStatusChart();
      this.createTrendsChart();
      this.createAmountChart();
      this.createPerformanceChart();
      this.createAgingChart();
    }
  }

  private createStatusChart() {
    if (!this.statusChartRef?.nativeElement || !this.metrics()) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const metrics = this.metrics()!;
    const total = metrics.paidAmount + metrics.pendingAmount + metrics.overdueAmount;

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Pendiente', 'Vencido'],
        datasets: [{
          data: [
            (metrics.paidAmount / total) * 100,
            (metrics.pendingAmount / total) * 100,
            (metrics.overdueAmount / total) * 100
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 4
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
              label: (context) => {
                const value = context.parsed;
                return `${context.label}: ${value.toFixed(1)}%`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  private createTrendsChart() {
    if (!this.trendsChartRef?.nativeElement || !this.metrics()) return;

    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const metrics = this.metrics()!;

    this.trendsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: metrics.monthlyTrends.map(t => t.month),
        datasets: [
          {
            label: 'Pagado',
            data: metrics.monthlyTrends.map(t => t.paid),
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Pendiente',
            data: metrics.monthlyTrends.map(t => t.pending),
            borderColor: 'rgba(234, 179, 8, 1)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Vencido',
            data: metrics.monthlyTrends.map(t => t.overdue),
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(Number(value))
            }
          }
        }
      }
    });
  }

  private createAmountChart() {
    if (!this.amountChartRef?.nativeElement || !this.metrics()) return;

    const ctx = this.amountChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const metrics = this.metrics()!;

    this.amountChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pagado', 'Pendiente', 'Vencido'],
        datasets: [{
          data: [metrics.paidAmount, metrics.pendingAmount, metrics.overdueAmount],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(Number(value))
            }
          }
        }
      }
    });
  }

  private createPerformanceChart() {
    if (!this.performanceChartRef?.nativeElement || !this.metrics()) return;

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const metrics = this.metrics()!;
    const performanceData = [
      metrics.paymentRate,
      100 - metrics.paymentRate
    ];

    this.performanceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cobrado', 'Pendiente'],
        datasets: [{
          data: performanceData,
          backgroundColor: [
            'rgba(147, 51, 234, 0.8)',
            'rgba(203, 213, 225, 0.3)'
          ],
          borderColor: [
            'rgba(147, 51, 234, 1)',
            'rgba(203, 213, 225, 0.5)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '70%'
      }
    });
  }

  private createAgingChart() {
    if (!this.agingChartRef?.nativeElement) return;

    const ctx = this.agingChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Mock aging data - in real app this would come from API
    const agingData = [40, 25, 20, 15]; // percentages for each aging bucket

    this.agingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-30 días', '31-60 días', '61-90 días', '+90 días'],
        datasets: [{
          data: agingData,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }

  private destroyCharts() {
    [this.statusChart, this.trendsChart, this.amountChart, this.performanceChart, this.agingChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  // Public methods
  refreshCharts() {
    this.loadMetrics();
  }

  toggleChartFullscreen(chartType: string) {
    // Implementation for fullscreen chart view
    console.log(`Toggle fullscreen for ${chartType} chart`);
  }

  exportChartsAsImages() {
    // Implementation for exporting charts as images
    const charts = [
      { chart: this.statusChart, name: 'status-distribution' },
      { chart: this.trendsChart, name: 'monthly-trends' },
      { chart: this.amountChart, name: 'amount-comparison' },
      { chart: this.performanceChart, name: 'payment-performance' },
      { chart: this.agingChart, name: 'aging-analysis' }
    ];

    charts.forEach(({ chart, name }) => {
      if (chart) {
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `${name}-chart.png`;
        link.href = url;
        link.click();
      }
    });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getPaymentRate(): number {
    return this.metrics()?.paymentRate || 0;
  }

  getCollectionEfficiency(): number {
    const metrics = this.metrics();
    if (!metrics) return 0;
    
    const total = metrics.paidAmount + metrics.pendingAmount + metrics.overdueAmount;
    return total > 0 ? Math.round((metrics.paidAmount / total) * 100) : 0;
  }
}