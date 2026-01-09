import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SalesCutService } from '../../services/sales-cut.service';
import { SalesCut, SalesCutItem } from '../../models/sales-cut.model';

@Component({
  selector: 'app-today-cut',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Corte de Hoy</h1>
            <p class="text-gray-600 mt-1">{{ currentDate() }}</p>
          </div>
          <div class="flex gap-3">
            <button
              (click)="refreshCut()"
              [disabled]="isLoading()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
            @if (todayCut()) {
              <button
                (click)="exportToExcel()"
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Exportar Excel
              </button>
            }
            @if (todayCut() && todayCut()!.status === 'open') {
              <button
                (click)="closeCut()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Cerrar Corte
              </button>
            }
            <button
              (click)="goToDashboard()"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Volver
            </button>
          </div>
        </div>
      </div>

      @if (isLoading() && !todayCut()) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (error()) {
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-600 font-medium">{{ error() }}</p>
          <button (click)="loadTodayCut()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      } @else if (todayCut()) {
        <div class="space-y-6">
          <!-- Status Banner -->
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 {{ getStatusBorderClass() }}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 {{ getStatusBgClass() }} rounded-xl flex items-center justify-center">
                  <svg class="w-8 h-8 {{ getStatusTextClass() }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    @if (todayCut()!.status === 'open') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    } @else {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    }
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Estado: {{ cutService.getStatusLabel(todayCut()!.status) }}</h3>
                  <p class="text-gray-600">Corte {{ cutService.getTypeLabel(todayCut()!.cut_type) }}</p>
                </div>
              </div>
              @if (todayCut()!.closed_by_user) {
                <div class="text-right">
                  <p class="text-sm text-gray-600">Cerrado por</p>
                  <p class="font-semibold text-gray-900">{{ todayCut()!.closed_by_user?.first_name }} {{ todayCut()!.closed_by_user?.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ todayCut()!.closed_at | date: 'short' }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Sales -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-600 uppercase">Ventas del Día</h4>
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ todayCut()!.total_sales_count }}</p>
              <p class="text-sm text-gray-500 mt-2">{{ cutService.formatCurrency(todayCut()!.total_revenue) }}</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-600">Inicial: {{ cutService.formatCurrency(todayCut()!.total_down_payments) }}</p>
              </div>
            </div>

            <!-- Payments -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-600 uppercase">Pagos Recibidos</h4>
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ todayCut()!.total_payments_count }}</p>
              <p class="text-sm text-gray-500 mt-2">{{ cutService.formatCurrency(todayCut()!.total_payments_received) }}</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-600">{{ todayCut()!.paid_installments_count }} cuotas pagadas</p>
              </div>
            </div>

            <!-- Commissions -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-600 uppercase">Comisiones</h4>
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ cutService.formatCurrency(todayCut()!.total_commissions) }}</p>
              <p class="text-sm text-gray-500 mt-2">3% de ventas</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-600">Sobre {{ cutService.formatCurrency(todayCut()!.total_revenue) }}</p>
              </div>
            </div>

            <!-- Balance -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-600 uppercase">Balance Total</h4>
                <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ cutService.formatCurrency((todayCut()!.cash_balance ?? 0) + (todayCut()!.bank_balance ?? 0)) }}</p>
              <div class="mt-4 pt-4 border-t border-gray-100 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">Efectivo:</span>
                  <span class="font-semibold text-green-600">{{ cutService.formatCurrency(todayCut()!.cash_balance ?? 0) }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">Banco:</span>
                  <span class="font-semibold text-blue-600">{{ cutService.formatCurrency(todayCut()!.bank_balance ?? 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sales by Advisor & Top Sales -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Sales by Advisor -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-bold text-gray-900">Ventas por Asesor</h3>
              </div>
              @if (todayCut()!.summary_data?.sales_by_advisor && todayCut()!.summary_data!.sales_by_advisor.length > 0) {
                <div class="p-6 space-y-4">
                  @for (advisor of todayCut()!.summary_data!.sales_by_advisor; track advisor.advisor_name) {
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <p class="font-semibold text-gray-900">{{ advisor.advisor_name }}</p>
                        <p class="text-sm text-gray-600">{{ advisor.sales_count }} ventas</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-gray-900">{{ cutService.formatCurrency(advisor.total_amount) }}</p>
                        <p class="text-xs text-purple-600">Com: {{ cutService.formatCurrency(advisor.total_commission) }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p>Sin ventas registradas</p>
                </div>
              }
            </div>

            <!-- Top Sales -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-bold text-gray-900">Top 5 Ventas</h3>
              </div>
              @if (todayCut()!.summary_data?.top_sales && todayCut()!.summary_data!.top_sales.length > 0) {
                <div class="p-6 space-y-4">
                  @for (sale of todayCut()!.summary_data!.top_sales; track sale.contract_number; let i = $index) {
                    <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {{ i + 1 }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 truncate">{{ sale.client_name }}</p>
                        <p class="text-xs text-gray-600">{{ sale.contract_number }} • {{ sale.advisor_name }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-blue-600">{{ cutService.formatCurrency(sale.amount) }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <p>Sin ventas registradas</p>
                </div>
              }
            </div>
          </div>

          <!-- Payments by Method -->
          @if (todayCut()!.summary_data?.payments_by_method && todayCut()!.summary_data!.payments_by_method.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-bold text-gray-900">Pagos por Método</h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  @for (method of todayCut()!.summary_data!.payments_by_method; track method.method) {
                    <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">{{ cutService.getPaymentMethodLabel(method.method) }}</span>
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">{{ method.count }}</span>
                      </div>
                      <p class="text-2xl font-bold text-gray-900">{{ cutService.formatCurrency(method.total) }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class TodayCutComponent implements OnInit {
  private router = inject(Router);
  cutService = inject(SalesCutService);

  todayCut = signal<SalesCut | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadTodayCut();
    // Auto-refresh every 30 seconds
    setInterval(() => this.refreshCut(), 30000);
  }

  loadTodayCut() {
    this.isLoading.set(true);
    this.error.set(null);

    this.cutService.getTodayCut().subscribe({
      next: (response) => {
        if (response.success) {
          this.todayCut.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el corte de hoy. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
        console.error('Error loading today cut:', err);
      }
    });
  }

  refreshCut() {
    if (!this.isLoading()) {
      this.loadTodayCut();
    }
  }

  closeCut() {
    if (!this.todayCut()) return;

    if (confirm('¿Estás seguro de cerrar el corte de hoy? Esta acción no se puede deshacer.')) {
      this.cutService.closeCut(this.todayCut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte cerrado exitosamente');
            this.loadTodayCut();
          }
        },
        error: (err) => {
          alert('❌ Error al cerrar el corte');
          console.error('Error closing cut:', err);
        }
      });
    }
  }

  goToDashboard() {
    this.router.navigate(['/sales/cuts']);
  }

  currentDate(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBorderClass(): string {
    if (!this.todayCut()) return 'border-gray-300';
    const classes: Record<string, string> = {
      'open': 'border-blue-500',
      'closed': 'border-green-500',
      'reviewed': 'border-purple-500',
      'exported': 'border-yellow-500'
    };
    return classes[this.todayCut()!.status] || 'border-gray-300';
  }

  getStatusBgClass(): string {
    if (!this.todayCut()) return 'bg-gray-100';
    const classes: Record<string, string> = {
      'open': 'bg-blue-100',
      'closed': 'bg-green-100',
      'reviewed': 'bg-purple-100',
      'exported': 'bg-yellow-100'
    };
    return classes[this.todayCut()!.status] || 'bg-gray-100';
  }

  getStatusTextClass(): string {
    if (!this.todayCut()) return 'text-gray-600';
    const classes: Record<string, string> = {
      'open': 'text-blue-600',
      'closed': 'text-green-600',
      'reviewed': 'text-purple-600',
      'exported': 'text-yellow-600'
    };
    return classes[this.todayCut()!.status] || 'text-gray-600';
  }

  exportToExcel(): void {
    if (this.todayCut()) {
      this.cutService.exportToExcel(this.todayCut()!.cut_id);
    }
  }
}
