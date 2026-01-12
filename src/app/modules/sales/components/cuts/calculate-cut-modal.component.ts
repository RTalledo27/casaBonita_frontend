import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesCutService } from '../../services/sales-cut.service';

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
    <div *ngIf="isOpen()" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="close()"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold text-white">Calcular Corte de Ventas</h2>
              <button (click)="close()" class="text-white hover:text-gray-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            
            <!-- Period Tabs -->
            <div class="flex gap-2 mb-6 border-b border-gray-200">
              <button
                *ngFor="let type of periodTypes"
                (click)="selectPeriodType(type.value)"
                [class]="getPeriodTabClass(type.value)"
                class="px-4 py-2 font-medium transition-colors">
                {{ type.label }}
              </button>
            </div>

            <!-- Date Selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  [(ngModel)]="startDate"
                  [disabled]="selectedPeriod() !== 'custom'"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  [(ngModel)]="endDate"
                  [disabled]="selectedPeriod() !== 'custom'"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mb-6">
              <button
                (click)="calculate()"
                [disabled]="isCalculating()"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                <span *ngIf="!isCalculating()">🔄 Calcular Preview</span>
                <span *ngIf="isCalculating()">Calculando...</span>
              </button>
              <button
                *ngIf="calculatedData()"
                (click)="save()"
                [disabled]="isSaving()"
                class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                <span *ngIf="!isSaving()">💾 Guardar Corte</span>
                <span *ngIf="isSaving()">Guardando...</span>
              </button>
            </div>

            <!-- Preview Results -->
            <div *ngIf="calculatedData()" class="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-900">Vista Previa del Corte</h3>
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {{ calculatedData()!.cut_type === 'daily' ? 'Diario' : 
                     calculatedData()!.cut_type === 'weekly' ? 'Semanal' :
                     calculatedData()!.cut_type === 'monthly' ? 'Mensual' : 'Personalizado' }}
                </span>
              </div>

              <!-- Period Info -->
              <div class="bg-white rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-600">
                  <strong>Período:</strong> {{ formatDate(calculatedData()!.period.start) }} - {{ formatDate(calculatedData()!.period.end) }}
                  ({{ calculatedData()!.period.days }} días)
                </p>
              </div>

              <!-- Stats Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-white rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Ventas</p>
                  <p class="text-2xl font-bold text-gray-900">{{ calculatedData()!.total_sales_count }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatCurrency(calculatedData()!.total_revenue) }}</p>
                </div>
                <div class="bg-white rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Pagos</p>
                  <p class="text-2xl font-bold text-gray-900">{{ calculatedData()!.total_payments_count }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatCurrency(calculatedData()!.total_payments_received) }}</p>
                </div>
                <div class="bg-white rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Comisiones</p>
                  <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(calculatedData()!.total_commissions) }}</p>
                  <p class="text-xs text-gray-500 mt-1">3% de ventas</p>
                </div>
                <div class="bg-white rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Saldos</p>
                  <p class="text-sm font-semibold text-gray-900">Efectivo: {{ formatCurrency(calculatedData()!.cash_balance) }}</p>
                  <p class="text-xs text-gray-500">Banco: {{ formatCurrency(calculatedData()!.bank_balance) }}</p>
                </div>
              </div>

              <!-- Top Sales -->
              <div *ngIf="calculatedData()!.summary_data?.top_sales?.length > 0" class="bg-white rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-gray-900 mb-3">🏆 Top 5 Ventas</h4>
                <div class="space-y-2">
                  <div *ngFor="let sale of calculatedData()!.summary_data.top_sales.slice(0, 5)" 
                       class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p class="font-medium text-gray-900">{{ sale.client_name || 'Cliente' }}</p>
                      <p class="text-sm text-gray-500">Lote: {{ sale.lot_name || 'N/A' }}</p>
                    </div>
                    <span class="font-bold text-green-600">{{ formatCurrency(sale.amount) }}</span>
                  </div>
                </div>
              </div>

              <!-- Sales by Advisor -->
              <div *ngIf="calculatedData()!.summary_data?.sales_by_advisor?.length > 0" class="bg-white rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3">👥 Ventas por Asesor</h4>
                <div class="space-y-2">
                  <div *ngFor="let advisor of calculatedData()!.summary_data.sales_by_advisor" 
                       class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p class="font-medium text-gray-900">{{ advisor.advisor_name }}</p>
                      <p class="text-sm text-gray-500">{{ advisor.sales_count }} ventas</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-gray-900">{{ formatCurrency(advisor.total_amount) }}</p>
                      <p class="text-xs text-purple-600">Comisión: {{ formatCurrency(advisor.commission) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                <textarea
                  [(ngModel)]="notes"
                  rows="3"
                  placeholder="Agrega notas sobre este corte..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">
                </textarea>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 text-sm">{{ errorMessage() }}</p>
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
          alert('✅ Corte guardado exitosamente');
          this.cutSaved.emit();
          this.close();
        } else {
          this.errorMessage.set(response.message || 'Error al guardar corte');
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage.set('Ya existe un corte para esta fecha. Usa la opción de recalcular en su lugar.');
        } else {
          this.errorMessage.set('Error al guardar corte. Intenta nuevamente.');
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
