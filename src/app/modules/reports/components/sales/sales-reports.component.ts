import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SalesReportService, ExportService } from '../../services';
import { SalesReport, SalesReportFilter, ExportFormat } from '../../models';
import { EmployeeService } from '../../../humanResources/services/employee.service';
import { TeamService } from '../../../humanResources/services/team.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BaseChartDirective],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Reportes de Ventas</h1>
            <p class="text-gray-600">Análisis detallado de ventas por asesor, oficina y período</p>
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

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Asesor</label>
              <select 
                formControlName="advisorId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los asesores</option>
                <option *ngFor="let advisor of advisors" [value]="advisor.id">{{ advisor.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Oficina</label>
              <select 
                formControlName="officeId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas las oficinas</option>
                <option *ngFor="let office of offices" [value]="office.id">{{ office.name }}</option>
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
        <!-- Sales by Advisor Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Ventas por Asesor</h3>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="advisorChartData"
              [options]="advisorChartOptions"
              [type]="advisorChartType">
            </canvas>
          </div>
        </div>

        <!-- Sales Trend Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas</h3>
          <div class="h-64">
            <canvas 
              baseChart
              [data]="trendChartData"
              [options]="trendChartOptions"
              [type]="trendChartType">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Ventas</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalSales | number }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Valor Total</p>
              <p class="text-2xl font-bold text-gray-900">S/. {{ totalAmount | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p class="text-2xl font-bold text-gray-900">S/. {{ averageSale | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Mejor Asesor</p>
              <p class="text-lg font-bold text-gray-900">{{ topAdvisor?.name || 'N/A' }}</p>
              <p class="text-sm text-gray-600">{{ topAdvisor?.sales || 0 }} ventas</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Detalle de Ventas</h3>
            <div class="flex items-center space-x-2">
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Buscar cliente, asesor..."
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
                    (click)="sortBy('saleDate')">
                  Fecha
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oficina</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                    (click)="sortBy('totalAmount')">
                  Valor
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let sale of paginatedSales" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ sale.saleDate | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ sale.clientName }}</div>
                  <div class="text-sm text-gray-500">{{ sale.clientEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ sale.advisorName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ sale.officeName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  S/. {{ sale.totalAmount | number:'1.0-0' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getStatusClass(sale.status)" 
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ sale.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    (click)="viewSaleDetail(sale.id)"
                    class="text-blue-600 hover:text-blue-900 mr-3">
                    Ver
                  </button>
                  <button 
                    (click)="exportSingleSale(sale.id)"
                    class="text-green-600 hover:text-green-900">
                    Exportar
                  </button>
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
export class SalesReportsComponent implements OnInit {
  filtersForm: FormGroup;
  salesReports: SalesReport[] = [];
  filteredSales: SalesReport[] = [];
  paginatedSales: SalesReport[] = [];
  
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
  totalSales = 0;
  totalAmount = 0;
  averageSale = 0;
  topAdvisor: any = null;
  
  // Filter options
  advisors: any[] = [];
  offices: any[] = [];
  
  // Chart configurations
  advisorChartType: ChartType = 'doughnut';
  advisorChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
      ]
    }]
  };
  
  advisorChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  trendChartType: ChartType = 'line';
  trendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Ventas',
      data: [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };
  
  trendChartOptions: ChartConfiguration['options'] = {
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

  constructor(
    private fb: FormBuilder,
    private salesReportService: SalesReportService,
    private exportService: ExportService,
    private employeeService: EmployeeService,
    private teamService: TeamService
  ) {
    this.filtersForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      advisorId: [''],
      officeId: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadSalesReports();
  }

  private loadInitialData(): void {
    console.log(' Loading advisors and teams from backend...');
    
    // Load advisors and teams in parallel
    forkJoin({
      employees: this.employeeService.getAllEmployees(),
      teams: this.teamService.getTeams()
    }).subscribe({
      next: (result) => {
        // Map employees to advisors
        if (result.employees?.success && result.employees.data) {
          this.advisors = result.employees.data
            .filter(emp => emp.user) // Only employees with user data
            .map(emp => ({
              id: emp.employee_id,
              name: `${emp.user!.first_name || ''} ${emp.user!.last_name || ''}`.trim()
            }))
            .filter(advisor => advisor.name.length > 0); // Remove empty names
          console.log(' Loaded advisors:', this.advisors.length);
        }
        
        // Map teams to offices
        if (result.teams?.success && result.teams.data) {
          this.offices = result.teams.data.map(team => ({
            id: team.team_id,
            name: team.team_name
          }));
          console.log(' Loaded teams/offices:', this.offices.length);
        }
      },
      error: (error) => {
        console.error(' Error loading filters data:', error);
        // Fallback to empty arrays
        this.advisors = [];
        this.offices = [];
      }
    });
  }

  private loadSalesReports(): void {
    const filters = this.filtersForm.value as SalesReportFilter;
    
    // Set default date range to capture all 2024-2025 data
    if (!filters.startDate) {
      filters.startDate = '2024-01-01';
    }
    if (!filters.endDate) {
      filters.endDate = '2025-12-31';
    }
    
    console.log(' Loading sales reports with filters:', filters);
    
    // Use the new getAllSales endpoint to get ALL individual sales
    this.salesReportService.getAllSales(filters).subscribe({
      next: (response) => {
        console.log(' Sales reports data received:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          // Map backend response to frontend format
          this.salesReports = this.mapAllSalesToReports(response.data);
          console.log(` Mapped ${this.salesReports.length} sales reports`);
          this.applySearchAndSort();
          this.updateSummaryData();
          this.updateCharts();
        } else {
          console.warn('⚠️ No sales data received from backend');
          this.salesReports = [];
          this.applySearchAndSort();
          this.updateSummaryData();
          this.updateCharts();
        }
      },
      error: (error) => {
        console.error(' Error loading sales reports:', error);
        // Fallback to empty array instead of mock data
        this.salesReports = [];
        this.applySearchAndSort();
        this.updateSummaryData();
        this.updateCharts();
      }
    });
  }

  private mapAllSalesToReports(sales: any[]): SalesReport[] {
    console.log('📊 Mapping all sales to reports:', sales.length);
    
    return sales.map((sale: any, index: number) => {
      const totalAmount = parseFloat(sale.total_price || 0);
      const downPayment = parseFloat(sale.down_payment || 0);
      const financingAmount = parseFloat(sale.financing_amount || 0);
      const termMonths = parseInt(sale.term_months || 60);
      const monthlyPayment = parseFloat(sale.monthly_payment || 0);
      
      console.log(`Sale ${index + 1}:`, {
        contract_id: sale.contract_id,
        date: sale.sign_date,
        advisor: sale.advisor_name,
        amount: totalAmount,
        downPayment: downPayment,
        financing: financingAmount
      });
      
      return {
        id: sale.contract_id || index + 1,
        saleNumber: sale.contract_number || `CB-${String(index + 1).padStart(6, '0')}`,
        date: sale.sign_date || new Date().toISOString().split('T')[0],
        saleDate: sale.sign_date || new Date().toISOString().split('T')[0],
        advisor: {
          id: sale.employee_id || 0,
          name: sale.advisor_name || 'N/A',
          office: 'Oficina Principal'
        },
        advisorName: sale.advisor_name || 'N/A',
        officeName: 'Oficina Principal',
        client: {
          id: sale.client_id || 0,
          name: `Cliente ${sale.client_id || index + 1}`,
          email: `cliente${sale.client_id || index + 1}@example.com`,
          phone: '555-0000'
        },
        clientName: `Cliente ${sale.client_id || index + 1}`,
        projectName: 'Proyecto Casa Bonita',
        lotNumber: sale.lot_number || `L${String(index + 1).padStart(3, '0')}`,
        lot: {
          id: sale.lot_id || 0,
          number: sale.lot_number || `L${String(index + 1).padStart(3, '0')}`,
          manzana: sale.manzana_name || 'N/A',
          area: parseFloat(sale.lot_area || 0),
          price: parseFloat(sale.lot_price || totalAmount)
        },
        totalAmount: totalAmount,
        saleAmount: totalAmount,
        downPayment: downPayment,
        financedAmount: financingAmount,
        financingAmount: financingAmount,
        installments: termMonths,
        monthlyPayment: monthlyPayment,
        paymentMethod: financingAmount > 0 ? 'Financiamiento' : 'Contado',
        status: sale.status || 'vigente',
        contractNumber: sale.contract_number || `CON-${String(index + 1).padStart(6, '0')}`,
        createdAt: sale.created_at || sale.sign_date || new Date().toISOString(),
        updatedAt: sale.updated_at || sale.sign_date || new Date().toISOString()
      };
    });
  }

  private mapBackendDataToSalesReports(backendData: any): SalesReport[] {
    console.log('Mapping backend data:', backendData);
    
    // Map the backend dashboard data to sales report format
    const reports: SalesReport[] = [];
    
    // If we have top performers data, use it to create sales reports
    if (backendData.top_performers && backendData.top_performers.length > 0) {
      backendData.top_performers.forEach((performer: any, index: number) => {
        // Usar la fecha real del backend (latest_sale_date o first_sale_date)
        const saleDate = performer.latest_sale_date || performer.first_sale_date || new Date().toISOString().split('T')[0];
        
        // Ensure we convert to number and handle any string concatenation
        const totalAmount = parseFloat(performer.total_revenue || performer.sales || 0);
        
        console.log(`Performer ${index + 1}:`, {
          raw: performer,
          totalAmount: totalAmount,
          name: performer.employee_name || performer.name,
          saleDate: saleDate
        });
        
        reports.push({
          id: index + 1,
          saleNumber: `CB-2024-${String(index + 1).padStart(3, '0')}`,
          date: saleDate,
          saleDate: saleDate,
          advisor: {
            id: performer.employee_id || index + 1,
            name: performer.employee_name || performer.name || 'N/A',
            office: performer.office || 'Oficina Principal'
          },
          advisorName: performer.employee_name || performer.name || 'N/A',
          officeName: performer.office || 'Oficina Principal',
          client: {
            id: (index + 1) * 100,
            name: `Cliente ${index + 1}`,
            email: `cliente${index + 1}@example.com`,
            phone: '555-0000'
          },
          clientName: `Cliente ${index + 1}`,
          projectName: 'Proyecto Casa Bonita',
          lotNumber: `L${String(index + 1).padStart(3, '0')}`,
          lot: {
            id: (index + 1) * 200,
            number: `L${String(index + 1).padStart(3, '0')}`,
            manzana: 'A',
            area: 500,
            price: totalAmount
          },
          totalAmount: totalAmount,
          saleAmount: totalAmount,
          downPayment: totalAmount * 0.2,
          financedAmount: totalAmount * 0.8,
          financingAmount: totalAmount * 0.8,
          installments: 60,
          monthlyPayment: (totalAmount * 0.8) / 60,
          paymentMethod: 'Financiamiento',
          status: 'active',
          contractNumber: `CON-${String(index + 1).padStart(6, '0')}`,
          createdAt: saleDate,
          updatedAt: saleDate
        });
      });
    }
    
    // If no top performers, create a placeholder entry with summary data
    if (reports.length === 0 && backendData.summary) {
      const summary = backendData.summary;
      const totalRevenue = parseFloat(summary.total_revenue || 0);
      
      if (summary.total_sales > 0 || totalRevenue > 0) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        reports.push({
          id: 1,
          saleNumber: 'CB-CONSOLIDADO',
          date: currentDate,
          saleDate: currentDate,
          advisor: {
            id: 0,
            name: 'Varios Asesores',
            office: 'Todas las Oficinas'
          },
          advisorName: 'Varios Asesores',
          officeName: 'Todas las Oficinas',
          client: {
            id: 0,
            name: 'Datos Consolidados',
            email: 'consolidado@example.com',
            phone: '555-0000'
          },
          clientName: 'Datos Consolidados',
          projectName: 'Casa Bonita',
          lotNumber: 'CONSOLIDADO',
          lot: {
            id: 0,
            number: 'CONSOLIDADO',
            manzana: 'N/A',
            area: 0,
            price: totalRevenue
          },
          totalAmount: totalRevenue,
          saleAmount: totalRevenue,
          downPayment: totalRevenue * 0.2,
          financedAmount: totalRevenue * 0.8,
          financingAmount: totalRevenue * 0.8,
          installments: 0,
          monthlyPayment: 0,
          paymentMethod: 'Varios',
          status: 'completed',
          contractNumber: 'CONSOLIDADO',
          createdAt: currentDate,
          updatedAt: currentDate
        });
      }
    }
    
    console.log('Final mapped reports:', reports);
    return reports;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadSalesReports();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.currentPage = 1;
    this.loadSalesReports();
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
    let filtered = [...this.salesReports];

    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        (sale.clientName || '').toLowerCase().includes(term) ||
        (sale.advisorName || '').toLowerCase().includes(term) ||
        (sale.officeName || '').toLowerCase().includes(term)
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

    this.filteredSales = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedSales = this.filteredSales.slice(startIndex, endIndex);
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
    this.totalSales = this.salesReports.length;
    // Ensure we're working with numbers
    this.totalAmount = this.salesReports.reduce((sum, sale) => {
      const amount = parseFloat(String(sale.totalAmount)) || 0;
      return sum + amount;
    }, 0);
    this.averageSale = this.totalSales > 0 ? this.totalAmount / this.totalSales : 0;
    
    console.log('Summary updated:', {
      totalSales: this.totalSales,
      totalAmount: this.totalAmount,
      averageSale: this.averageSale
    });
    
    // Find top advisor
    const advisorSales = this.salesReports.reduce((acc, sale) => {
      const advisorName = sale.advisorName || 'Sin Asesor';
      acc[advisorName] = (acc[advisorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topAdvisorName = Object.keys(advisorSales).reduce((a, b) => 
      advisorSales[a] > advisorSales[b] ? a : b, '');
    
    this.topAdvisor = {
      name: topAdvisorName,
      sales: advisorSales[topAdvisorName] || 0
    };
  }

  private updateCharts(): void {
    // Update advisor chart
    const advisorData = this.salesReports.reduce((acc, sale) => {
      const advisorName = sale.advisorName || 'Sin Asesor';
      const amount = parseFloat(String(sale.totalAmount)) || 0;
      acc[advisorName] = (acc[advisorName] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Chart data:', advisorData);
    
    this.advisorChartData = {
      labels: Object.keys(advisorData),
      datasets: [{
        data: Object.values(advisorData),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
        ]
      }]
    };
    
    // Calculate REAL trend data from sales by month
    const trendData = this.salesReports.reduce((acc, sale) => {
      // Get year-month from sale date (YYYY-MM format)
      const date = sale.saleDate || sale.date;
      if (!date) return acc;
      
      const yearMonth = date.substring(0, 7); // Extract YYYY-MM
      acc[yearMonth] = (acc[yearMonth] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by date and format labels
    const sortedPeriods = Object.keys(trendData).sort();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const labels = sortedPeriods.map(period => {
      const [year, month] = period.split('-');
      return `${monthNames[parseInt(month) - 1]}`;
    });
    
    const salesCounts = sortedPeriods.map(period => trendData[period]);
    
    console.log('📈 Trend data calculated:', {
      periods: sortedPeriods,
      labels: labels,
      counts: salesCounts
    });
    
    // Update trend chart with REAL data
    this.trendChartData = {
      labels: labels,
      datasets: [{
        label: 'Ventas',
        data: salesCounts,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewSaleDetail(saleId: number): void {
    // Navigate to sale detail or open modal
    console.log('View sale detail:', saleId);
  }

  exportSingleSale(saleId: number): void {
    const sale = this.salesReports.find(s => s.id === saleId);
    if (sale) {
      this.exportService.exportSalesReport([sale], 'excel').subscribe({
        next: (response) => {
          console.log('Export initiated:', response);
        },
        error: (error) => {
          console.error('Export error:', error);
        }
      });
    }
  }

  exportReport(format: ExportFormat): void {
    const filters = this.filtersForm.value as SalesReportFilter;
    
    this.exportService.exportSalesReport(
      this.filteredSales, 
      format
    ).subscribe({
      next: (blob) => {
        console.log('Export received, downloading file...');
        this.exportService.downloadFile(blob, 'reporte-ventas', format);
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