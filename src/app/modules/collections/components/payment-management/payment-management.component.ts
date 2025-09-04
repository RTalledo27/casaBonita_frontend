import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  LucideAngularModule, 
  DollarSign, 
  Calendar, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  BarChart3
} from 'lucide-angular';

import { CustomerPaymentService, PaymentFilters, PaymentStats, CreatePaymentRequest, PaymentDetectionResult } from '../../services/customer-payment.service';
import { CustomerPayment } from '../../models/customer-payment';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="payment-management-container p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p class="text-gray-600 mt-1">Administra los pagos de clientes y su impacto en comisiones</p>
        </div>
        <div class="flex gap-3">
          <button 
            (click)="exportPayments()"
            class="btn-secondary flex items-center gap-2"
            [disabled]="loading()"
          >
            <lucide-icon [img]="DownloadIcon" size="16"></lucide-icon>
            Exportar
          </button>
          <button 
            (click)="openCreatePaymentModal()"
            class="btn-primary flex items-center gap-2"
          >
            <lucide-icon [img]="PlusIcon" size="16"></lucide-icon>
            Nuevo Pago
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Pagos</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()?.total_payments || 0 }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <lucide-icon [img]="DollarSignIcon" size="24" class="text-blue-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Monto Total</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats()?.total_amount || 0) }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <lucide-icon [img]="TrendingUpIcon" size="24" class="text-green-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Afectan Comisiones</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()?.commission_affecting_payments || 0 }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <lucide-icon [img]="CheckCircleIcon" size="24" class="text-purple-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Primeras Cuotas</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()?.first_payments || 0 }}</p>
            </div>
            <div class="p-3 bg-orange-100 rounded-full">
              <lucide-icon [img]="CalendarIcon" size="24" class="text-orange-600"></lucide-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <lucide-icon [img]="FilterIcon" size="20" class="text-gray-500"></lucide-icon>
          <h3 class="text-lg font-semibold text-gray-900">Filtros</h3>
          <button 
            (click)="clearFilters()"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpiar filtros
          </button>
        </div>
        
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div class="relative">
              <input
                type="text"
                formControlName="search"
                placeholder="Número de contrato, cliente..."
                class="input-field pl-10"
              >
              <lucide-icon [img]="SearchIcon" size="16" class="absolute left-3 top-3 text-gray-400"></lucide-icon>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select formControlName="payment_method" class="input-field">
              <option value="">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuota</label>
            <select formControlName="installment_type" class="input-field">
              <option value="">Todos</option>
              <option value="first">Primera Cuota</option>
              <option value="second">Segunda Cuota</option>
              <option value="regular">Cuota Regular</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Afecta Comisiones</label>
            <select formControlName="affects_commissions" class="input-field">
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              formControlName="date_from"
              class="input-field"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              formControlName="date_to"
              class="input-field"
            >
          </div>
        </form>
      </div>

      <!-- Payments Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Pagos de Clientes</h3>
            <div class="flex items-center gap-2">
              <button 
                (click)="refreshPayments()"
                class="btn-secondary flex items-center gap-2"
                [disabled]="loading()"
              >
                <lucide-icon 
                  [img]="RefreshCwIcon" 
                  size="16" 
                  [class.animate-spin]="loading()"
                ></lucide-icon>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente/Contrato
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Cuota
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisiones
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center">
                    <div class="flex items-center justify-center">
                      <lucide-icon [img]="RefreshCwIcon" size="24" class="animate-spin text-gray-400 mr-2"></lucide-icon>
                      <span class="text-gray-500">Cargando pagos...</span>
                    </div>
                  </td>
                </tr>
              } @else if (payments().length === 0) {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center">
                    <div class="text-gray-500">
                      <lucide-icon [img]="FileTextIcon" size="48" class="mx-auto mb-4 text-gray-300"></lucide-icon>
                      <p class="text-lg font-medium">No se encontraron pagos</p>
                      <p class="text-sm">Intenta ajustar los filtros o crear un nuevo pago</p>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (payment of payments(); track payment.payment_id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <lucide-icon [img]="DollarSignIcon" size="16" class="text-blue-600"></lucide-icon>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">#{{ payment.payment_id }}</div>
                          <div class="text-sm text-gray-500">{{ payment.payment_method | titlecase }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {{ payment.contract?.client_name || 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        Contrato: {{ payment.contract?.contract_number || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatCurrency(payment.amount) }}
                      </div>
                      @if (payment.reference) {
                        <div class="text-sm text-gray-500">Ref: {{ payment.reference }}</div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getInstallmentTypeClass(payment.installment_type)"
                      >
                        {{ getInstallmentTypeLabel(payment.installment_type) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        @if (payment.affects_commissions) {
                          <lucide-icon [img]="CheckCircleIcon" size="16" class="text-green-500 mr-2"></lucide-icon>
                          <span class="text-sm text-green-700">Afecta ({{ payment.affected_commissions_count || 0 }})</span>
                        } @else {
                          <lucide-icon [img]="AlertTriangleIcon" size="16" class="text-gray-400 mr-2"></lucide-icon>
                          <span class="text-sm text-gray-500">No afecta</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(payment.payment_date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end gap-2">
                        <button 
                          (click)="viewPayment(payment)"
                          class="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <lucide-icon [img]="EyeIcon" size="16"></lucide-icon>
                        </button>
                        <button 
                          (click)="editPayment(payment)"
                          class="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <lucide-icon [img]="EditIcon" size="16"></lucide-icon>
                        </button>
                        @if (payment.installment_type && payment.installment_type !== 'regular') {
                          <button 
                            (click)="redetectInstallmentType(payment)"
                            class="text-purple-600 hover:text-purple-900"
                            title="Re-detectar tipo de cuota"
                          >
                            <lucide-icon [img]="RefreshCwIcon" size="16"></lucide-icon>
                          </button>
                        }
                        <button 
                          (click)="deletePayment(payment)"
                          class="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <lucide-icon [img]="Trash2Icon" size="16"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (meta() && meta()!.total > meta()!.per_page) {
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button 
                (click)="previousPage()"
                [disabled]="meta()!.current_page === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Anterior
              </button>
              <button 
                (click)="nextPage()"
                [disabled]="meta()!.current_page === meta()!.last_page"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Mostrando
                  <span class="font-medium">{{ (meta()!.current_page - 1) * meta()!.per_page + 1 }}</span>
                  a
                  <span class="font-medium">{{ Math.min(meta()!.current_page * meta()!.per_page, meta()!.total) }}</span>
                  de
                  <span class="font-medium">{{ meta()!.total }}</span>
                  resultados
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button 
                    (click)="previousPage()"
                    [disabled]="meta()!.current_page === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button 
                    (click)="nextPage()"
                    [disabled]="meta()!.current_page === meta()!.last_page"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .payment-management-container {
      min-height: 100vh;
      background-color: #f9fafb;
    }

    .btn-primary {
      @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
    }

    .btn-secondary {
      @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200;
    }

    .input-field {
      @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
    }

    .installment-first {
      @apply bg-green-100 text-green-800;
    }

    .installment-second {
      @apply bg-blue-100 text-blue-800;
    }

    .installment-regular {
      @apply bg-gray-100 text-gray-800;
    }

    .installment-unknown {
      @apply bg-yellow-100 text-yellow-800;
    }
  `]
})
export class PaymentManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private paymentService = inject(CustomerPaymentService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  FilterIcon = Filter;
  SearchIcon = Search;
  EyeIcon = Eye;
  EditIcon = Edit;
  Trash2Icon = Trash2;
  PlusIcon = Plus;
  DownloadIcon = Download;
  RefreshCwIcon = RefreshCw;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;
  SettingsIcon = Settings;
  BarChart3Icon = BarChart3;

  // Signals
  payments = signal<CustomerPayment[]>([]);
  stats = signal<PaymentStats | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  meta = signal<any>(null);

  // Form
  filterForm: FormGroup;
  currentFilters: PaymentFilters = {
    page: 1,
    per_page: 15
  };

  // Math for template
  Math = Math;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      payment_method: [''],
      installment_type: [''],
      affects_commissions: [''],
      date_from: [''],
      date_to: ['']
    });
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.setupServiceSubscriptions();
    this.loadPayments();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private setupServiceSubscriptions(): void {
    this.paymentService.loading
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading.set(loading));

    this.paymentService.error
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error.set(error);
        if (error) {
          this.toastService.error(error);
        }
      });

    this.paymentService.paymentCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPayments();
        this.loadStats();
        this.toastService.success('Pago creado exitosamente');
      });

    this.paymentService.paymentUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPayments();
        this.loadStats();
        this.toastService.success('Pago actualizado exitosamente');
      });

    this.paymentService.paymentDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPayments();
        this.loadStats();
        this.toastService.success('Pago eliminado exitosamente');
      });

    this.paymentService.commissionProcessed
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: PaymentDetectionResult) => {
        this.loadPayments();
        this.toastService.success(`Tipo de cuota re-detectado: ${result.installment_type}`);
      });
  }

  private loadPayments(): void {
    this.paymentService.getPayments(this.currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.payments.set(response.data);
          this.meta.set(response.meta);
        },
        error: (error) => {
          console.error('Error loading payments:', error);
          this.toastService.error('Error al cargar los pagos');
        }
      });
  }

  private loadStats(): void {
    const statsFilters = {
      date_from: this.currentFilters.date_from,
      date_to: this.currentFilters.date_to,
      contract_id: this.currentFilters.contract_id
    };

    this.paymentService.getDetectionStats(statsFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    
    this.currentFilters = {
      ...this.currentFilters,
      page: 1, // Reset to first page
      ...Object.fromEntries(
        Object.entries(formValue).filter(([_, value]) => value !== '' && value !== null)
      )
    };

    this.loadPayments();
    this.loadStats();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentFilters = {
      page: 1,
      per_page: 15
    };
    this.loadPayments();
    this.loadStats();
  }

  refreshPayments(): void {
    this.loadPayments();
    this.loadStats();
  }

  // Pagination
  nextPage(): void {
    if (this.meta() && this.meta()!.current_page < this.meta()!.last_page) {
      this.currentFilters.page = this.meta()!.current_page + 1;
      this.loadPayments();
    }
  }

  previousPage(): void {
    if (this.meta() && this.meta()!.current_page > 1) {
      this.currentFilters.page = this.meta()!.current_page - 1;
      this.loadPayments();
    }
  }

  // Payment actions
  openCreatePaymentModal(): void {
    // TODO: Implement create payment modal
    this.toastService.info('Funcionalidad de crear pago en desarrollo');
  }

  viewPayment(payment: CustomerPayment): void {
    this.router.navigate(['/collections/payments', payment.payment_id]);
  }

  editPayment(payment: CustomerPayment): void {
    // TODO: Implement edit payment modal
    this.toastService.info('Funcionalidad de editar pago en desarrollo');
  }

  deletePayment(payment: CustomerPayment): void {
    if (confirm('¿Estás seguro de que deseas eliminar este pago?')) {
      this.paymentService.deletePayment(payment.payment_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (error) => {
            console.error('Error deleting payment:', error);
            this.toastService.error('Error al eliminar el pago');
          }
        });
    }
  }

  redetectInstallmentType(payment: CustomerPayment): void {
    this.paymentService.redetectInstallmentType(payment.payment_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error redetecting installment type:', error);
          this.toastService.error('Error al re-detectar el tipo de cuota');
        }
      });
  }

  exportPayments(): void {
    // TODO: Implement export functionality
    this.toastService.info('Funcionalidad de exportar en desarrollo');
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO');
  }

  getInstallmentTypeLabel(type?: string): string {
    switch (type) {
      case 'first': return 'Primera Cuota';
      case 'second': return 'Segunda Cuota';
      case 'regular': return 'Cuota Regular';
      default: return 'No Detectado';
    }
  }

  getInstallmentTypeClass(type?: string): string {
    switch (type) {
      case 'first': return 'installment-first';
      case 'second': return 'installment-second';
      case 'regular': return 'installment-regular';
      default: return 'installment-unknown';
    }
  }
}