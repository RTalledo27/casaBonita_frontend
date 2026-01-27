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
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Cortes de Ventas</h1>
            <p class="text-gray-600 mt-1">Gestión y seguimiento de cortes diarios</p>
          </div>
          <div class="flex gap-3">
            <button
              (click)="navigateToToday()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Corte de Hoy
            </button>
            <button
              (click)="openCalculateModal()"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Calcular Corte
            </button>
          </div>
        </div>
      </div>

      <!-- Monthly Stats Cards -->
      @if (monthlyStats()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Ventas del Mes</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ monthlyStats()!.total_sales }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ cutService.formatCurrency(monthlyStats()!.total_revenue) }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Pagos Recibidos</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ cutService.formatCurrency(monthlyStats()!.total_payments) }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ monthlyStats()!.cuts_count }} cortes</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Comisiones</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ cutService.formatCurrency(monthlyStats()!.total_commissions) }}</p>
                <p class="text-xs text-gray-500 mt-1">3% de ventas</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Promedio Diario</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ cutService.formatCurrency(monthlyStats()!.daily_average.revenue) }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ monthlyStats()!.daily_average.sales.toFixed(1) }} ventas/día</p>
              </div>
              <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              [(ngModel)]="filters.status"
              (change)="loadCuts()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option [value]="undefined">Todos</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
              <option value="reviewed">Revisado</option>
              <option value="exported">Exportado</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              [(ngModel)]="filters.type"
              (change)="loadCuts()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option [value]="undefined">Todos</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              [(ngModel)]="filters.start_date"
              (change)="loadCuts()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              [(ngModel)]="filters.end_date"
              (change)="loadCuts()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
        </div>
      </div>

      <!-- Cuts Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        } @else if (error()) {
          <div class="flex flex-col items-center justify-center py-20">
            <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-red-600 font-medium">{{ error() }}</p>
            <button (click)="loadCuts()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Reintentar
            </button>
          </div>
        } @else if (cuts().length === 0) {
          <div class="flex flex-col items-center justify-center py-20">
            <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-gray-600 font-medium">No hay cortes disponibles</p>
            <p class="text-gray-500 text-sm mt-1">Prueba ajustar los filtros o crear un nuevo corte</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ventas</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ingresos</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pagos</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Comisiones</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (cut of cuts(); track cut.cut_id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ formatDate(cut.cut_date) }}</div>
                      <div class="text-xs text-gray-500">{{ cut.created_at | date: 'short' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-900">{{ cutService.getTypeLabel(cut.cut_type) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold {{ cutService.getStatusClass(cut.status) }}">
                        {{ cutService.getStatusLabel(cut.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm font-semibold text-gray-900">{{ cut.total_sales_count }}</div>
                      <div class="text-xs text-gray-500">{{ cutService.formatCurrency(cut.total_revenue) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-semibold text-green-600">{{ cutService.formatCurrency(cut.total_down_payments) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm font-semibold text-gray-900">{{ cut.total_payments_count }}</div>
                      <div class="text-xs text-gray-500">{{ cutService.formatCurrency(cut.total_payments_received) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-semibold text-purple-600">{{ cutService.formatCurrency(cut.total_commissions) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="viewCutDetail(cut.cut_id)"
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        @if (cut.status === 'open') {
                          <button
                            (click)="closeCut(cut.cut_id)"
                            class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Cerrar corte">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando <span class="font-semibold">{{ (pagination()!.current_page - 1) * pagination()!.per_page + 1 }}</span>
                a <span class="font-semibold">{{ Math.min(pagination()!.current_page * pagination()!.per_page, pagination()!.total) }}</span>
                de <span class="font-semibold">{{ pagination()!.total }}</span> resultados
              </div>
              <div class="flex gap-2">
                <button
                  (click)="loadPage(pagination()!.current_page - 1)"
                  [disabled]="pagination()!.current_page === 1"
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Anterior
                </button>
                <button
                  (click)="loadPage(pagination()!.current_page + 1)"
                  [disabled]="pagination()!.current_page === pagination()!.last_page"
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Siguiente
                </button>
              </div>
            </div>
          }
        }
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
