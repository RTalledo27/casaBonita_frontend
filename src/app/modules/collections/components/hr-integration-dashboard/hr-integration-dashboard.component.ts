import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { HrIntegrationService, HRCollectionsIntegrationData, CommissionWithVerification } from '../../services/hr-integration.service';
import { PusherNotificationService } from '../../services/pusher-notification.service';
import { Employee } from '../../../humanResources/models/employee';
import { Commission } from '../../../humanResources/models/commission';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, RefreshCw, Download, Filter, Search, X, DollarSign, Clock, CheckCircle, AlertTriangle, Eye, UserCheck, Inbox, History, AlertCircle, Settings, BarChart3, PieChart, XCircle, PlayCircle, CheckSquare, XCircleIcon, CheckCircleIcon, ClockIcon, CreditCard, EyeIcon, UserCircle, InboxIcon, AlertCircleIcon, RefreshCwIcon, RefreshCcw, DownloadIcon, DollarSignIcon, BarChart } from 'lucide-angular';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-hr-integration-dashboard',
  templateUrl: './hr-integration-dashboard.component.html',
  styleUrls: ['./hr-integration-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseChartDirective,
    LucideAngularModule
  ]
})
export class HrIntegrationDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  integrationData: HRCollectionsIntegrationData | null = null;
  loading = false;
  error: string | null = null;

  playCircle = PlayCircle;
  checkSquare = CheckSquare;
  xCircle = XCircleIcon;
  checkCircle = CheckCircleIcon;
  clock = ClockIcon;
  creditCard = CreditCard;
  eye = EyeIcon;
  userCheck = UserCircle;
  inbox = InboxIcon;
  history = History;
  alertCircle = AlertCircleIcon;
  refreshCw = RefreshCwIcon;
  refreshCcw = RefreshCcw;
  download = DownloadIcon;
  filter = Filter;
  search = Search;
  x = X;
  barChart3 = BarChart3;
  dollarSign = DollarSignIcon;
  pieChart = PieChart;
  barChart = BarChart;



  // Filtros
  filterForm = new FormGroup({
    period: new FormControl(''),
    employee_id: new FormControl(''),
    commission_status: new FormControl(''),
    verification_status: new FormControl(''),
    date_from: new FormControl(''),
    date_to: new FormControl(''),
    search: new FormControl('')
  });
  
  employees: Employee[] = [];
  selectedCommissions: number[] = [];
  
  // Configuración de gráficos
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };
  
  // Datos para gráficos
  verificationStatusChart: any = null;
  commissionAmountChart: any = null;
  
  // Columnas de la tabla
  displayedColumns = [
    'select',
    'commission_id',
    'employee',
    'commission_amount',
    'payment_status',
    'verification_status',
    'verification_summary',
    'actions'
  ];
  
  // Estados de verificación
  verificationStatuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending_verification', label: 'Pendiente de verificación' },
    { value: 'first_payment_verified', label: 'Primer pago verificado' },
    { value: 'second_payment_verified', label: 'Segundo pago verificado' },
    { value: 'fully_verified', label: 'Completamente verificado' },
    { value: 'verification_failed', label: 'Verificación fallida' }
  ];
  
  // Estados de comisión
  commissionStatuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'generated', label: 'Generada' },
    { value: 'partially_paid', label: 'Parcialmente pagada' },
    { value: 'fully_paid', label: 'Completamente pagada' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  constructor(
    private hrIntegrationService: HrIntegrationService,
    private pusherNotificationService: PusherNotificationService
  ) {}

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.setupRealTimeUpdates();
    this.loadIntegrationData();
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
        this.loadIntegrationData();
      });
  }

  private setupRealTimeUpdates(): void {
    // Suscribirse a actualizaciones de verificaciones
    this.pusherNotificationService.getVerificationUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshData();
      });

    // Suscribirse a notificaciones de verificación de Pusher
    this.pusherNotificationService.getVerificationUpdates()
      .pipe(
        takeUntil(this.destroy$),
        filter(notification => notification !== null)
      )
      .subscribe(notification => {
        if (notification) {
          this.updateCommissionFromNotification(notification);
        }
      });
  }

  loadIntegrationData(): void {
    this.loading = true;
    this.error = null;
    
    const filters = this.getActiveFilters();
    
    this.hrIntegrationService.getIntegrationData(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.integrationData = data;
          this.employees = data.employees;
          this.updateCharts();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar datos de integración';
          this.loading = false;
          toast.error('Error al cargar datos');
        }
      });
  }

  private getActiveFilters(): any {
    const formValue = this.filterForm.value;
    const filters: any = {};
    
    Object.keys(formValue).forEach(key => {
      const value = formValue[key as keyof typeof formValue];
      if (value !== null && value !== undefined && value !== '') {
        filters[key] = value;
      }
    });
    
    return filters;
  }

  private updateCharts(): void {
    if (!this.integrationData) return;
    
    this.updateVerificationStatusChart();
    this.updateCommissionAmountChart();
  }

  private updateVerificationStatusChart(): void {
    if (!this.integrationData) return;
    
    const stats = this.integrationData.stats;
    
    this.verificationStatusChart = {
      labels: ['Pendientes', 'Verificadas', 'Fallidas'],
      datasets: [{
        data: [
          stats.pending_verification_commissions,
          stats.verified_commissions,
          stats.failed_verification_commissions
        ],
        backgroundColor: ['#ff9800', '#4caf50', '#f44336'],
        borderWidth: 0
      }]
    };
  }

  private updateCommissionAmountChart(): void {
    if (!this.integrationData) return;
    
    const stats = this.integrationData.stats;
    
    this.commissionAmountChart = {
      labels: ['Monto Pendiente', 'Monto Verificado'],
      datasets: [{
        label: 'Montos de Comisiones',
        data: [stats.pending_amount, stats.verified_amount],
        backgroundColor: ['#ff9800', '#4caf50'],
        borderColor: ['#f57c00', '#388e3c'],
        borderWidth: 1
      }]
    };
  }

  refreshData(): void {
    this.loadIntegrationData();
  }

  syncData(): void {
    this.loading = true;
    
    this.hrIntegrationService.syncHRCollectionsData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          toast.success('Sincronización completada');
          this.loadIntegrationData();
        },
        error: () => {
          this.loading = false;
          toast.error('Error en la sincronización');
        }
      });
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  toggleCommissionSelection(commissionId: number): void {
    const index = this.selectedCommissions.indexOf(commissionId);
    if (index > -1) {
      this.selectedCommissions.splice(index, 1);
    } else {
      this.selectedCommissions.push(commissionId);
    }
  }

  isCommissionSelected(commissionId: number): boolean {
    return this.selectedCommissions.includes(commissionId);
  }

  isAllSelected(): boolean {
    if (!this.integrationData) return false;
    const eligibleCommissions = this.integrationData.commissions.filter(c => c.verification_summary?.can_be_paid);
    return eligibleCommissions.length > 0 && this.selectedCommissions.length === eligibleCommissions.length;
  }

  isIndeterminate(): boolean {
    if (!this.integrationData) return false;
    const eligibleCommissions = this.integrationData.commissions.filter(c => c.verification_summary?.can_be_paid);
    return this.selectedCommissions.length > 0 && this.selectedCommissions.length < eligibleCommissions.length;
  }

  selectAllCommissions(): void {
    if (!this.integrationData) return;
    
    this.selectedCommissions = this.integrationData.commissions
      .filter(c => c.verification_summary?.can_be_paid)
      .map(c => c.commission_id);
  }

  clearSelection(): void {
    this.selectedCommissions = [];
  }

  processSelectedCommissions(): void {
    if (this.selectedCommissions.length === 0) {
      toast.warning('Seleccione al menos una comisión');
      return;
    }
    
    this.hrIntegrationService.processEligibleCommissions(this.selectedCommissions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          toast.success('Comisiones procesadas exitosamente');
          this.clearSelection();
          this.loadIntegrationData();
        },
        error: () => {
          toast.error('Error al procesar comisiones');
        }
      });
  }

  markAsEligible(): void {
    if (this.selectedCommissions.length === 0) {
      toast.warning('Seleccione al menos una comisión');
      return;
    }
    
    this.hrIntegrationService.markCommissionsAsEligible(this.selectedCommissions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          toast.success('Comisiones marcadas como elegibles');
          this.clearSelection();
          this.loadIntegrationData();
        },
        error: () => {
          toast.error('Error al marcar comisiones');
        }
      });
  }

  exportData(): void {
    const filters = this.getActiveFilters();
    
    this.hrIntegrationService.exportIntegrationData(filters, 'csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `integracion-hr-collections-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          toast.error('Error al exportar datos');
        }
      });
  }

  getVerificationStatusLabel(status: string): string {
    const statusObj = this.verificationStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getCommissionStatusLabel(status: string): string {
    const statusObj = this.commissionStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getVerificationStatusColor(status: string): string {
    switch (status) {
      case 'pending_verification': return 'warn';
      case 'fully_verified': return 'primary';
      case 'verification_failed': return 'accent';
      default: return '';
    }
  }

  private updateCommissionFromNotification(notificationData: any): void {
    if (!this.integrationData) return;
    
    const commissionIndex = this.integrationData.commissions.findIndex(
      c => c.commission_id === notificationData.commission_id
    );
    
    if (commissionIndex > -1) {
      // Actualizar la comisión específica
      this.hrIntegrationService.getVerificationSummaryForCommission(notificationData.commission_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(summary => {
          if (this.integrationData) {
            this.integrationData.commissions[commissionIndex].verification_summary = summary;
          }
        });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  }
}