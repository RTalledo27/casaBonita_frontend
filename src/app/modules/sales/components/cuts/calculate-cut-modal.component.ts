import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesCutService } from '../../services/sales-cut.service';
import { ToastService } from '../../../../core/services/toast.service';

type PeriodType = 'today' | 'week' | 'month' | 'custom';

interface CalculatedCut {
  period: {
    start: string;
    end: string;
    days: number;
  };
  total_sales_count: number;
  total_revenue: number;
  total_down_payments: number;
  total_payments_count: number;
  total_payments_received: number;
  paid_installments_count: number;
  total_commissions: number;
  cash_balance: number;
  bank_balance: number;
  summary_data: any;
  cut_type: string;
  is_preview: boolean;
}

@Component({
  selector: 'app-calculate-cut-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" (click)="close()"></div>

      <!-- Modal wrapper -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-4xl transform transition-all">

            <!-- ═══════════════ HEADER ═══════════════ -->
            <div class="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">Calcular Corte de Ventas</h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Selecciona un período para calcular</p>
                </div>
              </div>
              <button (click)="close()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- ═══════════════ BODY ═══════════════ -->
            <div class="p-6 space-y-5">

              <!-- Period Tabs -->
              <div class="bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-1.5 flex gap-1">
                <button *ngFor="let type of periodTypes"
                  (click)="selectPeriodType(type.value)"
                  class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
                  [ngClass]="selectedPeriod() === type.value
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'">
                  {{ type.label }}
                </button>
              </div>

              <!-- Date Selectors -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fecha Inicio</label>
                  <input type="date" [(ngModel)]="startDate" [disabled]="selectedPeriod() !== 'custom'"
                    class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fecha Fin</label>
                  <input type="date" [(ngModel)]="endDate" [disabled]="selectedPeriod() !== 'custom'"
                    class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button (click)="calculate()" [disabled]="isCalculating()"
                  class="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                  @if (isCalculating()) {
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Calculando...
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Calcular Preview
                  }
                </button>
                <button *ngIf="calculatedData()" (click)="save()" [disabled]="isSaving()"
                  class="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                  @if (isSaving()) {
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Guardando...
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                    </svg>
                    Guardar Corte
                  }
                </button>
              </div>

              <!-- ═══════════ Preview Results ═══════════ -->
              <div *ngIf="calculatedData()" class="bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </div>
                    Vista Previa
                  </h3>
                  <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                    {{ calculatedData()!.cut_type === 'daily' ? 'Diario' :
                       calculatedData()!.cut_type === 'weekly' ? 'Semanal' :
                       calculatedData()!.cut_type === 'monthly' ? 'Mensual' : 'Personalizado' }}
                  </span>
                </div>

                <!-- Period Info -->
                <div class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-3.5">
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    <span class="font-semibold text-gray-900 dark:text-white">Período:</span> {{ formatDate(calculatedData()!.period.start) }} — {{ formatDate(calculatedData()!.period.end) }}
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-[10px] font-semibold">{{ calculatedData()!.period.days }} días</span>
                  </p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                    <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ventas</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white">{{ calculatedData()!.total_sales_count }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ formatCurrency(calculatedData()!.total_revenue) }}</p>
                  </div>
                  <div class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                    <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pagos</p>
                    <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ calculatedData()!.total_payments_count }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ formatCurrency(calculatedData()!.total_payments_received) }}</p>
                  </div>
                  <div class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                    <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Comisiones</p>
                    <p class="text-xl font-bold text-violet-600 dark:text-violet-400">{{ formatCurrency(calculatedData()!.total_commissions) }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">3% de ventas</p>
                  </div>
                  <div class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                    <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Saldos</p>
                    <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(calculatedData()!.cash_balance) }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Banco: {{ formatCurrency(calculatedData()!.bank_balance) }}</p>
                  </div>
                </div>

                <!-- Top Sales -->
                <div *ngIf="calculatedData()!.summary_data?.top_sales?.length > 0" class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div class="p-1 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <svg class="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    Top 5 Ventas
                  </h4>
                  <div class="space-y-1.5">
                    <div *ngFor="let sale of calculatedData()!.summary_data.top_sales.slice(0, 5)"
                         class="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 dark:bg-gray-700/20 rounded-lg">
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ sale.client_name || 'Cliente' }}</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400">Lote: {{ sale.lot_name || 'N/A' }}</p>
                      </div>
                      <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-3">{{ formatCurrency(sale.amount) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Sales by Advisor -->
                <div *ngIf="calculatedData()!.summary_data?.sales_by_advisor?.length > 0" class="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div class="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <svg class="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    Ventas por Asesor
                  </h4>
                  <div class="space-y-1.5">
                    <div *ngFor="let advisor of calculatedData()!.summary_data.sales_by_advisor"
                         class="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 dark:bg-gray-700/20 rounded-lg">
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ advisor.advisor_name }}</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ advisor.sales_count }} ventas</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(advisor.total_amount) }}</p>
                        <p class="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Com: {{ formatCurrency(advisor.commission) }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas (opcional)</label>
                  <textarea [(ngModel)]="notes" rows="3" placeholder="Agrega notas sobre este corte..."
                    class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"></textarea>
                </div>
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage()" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ errorMessage() }}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CalculateCutModalComponent {
  cutService = inject(SalesCutService);
  private toast = inject(ToastService);
  
  @Output() closed = new EventEmitter<void>();
  @Output() cutSaved = new EventEmitter<void>();

  isOpen = signal(false);
  selectedPeriod = signal<PeriodType>('today');
  startDate = this.getTodayString();
  endDate = this.getTodayString();
  notes = '';

  isCalculating = signal(false);
  isSaving = signal(false);
  calculatedData = signal<CalculatedCut | null>(null);
  errorMessage = signal<string | null>(null);

  periodTypes = [
    { value: 'today' as PeriodType, label: 'Hoy' },
    { value: 'week' as PeriodType, label: 'Semana' },
    { value: 'month' as PeriodType, label: 'Mes' },
    { value: 'custom' as PeriodType, label: 'Personalizado' }
  ];

  open() {
    this.isOpen.set(true);
    this.reset();
    this.selectPeriodType('today');
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  reset() {
    this.calculatedData.set(null);
    this.errorMessage.set(null);
    this.notes = '';
    this.startDate = this.getTodayString();
    this.endDate = this.getTodayString();
  }

  selectPeriodType(type: PeriodType) {
    this.selectedPeriod.set(type);
    this.calculatedData.set(null);
    this.errorMessage.set(null);

    const today = new Date();
    
    switch(type) {
      case 'today':
        this.startDate = this.getTodayString();
        this.endDate = this.getTodayString();
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Domingo
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sábado
        this.startDate = this.formatDateString(weekStart);
        this.endDate = this.formatDateString(weekEnd);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.startDate = this.formatDateString(monthStart);
        this.endDate = this.formatDateString(monthEnd);
        break;
      case 'custom':
        // Usuario selecciona manualmente
        break;
    }
  }

  calculate() {
    this.isCalculating.set(true);
    this.errorMessage.set(null);

    this.cutService.calculateCut(this.startDate, this.endDate, true).subscribe({
      next: (response) => {
        if (response.success) {
          this.calculatedData.set(response.data);
        } else {
          this.errorMessage.set(response.message || 'Error al calcular corte');
        }
        this.isCalculating.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al calcular corte. Verifica las fechas e intenta nuevamente.');
        this.isCalculating.set(false);
        console.error('Error calculating cut:', err);
      }
    });
  }

  save() {
    if (!this.calculatedData()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.cutService.storeCut(this.startDate, this.endDate, this.notes || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success('Corte generado y guardado exitosamente', 4000);
          this.cutSaved.emit();
          this.close();
        } else {
          this.errorMessage.set(response.message || 'Error al guardar corte');
          this.toast.error(response.message || 'Error al guardar corte');
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage.set('Ya existe un corte para esta fecha. Usa la opción de recalcular en su lugar.');
          this.toast.error('Ya existe un corte para esta fecha');
        } else {
          this.errorMessage.set('Error al guardar corte. Intenta nuevamente.');
          this.toast.error('Error al guardar corte. Intenta nuevamente.');
        }
        this.isSaving.set(false);
        console.error('Error saving cut:', err);
      }
    });
  }

  getPeriodTabClass(type: PeriodType): string {
    const base = 'px-4 py-2 font-medium transition-colors border-b-2';
    return this.selectedPeriod() === type
      ? base + ' border-blue-600 text-blue-600'
      : base + ' border-transparent text-gray-500 hover:text-gray-700';
  }

  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatCurrency(amount: number): string {
    return 'S/ ' + amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
