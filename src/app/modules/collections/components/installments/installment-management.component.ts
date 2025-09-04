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
  X,
  ChevronDown,
  ChevronRight,
  Users,
  User
} from 'lucide-angular';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { PaymentSchedule, ContractSummary, MarkPaymentPaidRequest } from '../../models/payment-schedule';

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
            <h1 class="text-3xl font-bold text-gray-900">Gestión de Contratos y Cuotas</h1>
            <p class="text-gray-600 mt-1">Administrar contratos con sus cronogramas de pago</p>
          </div>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="exportContracts()"
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
        
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search by Contract -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Número de Contrato</label>
            <div class="relative">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-angular>
              <input
                type="text"
                formControlName="contract_number"
                placeholder="Buscar por contrato..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <!-- Search by Client -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
            <div class="relative">
              <lucide-angular [img]="UserIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-angular>
              <input
                type="text"
                formControlName="client_name"
                placeholder="Buscar por cliente..."
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
        </form>
      </div>

      <!-- Contracts List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">Contratos con Cronogramas</h2>
            <div class="text-sm text-gray-600">
              {{ filteredContracts().length }} contratos encontrados
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Cargando contratos...</p>
          </div>
        } @else if (filteredContracts().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuotas</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próximo Vencimiento</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (contract of paginatedContracts(); track contract.contract_id) {
                  <!-- Contract Row -->
                  <tr class="hover:bg-gray-50 cursor-pointer" (click)="toggleContractExpansion(contract)">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <lucide-angular 
                          [img]="contract.expanded ? ChevronDownIcon : ChevronRightIcon" 
                          class="w-4 h-4 text-gray-400 mr-2"
                        ></lucide-angular>
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ contract.contract_number }}</p>
                          <p class="text-sm text-gray-500">ID: {{ contract.contract_id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <lucide-angular [img]="UserIcon" class="w-4 h-4 text-gray-400 mr-2"></lucide-angular>
                        <span class="text-sm text-gray-900">{{ contract.client_name }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <lucide-angular [img]="UsersIcon" class="w-4 h-4 text-gray-400 mr-2"></lucide-angular>
                        <span class="text-sm text-gray-900">{{ contract.advisor_name }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-900">{{ contract.lot_name }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm">
                        <div class="flex items-center space-x-2">
                          <span class="font-medium text-gray-900">{{ contract.total_schedules }}</span>
                          <span class="text-gray-500">cuotas</span>
                        </div>
                        <div class="flex space-x-1 text-xs mt-1">
                          <span class="text-green-600">{{ contract.paid_schedules }} pagadas</span>
                          <span class="text-gray-400">•</span>
                          <span class="text-yellow-600">{{ contract.pending_schedules }} pendientes</span>
                          @if (contract.overdue_schedules > 0) {
                            <span class="text-gray-400">•</span>
                            <span class="text-red-600">{{ contract.overdue_schedules }} vencidas</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-blue-600 h-2 rounded-full" 
                          [style.width.%]="contract.payment_rate"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-600 mt-1">{{ contract.payment_rate }}% completado</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (contract.next_due_date) {
                        <div class="flex items-center">
                          <lucide-angular [img]="CalendarIcon" class="w-4 h-4 text-gray-400 mr-2"></lucide-angular>
                          <span class="text-sm text-gray-900">{{ formatDate(contract.next_due_date) }}</span>
                        </div>
                      } @else {
                        <span class="text-sm text-gray-500">Sin cuotas pendientes</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        (click)="viewContractDetails(contract); $event.stopPropagation()"
                        class="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Ver detalles"
                      >
                        <lucide-angular [img]="EyeIcon" class="w-4 h-4"></lucide-angular>
                      </button>
                    </td>
                  </tr>
                  
                  <!-- Expanded Schedules -->
                  @if (contract.expanded) {
                    <tr>
                      <td colspan="8" class="px-6 py-0">
                        <div class="bg-gray-50 border-l-4 border-blue-500 p-4">
                          <h4 class="text-sm font-medium text-gray-900 mb-3">Cronograma de Cuotas</h4>
                          <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                              <thead>
                                <tr class="border-b border-gray-200">
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Cuota</th>
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Vencimiento</th>
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Monto</th>
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Estado</th>
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Días Vencido</th>
                                  <th class="text-left py-2 px-3 font-medium text-gray-700">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (schedule of contract.schedules; track schedule.schedule_id) {
                                  <tr class="border-b border-gray-100 hover:bg-white">
                                    <td class="py-2 px-3">
                                      <span class="font-medium">{{ schedule.installment_number || 'N/A' }}</span>
                                    </td>
                                    <td class="py-2 px-3">
                                      {{ formatDate(schedule.due_date) }}
                                    </td>
                                    <td class="py-2 px-3">
                                      <span class="font-medium">{{ formatCurrency(schedule.amount) }}</span>
                                    </td>
                                    <td class="py-2 px-3">
                                      <span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span>
                                    </td>
                                    <td class="py-2 px-3">
                                      @if (schedule.status === 'vencido') {
                                        <span class="text-red-600 font-medium">{{ getDaysOverdue(schedule.due_date) }} días</span>
                                      } @else {
                                        <span class="text-gray-500">-</span>
                                      }
                                    </td>
                                    <td class="py-2 px-3 space-x-1">
                                      @if (schedule.status !== 'pagado') {
                                        <button 
                                          (click)="openMarkPaidModal(schedule)"
                                          class="text-green-600 hover:text-green-900 p-1 rounded"
                                          title="Marcar como pagado"
                                        >
                                          <lucide-angular [img]="CheckCircleIcon" class="w-3 h-3"></lucide-angular>
                                        </button>
                                      }
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1 || contracts().length > 0) {
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="text-sm text-gray-700">
                  @if (paginationInfo()) {
                    Mostrando {{ paginationInfo()!.from }} a {{ paginationInfo()!.to }} de {{ paginationInfo()!.total }} resultados
                  } @else {
                    Mostrando {{ contracts().length }} resultados
                  }
                </div>
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-700">Mostrar:</label>
                  <select 
                    [value]="pageSize()"
                    (change)="onPageSizeChange($event)"
                    class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span class="text-sm text-gray-700">por página</span>
                </div>
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
            <p class="text-lg font-medium">No se encontraron contratos</p>
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
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  UsersIcon = Users;
  UserIcon = User;

  // Signals
  contracts = signal<ContractSummary[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showMarkPaidModal = signal(false);
  selectedScheduleForPayment = signal<PaymentSchedule | null>(null);
  isMarkingPaid = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  paginationInfo = signal<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  // Forms
  filterForm: FormGroup;
  markPaidForm: FormGroup;

  // Computed properties - Now using backend pagination
  paginatedContracts = computed(() => {
    return this.contracts();
  });

  totalPages = computed(() => {
    const paginationInfo = this.paginationInfo();
    return paginationInfo ? paginationInfo.last_page : 1;
  });

  filteredContracts = computed(() => {
    return this.contracts();
  });

  Math = Math;

  constructor() {
    this.filterForm = this.fb.group({
      contract_number: [''],
      client_name: [''],
      status: ['']
    });

    this.markPaidForm = this.fb.group({
      payment_date: [new Date().toISOString().split('T')[0], Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0.01)]],
      payment_method: ['cash', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadContracts();
    
    // Setup filter changes
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadContracts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContracts() {
    this.isLoading.set(true);
    this.clearMessages();
    
    const filters = this.filterForm.value;
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
    );
    
    // Add pagination parameters
    const paginationFilters = {
      ...cleanFilters,
      page: this.currentPage(),
      per_page: this.pageSize()
    };
    
    this.collectionsService.getContractsWithSchedulesSummary(paginationFilters)
      .pipe(
        catchError(error => {
          console.error('Error loading contracts:', error);
          this.errorMessage.set('Error cargando contratos: ' + (error.error?.message || error.message));
          return of({ success: false, data: [] });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isLoading.set(false);
        if (response.success) {
          // Add expanded property to each contract
          const contractsWithExpanded = response.data.map((contract: ContractSummary) => ({
            ...contract,
            expanded: false
          }));
          this.contracts.set(contractsWithExpanded);
          if (response.pagination) {
             this.paginationInfo.set(response.pagination);
             this.totalItems.set(response.pagination.total);
           }
        } else {
          this.errorMessage.set('Error cargando contratos');
        }
      });
  }

  toggleContractExpansion(contract: ContractSummary) {
    const contracts = this.contracts();
    const updatedContracts = contracts.map(c => 
      c.contract_id === contract.contract_id 
        ? { ...c, expanded: !c.expanded }
        : c
    );
    this.contracts.set(updatedContracts);
  }

  clearFilters() {
    this.filterForm.reset({
      contract_number: '',
      client_name: '',
      status: ''
    });
    this.currentPage.set(1);
  }

  viewContractDetails(contract: ContractSummary) {
    console.log('View contract details:', contract);
    // TODO: Navigate to contract details page
  }

  openMarkPaidModal(schedule: PaymentSchedule) {
    console.log('DEBUG: openMarkPaidModal called with schedule:', schedule);
    console.log('DEBUG: schedule_id value:', schedule.schedule_id);
    this.selectedScheduleForPayment.set(schedule);
    this.markPaidForm.patchValue({
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: schedule.amount,
      payment_method: 'cash',
      notes: ''
    });
    this.showMarkPaidModal.set(true);
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
    this.selectedScheduleForPayment.set(null);
  }

  markAsPaid() {
    if (this.markPaidForm.invalid) {
      return;
    }

    const selectedSchedule = this.selectedScheduleForPayment();
    if (!selectedSchedule) return;

    console.log('DEBUG: markAsPaid - selectedSchedule:', selectedSchedule);
    console.log('DEBUG: markAsPaid - schedule_id:', selectedSchedule.schedule_id);

    this.isMarkingPaid.set(true);
    this.clearMessages();

    const request: MarkPaymentPaidRequest = {
      payment_date: this.markPaidForm.value.payment_date,
      amount_paid: this.markPaidForm.value.amount_paid,
      payment_method: this.markPaidForm.value.payment_method,
      notes: this.markPaidForm.value.notes
    };

    console.log('DEBUG: About to call markPaymentPaid with schedule_id:', selectedSchedule.schedule_id, 'and request:', request);
    this.collectionsService.markPaymentPaid(selectedSchedule.schedule_id, request)
      .pipe(
        catchError(error => {
          console.error('Error marking payment as paid:', error);
          this.errorMessage.set('Error marcando pago: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isMarkingPaid.set(false);
        if (response.success) {
          this.successMessage.set('Pago marcado como pagado exitosamente');
          this.closeMarkPaidModal();
          this.loadContracts(); // Reload to get updated data
        }
      });
  }

  exportContracts() {
    console.log('Export contracts');
    // TODO: Implement export functionality
  }

  // Pagination methods
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadContracts();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadContracts();
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadContracts();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageSize.set(newPageSize);
    this.currentPage.set(1); // Reset to first page
    this.loadContracts();
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
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
      case 'pendiente':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
      default:
        return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  }

  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}