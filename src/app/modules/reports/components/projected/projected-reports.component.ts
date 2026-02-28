import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, TrendingUp, Download, Plus, Filter, X, PieChart, BarChart, DollarSign, Target } from 'lucide-angular';
import { ProjectedReportService, ExportService } from '../../services';
import { ProjectedReport, ProjectedReportFilter, ExportFormat } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-projected-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BaseChartDirective,
    LucideAngularModule
  ],
  templateUrl: './projected-reports.component.html'
})
export class ProjectedReportsComponent implements OnInit {
  // Lucide icons
  readonly icons = { TrendingUp, Download, Plus, Filter, X, PieChart, BarChart, DollarSign, Target };

  filtersForm: FormGroup;

  // Signals
  projectedReports = signal<ProjectedReport[]>([]);
  filteredProjections = signal<ProjectedReport[]>([]);
  paginatedProjections = signal<ProjectedReport[]>([]);

  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(25);
  totalItems = signal(0);
  totalPages = signal(0);

  // Search and sorting signals
  searchTerm = signal('');
  sortField = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Key metrics signals
  projectedRevenue = signal(2500000);
  projectedSales = signal(450);
  projectedCashFlow = signal(1800000);
  projectedROI = signal(18.5);

  isExporting = signal(false);

  // Scenario selection
  selectedScenario = signal('realistic');
  scenarios = [
    { key: 'optimistic', label: 'Optimista' },
    { key: 'realistic', label: 'Realista' },
    { key: 'pessimistic', label: 'Pesimista' }
  ];

  // Chart configurations
  revenueProjectionChartType: ChartType = 'line';
  revenueProjectionChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{
      label: 'Proyección',
      data: [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  revenueProjectionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  salesProjectionChartType: ChartType = 'bar';
  salesProjectionChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{
      label: 'Ventas Proyectadas',
      data: [],
      backgroundColor: '#10B981'
    }]
  };

  salesProjectionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  cashFlowChartType: ChartType = 'line';
  cashFlowChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{
      label: 'Flujo de Caja',
      data: [],
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  cashFlowChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private projectedReportService: ProjectedReportService,
    private exportService: ExportService
  ) {
    this.filtersForm = this.fb.group({
      projectionType: [''],
      period: ['monthly'],
      year: ['2025'],
      scenario: ['realistic']
    });
  }

  ngOnInit(): void {
    this.loadProjectedReports();
    this.loadMetrics();
    this.loadChartData();
  }

  private loadProjectedReports(): void {
    const filters = this.filtersForm.value as ProjectedReportFilter;

    this.projectedReportService.getProjectedReports(filters).subscribe({
      next: (reports) => {
        this.projectedReports.set(reports);
        this.applySearchAndSort();
      },
      error: (error) => console.error('Error loading projected reports:', error)
    });
  }

  private loadMetrics(): void {
    const year = parseInt(this.filtersForm.value.year);
    const scenario = this.filtersForm.value.scenario;

    this.projectedReportService.getProjectionMetrics(year, scenario).subscribe({
      next: (metrics) => {
        this.projectedRevenue.set(metrics.projected_revenue || 2500000);
        this.projectedSales.set(metrics.projected_sales || 450);
        this.projectedCashFlow.set(metrics.projected_cash_flow || 1800000);
        this.projectedROI.set(metrics.projected_roi || 18.5);
      },
      error: (error) => console.error('Error loading metrics:', error)
    });
  }

  private loadChartData(): void {
    const year = parseInt(this.filtersForm.value.year);

    // Load revenue chart
    this.projectedReportService.getRevenueProjectionChartData(year, 12).subscribe({
      next: (chartData) => {
        if (chartData.labels && chartData.datasets) {
          this.revenueProjectionChartData = {
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({ ...ds, tension: 0.4 }))
          };
        }
      },
      error: (error) => console.error('Error loading revenue chart:', error)
    });

    // Load sales chart
    this.projectedReportService.getSalesProjectionChartData(year).subscribe({
      next: (chartData) => {
        if (chartData.labels && chartData.datasets) {
          this.salesProjectionChartData = chartData;
        }
      },
      error: (error) => console.error('Error loading sales chart:', error)
    });

    // Load cash flow chart
    this.projectedReportService.getCashFlowChartData(year, 12).subscribe({
      next: (chartData) => {
        if (chartData.labels && chartData.datasets) {
          this.cashFlowChartData = {
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({
              ...ds,
              tension: 0.4,
              fill: ds.label === 'Flujo Neto'
            }))
          };
        }
      },
      error: (error) => console.error('Error loading cash flow chart:', error)
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProjectedReports();
    this.loadMetrics();
    this.loadChartData();
  }

  clearFilters(): void {
    this.filtersForm.patchValue({
      projectionType: '',
      period: 'monthly',
      year: String(new Date().getFullYear()),
      scenario: 'realistic'
    });
    this.currentPage.set(1);
    this.loadProjectedReports();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.applySearchAndSort();
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.applySearchAndSort();
  }

  private applySearchAndSort(): void {
    let filtered = [...this.projectedReports()];

    // Apply search
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(projection =>
        (projection.name || '').toLowerCase().includes(term) ||
        (projection.description || '').toLowerCase().includes(term) ||
        (projection.type || '').toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (this.sortField()) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[this.sortField()];
        const bValue = (b as any)[this.sortField()];

        if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredProjections.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.paginatedProjections.set(this.filteredProjections().slice(startIndex, endIndex));
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1, -1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1, total);
      }
    }

    return pages;
  }

  selectScenario(scenario: string): void {
    this.selectedScenario.set(scenario);
    this.filtersForm.patchValue({ scenario });
    this.loadMetrics();
    this.loadChartData();
  }

  getTypeClass(type: string): string {
    const typeMap: Record<string, string> = {
      'financial': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'sales': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'revenue': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'cashflow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'collection': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };

    return typeMap[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getTypeLabel(type: string): string {
    const labelMap: Record<string, string> = {
      'financial': 'Financiera',
      'sales': 'Ventas',
      'revenue': 'Ingresos',
      'cashflow': 'Flujo de Caja',
      'collection': 'Cobranza'
    };

    return labelMap[type.toLowerCase()] || type;
  }

  getVariationClass(variation: number): string {
    if (variation > 0) return 'text-green-600 dark:text-green-400';
    if (variation < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'bg-green-600';
    if (confidence >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  }

  viewProjectionDetail(id: number): void {
  }

  editProjection(id: number): void {
  }

  exportSingleProjection(id: number): void {
  }

  generateCustomProjection(): void {
  }

  exportReport(format: ExportFormat): void {
    this.isExporting.set(true);

    const filters = this.filtersForm.value;

    setTimeout(() => {
      this.isExporting.set(false);
    }, 1500);
  }
}
