import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, User, Calendar, DollarSign, FileText, Download, Edit, Trash2, CheckCircle, XCircle, Clock, Play, Check, Settings } from 'lucide-angular';
import { PayrollService } from '../../services/payroll.service';
import { Payroll } from '../../models/payroll';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-payroll-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './payroll-view.component.html',
  styleUrl: './payroll-view.component.scss'
})
export class PayrollViewComponent implements OnInit {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly Play = Play;
  readonly Check = Check;
  readonly Settings = Settings;

  payroll: Payroll | null = null;
  isLoading = false;
  isProcessing = false;
  payrollId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private payrollService: PayrollService
  ) {
    this.payrollId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    if (this.payrollId) {
      this.loadPayroll();
    } else {
      this.toastService.error('ID de nómina no válido');
      this.router.navigate(['/hr/payroll']);
    }
  }

  private loadPayroll(): void {
    this.isLoading = true;
    this.payrollService.getPayroll(this.payrollId).subscribe({
      next: (payroll) => {
        this.payroll = payroll;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payroll:', error);
        this.toastService.error('Error al cargar la nómina');
        this.isLoading = false;
        this.router.navigate(['/hr/payroll']);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/hr/payroll']);
  }

  onEdit(): void {
    if (this.payroll && this.canEdit()) {
      this.router.navigate(['/hr/payroll/edit', this.payroll.payroll_id]);
    }
  }

  onDelete(): void {
    if (this.payroll && this.canDelete()) {
      if (confirm('¿Está seguro de que desea eliminar esta nómina?')) {
        // Implementar eliminación cuando esté disponible en el backend
        this.toastService.info('Función de eliminación en desarrollo');
      }
    }
  }

  onDownloadPayslip(): void {
    if (this.payroll) {
      // Implementar descarga de comprobante cuando esté disponible
      this.toastService.info('Descargando comprobante de pago...');
    }
  }

  onProcess(): void {
    if (this.payroll && this.canProcess()) {
      this.isProcessing = true;
      this.payrollService.processPayroll(this.payroll.payroll_id).subscribe({
        next: (success) => {
          if (success) {
            this.toastService.success('Nómina procesada exitosamente');
            this.loadPayroll(); // Recargar para actualizar el estado
          } else {
            this.toastService.error('No se pudo procesar la nómina');
          }
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error processing payroll:', error);
          this.toastService.error('Error al procesar la nómina: ' + (error.error?.message || error.message));
          this.isProcessing = false;
        }
      });
    }
  }

  onApprove(): void {
    if (this.payroll && this.canApprove()) {
      this.isProcessing = true;
      this.payrollService.approvePayroll(this.payroll.payroll_id).subscribe({
        next: (success) => {
          if (success) {
            this.toastService.success('Nómina aprobada exitosamente');
            this.loadPayroll(); // Recargar para actualizar el estado
          } else {
            this.toastService.error('No se pudo aprobar la nómina');
          }
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error approving payroll:', error);
          this.toastService.error('Error al aprobar la nómina: ' + (error.error?.message || error.message));
          this.isProcessing = false;
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'status-paid';
      case 'aprobado':
        return 'status-approved';
      case 'procesado':
        return 'status-processed';
      case 'pendiente':
        return 'status-pending';
      case 'borrador':
        return 'status-draft';
      case 'cancelado':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
      case 'pagado':
      case 'aprobado':
        return CheckCircle;
      case 'procesado':
      case 'pendiente':
        return Clock;
      case 'cancelado':
        return XCircle;
      default:
        return Clock;
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'Pagado';
      case 'aprobado':
        return 'Aprobado';
      case 'procesado':
        return 'Procesado';
      case 'pendiente':
        return 'Pendiente';
      case 'borrador':
        return 'Borrador';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status || 'Pendiente';
    }
  }

  formatCurrency(amount: number | string): string {
    // Convertir a número de forma segura
    let numericAmount: number;
    
    if (typeof amount === 'string') {
      // Si es string, intentar extraer solo el primer número válido
      const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
      const firstNumber = cleanAmount.split('.')[0] + '.' + (cleanAmount.split('.')[1] || '0');
      numericAmount = parseFloat(firstNumber) || 0;
    } else {
      numericAmount = amount || 0;
    }
    
    // Validar que sea un número válido
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      numericAmount = 0;
    }
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(numericAmount);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString('es-PE', {
      month: 'short',
      day: 'numeric'
    });
    const end = new Date(endDate).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${start} - ${end}`;
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEmployeeName(): string {
    if (!this.payroll?.employee) return 'N/A';
    return this.payroll.employee.full_name || this.payroll.employee.employee_code || 'N/A';
  }

  getEmployeeInitials(): string {
    const name = this.getEmployeeName();
    if (!name || name === 'N/A') return '';
    
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  canEdit(): boolean {
    return this.payroll?.status === 'borrador' || this.payroll?.status === 'pendiente';
  }

  canDelete(): boolean {
    return this.payroll?.status === 'borrador';
  }

  canProcess(): boolean {
    return this.payroll?.status === 'borrador' || this.payroll?.status === 'pendiente';
  }

  canApprove(): boolean {
    return this.payroll?.status === 'procesado';
  }
}