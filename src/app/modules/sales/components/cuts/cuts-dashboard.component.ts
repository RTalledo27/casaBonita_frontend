import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SalesCutService } from '../../services/sales-cut.service';
import { SalesCut, SalesCutFilters, MonthlyStats } from '../../models/sales-cut.model';
import { CalculateCutModalComponent } from './calculate-cut-modal.component';

@Component({
  selector: 'app-cuts-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CalculateCutModalComponent],
  template: `
    <div class="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">Cortes de Ventas</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">Gestión y seguimiento de cortes diarios</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="navigateToToday()"
              class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Corte de Hoy
            </button>
            <button (click)="openCalculateModal()"
              class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Calcular Corte
            </button>
          </div>
        </div>

        <!-- ═══════════════ KPI CARDS ═══════════════ -->
        @if (monthlyStats()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Mes</span>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ monthlyStats()!.total_sales }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ventas · {{ cutService.formatCurrency(monthlyStats()!.total_revenue) }}</p>
            </div>

            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ monthlyStats()!.cuts_count }} cortes</span>
              </div>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ cutService.formatCurrency(monthlyStats()!.total_payments) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pagos Recibidos</p>
            </div>

            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">3%</span>
              </div>
              <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ cutService.formatCurrency(monthlyStats()!.total_commissions) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Comisiones</p>
            </div>

            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Promedio</span>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ cutService.formatCurrency(monthlyStats()!.daily_average.revenue) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ monthlyStats()!.daily_average.sales.toFixed(1) }} ventas/día</p>
            </div>
          </div>
        }

        <!-- ═══════════════ FILTERS ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <div class="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
            </div>
            Filtros
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estado</label>
              <select [(ngModel)]="filters.status" (change)="loadCuts()"
                class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
                <option [value]="undefined">Todos</option>
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="reviewed">Revisado</option>
                <option value="exported">Exportado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
              <select [(ngModel)]="filters.type" (change)="loadCuts()"
                class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
                <option [value]="undefined">Todos</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha Inicio</label>
              <input type="date" [(ngModel)]="filters.start_date" (change)="loadCuts()"
                class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha Fin</label>
              <input type="date" [(ngModel)]="filters.end_date" (change)="loadCuts()"
                class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
            </div>
          </div>
        </div>

        <!-- ═══════════════ TABLE ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-20">
              <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 dark:border-blue-900 border-t-blue-600"></div>
            </div>
          } @else if (error()) {
            <div class="flex flex-col items-center justify-center py-20">
              <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl mb-4">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-red-600 dark:text-red-400">{{ error() }}</p>
              <button (click)="loadCuts()"
                class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 transition-all">
                Reintentar
              </button>
            </div>
          } @else if (cuts().length === 0) {
            <div class="flex flex-col items-center justify-center py-20">
              <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">No hay cortes disponibles</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Prueba ajustar los filtros o crear un nuevo corte</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200/50 dark:border-gray-700/50">
                    <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ventas</th>
                    <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingresos</th>
                    <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagos</th>
                    <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comisiones</th>
                    <th class="px-5 py-3.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  @for (cut of cuts(); track cut.cut_id) {
                    <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group">
                      <td class="px-5 py-3.5 whitespace-nowrap">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(cut.cut_date) }}</p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ cut.created_at | date: 'short' }}</p>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap">
                        <span class="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {{ cutService.getTypeLabel(cut.cut_type) }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap">
                        <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                          [ngClass]="{
                            'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40': cut.status === 'open',
                            'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40': cut.status === 'closed',
                            'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40': cut.status === 'reviewed',
                            'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40': cut.status === 'exported'
                          }">
                          {{ cutService.getStatusLabel(cut.status) }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-right">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">{{ cut.total_sales_count }}</p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ cutService.formatCurrency(cut.total_revenue) }}</p>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-right">
                        <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ cutService.formatCurrency(cut.total_down_payments) }}</span>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-right">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">{{ cut.total_payments_count }}</p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ cutService.formatCurrency(cut.total_payments_received) }}</p>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-right">
                        <span class="text-sm font-bold text-violet-600 dark:text-violet-400">{{ cutService.formatCurrency(cut.total_commissions) }}</span>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-center">
                        <div class="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button (click)="viewCutDetail(cut.cut_id)" title="Ver detalle"
                            class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                          @if (cut.status === 'open') {
                            <button (click)="closeCut(cut.cut_id)" title="Cerrar corte"
                              class="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                              </svg>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (pagination()) {
              <div class="px-5 py-3.5 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Mostrando <span class="font-semibold text-gray-700 dark:text-gray-300">{{ (pagination()!.current_page - 1) * pagination()!.per_page + 1 }}</span>
                  a <span class="font-semibold text-gray-700 dark:text-gray-300">{{ Math.min(pagination()!.current_page * pagination()!.per_page, pagination()!.total) }}</span>
                  de <span class="font-semibold text-gray-700 dark:text-gray-300">{{ pagination()!.total }}</span>
                </p>
                <div class="flex gap-1.5">
                  <button (click)="loadPage(pagination()!.current_page - 1)"
                    [disabled]="pagination()!.current_page === 1"
                    class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  <button (click)="loadPage(pagination()!.current_page + 1)"
                    [disabled]="pagination()!.current_page === pagination()!.last_page"
                    class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Calculate Cut Modal -->
    <app-calculate-cut-modal
      #calculateModal
      (closed)="onModalClosed()"
      (cutSaved)="onCutSaved()">
    </app-calculate-cut-modal>
  `,
  styles: []
})
export class CutsDashboardComponent implements OnInit {
  private router = inject(Router);
  cutService = inject(SalesCutService);

  @ViewChild('calculateModal') calculateModal!: CalculateCutModalComponent;

  cuts = signal<SalesCut[]>([]);
  monthlyStats = signal<MonthlyStats | null>(null);
  pagination = signal<any>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  filters: SalesCutFilters = {
    per_page: 15,
    status: undefined,
    type: undefined,
    start_date: undefined,
    end_date: undefined
  };

  Math = Math;

  ngOnInit() {
    this.loadCuts();
    this.loadMonthlyStats();
  }

  loadCuts() {
    this.isLoading.set(true);
    this.error.set(null);

    // Clean empty filters
    const cleanFilters: SalesCutFilters = {
      per_page: this.filters.per_page
    };
    
    if (this.filters.status) cleanFilters.status = this.filters.status as any;
    if (this.filters.type) cleanFilters.type = this.filters.type as any;
    if (this.filters.start_date) cleanFilters.start_date = this.filters.start_date;
    if (this.filters.end_date) cleanFilters.end_date = this.filters.end_date;

    this.cutService.getCuts(cleanFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuts.set(response.data.data);
          this.pagination.set({
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total,
            last_page: response.data.last_page
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los cortes. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
        console.error('Error loading cuts:', err);
      }
    });
  }

  loadMonthlyStats() {
    this.cutService.getMonthlyStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.monthlyStats.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading monthly stats:', err);
      }
    });
  }

  loadPage(page: number) {
    // Implementar si tienes paginación en la API
    this.loadCuts();
  }

  navigateToToday() {
    this.router.navigate(['/sales/cuts/today']);
  }

  viewCutDetail(cutId: number) {
    this.router.navigate(['/sales/cuts', cutId]);
  }

  createNewCut() {
    if (confirm('¿Deseas crear un nuevo corte para hoy?')) {
      this.isLoading.set(true);
      this.cutService.createDailyCut().subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte creado exitosamente');
            this.loadCuts();
            this.loadMonthlyStats();
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          alert('❌ Error al crear el corte');
          this.isLoading.set(false);
          console.error('Error creating cut:', err);
        }
      });
    }
  }

  closeCut(cutId: number) {
    if (confirm('¿Estás seguro de cerrar este corte? Esta acción no se puede deshacer.')) {
      this.cutService.closeCut(cutId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte cerrado exitosamente');
            this.loadCuts();
          }
        },
        error: (err) => {
          alert('❌ Error al cerrar el corte');
          console.error('Error closing cut:', err);
        }
      });
    }
  }

  openCalculateModal() {
    this.calculateModal.open();
  }

  onModalClosed() {
    // Modal cerrado sin guardar
  }

  onCutSaved() {
    // Corte guardado exitosamente, recargar lista
    this.loadCuts();
    this.loadMonthlyStats();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
