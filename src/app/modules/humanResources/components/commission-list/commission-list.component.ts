import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, DollarSign, Calendar, Filter, Search, Eye, CheckCircle, XCircle, Clock, TrendingUp, Plus, Edit, Trash2, FileText, ChevronRight, Users, AlertTriangle, Shield, CheckCircle2, CreditCard, RefreshCcw, RefreshCw } from 'lucide-angular';
import { CommissionService } from '../../services/commission.service';
import { Commission } from '../../models/commission';
import { ToastService } from '../../../../core/services/toast.service';
import { Employee } from '../../models/employee';

// Interface para agrupar comisiones por asesor
interface AdvisorCommissionGroup {
  employee: Employee;
  commissions: Commission[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  overallStatus: 'all_paid' | 'partial_paid' | 'all_pending';
  paymentPercentage: number;
}

@Component({
  selector: 'app-commission-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './commission-list.component.html',
  styleUrls: ['./commission-list.component.scss']
})
export class CommissionListComponent implements OnInit {
  private commissionService = inject(CommissionService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  commissions = signal<Commission[]>([]);
  loading = signal<boolean>(false);
  processing = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalCommissions = signal<number>(0);
  showSplitPayments = signal<boolean>(false);

  // Iconos de Lucide
  DollarSign = DollarSign;
  Calendar = Calendar;
  Filter = Filter;
  Search = Search;
  Eye = Eye;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  TrendingUp = TrendingUp;
  Plus = Plus;
  Edit = Edit;
  Trash2 = Trash2;
  FileText = FileText;
  ChevronRight = ChevronRight;
  Users = Users;
  AlertTriangle = AlertTriangle;
  Shield = Shield;
  CheckCircle2 = CheckCircle2;
  CreditCard = CreditCard;
  RefreshCw =  RefreshCw;

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'generated', label: 'Generada' },
    { value: 'partially_paid', label: 'Parcialmente Pagada' },
    { value: 'fully_paid', label: 'Completamente Pagada' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  monthOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year, label: year.toString() };
  });

  // Computed para comisiones filtradas
  filteredCommissions = computed(() => {
    const commissions = this.commissions();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();

    return commissions.filter(commission => {
      const matchesSearch = !search || 
        commission.employee?.user?.first_name?.toLowerCase().includes(search) ||
        commission.employee?.user?.last_name?.toLowerCase().includes(search) ||
        commission.employee?.employee_code?.toLowerCase().includes(search);

      const matchesStatus = !status || commission.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // Comisiones paginadas
  paginatedCommissions = computed(() => {
    const filtered = this.filteredCommissions();
    const itemsPerPage = 10;
    const startIndex = (this.currentPage() - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Actualizar total de páginas
    this.totalPages.set(Math.ceil(filtered.length / itemsPerPage));
    this.totalCommissions.set(filtered.length);
    
    return filtered.slice(startIndex, endIndex);
  });

  // Computed para comisiones agrupadas por asesor
  groupedCommissions = computed(() => {
    const commissions = this.filteredCommissions();
    const grouped = new Map<number, AdvisorCommissionGroup>();
    
    commissions.forEach((commission) => {
      console.log("ESTRUCTURA DE COMISION:",commission);
      const employeeId = commission.employee.employee_id;
      console.log("IDE DE EMPLEADO:",employeeId);
      if (!grouped.has(employeeId)) {
        grouped.set(employeeId, {
          employee: commission.employee,
          commissions: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          overallStatus: 'all_pending',
          paymentPercentage: 0
        });
      }

      const group = grouped.get(employeeId)!;
      group.commissions.push(commission);
      
      const amount = this.parseAmount(commission.commission_amount);
      group.totalAmount += amount;
      
      if (commission.payment_status === 'pagado') {
        group.paidAmount += amount;
        group.paidCount++;
      } else if (commission.payment_status === 'pendiente') {
        group.pendingAmount += amount;
        group.pendingCount++;
      }
    });

    // Calcular estado general y porcentaje de pago
    grouped.forEach(group => {
      if (group.paidCount === group.commissions.length) {
        group.overallStatus = 'all_paid';
        group.paymentPercentage = 100;
      } else if (group.paidCount > 0) {
        group.overallStatus = 'partial_paid';
        group.paymentPercentage = Math.round((group.paidCount / group.commissions.length) * 100);
      } else {
        group.overallStatus = 'all_pending';
        group.paymentPercentage = 0;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      // Ordenar por estado (pendientes primero) y luego por nombre
      if (a.overallStatus !== b.overallStatus) {
        const statusOrder = { 'all_pending': 0, 'partial_paid': 1, 'all_paid': 2 };
        return statusOrder[a.overallStatus] - statusOrder[b.overallStatus];
      }
      const nameA = `${a.employee?.user?.first_name} ${a.employee?.user?.last_name}`.toLowerCase();
      const nameB = `${b.employee?.user?.first_name} ${b.employee?.user?.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });

  // Computed para estadísticas
  totalAmount = computed(() => {
    return this.filteredCommissions().reduce((sum, commission) => sum + (commission.commission_amount || 0), 0);
  });

  paidAmount = computed(() => {
    return this.filteredCommissions()
      .filter(c => c.payment_status === 'pagado')
      .reduce((sum, commission) => sum + (commission.commission_amount || 0), 0);
  });

  pendingAmount = computed(() => {
    const filtered = this.filteredCommissions();
    const pending = filtered.filter(c => c.payment_status === 'pendiente');
    
    return pending.reduce((sum, commission) => {
      const amount = commission.commission_amount;
      // Convertir a número de forma segura
      let numericAmount = 0;
      if (typeof amount === 'string') {
        numericAmount = parseFloat(amount) || 0;
      } else if (typeof amount === 'number') {
        numericAmount = amount;
      }
      return sum + numericAmount;
    }, 0);
  });

  ngOnInit() {
    this.loadCommissions();
  }

  async loadCommissions() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Crear el período de comisión en formato YYYY-MM
      const commissionPeriod = `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}`;
      
      const response = await this.commissionService.getCommissions({
        commission_period: commissionPeriod,
        status: this.selectedStatus(),
        search: this.searchTerm(),
        page: this.currentPage(),
        per_page: 20,
        include_split_payments: this.showSplitPayments()
      }).toPromise();
      
      if (response) {
        this.commissions.set(response.data);
        this.totalPages.set(response.meta?.last_page || 1);
        this.totalCommissions.set(response.meta?.total || 0);
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
      this.error.set('Error al cargar las comisiones');
      this.toastService.error('Error al cargar las comisiones');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadCommissions();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadCommissions();
  }

  toggleSplitPayments() {
    this.showSplitPayments.set(!this.showSplitPayments());
    this.currentPage.set(1);
    this.loadCommissions();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadCommissions();
  }

  createCommission() {
    this.router.navigate(['/hr/commissions/create']);
  }

  viewSalesDetail() {
    this.router.navigate(['/hr/commissions/sales-detail']);
  }

  editCommission(commission: Commission) {
    this.router.navigate(['/hr/commissions/edit', commission.commission_id]);
  }

  viewCommissionDetail(commission: Commission) {
    this.router.navigate(['/hr/commissions/view', commission.commission_id]);
  }

  async deleteCommission(commission: Commission) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la comisión de ${commission.employee?.user?.first_name} ${commission.employee?.user?.last_name}?`)) {
      return;
    }

    try {
      await this.commissionService.deleteCommission(commission.commission_id).toPromise();
      this.toastService.success('Comisión eliminada exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error deleting commission:', error);
      this.toastService.error('Error al eliminar la comisión');
    }
  }

  async processCommissions() {
    if (!confirm('¿Estás seguro de que deseas procesar las comisiones para este período?')) {
      return;
    }

    this.processing.set(true);
    try {
      // Crear el período de comisión en formato YYYY-MM
      const commissionPeriod = `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}`;
      
      await this.commissionService.processCommissionsForPeriod(
        commissionPeriod
      ).toPromise();
      
      this.toastService.success('Comisiones procesadas exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error processing commissions:', error);
      this.toastService.error('Error al procesar las comisiones');
    } finally {
      this.processing.set(false);
    }
  }

  canPayCommission(commission: Commission): boolean {
    return commission.payment_status === 'pendiente';
  }

  canEditCommission(commission: Commission): boolean {
    return commission.payment_status !== 'pagado';
  }

  canDeleteCommission(commission: Commission): boolean {
    return commission.payment_status !== 'pagado';
  }

  canCreateSplitPayment(commission: Commission): boolean {
    return commission.status === 'generated' || commission.status === 'partially_paid';
  }

  async payCommission(commission: Commission) {
    if (!confirm(`¿Confirmar el pago completo de la comisión de ${commission.employee?.user?.first_name} ${commission.employee?.user?.last_name}?`)) {
      return;
    }

    try {
      await this.commissionService.markMultipleAsPaid([commission.commission_id]).toPromise();
      this.toastService.success('Comisión pagada exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error paying commission:', error);
      this.toastService.error('Error al pagar la comisión');
    }
  }

  createSplitPayment(commission: Commission) {
    this.router.navigate(['/hr/commissions/split-payment', commission.commission_id]);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'fully_paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      case 'generated':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Sin Estado';
    
    switch (status) {
      case 'fully_paid':
        return 'Completamente Pagada';
      case 'partially_paid':
        return 'Parcialmente Pagada';
      case 'generated':
        return 'Generada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status || 'Sin Estado';
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'fully_paid':
        return CheckCircle;
      case 'partially_paid':
        return Clock;
      case 'generated':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  }

  getCommissionTypeLabel(type: string | undefined): string {
    if (!type) return 'No especificado';
    
    switch (type) {
      case 'sale': return 'Venta';
      case 'bonus': return 'Bono';
      case 'incentive': return 'Incentivo';
      default: return type;
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
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByCommissionId(index: number, commission: Commission): number {
    return commission.commission_id;
  }

  trackByAdvisorId(index: number, advisorGroup: AdvisorCommissionGroup): number {
    return advisorGroup.employee.employee_id || index;
  }

  // Función auxiliar para parsear montos
  parseAmount(amount: number | string): number {
    if (typeof amount === 'string') {
      const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
      const firstNumber = cleanAmount.split('.')[0] + '.' + (cleanAmount.split('.')[1] || '0');
      return parseFloat(firstNumber) || 0;
    }
    return amount || 0;
  }

  // Funciones para el estado general del asesor
  getOverallStatusClass(status: string): string {
    switch (status) {
      case 'all_paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial_paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getOverallStatusLabel(status: string): string {
    switch (status) {
      case 'all_paid':
        return 'Completamente Pagado';
      case 'partial_paid':
        return 'Parcialmente Pagado';
      case 'all_pending':
        return 'Pendiente de Pago';
      default:
        return 'Estado Desconocido';
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

  getOverallStatusIcon(status: string) {
    switch (status) {
      case 'all_paid':
        return CheckCircle;
      case 'partial_paid':
        return Clock;
      case 'all_pending':
        return Clock;
      default:
        return Clock;
    }
  }

  // Navegar a la vista de comisiones del asesor
  viewAdvisorCommissions(advisorGroup: AdvisorCommissionGroup) {
    // Navegar a la nueva ruta de comisiones del asesor
    console.log(advisorGroup);
    this.router.navigate(['/hr/commissions/advisor-commissions'], {
      queryParams: {
        month: this.selectedMonth(),
        year: this.selectedYear(),
        employeeId: advisorGroup.employee.employee_id,
        employee: advisorGroup.employee.full_name,
      }
    });
  }

  // Métodos para verificación de pagos del cliente
  requiresPaymentVerification(commission: Commission): boolean {
    return commission.requires_client_payment_verification === true;
  }

  getVerificationStatusClass(status: string | undefined): string {
    switch (status) {
      case 'fully_verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'first_payment_verified':
      case 'second_payment_verified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verification_failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getVerificationStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'fully_verified':
        return 'Completamente Verificado';
      case 'first_payment_verified':
        return 'Primer Pago Verificado';
      case 'second_payment_verified':
        return 'Segundo Pago Verificado';
      case 'pending_verification':
        return 'Pendiente de Verificación';
      case 'verification_failed':
        return 'Verificación Fallida';
      default:
        return 'Sin Verificación';
    }
  }

  getVerificationStatusIcon(status: string | undefined) {
    switch (status) {
      case 'fully_verified':
        return CheckCircle2;
      case 'first_payment_verified':
      case 'second_payment_verified':
        return Shield;
      case 'pending_verification':
        return Clock;
      case 'verification_failed':
        return AlertTriangle;
      default:
        return Clock;
    }
  }

  isEligibleForPayment(commission: Commission): boolean {
    if (!this.requiresPaymentVerification(commission)) {
      return true; // Si no requiere verificación, es elegible
    }
    return commission.is_eligible_for_payment === true;
  }

  getPaymentEligibilityClass(commission: Commission): string {
    if (!this.requiresPaymentVerification(commission)) {
      return 'text-gray-600';
    }
    return this.isEligibleForPayment(commission) 
      ? 'text-green-600' 
      : 'text-red-600';
  }

  getPaymentEligibilityLabel(commission: Commission): string {
    if (!this.requiresPaymentVerification(commission)) {
      return 'No requiere verificación';
    }
    return this.isEligibleForPayment(commission) 
      ? 'Elegible para pago' 
      : 'No elegible para pago';
  }

  formatVerificationDate(date: string | undefined): string {
    if (!date) return 'No verificado';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hasCommissionsRequiringVerification(commissions: Commission[]): boolean {
    return commissions.some(commission => this.requiresPaymentVerification(commission));
  }

  getPaymentTypeLabel(paymentType: string | undefined): string {
    switch (paymentType) {
      case 'first_payment':
        return 'Primer Pago';
      case 'second_payment':
        return 'Segundo Pago';
      case 'full_payment':
        return 'Pago Completo';
      default:
        return paymentType || 'No especificado';
    }
  }

  getPaymentStatusClass(status: string | undefined): string {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  formatPeriod(month: number, year: number): string {
    const monthName = this.monthOptions.find(m => m.value === month)?.label || 'Mes';
    return `${monthName} ${year}`;
  }

  getPaymentProgress(commission: Commission): number {
    if (!commission.child_commissions || commission.child_commissions.length === 0) {
      return commission.payment_status === 'pagado' ? 100 : 0;
    }
    
    const totalAmount = this.parseAmount(commission.commission_amount);
    const paidCommissions = commission.child_commissions
      .filter(child => child.payment_status === 'pagado');
    const paidAmount = paidCommissions
      .reduce((sum, child) => sum + this.parseAmount(child.commission_amount), 0);
    
    return totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  }
}