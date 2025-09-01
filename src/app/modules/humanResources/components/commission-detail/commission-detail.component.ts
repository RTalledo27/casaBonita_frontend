import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, User, Calendar, DollarSign, FileText, CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-angular';

import { CommissionService } from '../../services/commission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Commission } from '../../models/commission';

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
  loading = signal(true);
  error = signal<string | null>(null);

  // Options
  monthOptions = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCommission(+id);
    } else {
      this.error.set('ID de comisión no válido');
      this.loading.set(false);
    }
  }

  private loadCommission(id: number) {
    this.loading.set(true);
    this.commissionService.getCommission(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.commission.set(response.data);
          
          // Si es una comisión padre (general), redirigir a sales-detail
          if (this.isParentCommission(response.data)) {
            this.redirectToSalesDetail(response.data);
            return;
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
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