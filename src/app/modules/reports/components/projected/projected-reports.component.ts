import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProjectedReportService, ExportService } from '../../services';
import {
  ProjectedReport,
  ProjectedReportFilter,
  ExportFormat
} from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-projected-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BaseChartDirective],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Reportes Proyectados</h1>
            <p class="text-gray-600">Análisis financiero y proyecciones de crecimiento</p>
          </div>
          <div class="flex space-x-3">
            <button 
              (click)="generateCustomProjection()"
              class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>Nueva Proyección</span>
            </button>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Proyección</label>
              <select 
                formControlName="projectionType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas las proyecciones</option>
                <option value="financial">Financiera</option>
                <option value="sales">Ventas</option>
                <option value="revenue">Ingresos</option>
                <option value="cashflow">Flujo de Caja</option>
                <option value="collection">Cobranza</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select 
                formControlName="period"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Año</label>
              <select 
                formControlName="year"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Escenario</label>
              <select 
                formControlName="scenario"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="optimistic">Optimista</option>
                <option value="realistic">Realista</option>
                <option value="pessimistic">Pesimista</option>
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
          </div>
        </form>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Ingresos Proyectados</p>
              <p class="text-2xl font-bold text-gray-900">S/. {{ projectedRevenue | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-green-600 font-medium">+15.2%</span>
            <span class="text-sm text-gray-500 ml-1">vs año anterior</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Ventas Proyectadas</p>
              <p class="text-2xl font-bold text-gray-900">{{ projectedSales | number }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-blue-600 font-medium">+8.7%</span>
            <span class="text-sm text-gray-500 ml-1">vs año anterior</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Flujo de Caja</p>
              <p class="text-2xl font-bold text-gray-900">S/. {{ projectedCashFlow | number:'1.0-0' }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-purple-600 font-medium">+12.3%</span>
            <span class="text-sm text-gray-500 ml-1">vs año anterior</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ROI Proyectado</p>
              <p class="text-2xl font-bold text-gray-900">{{ projectedROI | number:'1.1-1' }}%</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm text-yellow-600 font-medium">+2.1%</span>
            <span class="text-sm text-gray-500 ml-1">vs año anterior</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Revenue Projection Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Proyección de Ingresos</h3>
            <div class="flex space-x-2">
              <button 
                *ngFor="let scenario of scenarios"
                (click)="selectScenario(scenario.key)"
                [class]="selectedScenario === scenario.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 rounded text-sm hover:bg-blue-500 hover:text-white transition-colors">
                {{ scenario.label }}
              </button>
            </div>
          </div>
          <div class="h-80">
            <canvas 
              baseChart
              [data]="revenueProjectionChartData"
              [options]="revenueProjectionChartOptions"
              [type]="revenueProjectionChartType">
            </canvas>
          </div>
        </div>

        <!-- Sales Projection Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Proyección de Ventas</h3>
          <div class="h-80">
            <canvas 
              baseChart
              [data]="salesProjectionChartData"
              [options]="salesProjectionChartOptions"
              [type]="salesProjectionChartType">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Cash Flow Chart -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Flujo de Caja Proyectado</h3>
        <div class="h-96">
          <canvas 
            baseChart
            [data]="cashFlowChartData"
            [options]="cashFlowChartOptions"
            [type]="cashFlowChartType">
          </canvas>
        </div>
      </div>

      <!-- Projections Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Detalle de Proyecciones</h3>
            <div class="flex items-center space-x-2">
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Buscar proyección..."
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
                    (click)="sortBy('name')">
                  Proyección
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
                    (click)="sortBy('projectedValue')">
                  Valor Proyectado
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variación</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confianza</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let projection of paginatedProjections" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ projection.name }}</div>
                  <div class="text-sm text-gray-500">{{ projection.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getTypeClass(projection.type || '')"
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ getTypeLabel(projection.type || '') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ (projection.period && projection.period.type) || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  S/. {{ projection.projectedValue | number:'1.0-0' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div [class]="getVariationClass(projection.variation || 0)" class="text-sm font-medium">
                    {{ (projection.variation || 0) > 0 ? '+' : '' }}{{ (projection.variation || 0) | number:'1.1-1' }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        [style.width.%]="projection.confidence || 0"
                        [class]="getConfidenceClass(projection.confidence || 0)"
                        class="h-2 rounded-full">
                      </div>
                    </div>
                    <span class="text-sm text-gray-600">{{ projection.confidence || 0 }}%</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button 
                      (click)="viewProjectionDetail(projection.id)"
                      class="text-blue-600 hover:text-blue-900">
                      Ver
                    </button>
                    <button 
                      (click)="editProjection(projection.id)"
                      class="text-green-600 hover:text-green-900">
                      Editar
                    </button>
                    <button 
                      (click)="exportSingleProjection(projection.id)"
                      class="text-purple-600 hover:text-purple-900">
                      Exportar
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
export class ProjectedReportsComponent implements OnInit {
  filtersForm: FormGroup;
  projectedReports: ProjectedReport[] = [];
  filteredProjections: ProjectedReport[] = [];
  paginatedProjections: ProjectedReport[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 0;
  
  // Search and sorting
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Key metrics
  projectedRevenue = 2500000;
  projectedSales = 450;
  projectedCashFlow = 1800000;
  projectedROI = 18.5;
  
  // Scenario selection
  selectedScenario = 'realistic';
  scenarios = [
    { key: 'optimistic', label: 'Optimista' },
    { key: 'realistic', label: 'Realista' },
    { key: 'pessimistic', label: 'Pesimista' }
  ];
  
  // Chart configurations
  revenueProjectionChartType: ChartType = 'line';
  revenueProjectionChartData: ChartConfiguration['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        label: 'Cargando datos del backend...',
        data: [0],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };
  
  revenueProjectionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'S/. ' + context.parsed.y.toLocaleString('es-PE');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'S/. ' + (Number(value) / 1000) + 'K';
          }
        }
      }
    }
  };
  
  salesProjectionChartType: ChartType = 'bar';
  salesProjectionChartData: ChartConfiguration['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        label: 'Cargando datos del backend...',
        data: [0],
        backgroundColor: '#6B7280'
      }
    ]
  };
  
  salesProjectionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString('es-PE') + ' ventas';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  
  cashFlowChartType: ChartType = 'line';
  cashFlowChartData: ChartConfiguration['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        label: 'Cargando datos del backend...',
        data: [0],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  cashFlowChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'S/. ' + context.parsed.y.toLocaleString('es-PE');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'S/. ' + (Number(value) / 1000) + 'K';
          }
        }
      }
    }
  };

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
        this.projectedReports = reports;
        this.applySearchAndSort();
      },
      error: (error) => {
        console.error('Error loading projected reports:', error);
      }
    });
  }

  private loadMetrics(): void {
    const year = parseInt(this.filtersForm.value.year);
    const scenario = this.filtersForm.value.scenario;
    
    console.log('🔄 Loading metrics from backend...', { year, scenario });
    
    this.projectedReportService.getProjectionMetrics(year, scenario).subscribe({
      next: (metrics) => {
        console.log('✅ Metrics loaded FROM BACKEND:', metrics);
        // Update key metrics with real data
        this.projectedRevenue = metrics.projected_revenue || this.projectedRevenue;
        this.projectedSales = metrics.projected_sales || this.projectedSales;
        this.projectedCashFlow = metrics.projected_cash_flow || this.projectedCashFlow;
        this.projectedROI = metrics.projected_roi || this.projectedROI;
        console.log('💰 Updated metrics:', {
          revenue: this.projectedRevenue,
          sales: this.projectedSales,
          cashFlow: this.projectedCashFlow,
          roi: this.projectedROI
        });
      },
      error: (error) => {
        console.error('❌ ERROR loading metrics from backend:', error);
        console.error('Error details:', error.message, error.status);
      }
    });
  }

  private loadChartData(): void {
    const year = parseInt(this.filtersForm.value.year);
    
    // Load revenue chart
    this.projectedReportService.getRevenueProjectionChartData(year, 12).subscribe({
      next: (chartData) => {
        console.log('📈 Revenue chart data loaded:', chartData);
        if (chartData.labels && chartData.datasets) {
          this.revenueProjectionChartData = {
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({
              ...ds,
              tension: 0.4
            }))
          };
        }
      },
      error: (error) => {
        console.error('Error loading revenue chart:', error);
      }
    });

    // Load sales chart
    this.projectedReportService.getSalesProjectionChartData(year).subscribe({
      next: (chartData) => {
        console.log('📊 Sales chart data loaded:', chartData);
        if (chartData.labels && chartData.datasets) {
          this.salesProjectionChartData = {
            labels: chartData.labels,
            datasets: chartData.datasets
          };
        }
      },
      error: (error) => {
        console.error('Error loading sales chart:', error);
      }
    });

    // Load cash flow chart
    this.projectedReportService.getCashFlowChartData(year, 12).subscribe({
      next: (chartData) => {
        console.log('💰 Cash flow chart data loaded:', chartData);
        if (chartData.labels && chartData.datasets) {
          this.cashFlowChartData = {
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({
              ...ds,
              tension: 0.4,
              fill: ds.label === 'Flujo Neto' ? true : false
            }))
          };
        }
      },
      error: (error) => {
        console.error('Error loading cash flow chart:', error);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProjectedReports();
    this.loadMetrics();
    this.loadChartData();
  }

  clearFilters(): void {
    this.filtersForm.patchValue({
      projectionType: '',
      period: 'monthly',
      year: '2025',
      scenario: 'realistic'
    });
    this.currentPage = 1;
    this.loadProjectedReports();
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
    let filtered = [...this.projectedReports];

    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(projection => 
        (projection.name || '').toLowerCase().includes(term) ||
        (projection.description || '').toLowerCase().includes(term) ||
        (projection.type || '').toLowerCase().includes(term)
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

    this.filteredProjections = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProjections = this.filteredProjections.slice(startIndex, endIndex);
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

  selectScenario(scenario: string): void {
    this.selectedScenario = scenario;
    // Update charts based on selected scenario
  }

  getTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'sales':
        return 'bg-blue-100 text-blue-800';
      case 'revenue':
        return 'bg-purple-100 text-purple-800';
      case 'cashflow':
        return 'bg-yellow-100 text-yellow-800';
      case 'collection':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case 'financial':
        return 'Financiera';
      case 'sales':
        return 'Ventas';
      case 'revenue':
        return 'Ingresos';
      case 'cashflow':
        return 'Flujo de Caja';
      case 'collection':
        return 'Cobranza';
      default:
        return type;
    }
  }

  getVariationClass(variation: number): string {
    if (variation > 0) {
      return 'text-green-600';
    } else if (variation < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) {
      return 'bg-green-500';
    } else if (confidence >= 60) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  }

  generateCustomProjection(): void {
    // Open modal or navigate to custom projection form
    console.log('Generate custom projection');
  }

  viewProjectionDetail(projectionId: number): void {
    // Navigate to projection detail or open modal
    console.log('View projection detail:', projectionId);
  }

  editProjection(projectionId: number): void {
    // Navigate to edit projection or open modal
    console.log('Edit projection:', projectionId);
  }

  exportSingleProjection(projectionId: number): void {
    this.exportService.exportProjectedReport([projectionId], 'excel').subscribe({
      next: (response) => {
        console.log('Export initiated:', response);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  exportReport(format: ExportFormat): void {
    console.log('📥 Exportando reporte en formato:', format);
    
    const filters = {
      year: this.filtersForm.get('year')?.value || new Date().getFullYear(),
      scenario: this.filtersForm.get('scenario')?.value || 'realistic',
      months_ahead: 12
    };

    // Use projected report service for all formats (now returns blob)
    this.projectedReportService.exportProjections(filters, format).subscribe({
      next: (blob: Blob) => {
        console.log('✅ Exportación exitosa, descargando archivo...');
        
        if (blob && blob.size > 0) {
          // Create download link for blob
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte_proyectado_${format}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Descarga completada');
        } else {
          console.error('❌ Error: Blob vacío');
          alert('Error al exportar el reporte. Por favor intenta de nuevo.');
        }
      },
      error: (error) => {
        console.error('❌ Error al exportar:', error);
        alert('Error al exportar el reporte. Por favor intenta de nuevo.');
      }
    });
  }

  // Utility property for template
  get Math() {
    return Math;
  }
}