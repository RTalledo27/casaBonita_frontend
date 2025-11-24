import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, DollarSign, Calendar, Filter, Search, Eye, CheckCircle, XCircle, Clock, TrendingUp, Plus, Edit, Trash2, FileText, ChevronRight, Users, User, AlertTriangle, Shield, CheckCircle2, CreditCard, RefreshCw } from 'lucide-angular';
import { AdvisorCommissionsModalComponent, AdvisorGroup } from '../advisor-commissions-modal/advisor-commissions-modal.component';
import { CommissionService } from '../../services/commission.service';
import { Commission } from '../../models/commission';
import { ToastService } from '../../../../core/services/toast.service';
import { Employee } from '../../models/employee';

// Interface para agrupar comisiones por contrato
interface ContractGroup {
  contractId: number | null;
  contractNumber?: string;
  clientName?: string;
  commissions: Commission[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  paymentPercentage: number;
  overallStatus: string;
}

@Component({
  selector: 'app-commission-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdvisorCommissionsModalComponent],
  templateUrl: './commission-list.component.html',
  styleUrls: ['./commission-list.component.scss']
})
export class CommissionListComponent implements OnInit {

  private commissionService = inject(CommissionService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    console.log('🚀 CommissionListComponent constructor ejecutado');
    // Cargar comisiones al inicializar
    this.loadCommissions();
  }

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
  showSplitPayments = signal<boolean>(false);
  showAdvisorModal = signal<boolean>(false);
  selectedAdvisorGroup = signal<AdvisorGroup | null>(null);

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
  User = User;
  AlertTriangle = AlertTriangle;
  Shield = Shield;
  CheckCircle2 = CheckCircle2;
  CreditCard = CreditCard;
  RefreshCw = RefreshCw;

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

  // Computed para comisiones filtradas - Solo comisiones padre
  filteredCommissions = computed(() => {
    const commissions = this.commissions();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();

    return commissions.filter(commission => {
      // Solo incluir comisiones padre (sin parent_commission_id)
      const isParentCommission = !commission.parent_commission_id;

      const matchesSearch = !search ||
        commission.employee?.user?.first_name?.toLowerCase().includes(search) ||
        commission.employee?.user?.last_name?.toLowerCase().includes(search) ||
        commission.employee?.employee_code?.toLowerCase().includes(search);

      const matchesStatus = !status || commission.status === status;

      return isParentCommission && matchesSearch && matchesStatus;
    });
  });

  // Comisiones paginadas
  paginatedCommissions = computed(() => {
    const filtered = this.filteredCommissions();
    const itemsPerPage = 10;
    const startIndex = (this.currentPage() - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filtered.slice(startIndex, endIndex);
  });

  // Computed property for total pages based on advisor groups
  computedTotalPages = computed(() => {
    const totalGroups = this.groupedCommissions().length;
    return Math.ceil(totalGroups / 10); // 10 groups per page
  });

  computedTotalCommissions = computed(() => {
    return this.filteredCommissions().length;
  });

  // Computed para comisiones agrupadas por asesor - Solo comisiones padre
  groupedCommissions = computed(() => {
    const commissions = this.filteredCommissions();

    console.log('=== DEBUG: Procesando groupedCommissions ===');
    console.log('Comisiones filtradas:', commissions.length);

    const parentCommissions = commissions.filter(commission =>
      !commission.parent_commission_id
    );

    parentCommissions.forEach(commission => {
      const advisorId = commission.employee?.employee_id || 'unknown';
      const advisorName = commission.employee?.user ?
        `${commission.employee.user.first_name} ${commission.employee.user.last_name}` :
        'Sin nombre';

      console.log(`Procesando comisión - ID Asesor: ${advisorId}, Nombre: ${advisorName}`);
    });

    const groups: { [key: string]: AdvisorGroup } = {};

    parentCommissions.forEach((commission) => {
      const employeeId = commission.employee?.employee_id;
      const advisorName = `${commission.employee?.user?.first_name || ''} ${commission.employee?.user?.last_name || ''}`.trim() || 'Nombre no disponible';
      const groupKey = employeeId ? `advisor_${employeeId}` : `name_${advisorName}_${commission.commission_id}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          employee: commission.employee,
          commissions: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          paymentPercentage: 0,
          overallStatus: 'all_pending'
        };
      }

      groups[groupKey].commissions.push(commission);

      const amount = parseFloat(commission.commission_amount?.toString() || '0');
      groups[groupKey].totalAmount += amount;

      if (commission.payment_status === 'pagado') {
        groups[groupKey].paidAmount += amount;
        groups[groupKey].paidCount++;
      } else {
        groups[groupKey].pendingCount++;
      }

      groups[groupKey].pendingAmount = groups[groupKey].totalAmount - groups[groupKey].paidAmount;
      groups[groupKey].paymentPercentage = groups[groupKey].totalAmount > 0
        ? (groups[groupKey].paidAmount / groups[groupKey].totalAmount) * 100
        : 0;

      if (groups[groupKey].paidCount === groups[groupKey].commissions.length) {
        groups[groupKey].overallStatus = 'all_paid';
      } else if (groups[groupKey].paidCount > 0) {
        groups[groupKey].overallStatus = 'partial_paid';
      } else {
        groups[groupKey].overallStatus = 'all_pending';
      }
    });

    const result = Object.values(groups);
    console.log('Grupos finales:', result.length);
    return result;
  });

  // Computed property for paginated grouped commissions
  paginatedGroupedCommissions = computed(() => {
    const allGroups = this.groupedCommissions();
    console.log('=== PAGINATED COMMISSIONS ===');
    console.log('Filtered commissions count:', allGroups.length);
    console.log('Current page:', this.currentPage());
    console.log('Items per page:', 10);
    const itemsPerPage = 10;
    const startIndex = (this.currentPage() - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = allGroups.slice(startIndex, endIndex);
    console.log('Paginated result count:', paginated.length);
    console.log('Paginated advisors:', paginated.map(a => a.commissions[0]?.employee?.user?.first_name + ' ' + a.commissions[0]?.employee?.user?.last_name || 'Nombre no disponible'));
    return paginated;
  });

  // Computed para estadísticas - Solo comisiones padre
  totalAmount = computed(() => {
    return this.filteredCommissions().reduce((sum, commission) => {
      // Ya filtrado por comisiones padre en filteredCommissions
      return sum + this.parseAmount(commission.commission_amount);
    }, 0);
  });

  paidAmount = computed(() => {
    return this.filteredCommissions()
      .filter(c => c.payment_status === 'pagado')
      .reduce((sum, commission) => {
        // Ya filtrado por comisiones padre en filteredCommissions
        return sum + this.parseAmount(commission.commission_amount);
      }, 0);
  });

  pendingAmount = computed(() => {
    return this.filteredCommissions()
      .filter(c => c.payment_status === 'pendiente')
      .reduce((sum, commission) => {
        // Ya filtrado por comisiones padre en filteredCommissions
        return sum + this.parseAmount(commission.commission_amount);
      }, 0);
  });

  ngOnInit(): void {
    console.log('🚀 COMMISSION LIST COMPONENT LOADED!');
    console.log('🚀 COMMISSION LIST COMPONENT ngOnInit CALLED');
    console.log('Component initialized successfully');
    this.loadCommissions();
  }

  async loadCommissions() {
    console.log('📊 Loading commissions...');
    this.loading.set(true);
    this.error.set(null);

    try {
      const commissionPeriod = `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}`;

      const response = await this.commissionService.getCommissions({
        commission_period: commissionPeriod,
        status: this.selectedStatus(),
        search: this.searchTerm(),
        per_page: 1000,
        include_split_payments: this.showSplitPayments()
      }).toPromise();

      if (response && response.data) {
        console.log(`✅ Loaded ${response.data.length} commissions`);

        // Debug logging: mostrar estructura completa de las primeras 2 comisiones
        console.log('=== DEBUG: Estructura de comisiones recibidas ===');
        console.log('Total comisiones:', response.data.length);
        if (response.data.length > 0) {
          console.log('Primera comisión completa:', JSON.stringify(response.data[0], null, 2));
          console.log('employee.user de primera comisión:', response.data[0].employee?.user);
          console.log('Nombre completo primera comisión:', response.data[0].employee?.user?.first_name, response.data[0].employee?.user?.last_name);
        }
        if (response.data.length > 1) {
          console.log('Segunda comisión completa:', JSON.stringify(response.data[1], null, 2));
          console.log('employee.user de segunda comisión:', response.data[1].employee?.user);
          console.log('Nombre completo segunda comisión:', response.data[1].employee?.user?.first_name, response.data[1].employee?.user?.last_name);
        }

        // Logging detallado de las primeras 2 comisiones
        if (response.data.length > 0) {
          console.log('🔍 DETAILED COMMISSION STRUCTURE - First 2 commissions:');
          const firstTwoCommissions = response.data.slice(0, 2);
          firstTwoCommissions.forEach((commission, index) => {
            console.log(`Commission ${index + 1}:`, {
              commission_id: commission.commission_id,
              employee: commission.employee,
              employee_id: commission.employee?.employee_id,
              employee_code: commission.employee?.employee_code,
              user_object: commission.employee?.user,
              first_name: commission.employee?.user?.first_name,
              last_name: commission.employee?.user?.last_name,
              full_name_constructed: `${commission.employee?.user?.first_name || ''} ${commission.employee?.user?.last_name || ''}`.trim(),
              has_employee: !!commission.employee,
              has_user: !!commission.employee?.user,
              user_keys: commission.employee?.user ? Object.keys(commission.employee.user) : 'No user object'
            });
          });
        }

        this.commissions.set(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading commissions:', error);
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
    // No necesitamos recargar datos, la paginación es local
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

  trackByAdvisorId(index: number, item: AdvisorGroup): string {
    return item.employee?.employee_id?.toString() || item.employee?.user?.email || index.toString();
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
      case 'paid':
        return CheckCircle2;
      case 'partial_paid':
      case 'partial':
        return Clock;
      case 'all_pending':
      case 'pending':
        return AlertTriangle;
      default:
        return Clock;
    }
  }

  getOverallStatusClass(status: string): string {
    switch (status) {
      case 'all_paid':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial_paid':
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'all_pending':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getOverallStatusLabel(status: string): string {
    switch (status) {
      case 'all_paid':
      case 'paid':
        return 'Todo Pagado';
      case 'partial_paid':
      case 'partial':
        return 'Parcialmente Pagado';
      case 'all_pending':
      case 'pending':
        return 'Todo Pendiente';
      default:
        return 'Sin Estado';
    }
  }

  // Abrir modal de comisiones del asesor
  viewAdvisorCommissions(advisorGroup: AdvisorGroup) {
    alert('¡Botón clickeado! Abriendo modal...');
    console.log('=== OPENING ADVISOR COMMISSIONS MODAL ===');

    // Crear una copia del advisorGroup con todas las comisiones (padre + hijas)
    const allCommissions: Commission[] = [];

    // Agregar comisiones padre y sus hijas
    advisorGroup.commissions.forEach(parentCommission => {
      allCommissions.push(parentCommission);

      // Agregar child_commissions si existen
      if (parentCommission.child_commissions && parentCommission.child_commissions.length > 0) {
        allCommissions.push(...parentCommission.child_commissions);
      }
    });

    // Crear un AdvisorGroup temporal para el modal (mantener compatibilidad)
    const tempAdvisorGroup: AdvisorGroup = {
      employee: {
        employee_id: 0,
        user_id: 0,
        employee_code: advisorGroup.commissions[0]?.employee?.employee_code || 'N/A',
        employee_type: 'asesor_inmobiliario',
        base_salary: 0,
        is_commission_eligible: true,
        is_bonus_eligible: true,
        hire_date: new Date().toISOString().split('T')[0],
        employment_status: 'activo',
        contract_type: 'indefinido',
        status: 'active',
        first_name: '',
        last_name: '',
        full_name: `${advisorGroup.commissions[0]?.employee?.user?.first_name || ''} ${advisorGroup.commissions[0]?.employee?.user?.last_name || ''}`.trim(),
        user: { id: 0, username: '', first_name: '', last_name: '', name: '', email: '', status: 'active' as const, roles: [] }
      },
      commissions: allCommissions,
      totalAmount: advisorGroup.totalAmount,
      paidAmount: advisorGroup.paidAmount,
      pendingAmount: advisorGroup.pendingAmount,
      paidCount: advisorGroup.paidCount,
      pendingCount: advisorGroup.pendingCount,
      paymentPercentage: advisorGroup.paymentPercentage,
      overallStatus: advisorGroup.overallStatus
    };

    console.log('AdvisorGroup to send to modal (with children):', tempAdvisorGroup);
    console.log('Advisor data:', `${advisorGroup.commissions[0]?.employee?.user?.first_name || ''} ${advisorGroup.commissions[0]?.employee?.user?.last_name || ''}`.trim());
    console.log('Total commissions count (parent + children):', allCommissions?.length || 0);
    console.log('Commissions data (parent + children):', allCommissions);

    // Log individual commission details
    if (allCommissions && allCommissions.length > 0) {
      console.log('=== INDIVIDUAL COMMISSION DETAILS ===');
      allCommissions.forEach((commission, index) => {
        console.log(`Commission ${index + 1}:`, {
          id: commission.commission_id,
          contract_id: commission.contract?.contract_id || commission.contract_id,
          contract_number: commission.contract?.contract_number || 'Sin Contrato',
          amount: commission.commission_amount,
          payment_status: commission.payment_status,
          parent_commission_id: commission.parent_commission_id,
          client_name: commission.contract?.client_name || 'Cliente no especificado',
          lot_number: commission.contract?.lot_number || 'N/A',
          full_contract_object: commission.contract,
          has_contract_object: !!commission.contract,
          contract_id_type: typeof (commission.contract?.contract_id || commission.contract_id),
          contract_id_value: commission.contract?.contract_id || commission.contract_id
        });

        // Log detallado de la estructura del contrato
        if (commission.contract) {
          console.log(`Commission ${index + 1} - Contract details:`, commission.contract);
        } else {
          console.log(`Commission ${index + 1} - NO CONTRACT OBJECT FOUND`);
        }
      });

      // Verificar si hay contract_ids únicos
      const contractIds = allCommissions.map(c => c.contract?.contract_id || c.contract_id).filter(id => id !== null && id !== undefined);
      const uniqueContractIds = [...new Set(contractIds)];
      console.log('All contract_ids:', contractIds);
      console.log('Unique contract_ids:', uniqueContractIds);
      console.log('Expected contracts count:', uniqueContractIds.length);

      // Verificar comisiones sin contract_id
      const commissionsWithoutContract = allCommissions.filter(c => !(c.contract?.contract_id || c.contract_id));
      console.log('Commissions without contract_id:', commissionsWithoutContract.length);
      if (commissionsWithoutContract.length > 0) {
        console.log('Commissions without contract_id details:', commissionsWithoutContract);
      }
    }

    this.selectedAdvisorGroup.set(tempAdvisorGroup);
    this.showAdvisorModal.set(true);

    console.log('Modal state set to:', this.showAdvisorModal());
    console.log('Selected advisor group set to:', this.selectedAdvisorGroup());
  }

  // Cerrar modal de comisiones del asesor
  closeAdvisorModal() {
    this.showAdvisorModal.set(false);
    this.selectedAdvisorGroup.set(null);
  }

  // Manejar pago exitoso desde el modal
  onPaymentSuccess() {
    console.log('💰 Payment success event received, reloading commissions...');
    this.loadCommissions();
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