import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, DollarSign, X, Percent, Calendar, Plus, CheckCircle } from 'lucide-angular';
import { Commission, CreateSplitPaymentRequest, SplitPaymentSummary } from '../../models/commission';
import { CommissionService } from '../../services/commission.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-commission-split-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <lucide-angular [img]="DollarSign" class="w-5 h-5 text-blue-600"></lucide-angular>
          Gestión de Pagos Divididos
        </h3>
        <button 
          (click)="closeModal.emit()"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <lucide-angular [img]="X" class="w-5 h-5"></lucide-angular>
        </button>
      </div>

      <!-- Información de la comisión -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="font-medium text-gray-900 mb-2">Información de la Comisión</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Monto Total:</span>
            <span class="font-medium ml-2">{{ commission.commission_amount | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div>
            <span class="text-gray-600">Estado:</span>
            <span class="ml-2" [ngClass]="getStatusClass(commission.status || commission.payment_status)">{{ getStatusText(commission.status || commission.payment_status) }}</span>
          </div>
          <div>
            <span class="text-gray-600">Período Generación:</span>
            <span class="font-medium ml-2">{{ commission.commission_period || (commission.period_month + '/' + commission.period_year) }}</span>
          </div>
          <div>
            <span class="text-gray-600">Empleado:</span>
            <span class="font-medium ml-2">{{ commission.employee && commission.employee.user ? commission.employee.user.name : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Resumen de pagos existentes -->
      <div *ngIf="splitSummary()" class="mb-6">
        <h4 class="font-medium text-gray-900 mb-3">Resumen de Pagos</h4>
        <div class="bg-blue-50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Pagado:</span>
              <div class="font-medium text-green-600">{{ splitSummary()?.total_paid_amount | currency:'USD':'symbol':'1.2-2' }}</div>
              <div class="text-xs text-gray-500">{{ splitSummary()?.total_paid_percentage }}%</div>
            </div>
            <div>
              <span class="text-gray-600">Pendiente:</span>
              <div class="font-medium text-orange-600">{{ splitSummary()?.remaining_amount | currency:'USD':'symbol':'1.2-2' }}</div>
              <div class="text-xs text-gray-500">{{ splitSummary()?.remaining_percentage }}%</div>
            </div>
            <div>
              <span class="text-gray-600">Pagos:</span>
              <div class="font-medium text-blue-600">{{ splitSummary()?.payments_count }}</div>
            </div>
          </div>
        </div>

        <!-- Lista de pagos existentes -->
        <div class="space-y-2 mb-4">
          <div 
            *ngFor="let payment of splitSummary()?.payments" 
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                {{ payment.payment_part }}
              </div>
              <div>
                <div class="font-medium text-gray-900">{{ payment.amount | currency:'USD':'symbol':'1.2-2' }}</div>
                <div class="text-sm text-gray-600">{{ payment.percentage }}% - {{ payment.payment_period }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                <lucide-angular [img]="CheckCircle" class="w-3 h-3 inline mr-1"></lucide-angular>
                Pagado
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario para nuevo pago dividido -->
      <div *ngIf="canAddPayment()" class="border-t pt-6">
        <h4 class="font-medium text-gray-900 mb-4">Crear Nuevo Pago</h4>
        <form (ngSubmit)="createSplitPayment()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <lucide-angular [img]="Percent" class="w-4 h-4 inline mr-1"></lucide-angular>
                Porcentaje a Pagar
              </label>
              <input
                type="number"
                [(ngModel)]="newPayment.percentage"
                name="percentage"
                min="0.01"
                [max]="maxPercentage()"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 50"
              >
              <p class="text-xs text-gray-500 mt-1">Máximo disponible: {{ maxPercentage() }}%</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <lucide-angular [img]="Calendar" class="w-4 h-4 inline mr-1"></lucide-angular>
                Período de Pago
              </label>
              <input
                type="month"
                [(ngModel)]="newPayment.payment_period"
                name="payment_period"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <!-- Monto calculado -->
          <div *ngIf="newPayment.percentage > 0" class="bg-green-50 rounded-lg p-3">
            <div class="flex items-center gap-2 text-green-800">
              <lucide-angular [img]="DollarSign" class="w-4 h-4"></lucide-angular>
              <span class="font-medium">Monto a pagar: {{ calculatePaymentAmount() | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              [disabled]="isCreating() || !isFormValid()"
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <lucide-angular [img]="Plus" class="w-4 h-4"></lucide-angular>
              {{ isCreating() ? 'Creando...' : 'Crear Pago' }}
            </button>
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- Mensaje cuando no se pueden agregar más pagos -->
      <div *ngIf="!canAddPayment()" class="border-t pt-6">
        <div class="flex items-center gap-2 text-green-800 bg-green-50 p-3 rounded-lg">
          <lucide-angular [img]="CheckCircle" class="w-5 h-5"></lucide-angular>
          <span class="font-medium">Esta comisión ha sido pagada completamente</span>
        </div>
      </div>
    </div>
  `
})
export class CommissionSplitPaymentComponent implements OnInit {
  @Input() commission!: Commission;
  @Output() closeModal = new EventEmitter<void>();
  @Output() paymentCreated = new EventEmitter<void>();

  splitSummary = signal<SplitPaymentSummary | null>(null);
  isCreating = signal(false);

  // Iconos de Lucide
  DollarSign = DollarSign;
  X = X;
  Percent = Percent;
  Calendar = Calendar;
  Plus = Plus;
  CheckCircle = CheckCircle;
  
  newPayment: CreateSplitPaymentRequest = {
    percentage: 0,
    payment_period: ''
  };

  constructor(
    private commissionService: CommissionService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadSplitSummary();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.newPayment.payment_period = nextMonth.toISOString().slice(0, 7);
  }

  loadSplitSummary() {
    this.commissionService.getSplitPaymentSummary(this.commission.commission_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.splitSummary.set(response.summary);
        }
      },
      error: (error) => {
        console.error('Error loading split summary:', error);
      }
    });
  }

  createSplitPayment() {
    if (!this.isFormValid()) return;

    this.isCreating.set(true);
    
    this.commissionService.createSplitPayment(this.commission.commission_id, this.newPayment).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Pago dividido creado exitosamente');
          this.loadSplitSummary();
          this.resetForm();
          this.paymentCreated.emit();
        } else {
          this.toastService.error(response.message || 'Error al crear el pago dividido');
        }
      },
      error: (error) => {
        this.toastService.error('Error al crear el pago dividido');
        console.error('Error creating split payment:', error);
      },
      complete: () => {
        this.isCreating.set(false);
      }
    });
  }

  resetForm() {
    this.newPayment = {
      percentage: 0,
      payment_period: new Date().toISOString().slice(0, 7)
    };
  }

  isFormValid(): boolean {
    return this.newPayment.percentage > 0 && 
           this.newPayment.percentage <= this.maxPercentage() &&
           this.newPayment.payment_period !== '';
  }

  canAddPayment(): boolean {
    const summary = this.splitSummary();
    return !summary || summary.remaining_percentage > 0;
  }

  maxPercentage(): number {
    const summary = this.splitSummary();
    return summary ? summary.remaining_percentage : 100;
  }

  calculatePaymentAmount(): number {
    return (this.commission.commission_amount * this.newPayment.percentage) / 100;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'generated':
      case 'pendiente':
        return 'text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs';
      case 'partially_paid':
        return 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs';
      case 'fully_paid':
      case 'pagado':
        return 'text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs';
      case 'cancelled':
      case 'cancelado':
        return 'text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs';
      default:
        return 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'generated':
        return 'Generada';
      case 'partially_paid':
        return 'Parcialmente Pagada';
      case 'fully_paid':
        return 'Completamente Pagada';
      case 'cancelled':
        return 'Cancelada';
      case 'pendiente':
        return 'Pendiente';
      case 'pagado':
        return 'Pagado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }
}