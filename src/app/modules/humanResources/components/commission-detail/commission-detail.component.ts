import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, User, Calendar, DollarSign, FileText, CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-angular';

import { CommissionService, ContractDetail, PaymentScheduleItem, CommissionWithContractDetails, ChildCommissionPercentage } from '../../services/commission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Commission } from '../../models/commission';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-commission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './commission-detail.component.html',
  styleUrls: ['./commission-detail.component.scss']
})
export class CommissionDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private commissionService = inject(CommissionService);
  private toastService = inject(ToastService);

  // Icons
  ArrowLeft = ArrowLeft;
  User = User;
  Calendar = Calendar;
  DollarSign = DollarSign;
  FileText = FileText;
  CheckCircle = CheckCircle;
  Clock = Clock;
  XCircle = XCircle;
  Edit = Edit;
  Trash2 = Trash2;

  // Signals
  commission = signal<Commission | null>(null);
  contractDetails = signal<ContractDetail | null>(null);
  paymentSchedule = signal<PaymentScheduleItem[]>([]);
  childCommissionsPercentage = signal<ChildCommissionPercentage[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  loadingContractDetails = signal<boolean>(false);

  // Options
  monthOptions = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCommission(+id);
    } else {
      this.error.set('ID de comisión no válido');
      this.loading.set(false);
    }
  }

  private loadCommission(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    
    // Cargar información completa de la comisión con detalles del contrato
    this.commissionService.getCommissionWithContractDetails(id).subscribe({
      next: (data) => {
        this.commission.set(data.commission);
        this.contractDetails.set(data.contract);
        this.paymentSchedule.set(data.payment_schedule);
        this.childCommissionsPercentage.set(data.child_commissions_percentage);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading commission with contract details:', error);
        // Fallback: cargar solo la comisión si el endpoint completo falla
        this.loadBasicCommission(id);
      }
    });
  }

  private loadBasicCommission(id: number): void {
    this.commissionService.getCommission(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.commission.set(response.data);
          
          // Si es una comisión padre (general), redirigir a sales-detail
          if (this.isParentCommission(response.data)) {
            this.redirectToSalesDetail(response.data);
            return;
          }
          
          // Cargar detalles del contrato por separado si existe contract_id
          if (response.data.contract_id) {
            this.loadContractDetails(response.data.contract_id);
          }
        } else {
          this.error.set('No se pudo cargar la comisión');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading commission:', error);
        this.error.set('Error al cargar la comisión');
        this.loading.set(false);
      }
    });
  }

  private loadContractDetails(contractId: number): void {
    this.loadingContractDetails.set(true);
    
    // Cargar detalles del contrato
    this.commissionService.getContractDetails(contractId).subscribe({
      next: (contract) => {
        this.contractDetails.set(contract);
        this.loadingContractDetails.set(false);
      },
      error: (error) => {
        console.error('Error loading contract details:', error);
        this.loadingContractDetails.set(false);
      }
    });

    // Cargar cronograma de pagos
    this.commissionService.getContractPaymentSchedule(contractId).subscribe({
      next: (schedule) => {
        this.paymentSchedule.set(schedule);
      },
      error: (error) => {
        console.error('Error loading payment schedule:', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/human-resources/commissions']);
  }

  editCommission() {
    const commission = this.commission();
    if (commission) {
      this.router.navigate(['/human-resources/commissions/edit', commission.commission_id]);
    }
  }

  deleteCommission() {
    const commission = this.commission();
    if (commission && confirm('¿Está seguro de que desea eliminar esta comisión?')) {
      this.commissionService.deleteCommission(commission.commission_id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Comisión eliminada exitosamente');
            this.router.navigate(['/human-resources/commissions']);
          }
        },
        error: (error) => {
          console.error('Error deleting commission:', error);
          this.toastService.error('Error al eliminar la comisión');
        }
      });
    }
  }

  payCommission() {
    const commission = this.commission();
    if (commission && commission.payment_status === 'pendiente') {
      this.commissionService.payCommissions([commission.commission_id]).subscribe({
        next: (response) => {
          this.toastService.success('Comisión marcada como pagada');
          this.loadCommission(commission.commission_id); // Reload to get updated data
        },
        error: (error) => {
          console.error('Error paying commission:', error);
          this.toastService.error('Error al marcar la comisión como pagada');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'fully_paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'pagado':
        return CheckCircle;
      case 'pendiente':
        return Clock;
      case 'cancelado':
        return XCircle;
      default:
        return Clock;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'generated':
        return 'Generada';
      case 'partially_paid':
        return 'Parcialmente Pagada';
      case 'fully_paid':
        return 'Completamente Pagada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  hasPaymentSplitInfo(): boolean {
    const commission = this.commission();
    if (!commission) return false;
    
    return !!(commission.commission_period || 
             commission.payment_period || 
             commission.payment_percentage || 
             commission.payment_part || 
             commission.status);
  }

  hasRelatedCommissions(): boolean {
    const commission = this.commission();
    if (!commission) return false;
    
    return !!(commission.parent_commission || 
             (commission.child_commissions && commission.child_commissions.length > 0));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Calcular el porcentaje total de comisiones hijas
  getTotalChildCommissionsPercentage(): number {
    return this.childCommissionsPercentage().reduce((total, child) => {
      return total + (child.percentage_of_parent || 0);
    }, 0);
  }

  // Verificar si hay información del contrato
  hasContractDetails(): boolean {
    return this.contractDetails() !== null;
  }

  // Verificar si hay cronograma de pagos
  hasPaymentSchedule(): boolean {
    return this.paymentSchedule().length > 0;
  }

  // Verificar si hay comisiones hijas con porcentajes
  hasChildCommissionsWithPercentages(): boolean {
    return this.childCommissionsPercentage().length > 0;
  }

  // Obtener el estado del cronograma de pagos
  getPaymentScheduleStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200',
      'partial': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  // Obtener etiqueta del estado del cronograma
  getPaymentScheduleStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'paid': 'Pagado',
      'overdue': 'Vencido',
      'partial': 'Pago Parcial'
    };
    return statusLabels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonthName(month: number): string {
    return this.monthOptions[month - 1] || 'Mes inválido';
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  // Nuevos métodos para los campos adicionales
  getPaymentTypeLabel(paymentType: string): string {
    switch (paymentType) {
      case 'first_payment':
        return 'Primer Pago';
      case 'second_payment':
        return 'Segundo Pago';
      case 'full_payment':
        return 'Pago Completo';
      default:
        return paymentType;
    }
  }

  canPayCommission(): boolean {
    const commission = this.commission();
    return commission?.payment_status === 'pendiente';
  }

  canEditCommission(): boolean {
    const commission = this.commission();
    return commission?.payment_status !== 'pagado';
  }

  canDeleteCommission(): boolean {
    const commission = this.commission();
    return commission?.payment_status === 'pendiente';
  }

  getEmployeeName(): string {
    const commission = this.commission();
    if (!commission?.employee?.user) {
      return 'N/A';
    }
    
    const user = commission.employee.user;
    const firstName = user.first_name;
    const lastName = user.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return firstName || lastName || 'N/A';
  }

  // Método para detectar si es una comisión padre
  isParentCommission(commission: Commission): boolean {
    return !!(commission.child_commissions && commission.child_commissions.length > 0);
  }

  // Método para redirigir a sales-detail con los parámetros correctos
  private redirectToSalesDetail(commission: Commission): void {
    const employeeId = commission.employee_id;
    const month = commission.period_month;
    const year = commission.period_year;
    
    this.router.navigate(['/human-resources/commissions/sales-detail'], {
      queryParams: {
        employee_id: employeeId,
        month: month,
        year: year
      }
    });
  }
}