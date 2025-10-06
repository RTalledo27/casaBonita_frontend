import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BarChart3, PieChart, TrendingUp, Download, Maximize2, RefreshCw } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
  TooltipItem,
  ChartEvent,
  ActiveElement
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { AdvancedReportsService, TrendData, CollectorEfficiency } from '../../services/advanced-reports.service';

// Register Chart.js components
Chart.register(...registerables);

interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: any;
  options: ChartConfiguration['options'];
  height?: number;
}

@Component({
  selector: 'app-interactive-charts',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
<div class="space-y-6 p-6">
  <!-- Charts Header -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Análisis Gráfico Interactivo
      </h2>
      <p class="text-slate-600 dark:text-slate-300">
        Visualización avanzada de datos de cobranza
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <button 
        (click)="refreshCharts()"
        [disabled]="loading()"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
      >
        <lucide-angular [img]="RefreshCwIcon" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-angular>
        Actualizar
      </button>
      
      <button 
        (click)="exportAllCharts()"
        class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
        Exportar
      </button>
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Collection Trends Chart -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <lucide-angular [img]="TrendingUpIcon" class="w-5 h-5 text-blue-500"></lucide-angular>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Tendencias de Cobranza</h3>
        </div>
        <button 
          (click)="toggleChartSize('trends')"
          class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
        </button>
      </div>
      
      <div class="relative" [style.height.px]="getChartHeight('trends')">
        <canvas #trendsChart></canvas>
      </div>
      
      <div class="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ trendsMetrics().totalCollected | currency:'MXN':'symbol':'1.0-0' }}</div>
          <div class="text-sm text-slate-600 dark:text-slate-400">Total Cobrado</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ trendsMetrics().avgRate }}%</div>
          <div class="text-sm text-slate-600 dark:text-slate-400">Tasa Promedio</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ trendsMetrics().bestMonth }}</div>
          <div class="text-sm text-slate-600 dark:text-slate-400">Mejor Mes</div>
        </div>
      </div>
    </div>

    <!-- Portfolio Distribution Chart -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <lucide-angular [img]="PieChartIcon" class="w-5 h-5 text-green-500"></lucide-angular>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Distribución de Cartera</h3>
        </div>
        <button 
          (click)="toggleChartSize('distribution')"
          class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
        </button>
      </div>
      
      <div class="relative" [style.height.px]="getChartHeight('distribution')">
        <canvas #distributionChart></canvas>
      </div>
      
      <div class="mt-4 space-y-2">
        @for (item of distributionLegend(); track item.label) {
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" [style.background-color]="item.color"></div>
              <span class="text-sm text-slate-700 dark:text-slate-300">{{ item.label }}</span>
            </div>
            <div class="text-sm font-medium text-slate-900 dark:text-white">
              {{ item.value | currency:'MXN':'symbol':'1.0-0' }} ({{ item.percentage }}%)
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Collector Performance Chart -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-purple-500"></lucide-angular>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Rendimiento por Cobrador</h3>
        </div>
        <button 
          (click)="toggleChartSize('performance')"
          class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
        </button>
      </div>
      
      <div class="relative" [style.height.px]="getChartHeight('performance')">
        <canvas #performanceChart></canvas>
      </div>
      
      <div class="mt-4 text-center">
        <div class="text-sm text-slate-600 dark:text-slate-400 mb-2">Top 3 Performers</div>
        <div class="flex justify-center gap-6">
          @for (top of topPerformers(); track top.name; let i = $index) {
            <div class="text-center">
              <div class="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center text-white text-sm font-bold"
                   [class]="i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-600'">
                {{ i + 1 }}
              </div>
              <div class="text-xs font-medium text-slate-900 dark:text-white">{{ top.name }}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400">{{ top.efficiency }}%</div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Collection Heatmap -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-red-500"></lucide-angular>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Mapa de Calor - Vencimientos</h3>
        </div>
        <button 
          (click)="toggleChartSize('heatmap')"
          class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <lucide-angular [img]="Maximize2Icon" class="w-4 h-4"></lucide-angular>
        </button>
      </div>
      
      <div class="relative" [style.height.px]="getChartHeight('heatmap')">
        <canvas #heatmapChart></canvas>
      </div>
      
      <div class="mt-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-400">Menor actividad</span>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-green-200 rounded"></div>
            <div class="w-3 h-3 bg-yellow-300 rounded"></div>
            <div class="w-3 h-3 bg-orange-400 rounded"></div>
            <div class="w-3 h-3 bg-red-500 rounded"></div>
          </div>
          <span class="text-slate-600 dark:text-slate-400">Mayor actividad</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Chart Modal for Expanded View -->
  @if (expandedChart()) {
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-slate-900 dark:text-white">{{ getExpandedChartTitle() }}</h3>
            <button 
              (click)="closeExpandedChart()"
              class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div class="relative h-96">
            <canvas #expandedChartCanvas></canvas>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- Loading Overlay -->
  @if (loading()) {
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center gap-3">
        <lucide-angular [img]="RefreshCwIcon" class="w-6 h-6 text-blue-500 animate-spin"></lucide-angular>
        <span class="text-slate-900 dark:text-white font-medium">Actualizando gráficos...</span>
      </div>
    </div>
  }
</div>
  `
})
export class InteractiveChartsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private advancedReportsService = inject(AdvancedReportsService);

  // Chart references
  @ViewChild('trendsChart', { static: true }) trendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distributionChart', { static: true }) distributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart', { static: true }) performanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heatmapChart', { static: true }) heatmapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expandedChartCanvas', { static: false }) expandedChartCanvasRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private trendsChart?: Chart;
  private distributionChart?: Chart;
  private performanceChart?: Chart;
  private heatmapChart?: Chart;
  private expandedChartInstance?: Chart;

  // Icons
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  TrendingUpIcon = TrendingUp;
  DownloadIcon = Download;
  Maximize2Icon = Maximize2;
  RefreshCwIcon = RefreshCw;

  // Signals
  loading = signal(false);
  trendData = signal<TrendData[]>([]);
  collectorEfficiency = signal<CollectorEfficiency[]>([]);
  expandedChart = signal<string | null>(null);
  chartSizes = signal<Record<string, 'normal' | 'expanded'>>({
    trends: 'normal',
    distribution: 'normal',
    performance: 'normal',
    heatmap: 'normal'
  });

  // Computed properties
  trendsMetrics = computed(() => {
    const data = this.trendData();
    if (!data.length) return { totalCollected: 0, avgRate: 0, bestMonth: 'N/A' };

    const totalCollected = data.reduce((sum, item) => sum + item.collected_amount, 0);
    const avgRate = data.reduce((sum, item) => sum + item.collection_rate, 0) / data.length;
    const bestMonth = data.reduce((best, current) => 
      current.collection_rate > best.collection_rate ? current : best
    ).period;

    return {
      totalCollected,
      avgRate: Math.round(avgRate),
      bestMonth
    };
  });

  distributionLegend = signal([
    { label: 'Al Día', value: 2500000, percentage: 45, color: '#10b981' },
    { label: '1-30 días', value: 1800000, percentage: 32, color: '#f59e0b' },
    { label: '31-60 días', value: 800000, percentage: 15, color: '#f97316' },
    { label: '60+ días', value: 450000, percentage: 8, color: '#ef4444' }
  ]);

  topPerformers = computed(() => {
    return this.collectorEfficiency()
      .sort((a, b) => b.efficiency_score - a.efficiency_score)
      .slice(0, 3)
      .map(collector => ({
        name: collector.collector_name,
        efficiency: collector.efficiency_score
      }));
  });

  ngOnInit() {
    this.loadChartsData();
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadChartsData() {
    this.loading.set(true);
    
    const filters = {
      dateFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    };

    // Load trend data
    this.advancedReportsService.getTrendAnalysis('monthly', filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.trendData.set(data);
          this.createTrendsChart();
        },
        error: (error) => console.error('Error loading trend data:', error)
      });

    // Load collector efficiency
    this.advancedReportsService.getCollectorEfficiency(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.collectorEfficiency.set(data);
          this.createPerformanceChart();
        },
        error: (error) => console.error('Error loading collector efficiency:', error)
      });

    // Create other charts with mock data for now
    setTimeout(() => {
      this.createDistributionChart();
      this.createHeatmapChart();
      this.loading.set(false);
    }, 1000);
  }

  createTrendsChart() {
    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.trendsChart) {
      this.trendsChart.destroy();
    }

    const data = this.trendData();
    
    this.trendsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => item.period),
        datasets: [
          {
            label: 'Monto Cobrado',
            data: data.map(item => item.collected_amount),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Tasa de Cobranza (%)',
            data: data.map(item => item.collection_rate),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'line'>) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label.includes('Monto')) {
                  return `${label}: ${this.formatCurrency(value)}`;
                }
                return `${label}: ${value}%`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Período'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Monto (MXN)'
            },
            ticks: {
              callback: (value) => this.formatCurrency(Number(value))
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Tasa (%)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }

  createDistributionChart() {
    const ctx = this.distributionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.distributionChart) {
      this.distributionChart.destroy();
    }

    const legend = this.distributionLegend();
    
    this.distributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: legend.map(item => item.label),
        datasets: [{
          data: legend.map(item => item.value),
          backgroundColor: legend.map(item => item.color),
          borderWidth: 2,
          borderColor: '#ffffff'
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
              label: (context: TooltipItem<'doughnut'>) => {
                const label = context.label || '';
                const value = context.parsed;
                const percentage = legend[context.dataIndex].percentage;
                return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  createPerformanceChart() {
    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    const data = this.collectorEfficiency().slice(0, 10); // Top 10
    
    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.collector_name),
        datasets: [
          {
            label: 'Eficiencia (%)',
            data: data.map(item => item.efficiency_score),
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: '#9333ea',
            borderWidth: 1
          },
          {
            label: 'Cuentas Asignadas',
            data: data.map(item => item.total_assigned),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Cobradores'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Eficiencia (%)'
            },
            max: 100
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cuentas'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  createHeatmapChart() {
    const ctx = this.heatmapChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.heatmapChart) {
      this.heatmapChart.destroy();
    }

    // Mock heatmap data - in real implementation, this would come from the service
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    const heatmapData = months.flatMap((month, monthIndex) => 
      days.map((day, dayIndex) => ({
        x: day,
        y: monthIndex,
        v: Math.floor(Math.random() * 100) // Mock intensity value
      }))
    );

    this.heatmapChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Actividad de Cobranza',
          data: heatmapData.map(point => ({ x: point.x, y: point.y })),
          backgroundColor: (context) => {
            const value = heatmapData[context.dataIndex]?.v || 0;
            const intensity = value / 100;
            if (intensity < 0.25) return 'rgba(34, 197, 94, 0.6)';
            if (intensity < 0.5) return 'rgba(234, 179, 8, 0.6)';
            if (intensity < 0.75) return 'rgba(249, 115, 22, 0.6)';
            return 'rgba(239, 68, 68, 0.8)';
          },
          pointRadius: 8
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
              title: () => '',
              label: (context) => {
                const point = heatmapData[context.dataIndex];
                const month = months[point.y];
                return `${month} ${point.x}: ${point.v}% actividad`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Día del Mes'
            },
            min: 1,
            max: 31,
            ticks: {
              stepSize: 5
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Mes'
            },
            min: -0.5,
            max: months.length - 0.5,
            ticks: {
              callback: (value) => months[Math.round(Number(value))] || ''
            }
          }
        }
      }
    });
  }

  refreshCharts() {
    this.loadChartsData();
  }

  exportAllCharts() {
    const charts = [
      { name: 'tendencias-cobranza', chart: this.trendsChart },
      { name: 'distribucion-cartera', chart: this.distributionChart },
      { name: 'rendimiento-cobradores', chart: this.performanceChart },
      { name: 'mapa-calor-vencimientos', chart: this.heatmapChart }
    ];

    charts.forEach(({ name, chart }) => {
      if (chart) {
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `${name}.png`;
        link.href = url;
        link.click();
      }
    });
  }

  toggleChartSize(chartId: string) {
    this.expandedChart.set(chartId);
  }

  closeExpandedChart() {
    if (this.expandedChartInstance) {
      this.expandedChartInstance.destroy();
      this.expandedChartInstance = undefined;
    }
    this.expandedChart.set(null);
  }

  getExpandedChartTitle(): string {
    const titles: Record<string, string> = {
      trends: 'Tendencias de Cobranza - Vista Expandida',
      distribution: 'Distribución de Cartera - Vista Expandida',
      performance: 'Rendimiento por Cobrador - Vista Expandida',
      heatmap: 'Mapa de Calor de Vencimientos - Vista Expandida'
    };
    return titles[this.expandedChart() || ''] || '';
  }

  getChartHeight(chartId: string): number {
    const sizes = this.chartSizes();
    return sizes[chartId] === 'expanded' ? 400 : 300;
  }

  private destroyCharts() {
    [this.trendsChart, this.distributionChart, this.performanceChart, this.heatmapChart, this.expandedChartInstance]
      .forEach(chart => chart?.destroy());
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}