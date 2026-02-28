import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { PaymentScheduleService, ExportService } from '../../services';
import { PaymentSchedule, PaymentScheduleFilter } from '../../models';
import {
  LucideAngularModule, Search, Filter, Download, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, DollarSign, Users, Calendar,
  ArrowUpRight, ArrowDownRight, X, RefreshCw, FileSpreadsheet, Eye, Bell, CreditCard
} from 'lucide-angular';

// Define missing types
export type ExportFormat = 'excel' | 'pdf' | 'csv';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'pendiente' | 'pagado' | 'vencido' | 'parcial';

Chart.register(...registerables);

@Component({
  selector: 'app-payment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BaseChartDirective, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Cronogramas de Pago</h1>
          <p class="text-gray-500 dark:text-gray-400">Seguimiento de cuotas, pagos y morosidad por cliente</p>
        </div>
        <div class="flex items-center gap-3 mt-4 md:mt-0">
          <button (click)="loadPaymentSchedules()" class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <lucide-angular [img]="icons.RefreshCw" [size]="16"></lucide-angular>
            Actualizar
          </button>
          <div class="relative">
            <button (click)="showExportMenu = !showExportMenu"
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <lucide-angular [img]="icons.Download" [size]="16"></lucide-angular>
              Exportar
              <lucide-angular [img]="icons.ChevronDown" [size]="14"></lucide-angular>
            </button>
            @if (showExportMenu) {
            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <button (click)="exportReport('excel'); showExportMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2">
                <lucide-angular [img]="icons.FileSpreadsheet" [size]="16" class="text-green-600"></lucide-angular>
                Excel (.xlsx)
              </button>
              <button (click)="exportReport('pdf'); showExportMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <lucide-angular [img]="icons.Download" [size]="16" class="text-red-600"></lucide-angular>
                PDF
              </button>
              <button (click)="exportReport('csv'); showExportMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2">
                <lucide-angular [img]="icons.Download" [size]="16" class="text-blue-600"></lucide-angular>
                CSV
              </button>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Cuotas Vencidas -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Cuotas Vencidas</span>
            <div class="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <lucide-angular [img]="icons.AlertTriangle" [size]="18" class="text-red-600 dark:text-red-400"></lucide-angular>
            </div>
          </div>
          @if (isLoading) {
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ overdueSummary.count }}</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">S/. {{ overdueSummary.amount | number:'1.2-2' }}</p>
          }
        </div>

        <!-- Próximos 7 días -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Próximos 7 días</span>
            <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <lucide-angular [img]="icons.Clock" [size]="18" class="text-amber-600 dark:text-amber-400"></lucide-angular>
            </div>
          </div>
          @if (isLoading) {
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ upcomingSummary.count }}</p>
            <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">S/. {{ upcomingSummary.amount | number:'1.2-2' }}</p>
          }
        </div>

        <!-- Pagados -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pagado</span>
            <div class="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <lucide-angular [img]="icons.CheckCircle" [size]="18" class="text-green-600 dark:text-green-400"></lucide-angular>
            </div>
          </div>
          @if (isLoading) {
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ currentSummary.count }}</p>
            <p class="text-sm text-green-600 dark:text-green-400 mt-1">S/. {{ currentSummary.amount | number:'1.2-2' }}</p>
          }
        </div>

        <!-- Total de Cuotas -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Registros</span>
            <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <lucide-angular [img]="icons.CreditCard" [size]="18" class="text-blue-600 dark:text-blue-400"></lucide-angular>
            </div>
          </div>
          @if (isLoading) {
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalItems }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">cuotas en total</p>
          }
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Status Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Estado</h3>
          <div class="h-64">
            <canvas baseChart
              [data]="statusChartData"
              [type]="statusChartType"
              [options]="statusChartOptions">
            </canvas>
          </div>
        </div>

        <!-- Timeline Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pagos Programados por Mes</h3>
          <div class="h-64">
            <canvas baseChart
              [data]="timelineChartData"
              [type]="timelineChartType"
              [options]="timelineChartOptions">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div class="flex items-center justify-between mb-4 cursor-pointer" (click)="showFilters = !showFilters">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <lucide-angular [img]="icons.Filter" [size]="16"></lucide-angular>
            Filtros
          </h3>
          <lucide-angular [img]="showFilters ? icons.ChevronUp : icons.ChevronDown" [size]="18"
            class="text-gray-400"></lucide-angular>
        </div>
        @if (showFilters) {
        <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Inicio</label>
            <input type="date" formControlName="startDate"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Fin</label>
            <input type="date" formControlName="endDate"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cliente</label>
            <select formControlName="clientId"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="">Todos</option>
              @for (client of clients; track client.id) {
              <option [value]="client.id">{{ client.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
            <select formControlName="status"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="">Todos</option>
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
              <option value="partial">Parcial</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button (click)="applyFilters()"
              class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              Aplicar
            </button>
            <button (click)="clearFilters()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <lucide-angular [img]="icons.X" [size]="16"></lucide-angular>
            </button>
          </div>
        </form>
        }
      </div>

      <!-- Data Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Table Header with Search -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle de Cuotas
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({{ totalItems }} registros)</span>
          </h3>
          <div class="relative">
            <lucide-angular [img]="icons.Search" [size]="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-angular>
            <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
              placeholder="Buscar por cliente..."
              class="pl-10 pr-4 py-2 w-full sm:w-72 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th (click)="sortBy('clientName')" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center gap-1">
                    Cliente
                    @if (sortField === 'clientName') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th (click)="sortBy('installmentNumber')" class="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center justify-center gap-1">
                    Cuota
                    @if (sortField === 'installmentNumber') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th (click)="sortBy('dueDate')" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center gap-1">
                    Vencimiento
                    @if (sortField === 'dueDate') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th (click)="sortBy('amount')" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center justify-end gap-1">
                    Monto
                    @if (sortField === 'amount') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th (click)="sortBy('paidAmount')" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center justify-end gap-1">
                    Pagado
                    @if (sortField === 'paidAmount') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th (click)="sortBy('status')" class="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <div class="flex items-center justify-center gap-1">
                    Estado
                    @if (sortField === 'status') {
                    <lucide-angular [img]="sortDirection === 'asc' ? icons.ChevronUp : icons.ChevronDown" [size]="14"></lucide-angular>
                    }
                  </div>
                </th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Días
                </th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (isTableLoading) {
                @for (i of [1,2,3,4,5]; track i) {
                <tr class="animate-pulse">
                  <td class="px-6 py-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div><div><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div><div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></div></div></td>
                  <td class="px-6 py-4"><div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12 mx-auto"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div></td>
                  <td class="px-6 py-4"><div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div></td>
                  <td class="px-6 py-4"><div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div></td>
                </tr>
                }
              } @else {
              @for (payment of paginatedPayments; track payment.scheduleId || payment.id || $index) {
              <tr [class]="getRowClass(payment.status, payment.daysUntilDue ?? 0) + ' dark:hover:bg-gray-750 transition-colors'">
                <!-- Client -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {{ (payment.clientName || 'N/A').charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ payment.clientName || 'Sin nombre' }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ payment.clientEmail }}</p>
                    </div>
                  </div>
                </td>
                <!-- Installment -->
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {{ payment.installmentNumber || '-' }}
                    @if (payment.totalInstallments) {
                      / {{ payment.totalInstallments }}
                    }
                  </span>
                </td>
                <!-- Due Date -->
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ payment.dueDate | date:'dd/MM/yyyy' }}
                </td>
                <!-- Amount -->
                <td class="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  S/. {{ payment.amount | number:'1.2-2' }}
                </td>
                <!-- Paid Amount -->
                <td class="px-6 py-4 text-right">
                  @if (payment.paidAmount && payment.paidAmount > 0) {
                  <span class="text-sm font-medium text-green-600 dark:text-green-400">S/. {{ payment.paidAmount | number:'1.2-2' }}</span>
                  } @else {
                  <span class="text-sm text-gray-400">—</span>
                  }
                </td>
                <!-- Status -->
                <td class="px-6 py-4 text-center">
                  <span [class]="'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ' + getStatusClass(payment.status) + ' dark:bg-opacity-30'">
                    {{ getStatusLabel(payment.status) }}
                  </span>
                </td>
                <!-- Days Until Due -->
                <td class="px-6 py-4 text-center">
                  @if (payment.status === 'paid' || payment.status === 'pagado') {
                  <span class="text-sm text-gray-400">—</span>
                  } @else {
                  <span [class]="'text-sm font-medium ' + getDaysClass(payment.daysUntilDue ?? 0)">
                    @if ((payment.daysUntilDue ?? 0) < 0) {
                    <span class="flex items-center justify-center gap-1">
                      <lucide-angular [img]="icons.AlertTriangle" [size]="14"></lucide-angular>
                      {{ Math.abs(payment.daysUntilDue ?? 0) }}d vencido
                    </span>
                    } @else if ((payment.daysUntilDue ?? 0) === 0) {
                    Hoy
                    } @else {
                    {{ payment.daysUntilDue ?? 0 }}d
                    }
                  </span>
                  }
                </td>
                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-1">
                    @if (payment.status !== 'paid' && payment.status !== 'pagado') {
                    <button (click)="markAsPaid(payment.scheduleId || payment.id || 0)" title="Marcar como pagado"
                      class="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                      <lucide-angular [img]="icons.CheckCircle" [size]="16"></lucide-angular>
                    </button>
                    }
                    @if (payment.status === 'overdue' || payment.status === 'vencido' || (payment.daysUntilDue ?? 0) < 0) {
                    <button (click)="sendReminder(payment.scheduleId || payment.id || 0)" title="Enviar recordatorio"
                      class="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                      <lucide-angular [img]="icons.Bell" [size]="16"></lucide-angular>
                    </button>
                    }
                    <button (click)="viewPaymentDetail(payment.scheduleId || payment.id || 0)" title="Ver detalle"
                      class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <lucide-angular [img]="icons.Eye" [size]="16"></lucide-angular>
                    </button>
                  </div>
                </td>
              </tr>
              } @empty {
              <tr>
                <td colspan="8" class="px-6 py-16 text-center">
                  <lucide-angular [img]="icons.CreditCard" [size]="48" class="mx-auto text-gray-300 dark:text-gray-600 mb-4"></lucide-angular>
                  <p class="text-lg font-medium text-gray-900 dark:text-white">No se encontraron cuotas</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Intenta ajustar los filtros o el término de búsqueda.</p>
                </td>
              </tr>
              }
              }
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Mostrando</span>
            <select [(ngModel)]="pageSize" (change)="onPageSizeChange()"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span>de {{ totalItems }} registros</span>
          </div>
          <div class="flex items-center gap-1">
            <button (click)="previousPage()" [disabled]="currentPage === 1"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300">
              Anterior
            </button>
            @for (page of getPageNumbers(); track page) {
            <button (click)="goToPage(page)"
              [ngClass]="{
                'bg-blue-600 text-white font-medium shadow-sm border border-blue-600': page == currentPage,
                'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': page != currentPage
              }"
              class="px-3 py-1.5 text-sm rounded-md transition-colors">
              {{ page }}
            </button>
            }
            <button (click)="nextPage()" [disabled]="currentPage === totalPages"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300">
              Siguiente
            </button>
          </div>
        </div>
        }
      </div>
    </div>
  `
})
export class PaymentScheduleComponent implements OnInit {
  readonly icons = {
    Search, Filter, Download, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle, Clock, DollarSign, Users, Calendar, ArrowUpRight,
    ArrowDownRight, X, RefreshCw, FileSpreadsheet, Eye, Bell, CreditCard
  };

  filtersForm: FormGroup;
  paymentSchedules: PaymentSchedule[] = [];
  filteredPayments: PaymentSchedule[] = [];
  paginatedPayments: PaymentSchedule[] = [];

  // UI state
  isLoading = true;
  isTableLoading = true;
  showFilters = false;
  showExportMenu = false;

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
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true
        }
      }
    }
  };

  timelineChartType: ChartType = 'bar';
  timelineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Pagos Programados',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.75)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
      borderRadius: 4
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
          callback: function (value) {
            return 'S/. ' + (Number(value) / 1000).toFixed(0) + 'K';
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
    this.loadAllData();
  }

  private loadInitialData(): void {
    // Load clients for filters
    this.clients = [
      { id: 1, name: 'Juan Pérez', email: 'juan@email.com' },
      { id: 2, name: 'María García', email: 'maria@email.com' },
      { id: 3, name: 'Carlos López', email: 'carlos@email.com' }
    ];
  }

  loadAllData(): void {
    this.currentPage = 1;
    this.loadOverview();
    this.loadPaymentSchedules();
  }

  loadOverview(): void {
    this.isLoading = true;
    const filters = {
      ...this.filtersForm.value
    } as PaymentScheduleFilter;

    // Load overall summary directly so KPIs reflect total DB data
    this.paymentScheduleService.getOverview(filters).subscribe({
      next: (response: any) => {
        const rs = response?.data || response;
        if (rs) {
          // Status breakdown is an array: [{status: 'pagado', count: 10, total_amount: 500}, ...]
          const breakdown = rs.status_breakdown || [];
          const getStatusData = (status: string) => breakdown.find((item: any) => item.status === status) || { count: 0, total_amount: 0 };

          const overdueData = rs.overdue_summary || {};
          const paidData = getStatusData('pagado');
          const pendingData = getStatusData('pendiente');

          this.overdueSummary = {
            count: overdueData.total_overdue || 0,
            amount: overdueData.total_overdue_amount || 0
          };
          this.upcomingSummary = {
            count: pendingData.count || 0,
            amount: pendingData.total_amount || 0
          };
          this.currentSummary = {
            count: paidData.count || 0,
            amount: paidData.total_amount || 0
          };

          if (rs.summary && rs.summary.total_payments) {
            this.totalItems = rs.summary.total_payments;
          }
        }
        this.updateCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading overview:', error);
        this.isLoading = false;
      }
    });
  }

  loadPaymentSchedules(): void {
    this.isTableLoading = true;
    const filters = {
      ...this.filtersForm.value,
      page: this.currentPage,
      limit: this.pageSize
    } as PaymentScheduleFilter;

    this.paymentScheduleService.getPaymentSchedules(filters).subscribe({
      next: (response: any) => {
        const responseData = response?.data || response;
        const rawItems = responseData?.data || responseData || [];

        this.paymentSchedules = (Array.isArray(rawItems) ? rawItems : []).map((item: any) => ({
          scheduleId: item.schedule_id || item.scheduleId || 0,
          contractId: item.contract_id || item.contractId || 0,
          clientName: item.client_name || item.clientName || '',
          clientEmail: item.client_email || item.clientEmail || '',
          clientPhone: item.client_phone || item.clientPhone || '',
          lotNumber: item.lot_number || item.num_lot || item.lotNumber || '',
          installmentNumber: item.installment_number || item.installmentNumber || 0,
          amount: parseFloat(item.amount) || 0,
          dueDate: item.due_date || item.dueDate || '',
          paidDate: item.paid_date || item.paidDate || null,
          status: item.status || 'pendiente',
          saleAmount: parseFloat(item.sale_amount || item.saleAmount) || 0,
          daysUntilDue: item.days_until_due || item.daysUntilDue || this.calculateDaysUntilDue(item.due_date || item.dueDate),
          daysOverdue: item.days_overdue || item.daysOverdue || 0,
          totalInstallments: item.total_installments || item.totalInstallments || 0 // Added totalInstallments mapping
        }));

        if (responseData.total) {
          this.totalItems = responseData.total;
        }
        this.totalPages = responseData.last_page || Math.ceil(this.totalItems / this.pageSize);
        this.currentPage = responseData.current_page || this.currentPage;

        this.applySearchAndSort();
        this.isTableLoading = false;
      },
      error: (error) => {
        console.error('Error loading payment schedules:', error);
        this.paymentSchedules = [];
        this.isTableLoading = false;
      }
    });
  }

  private calculateDaysUntilDue(dueDate: string): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  applyFilters(): void {
    this.loadAllData();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.loadAllData();
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
        (payment.installmentNumber || 0).toString().includes(term)
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
    this.paginatedPayments = filtered; // Uses server-side pagination, so we render the array directly
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadPaymentSchedules();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPaymentSchedules();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPaymentSchedules();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPaymentSchedules();
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
    this.overdueSummary = this.paymentSchedules
      .filter(p => p.status === 'vencido' || (p as any).daysUntilDue < 0)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });

    this.upcomingSummary = this.paymentSchedules
      .filter(p => (p.status === 'pendiente') && (p as any).daysUntilDue >= 0 && (p as any).daysUntilDue <= 7)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });

    this.currentSummary = this.paymentSchedules
      .filter(p => p.status === 'pagado')
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
          statusCounts['pagado'] || 0,
          statusCounts['pendiente'] || 0,
          statusCounts['vencido'] || 0,
          statusCounts['parcial'] || 0
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
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }

  getStatusClass(status: PaymentStatus | string): string {
    switch (status) {
      case 'paid':
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'overdue':
      case 'vencido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'partial':
      case 'parcial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status: PaymentStatus | string): string {
    switch (status) {
      case 'paid':
      case 'pagado':
        return 'Pagado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'overdue':
      case 'vencido':
        return 'Vencido';
      case 'partial':
      case 'parcial':
        return 'Parcial';
      default:
        return 'Desconocido';
    }
  }

  getDaysClass(daysUntilDue: number): string {
    if (daysUntilDue < 0) {
      return 'text-red-600 dark:text-red-400';
    } else if (daysUntilDue <= 7) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  }

  getRowClass(status: PaymentStatus | string, daysUntilDue: number): string {
    if (status === 'overdue' || daysUntilDue < 0) {
      return 'bg-red-50 dark:bg-red-900/10';
    } else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      return 'bg-yellow-50 dark:bg-yellow-900/10';
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
  }

  sendReminder(paymentId: number): void {
    // Send payment reminder
  }

  exportReport(format: ExportFormat): void {
    const token = localStorage.getItem('token');
    const filters = { ...this.filtersForm.value };

    const exportData: any = {
      format: format,
      type: 'payment_schedules'
    };

    // Add non-empty form filters
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        exportData[key] = value;
      }
    });

    // Add table search term if present
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      exportData.searchTerm = this.searchTerm.trim();
    }

    // Add current sorting if present
    if (this.sortField) {
      exportData.sortField = this.sortField;
      exportData.sortDirection = this.sortDirection;
    }

    // Step 1: POST to generate the file — returns JSON with file_name
    fetch(`http://localhost:8000/api/v1/reports/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(exportData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.file_name) {
          // Step 2: Trigger silent download in the same tab — browser intercepts Content-Disposition: attachment
          window.location.href = `http://localhost:8000/api/v1/reports/download-export/${data.file_name}?token=${token}`;
        } else {
          console.error('Export generation failed:', data.message);
        }
      })
      .catch(error => {
        console.error('Export error:', error);
      });
  }

  // Utility property for template
  get Math() {
    return Math;
  }
}