import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, DollarSign, CheckCircle, Clock, TrendingUp, XCircle, Eye, Edit, Trash2, Split } from 'lucide-angular';
import { Commission } from '../../models/commission';
import { CommissionService } from '../../services/commission.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-advisor-commissions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './advisor-commissions.component.html',
  styleUrls: ['./advisor-commissions.component.css']
})
export class AdvisorCommissionsComponent implements OnInit {
  // Lucide Icons
  readonly ArrowLeft = ArrowLeft;
  readonly DollarSign = DollarSign;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly TrendingUp = TrendingUp;
  readonly XCircle = XCircle;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Split = Split;

  // Signals
  commissions = signal<Commission[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Route parameters
  employeeName = signal<string>('');
  employeeId = signal<number | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());

  // Computed properties
  totalAmount = computed(() => {
    return this.commissions().reduce((sum, commission) => sum + this.parseAmount(commission.commission_amount), 0);
  });

  paidAmount = computed(() => {
    return this.commissions()
      .filter(commission => commission.payment_status === 'pagado')
      .reduce((sum, commission) => sum + this.parseAmount(commission.commission_amount), 0);
  });

  pendingAmount = computed(() => {
    return this.commissions()
      .filter(commission => commission.payment_status === 'pendiente')
      .reduce((sum, commission) => sum + this.parseAmount(commission.commission_amount), 0);
  });

  paidCount = computed(() => {
    return this.commissions().filter(commission => commission.payment_status === 'pagado').length;
  });

  pendingCount = computed(() => {
    return this.commissions().filter(commission => commission.payment_status === 'pendiente').length;
  });

  paymentPercentage = computed(() => {
    const total = this.totalAmount();
    if (total === 0) return 0;
    return Math.round((this.paidAmount() / total) * 100);
  });

  monthName = computed(() => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[this.selectedMonth() - 1] || '';
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commissionService: CommissionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.employeeName.set(params['employee'] || '');
      this.employeeId.set(params['employeeId'] ? parseInt(params['employeeId']) : null);
      this.selectedMonth.set(parseInt(params['month']) || new Date().getMonth() + 1);
      this.selectedYear.set(parseInt(params['year']) || new Date().getFullYear());
      this.loadCommissions();
    });
  }

  loadCommissions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.commissionService.getCommissions().subscribe({
      next: (response) => {
        // Filter commissions by employee ID (more precise) or name, month, and year
        const safeData = Array.isArray(response.data) ? response.data : [];
        const filteredCommissions = safeData.filter((commission: Commission) => {
          let employeeMatch = false;
          
          // Use employee ID if available (more precise)
          if (this.employeeId()) {
            employeeMatch = commission.employee?.employee_id === this.employeeId();
          } else {
            // Fallback to name matching
            const fullName = `${commission.employee?.user?.first_name} ${commission.employee?.user?.last_name}`.toLowerCase();
            employeeMatch = fullName.includes(this.employeeName().toLowerCase());
          }
          
          const monthMatch = commission.period_month === this.selectedMonth();
          const yearMatch = commission.period_year === this.selectedYear();
          return employeeMatch && monthMatch && yearMatch;
        });
        
        console.log('Filtered commissions for employee:', {
          employeeId: this.employeeId(),
          employeeName: this.employeeName(),
          month: this.selectedMonth(),
          year: this.selectedYear(),
          totalCommissions: safeData.length,
          filteredCommissions: filteredCommissions.length
        });
        
        this.commissions.set(filteredCommissions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading commissions:', error);
        this.error.set('Error al cargar las comisiones. Por favor, intenta nuevamente.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hr/commissions']);
  }

  hasPendingCommissions(): boolean {
    return this.commissions().some(commission => commission.payment_status === 'pendiente');
  }

  payAllPendingCommissions(): void {
    const pendingCommissions = this.commissions().filter(commission => commission.payment_status === 'pendiente');
    
    if (pendingCommissions.length === 0) {
      this.toastService.show('No hay comisiones pendientes para pagar', 'info');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres marcar como pagadas todas las ${pendingCommissions.length} comisiones pendientes?`)) {
      let processedCount = 0;
      let errorCount = 0;

      const commissionIds = pendingCommissions.map(c => c.commission_id);
      
      this.commissionService.payCommissions(commissionIds).subscribe({
        next: () => {
          // Update all commission statuses in the local array
          const updatedCommissions = this.commissions().map(c => 
            commissionIds.includes(c.commission_id)
              ? { ...c, payment_status: 'pagado' as const, payment_date: new Date().toISOString() }
              : c
          );
          this.commissions.set(updatedCommissions);
          this.toastService.show(`Se marcaron como pagadas ${pendingCommissions.length} comisiones exitosamente`, 'success');
        },
        error: (error: any) => {
          console.error('Error paying commissions:', error);
          this.toastService.show('Error al procesar las comisiones', 'error');
        }
      });
    }
  }

  viewCommissionDetail(commission: Commission): void {
    this.router.navigate(['/hr/commissions/view', commission.commission_id]);
  }

  editCommission(commission: Commission): void {
    this.router.navigate(['/hr/commissions/edit', commission.commission_id]);
  }

  payCommission(commission: Commission): void {
    if (confirm('¿Estás seguro de que quieres marcar esta comisión como pagada?')) {
      this.commissionService.payCommissions([commission.commission_id]).subscribe({
        next: () => {
          // Update the commission status in the local array
          const updatedCommissions = this.commissions().map(c => 
            c.commission_id === commission.commission_id 
              ? { ...c, payment_status: 'pagado' as const, payment_date: new Date().toISOString() }
              : c
          );
          this.commissions.set(updatedCommissions);
          this.toastService.show('Comisión marcada como pagada exitosamente', 'success');
        },
        error: (error: any) => {
          console.error('Error paying commission:', error);
          this.toastService.show('Error al marcar la comisión como pagada', 'error');
        }
      });
    }
  }

  deleteCommission(commission: Commission): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta comisión? Esta acción no se puede deshacer.')) {
      this.commissionService.deleteCommission(commission.commission_id).subscribe({
        next: () => {
          // Remove the commission from the local array
          const updatedCommissions = this.commissions().filter(c => c.commission_id !== commission.commission_id);
          this.commissions.set(updatedCommissions);
          this.toastService.show('Comisión eliminada exitosamente', 'success');
        },
        error: (error) => {
          console.error('Error deleting commission:', error);
          this.toastService.show('Error al eliminar la comisión', 'error');
        }
      });
    }
  }

  // Helper functions
  canEditCommission(commission: Commission): boolean {
    return commission.payment_status === 'pendiente';
  }

  canPayCommission(commission: Commission): boolean {
    return commission.payment_status === 'pendiente';
  }

  canDeleteCommission(commission: Commission): boolean {
    return commission.payment_status === 'pendiente';
  }

  canCreateSplitPayment(commission: Commission): boolean {
    return commission.payment_status === 'pendiente' && this.parseAmount(commission.commission_amount) > 0;
  }

  createSplitPayment(commission: Commission): void {
    this.router.navigate(['/hr/commissions/split-payment', commission.commission_id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagada';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelada';
      default:
        return 'Desconocido';
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

  getCommissionTypeLabel(type: string | undefined): string {
    if (!type) return 'No especificado';
    
    switch (type) {
      case 'venta_financiada':
        return 'Venta Financiada';
      case 'venta_contado':
        return 'Venta al Contado';
      case 'referido':
        return 'Referido';
      case 'bono':
        return 'Bono';
      default:
        return type || 'No especificado';
    }
  }

  isParentCommission(commission: Commission): boolean {
    return !commission.parent_commission_id;
  }

  isSplitCommission(commission: Commission): boolean {
    return !!commission.parent_commission_id;
  }

  getCommissionHierarchyLabel(commission: Commission): string {
    if (this.isParentCommission(commission)) {
      return commission.child_commissions && commission.child_commissions.length > 0 
        ? 'Comisión General (con divisiones)' 
        : 'Comisión General';
    } else {
      return `División ${commission.payment_part || 'N/A'}`;
    }
  }

  getCommissionTypeClass(commission: Commission): string {
    if (this.isParentCommission(commission)) {
      return commission.child_commissions && commission.child_commissions.length > 0
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    } else {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  }

  formatCurrency(amount: number | string): string {
    const numericAmount = typeof amount === 'string' ? this.parseAmount(amount) : amount;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(numericAmount);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'No especificada';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  }

  parseAmount(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      // Remove currency symbols and parse
      const cleanAmount = amount.replace(/[^\d.-]/g, '');
      return parseFloat(cleanAmount) || 0;
    }
    return 0;
  }

  trackByCommissionId(index: number, commission: Commission): number {
    return commission.commission_id;
  }
}