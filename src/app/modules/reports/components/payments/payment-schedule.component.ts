import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { PaymentScheduleService, ExportService } from '../../services';
import { PaymentSchedule, PaymentScheduleFilter } from '../../models';

// Define missing types
export type ExportFormat = 'excel' | 'pdf' | 'csv';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

Chart.register(...registerables);

@Component({
  selector: 'app-payment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BaseChartDirective],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Cronogramas de Pagos</h1>
            <p class="text-gray-600">Gestión de cuotas, vencimientos y estados de pago</p>
          </div>
          <div class="flex space-x-3">
            <button 
              (click)="exportReport('excel')"
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Excel</span>
            </button>
            <button 
              (click)="exportReport('pdf')"
              class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Alert Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-red-800">Pagos Vencidos</h3>
              <p class="text-2xl font-bold text-red-900">{{ overdueSummary.count | number }}</p>
              <p class="text-sm text-red-700">S/. {{ overdueSummary.amount | number:'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-yellow-800">Próximos Vencimientos</h3>
              <p class="text-2xl font-bold text-yellow-900">{{ upcomingSummary.count | number }}</p>
              <p class="text-sm text-yellow-700">S/. {{ upcomingSummary.amount | number:'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-green-800">Pagos al Día</h3>
              <p class="text-2xl font-bold text-green-900">{{ currentSummary.count | number }}</p>
              <p class="text-sm text-green-700">S/. {{ currentSummary.amount | number:'1.0-0' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input 
                type="date" 
                formControlName="startDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input 
                type="date" 
                formControlName="endDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <select 
                formControlName="clientId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los clientes</option>
                <option *ngFor="let client of clients" [value]="client.id">{{ client.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select 
                formControlName="status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
                <option value="partial">Parcial</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Alerta</label>
              <select 
                formControlName="alertType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas</option>
                <option value="overdue">Solo Vencidos</option>
                <option value="upcoming">Próximos a Vencer</option>
                <option value="current">Al Día</option>
              </select>
            </div>
          </div>
          <div class="flex justify-between items-center mt-4">
            <div class="flex space-x-2">
              <button 
                type="submit"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Aplicar Filtros
              </button>
              <button 
                type="button"
                (click)="clearFilters()"
                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                Limpiar
              </button>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Mostrar:</span>
              <select 
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span class="text-sm text-gray-600">registros</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Payment Status Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Estados de Pago</h3>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="statusChartData"
              [options]="statusChartOptions"
              [type]="statusChartType">
            </canvas>
          </div>
        </div>

        <!-- Payment Timeline Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Cronograma de Pagos</h3>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="timelineChartData"
              [options]="timelineChartOptions"
              [type]="timelineChartType">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Payment Schedule Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Cronograma de Pagos</h3>
            <div class="flex items-center space-x-2">
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Buscar cliente, cuota..."
                class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <button class="p-2 text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                    (click)="sortBy('dueDate')">
                  Vencimiento
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                    (click)="sortBy('amount')">
                  Monto
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let payment of paginatedPayments" 
                  [class]="getRowClass(payment.status, payment.daysUntilDue)"
                  class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ payment.dueDate | date:'dd/MM/yyyy' }}</div>
                  <div class="text-sm text-gray-500" *ngIf="payment.daysUntilDue < 0">
                    Vencido hace {{ Math.abs(payment.daysUntilDue) }} días
                  </div>
                  <div class="text-sm text-gray-500" *ngIf="payment.daysUntilDue >= 0 && payment.daysUntilDue <= 7">
                    Vence en {{ payment.daysUntilDue }} días
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ payment.clientName }}</div>
                  <div class="text-sm text-gray-500">{{ payment.clientEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.installmentNumber }}/{{ payment.totalInstallments }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    S/. {{ payment.amount | number:'1.0-0' }}
                  </div>
                  <div class="text-sm text-gray-500" *ngIf="payment.paidAmount && payment.paidAmount > 0">
                    Pagado: S/. {{ payment.paidAmount | number:'1.0-0' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getStatusClass(payment.status)" 
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ getStatusLabel(payment.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div [class]="getDaysClass(payment.daysUntilDue)" class="text-sm font-medium">
                    {{ payment.daysUntilDue >= 0 ? payment.daysUntilDue : Math.abs(payment.daysUntilDue) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button 
                      (click)="markAsPaid(payment.id)"
                      *ngIf="payment.status !== 'paid'"
                      class="text-green-600 hover:text-green-900">
                      Marcar Pagado
                    </button>
                    <button 
                      (click)="viewPaymentDetail(payment.id)"
                      class="text-blue-600 hover:text-blue-900">
                      Ver
                    </button>
                    <button 
                      (click)="sendReminder(payment.id)"
                      *ngIf="payment.status === 'pending' || payment.status === 'overdue'"
                      class="text-orange-600 hover:text-orange-900">
                      Recordatorio
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button 
              (click)="previousPage()"
              [disabled]="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Anterior
            </button>
            <button 
              (click)="nextPage()"
              [disabled]="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Siguiente
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Mostrando <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                a <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span>
                de <span class="font-medium">{{ totalItems }}</span> resultados
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button 
                  *ngFor="let page of getPageNumbers()" 
                  (click)="goToPage(page)"
                  [class]="page === currentPage ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                  {{ page }}
                </button>
                <button 
                  (click)="nextPage()"
                  [disabled]="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentScheduleComponent implements OnInit {
  filtersForm: FormGroup;
  paymentSchedules: PaymentSchedule[] = [];
  filteredPayments: PaymentSchedule[] = [];
  paginatedPayments: PaymentSchedule[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 0;
  
  // Search and sorting
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Summary data
  overdueSummary = { count: 0, amount: 0 };
  upcomingSummary = { count: 0, amount: 0 };
  currentSummary = { count: 0, amount: 0 };
  
  // Filter options
  clients: any[] = [];
  
  // Chart configurations
  statusChartType: ChartType = 'doughnut';
  statusChartData: ChartConfiguration['data'] = {
    labels: ['Pagado', 'Pendiente', 'Vencido', 'Parcial'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  };
  
  statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  timelineChartType: ChartType = 'bar';
  timelineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Pagos Programados',
      data: [],
      backgroundColor: '#3B82F6'
    }]
  };
  
  timelineChartOptions: ChartConfiguration['options'] = {
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
          callback: function(value) {
            return '$' + (Number(value) / 1000) + 'K';
          }
        }
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private paymentScheduleService: PaymentScheduleService,
    private exportService: ExportService
  ) {
    this.filtersForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      clientId: [''],
      status: [''],
      alertType: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPaymentSchedules();
  }

  private loadInitialData(): void {
    // Load clients for filters
    this.clients = [
      { id: 1, name: 'Juan Pérez', email: 'juan@email.com' },
      { id: 2, name: 'María García', email: 'maria@email.com' },
      { id: 3, name: 'Carlos López', email: 'carlos@email.com' }
    ];
  }

  private loadPaymentSchedules(): void {
    const filters = this.filtersForm.value as PaymentScheduleFilter;
    
    this.paymentScheduleService.getPaymentSchedules(filters).subscribe({
      next: (response) => {
        this.paymentSchedules = response.data;
        this.applySearchAndSort();
        this.updateSummaryData();
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading payment schedules:', error);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPaymentSchedules();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.currentPage = 1;
    this.loadPaymentSchedules();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applySearchAndSort();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applySearchAndSort();
  }

  private applySearchAndSort(): void {
    let filtered = [...this.paymentSchedules];

    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        (payment.clientName || '').toLowerCase().includes(term) ||
        (payment.clientEmail || '').toLowerCase().includes(term) ||
        payment.installmentNumber.toString().includes(term)
      );
    }

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[this.sortField];
        const bValue = (b as any)[this.sortField];
        
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredPayments = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPayments = this.filteredPayments.slice(startIndex, endIndex);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private updateSummaryData(): void {
    const today = new Date();
    
    this.overdueSummary = this.paymentSchedules
      .filter(p => p.daysUntilDue < 0)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });
    
    this.upcomingSummary = this.paymentSchedules
      .filter(p => p.daysUntilDue >= 0 && p.daysUntilDue <= 7)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });
    
    this.currentSummary = this.paymentSchedules
      .filter(p => p.status === 'paid')
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });
  }

  private updateCharts(): void {
    // Update status chart
    const statusCounts = this.paymentSchedules.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.statusChartData = {
      labels: ['Pagado', 'Pendiente', 'Vencido', 'Parcial'],
      datasets: [{
        data: [
          statusCounts['paid'] || 0,
          statusCounts['pending'] || 0,
          statusCounts['overdue'] || 0,
          statusCounts['partial'] || 0
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }]
    };
    
    // Update timeline chart (mock data for now)
    this.timelineChartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Pagos Programados',
        data: [120000, 150000, 180000, 140000, 160000, 190000],
        backgroundColor: '#3B82F6'
      }]
    };
  }

  getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      case 'partial':
        return 'Parcial';
      default:
        return 'Desconocido';
    }
  }

  getDaysClass(daysUntilDue: number): string {
    if (daysUntilDue < 0) {
      return 'text-red-600';
    } else if (daysUntilDue <= 7) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  }

  getRowClass(status: PaymentStatus, daysUntilDue: number): string {
    if (status === 'overdue' || daysUntilDue < 0) {
      return 'bg-red-50';
    } else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      return 'bg-yellow-50';
    }
    return '';
  }

  markAsPaid(paymentId: number): void {
    this.paymentScheduleService.updatePaymentStatus(paymentId, 'paid').subscribe({
      next: () => {
        this.loadPaymentSchedules();
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
      }
    });
  }

  viewPaymentDetail(paymentId: number): void {
    // Navigate to payment detail or open modal
    console.log('View payment detail:', paymentId);
  }

  sendReminder(paymentId: number): void {
    // Send payment reminder
    console.log('Send reminder for payment:', paymentId);
  }

  exportReport(format: ExportFormat): void {
    const filters = this.filtersForm.value as PaymentScheduleFilter;
    
    this.exportService.exportPaymentSchedule(
      this.filteredPayments, 
      format
    ).subscribe({
      next: (blob) => {
        console.log('Export received, downloading file...');
        this.exportService.downloadFile(blob, 'cronograma-pagos', format);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  // Utility property for template
  get Math() {
    return Math;
  }
}