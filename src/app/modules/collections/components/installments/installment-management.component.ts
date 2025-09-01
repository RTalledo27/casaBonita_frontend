import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { 
  LucideAngularModule, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  ArrowLeft,
  Download,
  Eye,
  Edit,
  X
} from 'lucide-angular';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { PaymentSchedule, PaymentScheduleFilters, MarkPaymentPaidRequest } from '../../models/payment-schedule';

@Component({
  selector: 'app-installment-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button 
            routerLink="/collections/dashboard"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <lucide-angular [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-angular>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestión de Cuotas</h1>
            <p class="text-gray-600 mt-1">Administrar cronogramas de pago y cuotas</p>
          </div>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="exportSchedules()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <lucide-angular [img]="FilterIcon" class="w-5 h-5 mr-2"></lucide-angular>
            Filtros
          </h2>
          <button 
            (click)="clearFilters()"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Limpiar Filtros
          </button>
        </div>
        
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div class="relative">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-angular>
              <input
                type="text"
                formControlName="search"
                placeholder="Contrato, cliente..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              formControlName="status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              formControlName="date_from"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              formControlName="date_to"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
        </form>
      </div>

      <!-- Schedules List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">Cronogramas de Pago</h2>
            <div class="text-sm text-gray-600">
              {{ filteredSchedules().length }} cronogramas encontrados
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Cargando cronogramas...</p>
          </div>
        } @else if (filteredSchedules().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Vencido</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (schedule of paginatedSchedules(); track schedule.schedule_id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ schedule.contract_id }}</p>
                        <p class="text-sm text-gray-500">Cuota {{ schedule.installment_number || 'N/A' }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <lucide-angular [img]="CalendarIcon" class="w-4 h-4 text-gray-400 mr-2"></lucide-angular>
                        <span class="text-sm text-gray-900">{{ formatDate(schedule.due_date) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <lucide-angular [img]="DollarSignIcon" class="w-4 h-4 text-gray-400 mr-2"></lucide-angular>
                        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(schedule.amount) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (schedule.status === 'vencido') {
                        <span class="text-sm text-red-600 font-medium">{{ getDaysOverdue(schedule.due_date) }} días</span>
                      } @else {
                        <span class="text-sm text-gray-500">-</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        (click)="viewScheduleDetails(schedule)"
                        class="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Ver detalles"
                      >
                        <lucide-angular [img]="EyeIcon" class="w-4 h-4"></lucide-angular>
                      </button>
                      @if (schedule.status !== 'pagado') {
                        <button 
                          (click)="openMarkPaidModal(schedule)"
                          class="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Marcar como pagado"
                        >
                          <lucide-angular [img]="CheckCircleIcon" class="w-4 h-4"></lucide-angular>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando {{ (currentPage() - 1) * pageSize() + 1 }} a {{ Math.min(currentPage() * pageSize(), filteredSchedules().length) }} de {{ filteredSchedules().length }} resultados
              </div>
              <div class="flex space-x-2">
                <button 
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                @for (page of getPageNumbers(); track page) {
                  <button 
                    (click)="goToPage(page)"
                    [class]="page === currentPage() ? 
                      'px-3 py-1 bg-blue-600 text-white rounded text-sm' : 
                      'px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'"
                  >
                    {{ page }}
                  </button>
                }
                <button 
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="text-center py-12 text-gray-500">
            <lucide-angular [img]="CalendarIcon" class="w-12 h-12 mx-auto mb-4 text-gray-400"></lucide-angular>
            <p class="text-lg font-medium">No se encontraron cronogramas</p>
            <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        }
      </div>

      <!-- Mark as Paid Modal -->
      @if (showMarkPaidModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Marcar como Pagado</h3>
                <button 
                  (click)="closeMarkPaidModal()"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <lucide-angular [img]="XIcon" class="w-5 h-5"></lucide-angular>
                </button>
              </div>
              
              @if (selectedScheduleForPayment()) {
                <form [formGroup]="markPaidForm" (ngSubmit)="markAsPaid()" class="space-y-4">
                  <!-- Schedule Info -->
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Contrato: <span class="font-medium">{{ selectedScheduleForPayment()!.contract_id }}</span></p>
                    <p class="text-sm text-gray-600">Monto: <span class="font-medium">{{ formatCurrency(selectedScheduleForPayment()!.amount) }}</span></p>
                    <p class="text-sm text-gray-600">Vencimiento: <span class="font-medium">{{ formatDate(selectedScheduleForPayment()!.due_date) }}</span></p>
                  </div>

                  <!-- Payment Details -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Pago</label>
                      <input
                        type="date"
                        formControlName="payment_date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Monto Pagado</label>
                      <input
                        type="number"
                        step="0.01"
                        formControlName="amount_paid"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                    <select
                      formControlName="payment_method"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="check">Cheque</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                    <textarea
                      formControlName="notes"
                      rows="3"
                      placeholder="Notas adicionales sobre el pago..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>

                  <!-- Actions -->
                  <div class="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      [disabled]="markPaidForm.invalid || isMarkingPaid()"
                      class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      @if (isMarkingPaid()) {
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      } @else {
                        <lucide-angular [img]="CheckCircleIcon" class="w-4 h-4"></lucide-angular>
                        <span>Marcar como Pagado</span>
                      }
                    </button>
                    <button
                      type="button"
                      (click)="closeMarkPaidModal()"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }

      <!-- Error/Success Messages -->
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <lucide-angular [img]="AlertTriangleIcon" class="w-5 h-5 text-red-600"></lucide-angular>
          <p class="text-red-800">{{ errorMessage() }}</p>
        </div>
      }

      @if (successMessage()) {
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <lucide-angular [img]="CheckCircleIcon" class="w-5 h-5 text-green-600"></lucide-angular>
          <p class="text-green-800">{{ successMessage() }}</p>
        </div>
      }
    </div>
  `
})
export class InstallmentManagementComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ClockIcon = Clock;
  ArrowLeftIcon = ArrowLeft;
  DownloadIcon = Download;
  EyeIcon = Eye;
  EditIcon = Edit;
  XIcon = X;

  // Signals
  schedules = signal<PaymentSchedule[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showMarkPaidModal = signal(false);
  selectedScheduleForPayment = signal<PaymentSchedule | null>(null);
  isMarkingPaid = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  // Forms
  filterForm: FormGroup;
  markPaidForm: FormGroup;

  // Computed
  filteredSchedules = computed(() => {
    const filters = this.filterForm.value;
    let filtered = this.schedules();

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(schedule => 
        schedule.contract_id.toString().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(schedule => schedule.status === filters.status);
    }

    if (filters.date_from) {
      filtered = filtered.filter(schedule => schedule.due_date >= filters.date_from);
    }

    if (filters.date_to) {
      filtered = filtered.filter(schedule => schedule.due_date <= filters.date_to);
    }

    return filtered;
  });

  totalPages = computed(() => Math.ceil(this.filteredSchedules().length / this.pageSize()));
  
  paginatedSchedules = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredSchedules().slice(start, end);
  });

  Math = Math;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      date_from: [''],
      date_to: ['']
    });

    this.markPaidForm = this.fb.group({
      payment_date: [new Date().toISOString().split('T')[0], Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0.01)]],
      payment_method: ['transfer', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    // Check for status filter from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['status']) {
        this.filterForm.patchValue({ status: params['status'] });
      }
    });

    // Watch for filter changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage.set(1);
      });

    this.loadSchedules();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSchedules() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const filters: PaymentScheduleFilters = {};
    
    this.collectionsService.getPaymentSchedules(filters)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading schedules:', error);
          this.errorMessage.set('Error al cargar los cronogramas');
          return of({ data: [], meta: {} });
        })
      )
      .subscribe({
        next: (response) => {
          this.schedules.set(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: '',
      date_from: '',
      date_to: ''
    });
    this.currentPage.set(1);
  }

  viewScheduleDetails(schedule: PaymentSchedule) {
    // Navigate to schedule details or open modal
    console.log('View schedule details:', schedule);
  }

  openMarkPaidModal(schedule: PaymentSchedule) {
    this.selectedScheduleForPayment.set(schedule);
    this.markPaidForm.patchValue({
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: schedule.amount,
      payment_method: 'transfer',
      notes: ''
    });
    this.showMarkPaidModal.set(true);
    this.clearMessages();
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
    this.selectedScheduleForPayment.set(null);
    this.markPaidForm.reset();
  }

  markAsPaid() {
    if (this.markPaidForm.invalid || !this.selectedScheduleForPayment()) {
      return;
    }

    this.isMarkingPaid.set(true);
    this.clearMessages();

    const formValue = this.markPaidForm.value;
    const schedule = this.selectedScheduleForPayment()!;

    const request: MarkPaymentPaidRequest = {
      payment_date: formValue.payment_date,
      amount_paid: formValue.amount_paid,
      payment_method: formValue.payment_method,
      notes: formValue.notes || undefined
    };

    this.collectionsService.markPaymentPaid(schedule.schedule_id, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error marking payment as paid:', error);
          this.errorMessage.set('Error al marcar el pago como pagado');
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.successMessage.set('Pago marcado como pagado exitosamente');
            this.closeMarkPaidModal();
            this.loadSchedules();
          }
          this.isMarkingPaid.set(false);
        },
        error: () => {
          this.isMarkingPaid.set(false);
        }
      });
  }

  exportSchedules() {
    // Implement export functionality
    console.log('Export schedules');
  }

  // Pagination methods
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
      case 'vencido':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
      case 'pendiente':
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  getDaysOverdue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}