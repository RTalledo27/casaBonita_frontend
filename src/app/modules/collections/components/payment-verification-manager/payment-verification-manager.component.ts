import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { 
  CommissionVerificationService, 
  CommissionRequiringVerification,
  VerificationStats 
} from '../../services/commission-verification.service';
import { PusherNotificationService } from '../../services/pusher-notification.service';
import { ManualVerificationModalComponent } from '../manual-verification-modal/manual-verification-modal.component';

@Component({
  selector: 'app-payment-verification-manager',
  templateUrl: './payment-verification-manager.component.html',
  styleUrls: ['./payment-verification-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class PaymentVerificationManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Datos y configuración de la tabla
  dataSource = new MatTableDataSource<CommissionRequiringVerification>();
  displayedColumns: string[] = [
    'commission_id',
    'employee_name', 
    'client_name',
    'contract_id',
    'commission_amount',
    'payment_verification_status',
    'created_at',
    'actions'
  ];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Formulario de filtros
  filterForm: FormGroup;
  searchControl = new FormControl('');
  statusFilter = new FormControl<string[]>([]);
  employeeFilter = new FormControl('');
  clientFilter = new FormControl('');
  minAmountFilter = new FormControl('');
  maxAmountFilter = new FormControl('');
  startDateFilter = new FormControl<Date | null>(null);
  endDateFilter = new FormControl<Date | null>(null);
  quickFilter = '';
  
  // Datos para filtros
  employees: any[] = [];
  clients: any[] = [];
  
  // Estados y datos
  loading = false;
  stats: VerificationStats | null = null;
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  
  // Opciones de filtro
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending_verification', label: 'Pendiente de verificación' },
    { value: 'first_payment_verified', label: 'Primera cuota verificada' },
    { value: 'second_payment_verified', label: 'Segunda cuota verificada' },
    { value: 'fully_verified', label: 'Completamente verificado' },
    { value: 'verification_failed', label: 'Verificación fallida' }
  ];
  
  constructor(
    private commissionVerificationService: CommissionVerificationService,
    private pusherNotificationService: PusherNotificationService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      employee_id: [''],
      search: [''],
      date_from: [''],
      date_to: ['']
    });
  }
  
  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.loadStats();
    this.loadCommissions();
    this.loadFilterData();
    this.setupRealtimeUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura las suscripciones del formulario de filtros
   */
  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadCommissions();
      });
  }
  
  /**
   * Configura las actualizaciones en tiempo real
   */
  private setupRealtimeUpdates(): void {
    this.commissionVerificationService.verificationsUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        if (updated) {
          this.loadStats();
          this.loadCommissions();
        }
      });
    
    // Escuchar notificaciones de verificación
    this.pusherNotificationService.getVerificationUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (update) {
          // Actualizar la comisión específica en la lista
          this.updateCommissionInList(update.commission_id, update.verification_status);
        }
      });
  }
  
  /**
   * Carga las estadísticas de verificación
   */
  loadStats(): void {
    this.commissionVerificationService.getVerificationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.showError('Error al cargar estadísticas');
        }
      });
  }
  
  /**
   * Carga las comisiones que requieren verificación
   */
  loadCommissions(): void {
    this.loading = true;
    const filters = {
      ...this.filterForm.value,
      page: this.currentPage,
      per_page: this.pageSize
    };
    
    // Remover campos vacíos
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    this.commissionVerificationService.getCommissionsRequiringVerification(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalRecords = response.meta?.total || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading commissions:', error);
          this.showError('Error al cargar comisiones');
          this.loading = false;
        }
      });
  }
  
  /**
   * Maneja el cambio de página
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCommissions();
  }
  
  /**
   * Abre el modal de verificación manual
   */
  openManualVerification(commission: CommissionRequiringVerification): void {
    const dialogRef = this.dialog.open(ManualVerificationModalComponent, {
      width: '600px',
      data: { commission }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCommissions();
        this.loadStats();
      }
    });
  }
  
  /**
   * Procesa verificaciones automáticas
   */
  processAutomaticVerifications(): void {
    this.loading = true;
    this.commissionVerificationService.processAutomaticVerifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccess(`Se procesaron ${response.processed_count || 0} verificaciones automáticas`);
          this.loadCommissions();
          this.loadStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error processing automatic verifications:', error);
          this.showError('Error al procesar verificaciones automáticas');
          this.loading = false;
        }
      });
  }
  
  /**
   * Carga datos para los filtros (empleados y clientes)
   */
  private loadFilterData(): void {
    // Cargar empleados
    this.commissionVerificationService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Error cargando empleados:', error);
      }
    });
    
    // Cargar clientes
    this.commissionVerificationService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
      }
    });
  }
  
  /**
   * Aplica filtros rápidos
   */
  applyQuickFilter(filter: string): void {
    this.quickFilter = this.quickFilter === filter ? '' : filter;
    
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (filter) {
      case 'today':
        this.startDateFilter.setValue(new Date());
        this.endDateFilter.setValue(new Date());
        break;
      case 'week':
        this.startDateFilter.setValue(startOfWeek);
        this.endDateFilter.setValue(new Date());
        break;
      case 'month':
        this.startDateFilter.setValue(startOfMonth);
        this.endDateFilter.setValue(new Date());
        break;
      case 'pending_only':
        this.statusFilter.setValue(['pending']);
        break;
      default:
        // Limpiar filtros rápidos
        if (this.quickFilter === '') {
          this.clearFilters();
        }
        break;
    }
    
    this.applyFilters();
  }
  
  /**
   * Aplica todos los filtros
   */
  applyFilters(): void {
    const filters: any = {};
    
    if (this.searchControl.value) {
      filters.search = this.searchControl.value;
    }
    
    if (this.statusFilter.value?.length) {
      filters.status = this.statusFilter.value;
    }
    
    if (this.employeeFilter.value) {
      filters.employee_id = this.employeeFilter.value;
    }
    
    if (this.clientFilter.value) {
      filters.client_id = this.clientFilter.value;
    }
    
    if (this.minAmountFilter.value) {
      filters.min_amount = this.minAmountFilter.value;
    }
    
    if (this.maxAmountFilter.value) {
      filters.max_amount = this.maxAmountFilter.value;
    }
    
    if (this.startDateFilter.value) {
      filters.start_date = this.startDateFilter.value;
    }
    
    if (this.endDateFilter.value) {
      filters.end_date = this.endDateFilter.value;
    }
    
    this.loadCommissions();
  }
  
  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue([]);
    this.employeeFilter.setValue('');
    this.clientFilter.setValue('');
    this.minAmountFilter.setValue('');
    this.maxAmountFilter.setValue('');
    this.startDateFilter.setValue(null);
    this.endDateFilter.setValue(null);
    this.quickFilter = '';
    this.loadCommissions();
  }
  
  /**
   * Exporta los datos actuales
   */
  exportData(): void {
    // TODO: Implementar exportación
    this.showInfo('Funcionalidad de exportación en desarrollo');
  }
  
  /**
   * Obtiene el texto del estado de verificación
   */
  getStatusText(status: string): string {
    return this.commissionVerificationService.getVerificationStatusText(status);
  }
  
  /**
   * Obtiene la clase CSS del estado de verificación
   */
  getStatusClass(status: string): string {
    return this.commissionVerificationService.getVerificationStatusClass(status);
  }
  
  /**
   * Verifica si una comisión puede ser verificada manualmente
   */
  canVerifyManually(commission: CommissionRequiringVerification): boolean {
    return commission.payment_verification_status === 'pending_verification' ||
           commission.payment_verification_status === 'first_payment_verified';
  }
  
  /**
   * Actualiza una comisión específica en la lista
   */
  private updateCommissionInList(commissionId: number, newStatus: string): void {
    const commission = this.dataSource.data.find(c => c.commission_id === commissionId);
    if (commission) {
      commission.payment_verification_status = newStatus;
      // Actualizar la fuente de datos
      this.dataSource.data = [...this.dataSource.data];
    }
  }
  
  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return !!(this.searchControl.value || 
             this.statusFilter.value?.length || 
             this.employeeFilter.value || 
             this.clientFilter.value || 
             this.minAmountFilter.value || 
             this.maxAmountFilter.value || 
             this.startDateFilter.value || 
             this.endDateFilter.value);
  }
  
  /**
   * Métodos para limpiar filtros individuales
   */
  clearSearchFilter(): void {
    this.searchControl.setValue('');
    this.applyFilters();
  }
  
  clearStatusFilter(): void {
    this.statusFilter.setValue([]);
    this.applyFilters();
  }
  
  clearEmployeeFilter(): void {
    this.employeeFilter.setValue('');
    this.applyFilters();
  }
  
  clearClientFilter(): void {
    this.clientFilter.setValue('');
    this.applyFilters();
  }
  
  clearAmountFilters(): void {
    this.minAmountFilter.setValue('');
    this.maxAmountFilter.setValue('');
    this.applyFilters();
  }
  
  clearDateFilters(): void {
    this.startDateFilter.setValue(null);
    this.endDateFilter.setValue(null);
    this.applyFilters();
  }
  
  /**
   * Obtiene texto descriptivo de filtros
   */
  getStatusFilterText(): string {
    const statuses = this.statusFilter.value || [];
    const statusTexts = statuses.map((status: string) => {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'verified': return 'Verificado';
        case 'failed': return 'Fallido';
        case 'processing': return 'Procesando';
        default: return status;
      }
    });
    return statusTexts.join(', ');
  }
  
  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee ? employee.name : employeeId;
  }
  
  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? client.name : clientId;
  }
  
  getAmountFilterText(): string {
    const min = this.minAmountFilter.value;
    const max = this.maxAmountFilter.value;
    
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `Desde $${min.toLocaleString()}`;
    } else if (max) {
      return `Hasta $${max.toLocaleString()}`;
    }
    return '';
  }
  
  getDateFilterText(): string {
    const start = this.startDateFilter.value;
    const end = this.endDateFilter.value;
    
    if (start && end) {
      return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    } else if (start) {
      return `Desde ${this.formatDate(start)}`;
    } else if (end) {
      return `Hasta ${this.formatDate(end)}`;
    }
    return '';
  }
  
  /**
   * Exporta los resultados filtrados
   */
  exportResults(): void {
    const data = this.dataSource.data;
    const csvContent = this.generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `verificaciones_comisiones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  /**
   * Genera contenido CSV
   */
  private generateCSV(data: any[]): string {
    const headers = ['ID Comisión', 'Empleado', 'Cliente', 'Contrato', 'Monto', 'Estado', 'Fecha Creación'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = [
        row.commission_id,
        `"${row.employee_name}"`,
        `"${row.client_name}"`,
        row.contract_number,
        row.commission_amount,
        row.payment_verification_status,
        row.created_at
      ];
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  /**
   * Formatea fecha para mostrar
   */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO');
  }
  
  /**
   * Obtiene el estado de conexión de notificaciones
   */
  isNotificationsConnected(): boolean {
    return this.pusherNotificationService.isConnected();
  }
  
  /**
   * Muestra mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
  
  /**
   * Muestra mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  /**
   * Muestra mensaje informativo
   */
  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}