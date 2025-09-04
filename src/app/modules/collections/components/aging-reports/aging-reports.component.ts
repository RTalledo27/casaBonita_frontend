import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, Download, Filter, Calendar, FileText, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-angular';
import { AgingReportsService } from '../../services/aging-reports.service';
import { AgingReportData, AgingReportFilters, AgingPeriodSummary, AgingClientData } from '../../models/aging-report';

@Component({
  selector: 'app-aging-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reportes de Antigüedad</h1>
          <p class="text-gray-600 mt-1">Análisis de cuentas por cobrar por períodos de vencimiento</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="exportReport('excel')"
            [disabled]="isLoading() || !reportData()"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="Download" class="w-4 h-4"></lucide-angular>
            <span>Excel</span>
          </button>
          <button 
            (click)="exportReport('pdf')"
            [disabled]="isLoading() || !reportData()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="FileText" class="w-4 h-4"></lucide-angular>
            <span>PDF</span>
          </button>
          <button 
            (click)="generateReport()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="BarChart3" class="w-4 h-4"></lucide-angular>
            <span>{{ isLoading() ? 'Generando...' : 'Generar Reporte' }}</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form [formGroup]="filtersForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Report Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Reporte</label>
              <input
                type="date"
                formControlName="report_date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>

            <!-- Currency -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select 
                formControlName="currency"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las monedas</option>
                <option value="PEN">Soles (PEN)</option>
              </select>
            </div>

            <!-- Client Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
              <select 
                formControlName="client_type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporativo</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Minimum Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
              <input
                type="number"
                formControlName="min_amount"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>

            <!-- Include Zero Balances -->
            <div class="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                formControlName="include_zero_balances"
                id="includeZero"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <label for="includeZero" class="text-sm text-gray-700">Incluir saldos en cero</label>
            </div>
          </div>
        </form>
      </div>

      <!-- Summary Cards -->
      @if (reportData(); as report) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-blue-100 p-3 rounded-lg">
                <lucide-angular [img]="DollarSign" class="w-6 h-6 text-blue-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total General</p>
                <p class="text-2xl font-bold text-gray-900">{{ report.total_amount | currency:report.currency:'symbol':'1.0-0' }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-green-100 p-3 rounded-lg">
                <lucide-angular [img]="Calendar" class="w-6 h-6 text-green-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Al Día (0-30)</p>
                <p class="text-2xl font-bold text-green-600">{{ getCurrentAmount() | currency:report.currency:'symbol':'1.0-0' }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-yellow-100 p-3 rounded-lg">
                <lucide-angular [img]="TrendingUp" class="w-6 h-6 text-yellow-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Vencidas</p>
                <p class="text-2xl font-bold text-yellow-600">{{ getOverdueAmount() | currency:report.currency:'symbol':'1.0-0' }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-purple-100 p-3 rounded-lg">
                <lucide-angular [img]="Users" class="w-6 h-6 text-purple-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Clientes</p>
                <p class="text-2xl font-bold text-purple-600">{{ report.clients.length }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Aging Periods Summary -->
      @if (periodSummary(); as summary) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumen por Períodos</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porcentaje
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gráfico
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (period of summary; track period.period_name) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ period.period_name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ period.account_count }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ period.amount | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ period.percentage }}%
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          [style.width.%]="period.percentage"
                          [class]="getPeriodBarColor(period.period_name) + ' h-2 rounded-full'"
                        ></div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Client Details -->
      @if (reportData()?.clients; as clients) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Detalle por Cliente</h3>
            <div class="flex space-x-2">
              <input
                type="text"
                [(ngModel)]="clientSearchTerm"
                placeholder="Buscar cliente..."
                class="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
              <select 
                [(ngModel)]="sortBy"
                (ngModelChange)="sortClients()"
                class="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nombre</option>
                <option value="total">Monto Total</option>
                <option value="overdue">Monto Vencido</option>
              </select>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Al Día (0-30)
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    31-60 días
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    61-90 días
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    91-120 días
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    &gt; 120 días
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (client of getFilteredClients(); track client.client_id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ client.client_name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ client.client_id }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ getPeriodAmount(client, '0-30') | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ getPeriodAmount(client, '31-60') | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ getPeriodAmount(client, '61-90') | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ getPeriodAmount(client, '91-120') | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {{ getPeriodAmount(client, '120+') | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {{ client.total | currency:reportData()?.currency:'symbol':'1.2-2' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                      <div class="flex flex-col items-center">
                        <lucide-angular [img]="Users" class="w-12 h-12 text-gray-300 mb-4"></lucide-angular>
                        <p class="text-lg font-medium">No se encontraron clientes</p>
                        <p class="text-sm">Intenta generar un nuevo reporte</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Generando reporte...</span>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !reportData()) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div class="text-center">
            <lucide-angular [img]="BarChart3" class="w-16 h-16 text-gray-300 mx-auto mb-4"></lucide-angular>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay datos de reporte</h3>
            <p class="text-gray-600 mb-6">Haz clic en "Generar Reporte" para crear un nuevo reporte de antigüedad</p>
            <button 
              (click)="generateReport()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <lucide-angular [img]="BarChart3" class="w-4 h-4"></lucide-angular>
              <span>Generar Reporte</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class AgingReportsComponent implements OnInit, OnDestroy {
  private readonly agingService = inject(AgingReportsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Icons
  readonly Download = Download;
  readonly Filter = Filter;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly BarChart3 = BarChart3;
  readonly TrendingUp = TrendingUp;
  readonly Users = Users;
  readonly DollarSign = DollarSign;

  // Signals
  isLoading = signal(false);
  reportData = signal<AgingReportData | null>(null);
  periodSummary = signal<AgingPeriodSummary[]>([]);

  // Form and filters
  filtersForm: FormGroup;
  clientSearchTerm = '';
  sortBy = 'name';

  constructor() {
    this.filtersForm = this.fb.group({
      report_date: [new Date().toISOString().split('T')[0]],
      currency: [''],
      client_type: [''],
      min_amount: [''],
      include_zero_balances: [false]
    });
  }

  ngOnInit(): void {
    // Auto-generate report on load
    this.generateReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateReport(): void {
    this.isLoading.set(true);
    
    const filters: AgingReportFilters = {
      ...this.filtersForm.value
    };

    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AgingReportFilters] === '' || filters[key as keyof AgingReportFilters] === null) {
        delete filters[key as keyof AgingReportFilters];
      }
    });

    this.agingService.generateReport(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.reportData.set(response.data);
          this.loadPeriodSummary();
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Error generating aging report:', error);
          this.isLoading.set(false);
        }
      });
  }

  loadPeriodSummary(): void {
    const filters = this.filtersForm.value;
    this.agingService.getPeriodSummary(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.periodSummary.set(response.data);
        },
        error: (error) => {
          console.error('Error loading period summary:', error);
        }
      });
  }

  exportReport(format: 'excel' | 'pdf' | 'csv'): void {
    if (!this.reportData()) return;

    const filters = this.filtersForm.value;
    const exportOptions = {
      format,
      include_summary: true,
      include_details: true,
      group_by_client: true
    };

    let exportObservable;
    switch (format) {
      case 'excel':
        exportObservable = this.agingService.exportToExcel(filters, exportOptions);
        break;
      case 'pdf':
        exportObservable = this.agingService.exportToPDF(filters, exportOptions);
        break;
      case 'csv':
        exportObservable = this.agingService.exportToCSV(filters);
        break;
    }

    exportObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte-antiguedad-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error(`Error exporting ${format}:`, error);
        }
      });
  }

  getFilteredClients(): AgingClientData[] {
    const clients = this.reportData()?.clients || [];
    let filtered = clients;

    // Filter by search term
    if (this.clientSearchTerm) {
      filtered = filtered.filter(client => 
        client.client_name.toLowerCase().includes(this.clientSearchTerm.toLowerCase())
      );
    }

    // Sort clients
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.client_name.localeCompare(b.client_name);
        case 'total':
          return b.total - a.total;
        case 'overdue':
          const aOverdue = this.getClientOverdueAmount(a);
          const bOverdue = this.getClientOverdueAmount(b);
          return bOverdue - aOverdue;
        default:
          return 0;
      }
    });

    return filtered;
  }

  sortClients(): void {
    // Trigger re-computation of filtered clients
    this.clientSearchTerm = this.clientSearchTerm;
  }

  getPeriodAmount(client: AgingClientData, period: string): number {
    const periodData = client.aging_periods.find(p => p.period_name === period);
    return periodData?.amount || 0;
  }

  getCurrentAmount(): number {
    const report = this.reportData();
    if (!report) return 0;
    
    return report.periods.find((p: any) => p.period_name === '0-30')?.amount || 0;
  }

  getOverdueAmount(): number {
    const report = this.reportData();
    if (!report) return 0;
    
    return report.periods
      .filter((p: any) => p.period_name !== '0-30')
      .reduce((sum: number, period: any) => sum + period.amount, 0);
  }

  getClientOverdueAmount(client: AgingClientData): number {
    return client.aging_periods
      .filter((p: any) => p.period_name !== '0-30')
      .reduce((sum: number, period: any) => sum + period.amount, 0);
  }

  getPeriodBarColor(periodName: string): string {
    const colors: { [key: string]: string } = {
      '0-30': 'bg-green-500',
      '31-60': 'bg-yellow-500',
      '61-90': 'bg-orange-500',
      '91-120': 'bg-red-500',
      '120+': 'bg-red-700'
    };
    return colors[periodName] || 'bg-gray-500';
  }
}