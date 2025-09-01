import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Search, Filter, Plus, Edit, Trash2, Eye, Download, User, Calendar, DollarSign, AlertTriangle, CheckCircle } from 'lucide-angular';
import { AccountsReceivableService } from '../../services/accounts-receivable.service';
import { AccountReceivable, AccountReceivableFilters } from '../../models/account-receivable';

@Component({
  selector: 'app-accounts-receivable-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Cuentas por Cobrar</h1>
          <p class="text-gray-600 mt-1">Gestión de cuentas por cobrar y seguimiento de pagos</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="exportData()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="Download" class="w-4 h-4"></lucide-angular>
            <span>Exportar</span>
          </button>
          <button 
            routerLink="/collections/accounts-receivable/create"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <lucide-angular [img]="Plus" class="w-4 h-4"></lucide-angular>
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form [formGroup]="filtersForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="relative">
              <lucide-angular [img]="Search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-angular>
              <input
                type="text"
                formControlName="search"
                placeholder="Buscar por cliente, factura..."
                class="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>

            <!-- Status Filter -->
            <select 
              formControlName="status"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencida</option>
              <option value="paid">Pagada</option>
              <option value="partial">Pago Parcial</option>
              <option value="cancelled">Cancelada</option>
            </select>

            <!-- Priority Filter -->
            <select 
              formControlName="priority"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <!-- Collector Filter -->
            <select 
              formControlName="collector_id"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los cobradores</option>
              @for (collector of collectors(); track collector.collector_id) {
                <option [value]="collector.collector_id">{{ collector.employee_name }}</option>
              }
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
              <input
                type="date"
                formControlName="due_date_from"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
              <input
                type="date"
                formControlName="due_date_to"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto mínimo</label>
              <input
                type="number"
                formControlName="min_amount"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <div class="flex justify-between items-center">
            <button 
              type="button"
              (click)="clearFilters()"
              class="text-gray-600 hover:text-gray-800 text-sm"
            >
              Limpiar filtros
            </button>
            <div class="flex space-x-2">
              <span class="text-sm text-gray-600">{{ totalRecords() }} registros encontrados</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <div class="bg-blue-100 p-2 rounded-lg">
              <lucide-angular [img]="DollarSign" class="w-5 h-5 text-blue-600"></lucide-angular>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total</p>
              <p class="text-lg font-semibold text-gray-900">{{ summary().total | currency:'PEN':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <div class="bg-red-100 p-2 rounded-lg">
              <lucide-angular [img]="AlertTriangle" class="w-5 h-5 text-red-600"></lucide-angular>
            </div>
            <div>
              <p class="text-sm text-gray-600">Vencidas</p>
              <p class="text-lg font-semibold text-red-600">{{ summary().overdue | currency:'PEN':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <div class="bg-green-100 p-2 rounded-lg">
              <lucide-angular [img]="CheckCircle" class="w-5 h-5 text-green-600"></lucide-angular>
            </div>
            <div>
              <p class="text-sm text-gray-600">Cobradas</p>
              <p class="text-lg font-semibold text-green-600">{{ summary().collected | currency:'PEN':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <div class="bg-yellow-100 p-2 rounded-lg">
              <lucide-angular [img]="Calendar" class="w-5 h-5 text-yellow-600"></lucide-angular>
            </div>
            <div>
              <p class="text-sm text-gray-600">Pendientes</p>
              <p class="text-lg font-semibold text-yellow-600">{{ summary().pending | currency:'PEN':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Cargando...</span>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cobrador
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (account of accountsReceivable(); track account.account_receivable_id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="bg-gray-100 p-2 rounded-full mr-3">
                          <lucide-angular [img]="User" class="w-4 h-4 text-gray-600"></lucide-angular>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ getClientFullName(account.client) || 'N/A' }}</div>
                          <div class="text-sm text-gray-500">ID: {{ account.client_id }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ account.invoice_number }}</div>
                      <div class="text-sm text-gray-500">{{ account.description }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ account.amount | currency:'PEN':'symbol':'1.2-2' }}</div>
                      @if (account.balance !== account.amount) {
                        <div class="text-sm text-gray-500">Saldo: {{ account.balance | currency:'PEN':'symbol':'1.2-2' }}</div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ account.due_date | date:'dd/MM/yyyy' }}</div>
                      @if (account.days_overdue && account.days_overdue > 0) {
                        <div class="text-sm text-red-600">{{ account.days_overdue }} días vencida</div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusClass(account.status) + ' px-2 inline-flex text-xs leading-5 font-semibold rounded-full'">
                        {{ getStatusLabel(account.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getPriorityClass(account.priority) + ' px-2 inline-flex text-xs leading-5 font-semibold rounded-full'">
                        {{ getPriorityLabel(account.priority) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getCollectorName(account.collector_id || null) || 'Sin asignar' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end space-x-2">
                        <button 
                          [routerLink]="['/collections/accounts-receivable', account.account_receivable_id]"
                          class="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <lucide-angular [img]="Eye" class="w-4 h-4"></lucide-angular>
                        </button>
                        <button 
                          [routerLink]="['/collections/accounts-receivable', account.account_receivable_id, 'edit']"
                          class="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Editar"
                        >
                          <lucide-angular [img]="Edit" class="w-4 h-4"></lucide-angular>
                        </button>
                        <button 
                          (click)="deleteAccount(account)"
                          class="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Eliminar"
                        >
                          <lucide-angular [img]="Trash2" class="w-4 h-4"></lucide-angular>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                      <div class="flex flex-col items-center">
                        <lucide-angular [img]="Search" class="w-12 h-12 text-gray-300 mb-4"></lucide-angular>
                        <p class="text-lg font-medium">No se encontraron cuentas por cobrar</p>
                        <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div class="flex-1 flex justify-between sm:hidden">
                <button 
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button 
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    Mostrando
                    <span class="font-medium">{{ getStartRecord() }}</span>
                    a
                    <span class="font-medium">{{ getEndRecord() }}</span>
                    de
                    <span class="font-medium">{{ totalRecords() }}</span>
                    resultados
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button 
                      (click)="previousPage()"
                      [disabled]="currentPage() === 1"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    @for (page of getPageNumbers(); track page) {
                      <button 
                        (click)="goToPage(page)"
                        [class]="page === currentPage() ? 
                          'relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600' :
                          'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50'"
                      >
                        {{ page }}
                      </button>
                    }
                    <button 
                      (click)="nextPage()"
                      [disabled]="currentPage() === totalPages()"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AccountsReceivableListComponent implements OnInit, OnDestroy {
  private readonly accountsService = inject(AccountsReceivableService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Download = Download;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;

  // Signals
  isLoading = signal(false);
  accountsReceivable = signal<AccountReceivable[]>([]);
  collectors = signal<any[]>([]);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = 20;

  // Form
  filtersForm: FormGroup;

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize));
  
  summary = computed(() => {
    const accounts = this.accountsReceivable();
    // Ensure accounts is always an array before using array methods
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    return {
      total: safeAccounts.reduce((sum, acc) => sum + (acc.amount || 0), 0),
      overdue: safeAccounts.filter(acc => acc.status === 'overdue').reduce((sum, acc) => sum + (acc.amount || 0), 0),
      collected: safeAccounts.filter(acc => acc.status === 'paid').reduce((sum, acc) => sum + (acc.amount || 0), 0),
      pending: safeAccounts.filter(acc => acc.status === 'pending').reduce((sum, acc) => sum + (acc.amount || 0), 0)
    };
  });

  constructor() {
    this.filtersForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      collector_id: [''],
      due_date_from: [''],
      due_date_to: [''],
      min_amount: ['']
    });
  }

  ngOnInit(): void {
    this.loadAccountsReceivable();
    this.loadCollectors();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadAccountsReceivable();
      });
  }

  loadAccountsReceivable(): void {
    this.isLoading.set(true);
    
    const filters: AccountReceivableFilters = {
      ...this.filtersForm.value,
      page: this.currentPage(),
      limit: this.pageSize
    };

    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AccountReceivableFilters] === '' || filters[key as keyof AccountReceivableFilters] === null) {
        delete filters[key as keyof AccountReceivableFilters];
      }
    });

    this.accountsService.getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Ensure response.data is always an array
          const data = Array.isArray(response?.data) ? response.data : [];
          this.accountsReceivable.set(data);
          this.totalRecords.set(response?.total || data.length);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading accounts receivable:', error);
          // Set empty array on error to prevent reduce errors
          this.accountsReceivable.set([]);
          this.totalRecords.set(0);
          this.isLoading.set(false);
        }
      });
  }

  loadCollectors(): void {
    // This would typically come from CollectorsService
    // For now, we'll use a placeholder
    this.collectors.set([]);
  }

  clearFilters(): void {
    this.filtersForm.reset();
  }

  exportData(): void {
    const filters = this.filtersForm.value;
    this.accountsService.exportToExcel(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cuentas-por-cobrar-${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting data:', error);
        }
      });
  }

  deleteAccount(account: AccountReceivable): void {
    if (confirm(`¿Está seguro de eliminar la cuenta por cobrar ${account.invoice_number}?`)) {
      this.accountsService.delete(account.account_receivable_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadAccountsReceivable();
          },
          error: (error) => {
            console.error('Error deleting account:', error);
          }
        });
    }
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadAccountsReceivable();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadAccountsReceivable();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadAccountsReceivable();
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

  getStartRecord(): number {
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalRecords());
  }

  // Helper methods
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'paid': 'bg-green-100 text-green-800',
      'partial': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'overdue': 'Vencida',
      'paid': 'Pagada',
      'partial': 'Parcial',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  getCollectorName(collectorId: number | null): string {
    if (!collectorId) return '';
    const collector = this.collectors().find(c => c.collector_id === collectorId);
    return collector?.employee_name || '';
  }

  getClientFullName(client: any): string {
    if (!client) return '';
    return `${client.first_name || ''} ${client.last_name || ''}`.trim();
  }
}