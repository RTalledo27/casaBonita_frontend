import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LucideAngularModule, User, Users, Target, TrendingUp, Calendar, Mail, Phone, Edit, Trash2, Plus, Search, Filter, Download, BarChart3, PieChart, Activity } from 'lucide-angular';
import { CollectorsService } from '../../services/collectors.service';
import { AccountsReceivableService } from '../../services/accounts-receivable.service';
import { Collector, CollectorMetrics, CollectorWorkload, AssignmentRequest, ReassignmentRequest } from '../../models/collector';
import { AccountReceivable } from '../../models/account-receivable';

@Component({
  selector: 'app-collector-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestión de Cobradores</h1>
          <p class="text-gray-600 mt-1">Administra cobradores y sus asignaciones</p>
        </div>
        <div class="flex gap-3">
          <button 
            (click)="exportData()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <lucide-icon name="download" [size]="16"></lucide-icon>
            Exportar
          </button>
          <button 
            (click)="openCreateModal()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <lucide-icon name="plus" [size]="16"></lucide-icon>
            Nuevo Cobrador
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Cobradores</p>
              <p class="text-2xl font-bold text-gray-900">{{ summary().totalCollectors }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <lucide-icon name="users" [size]="24" class="text-blue-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Cobradores Activos</p>
              <p class="text-2xl font-bold text-green-600">{{ summary().activeCollectors }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-lg">
              <lucide-icon name="activity" [size]="24" class="text-green-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Cuentas Asignadas</p>
              <p class="text-2xl font-bold text-orange-600">{{ summary().totalAssignments }}</p>
            </div>
            <div class="p-3 bg-orange-100 rounded-lg">
              <lucide-icon name="target" [size]="24" class="text-orange-600"></lucide-icon>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Efectividad Promedio</p>
              <p class="text-2xl font-bold text-purple-600">{{ summary().averageEffectiveness }}%</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-lg">
              <lucide-icon name="trending-up" [size]="24" class="text-purple-600"></lucide-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow-sm border">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="relative">
            <lucide-icon name="search" [size]="16" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="filters.searchTerm"
              (input)="applyFilters()"
              placeholder="Buscar cobrador..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <select 
            [(ngModel)]="filters.status"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="on_leave">En licencia</option>
          </select>

          <select 
            [(ngModel)]="filters.department"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los departamentos</option>
            <option value="collections">Cobranzas</option>
            <option value="legal">Legal</option>
            <option value="customer_service">Atención al Cliente</option>
          </select>

          <button 
            (click)="clearFilters()"
            class="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <lucide-icon name="filter" [size]="16"></lucide-icon>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Collectors Table -->
      <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Lista de Cobradores</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cobrador</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuentas Asignadas</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectividad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (collector of filteredCollectors(); track collector.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <lucide-icon name="user" [size]="20" class="text-blue-600"></lucide-icon>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ collector.name }}</div>
                        <div class="text-sm text-gray-500">{{ collector.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getStatusClass(collector.status)">
                      {{ getStatusLabel(collector.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ getDepartmentLabel(collector.department) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ collector.assigned_accounts_count }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="text-sm font-medium text-gray-900">{{ collector.collection_rate }}%</div>
                      <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-green-600 h-2 rounded-full" 
                          [style.width.%]="collector.collection_rate"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(collector.last_activity_date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button 
                        (click)="viewCollectorDetails(collector)"
                        class="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <lucide-icon name="bar-chart-3" [size]="16"></lucide-icon>
                      </button>
                      <button 
                        (click)="editCollector(collector)"
                        class="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <lucide-icon name="edit" [size]="16"></lucide-icon>
                      </button>
                      <button 
                        (click)="manageAssignments(collector)"
                        class="text-green-600 hover:text-green-900"
                        title="Gestionar asignaciones"
                      >
                        <lucide-icon name="target" [size]="16"></lucide-icon>
                      </button>
                      <button 
                        (click)="deleteCollector(collector)"
                        class="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                      <lucide-icon name="users" [size]="48" class="text-gray-300 mb-4"></lucide-icon>
                      <p class="text-lg font-medium">No se encontraron cobradores</p>
                      <p class="text-sm">Intenta ajustar los filtros o crear un nuevo cobrador</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div class="flex items-center">
          <p class="text-sm text-gray-700">
            Mostrando {{ (currentPage() - 1) * pageSize() + 1 }} a {{ Math.min(currentPage() * pageSize(), totalItems()) }} de {{ totalItems() }} resultados
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="previousPage()"
            [disabled]="currentPage() === 1"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span class="px-3 py-1 text-sm text-gray-700">
            Página {{ currentPage() }} de {{ totalPages() }}
          </span>
          <button 
            (click)="nextPage()"
            [disabled]="currentPage() === totalPages()"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Assignment Modal -->
    @if (showAssignmentModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Gestionar Asignaciones - {{ selectedCollector()?.name }}</h3>
            <button (click)="closeAssignmentModal()" class="text-gray-400 hover:text-gray-600">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Current Assignments -->
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Cuentas Asignadas Actualmente</h4>
              <div class="max-h-60 overflow-y-auto border rounded-lg">
                @for (assignment of currentAssignments(); track assignment.id) {
                  <div class="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div>
                      <p class="font-medium">{{ assignment.client_name }}</p>
                      <p class="text-sm text-gray-500">{{ formatCurrency(assignment.amount) }} - {{ assignment.status }}</p>
                    </div>
                    <button 
                      (click)="removeAssignment(assignment.id)"
                      class="text-red-600 hover:text-red-800"
                    >
                      <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                    </button>
                  </div>
                } @empty {
                  <p class="p-4 text-gray-500 text-center">No hay cuentas asignadas</p>
                }
              </div>
            </div>

            <!-- Available Accounts -->
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Cuentas Disponibles para Asignar</h4>
              <div class="max-h-60 overflow-y-auto border rounded-lg">
                @for (account of availableAccounts(); track account.id) {
                  <div class="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div>
                      <p class="font-medium">{{ account.client_name }}</p>
                      <p class="text-sm text-gray-500">{{ formatCurrency(account.amount) }} - Vence: {{ formatDate(account.due_date) }}</p>
                    </div>
                    <button 
                      (click)="assignAccount(account.id)"
                      class="text-green-600 hover:text-green-800"
                    >
                      <lucide-icon name="plus" [size]="16"></lucide-icon>
                    </button>
                  </div>
                } @empty {
                  <p class="p-4 text-gray-500 text-center">No hay cuentas disponibles</p>
                }
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button 
              (click)="closeAssignmentModal()"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              (click)="saveAssignments()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CollectorManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private collectorsService = inject(CollectorsService);
  private accountsService = inject(AccountsReceivableService);

  // Signals
  collectors = signal<Collector[]>([]);
  loading = signal(false);
  showAssignmentModal = signal(false);
  selectedCollector = signal<Collector | null>(null);
  currentAssignments = signal<any[]>([]);
  availableAccounts = signal<AccountReceivable[]>([]);
  
  // Filters
  filters = {
    searchTerm: '',
    status: '',
    department: ''
  };

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  // Computed properties
  filteredCollectors = computed(() => {
    let filtered = this.collectors();
    
    if (this.filters.searchTerm) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(collector => 
        collector.name.toLowerCase().includes(term) ||
        collector.email.toLowerCase().includes(term)
      );
    }
    
    if (this.filters.status) {
      filtered = filtered.filter(collector => collector.status === this.filters.status);
    }
    
    if (this.filters.department) {
      filtered = filtered.filter(collector => collector.department === this.filters.department);
    }
    
    this.totalItems.set(filtered.length);
    
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  summary = computed(() => {
    const allCollectors = this.collectors();
    return {
      totalCollectors: allCollectors.length,
      activeCollectors: allCollectors.filter(c => c.status === 'active').length,
      totalAssignments: allCollectors.reduce((sum, c) => sum + c.assigned_accounts_count, 0),
      averageEffectiveness: allCollectors.length > 0 
        ? Math.round(allCollectors.reduce((sum, c) => sum + c.collection_rate, 0) / allCollectors.length)
        : 0
    };
  });

  ngOnInit() {
    this.loadCollectors();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCollectors() {
    this.loading.set(true);
    this.collectorsService.getCollectors()
       .pipe(takeUntil(this.destroy$))
       .subscribe({
         next: (response: any) => {
           const safeData = Array.isArray(response.data) ? response.data : [];
           this.collectors.set(safeData);
           this.loading.set(false);
         },
         error: (error: any) => {
           console.error('Error loading collectors:', error);
           this.loading.set(false);
         }
       });
  }

  applyFilters() {
    this.currentPage.set(1);
  }

  clearFilters() {
    this.filters = {
      searchTerm: '',
      status: '',
      department: ''
    };
    this.currentPage.set(1);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  manageAssignments(collector: Collector) {
    this.selectedCollector.set(collector);
    this.showAssignmentModal.set(true);
    
    // Load current assignments
     // TODO: Implement getAssignments method in service
     // this.collectorsService.getAssignments(collector.collector_id)
     //   .pipe(takeUntil(this.destroy$))
     //   .subscribe({
     //     next: (response) => {
     //       const safeData = Array.isArray(response.data) ? response.data : [];
     //       this.currentAssignments.set(safeData);
     //     },
     //     error: (error: any) => {
     //       console.error('Error loading assignments:', error);
     //     }
     //   });
     
     // Load available accounts
     this.accountsService.getAll({ status: 'pending', collector_id: undefined })
       .pipe(takeUntil(this.destroy$))
       .subscribe({
         next: (response) => {
           const safeData = Array.isArray(response.data) ? response.data : [];
           this.availableAccounts.set(safeData);
         },
         error: (error: any) => {
           console.error('Error loading available accounts:', error);
         }
       });
  }

  closeAssignmentModal() {
    this.showAssignmentModal.set(false);
    this.selectedCollector.set(null);
    this.currentAssignments.set([]);
    this.availableAccounts.set([]);
  }

  assignAccount(accountId: string) {
    const collector = this.selectedCollector();
    if (!collector) return;

    const request: AssignmentRequest = {
        collector_id: collector.collector_id.toString(),
        account_receivable_ids: [accountId],
        assigned_by: 'current_user', // This should come from auth service
        notes: 'Asignación manual desde gestión de cobradores'
      };
    
    // TODO: Implement assignAccounts method in service
    console.log('Assign account functionality not implemented yet', request);
    // this.collectorsService.assignAccounts(request)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       // Refresh data
    //       this.manageAssignments(collector);
    //       this.loadCollectors();
    //     },
    //     error: (error: any) => {
    //       console.error('Error assigning account:', error);
    //     }
    //   });
  }

  removeAssignment(assignmentId: string) {
    const request: ReassignmentRequest = {
      assignment_id: assignmentId,
      new_collector_id: null, // Unassign
      reason: 'Removido manualmente',
      reassigned_by: 'current_user'
    };
    
    // TODO: Implement reassignAccount method in service
    console.log('Reassign account functionality not implemented yet', request);
    // this.collectorsService.reassignAccount(request)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       // Refresh data
    //       const collector = this.selectedCollector();
    //       if (collector) {
    //         this.manageAssignments(collector);
    //         this.loadCollectors();
    //       }
    //     },
    //     error: (error: any) => {
    //       console.error('Error removing assignment:', error);
    //     }
    //   });
  }

  saveAssignments() {
    this.closeAssignmentModal();
    this.loadCollectors();
  }

  viewCollectorDetails(collector: Collector) {
    // Navigate to collector details page or open modal
    console.log('View details for collector:', collector);
  }

  editCollector(collector: Collector) {
    // Open edit modal
    console.log('Edit collector:', collector);
  }

  openCreateModal() {
    // Open create collector modal
    console.log('Create new collector');
  }

  deleteCollector(collector: Collector) {
    if (confirm(`¿Estás seguro de que deseas eliminar al cobrador ${collector.name}?`)) {
      // TODO: Use correct method name from service
      this.collectorsService.deleteCollector(collector.collector_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCollectors();
          },
          error: (error: any) => {
            console.error('Error deleting collector:', error);
          }
        });
    }
  }

  exportData() {
    // TODO: Implement export functionality
    console.log('Export functionality not implemented yet');
    // this.collectorsService.exportToExcel()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (blob: Blob) => {
    //       const url = window.URL.createObjectURL(blob);
    //       const link = document.createElement('a');
    //       link.href = url;
    //       link.download = `collectors_${new Date().toISOString().split('T')[0]}.xlsx`;
    //       link.click();
    //       window.URL.revokeObjectURL(url);
    //     },
    //     error: (error: any) => {
    //       console.error('Error exporting data:', error);
    //     }
    //   });
  }

  // Utility methods
  getStatusClass(status: string): string {
    const classes = {
      'active': 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
      'inactive': 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800',
      'on_leave': 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800'
    };
    return classes[status as keyof typeof classes] || classes.inactive;
  }

  getStatusLabel(status: string): string {
    const labels = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'on_leave': 'En Licencia'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getDepartmentLabel(department: string): string {
    const labels = {
      'collections': 'Cobranzas',
      'legal': 'Legal',
      'customer_service': 'Atención al Cliente'
    };
    return labels[department as keyof typeof labels] || department;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Expose Math for template
  Math = Math;
}