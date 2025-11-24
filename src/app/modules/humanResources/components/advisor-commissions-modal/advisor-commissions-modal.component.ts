import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, X, FileText, Calendar, DollarSign, Hash, ChevronUp, ChevronDown, Eye, GitBranch, Info, MapPin, Grid } from 'lucide-angular';
import { Router } from '@angular/router';
import { CommissionService } from '../../services/commission.service';
import { forkJoin } from 'rxjs';
import { Commission } from '../../models/commission';
import { Employee } from '../../models/employee';

export interface AdvisorGroup {
  employee: Employee;
  commissions: Commission[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  paymentPercentage: number;
  overallStatus: string;
}

interface ContractGroup {
  contractId: number | null;
  commissions: Commission[];
  contractNumber?: string;
  clientName?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

@Component({
  selector: 'app-advisor-commissions-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './advisor-commissions-modal.component.html',
  styleUrls: ['./advisor-commissions-modal.component.scss']
})
export class AdvisorCommissionsModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() advisorGroup: AdvisorGroup | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  // Lucide icons
  User = User;
  X = X;
  FileText = FileText;
  Calendar = Calendar;
  DollarSign = DollarSign;
  Hash = Hash;
  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  Eye = Eye;
  GitBranch = GitBranch;
  Info = Info;
  MapPin = MapPin;
  Grid = Grid;

  groupedByContract: ContractGroup[] = [];
  expandedContracts: Set<string> = new Set();
  expandedParentCommissions: Set<number> = new Set();

  // Estados para pagos de comisiones
  paymentStates: Map<number, { canPayFirst: boolean, canPaySecond: boolean, isProcessing: boolean }> = new Map();
  processingPayments: Set<number> = new Set();

  constructor(
    private router: Router,
    private commissionService: CommissionService
  ) { }

  ngOnInit(): void {
    // console.log('=== MODAL INIT ===');
    //console.log('Modal initialized with advisorGroup:', this.advisorGroup);
    //console.log('Total commissions received:', this.advisorGroup?.commissions?.length || 0);
    console.table(this.advisorGroup)
    if (this.advisorGroup?.commissions) {
      //   console.log('All commissions data:', this.advisorGroup.commissions);
      this.advisorGroup.commissions.forEach((comm, index) => {
        /*  console.log(`Commission ${index + 1}:`, {
            id: comm.commission_id,
            contract_id: comm.contract_id,
            parent_commission_id: comm.parent_commission_id,
            amount: comm.commission_amount
          });*/
      });
    }
    this.groupCommissionsByContract();
    this.checkPaymentStates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['advisorGroup'] && this.advisorGroup) {
      console.log('=== ADVISOR CHANGED ===');
      console.log('Advisor changed:', this.advisorGroup);
      console.log('New total commissions:', this.advisorGroup?.commissions?.length || 0);
      if (this.advisorGroup?.commissions) {
        this.advisorGroup.commissions.forEach((comm, index) => {
          console.log(`Changed Commission ${index + 1}:`, {
            commission_id: comm.commission_id,
            contract_id: comm.contract_id,
            parent_commission_id: comm.parent_commission_id,
            commission_amount: comm.commission_amount
          });
        });
      }
      this.groupCommissionsByContract();
      this.checkPaymentStates();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  private groupCommissionsByContract() {
    console.log('🔄 Agrupando comisiones por contrato...');
    console.log('=== DEBUGGING groupCommissionsByContract ===');
    console.log('advisorGroup:', this.advisorGroup);
    console.log('advisorGroup.commissions:', this.advisorGroup?.commissions);

    if (!this.advisorGroup?.commissions) {
      console.log('No commissions to group - advisorGroup or commissions is null/undefined');
      console.log('advisorGroup:', this.advisorGroup);
      this.groupedByContract = [];
      return;
    }

    const commissions = this.advisorGroup.commissions;
    console.log('📊 Comisiones recibidas:', commissions);

    // Log ALL commissions first
    commissions.forEach((comm, index) => {
      console.log(`ALL Commission ${index + 1} (ID: ${comm.commission_id}):`, {
        commission_id: comm.commission_id,
        contract_id: comm.contract_id,
        parent_commission_id: comm.parent_commission_id,
        commission_amount: comm.commission_amount,
        isParent: this.isParentCommission(comm)
      });

      // Special attention to commissions #77 and #78
      if (comm.commission_id === 77 || comm.commission_id === 78) {
        console.log(`🔍 TRACKING COMMISSION #${comm.commission_id}:`, {
          contract_id: comm.contract_id,
          contract_id_type: typeof comm.contract_id,
          contract_id_valid: comm.contract_id && comm.contract_id > 0 && Number.isInteger(comm.contract_id),
          parent_commission_id: comm.parent_commission_id,
          isParent: this.isParentCommission(comm)
        });
      }
    });

    const groups: { [key: string]: ContractGroup } = {};

    // FILTRADO MÁS ESTRICTO: Primero filtrar por contract_id válido, LUEGO por isParentCommission
    // Esto elimina completamente las comisiones CRJ sin contract_id desde el inicio
    const commissionsWithValidContract = commissions.filter(commission => {
      const contractId = commission.contract?.contract_id || commission.contract_id;
      const isValid = contractId && contractId !== null && contractId !== undefined && contractId > 0 && Number.isInteger(Number(contractId));

      if (!isValid && (commission.commission_id === 77 || commission.commission_id === 78)) {
        console.log(`🔍 Commission #${commission.commission_id} FILTERED OUT - invalid contract_id: ${contractId}`);
      }

      return isValid;
    });

    console.log('🔍 Comisiones con contract_id válido:', commissionsWithValidContract.length, 'de', commissions.length);

    // AHORA aplicar el filtro de isParentCommission solo a las comisiones con contract_id válido
    const parentCommissions = commissionsWithValidContract.filter(commission =>
      this.isParentCommission(commission)
    );

    console.log('👨‍👩‍👧‍👦 Comisiones padre encontradas:', parentCommissions.length);
    console.log('Parent commissions found:', parentCommissions.length);
    console.log('Parent commissions:', parentCommissions);

    parentCommissions.forEach(comm => {
      console.log(`Parent commission ID ${comm.commission_id}: contract_id=${comm.contract_id}`);
      if (comm.commission_id === 77 || comm.commission_id === 78) {
        console.log(`🔍 Commission #${comm.commission_id} IS PARENT - contract_id: ${comm.contract_id}`);
      }
    });

    parentCommissions.forEach((commission, index) => {
      console.log(`📋 Procesando comisión padre ${index + 1}:`, {
        commission_id: commission.commission_id,
        contract_id: commission.contract?.contract_id || commission.contract_id,
        contract_number: commission.contract?.contract_number || 'Sin número',
        hierarchy: this.getCommissionHierarchyLabel(commission)
      });

      // Las comisiones ya fueron filtradas por contract_id válido al inicio del método
      const contractId = commission.contract?.contract_id || commission.contract_id;

      // LOGGING ESPECÍFICO para comisiones #77 y #78
      if (commission.commission_id === 77 || commission.commission_id === 78) {
        console.log(`✅ Commission #${commission.commission_id} PROCESSING - contract_id: ${contractId}`);
      }

      const contractNumber = commission.contract?.contract_number || 'Sin número';
      const groupKey = `contract_${contractId}`;

      console.log(`🔑 Clave de grupo generada: ${groupKey}`);

      if (!groups[groupKey]) {
        console.log(`✨ Creando nuevo grupo para: ${groupKey}`);
        groups[groupKey] = {
          contractId: contractId,
          contractNumber: contractNumber,
          clientName: commission.contract?.client?.name ||
            commission.contract?.client?.name ||
            'Cliente no especificado',
          commissions: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        };

        console.log('📝 Grupo creado:', groups[groupKey]);
      }

      // SOLO agregar la comisión padre al grupo
      // Las comisiones hijas se obtienen dinámicamente con getChildCommissions()
      groups[groupKey].commissions.push(commission);

      // Calcular montos SOLO de la comisión padre
      // Los montos de las hijas no se suman para evitar duplicación
      groups[groupKey].totalAmount += parseFloat(commission.commission_amount?.toString() || '0');

      if (commission.payment_status === 'pagado') {
        groups[groupKey].paidAmount += parseFloat(commission.commission_amount?.toString() || '0');
      }

      groups[groupKey].pendingAmount = groups[groupKey].totalAmount - groups[groupKey].paidAmount;

      console.log(`💰 Montos calculados para ${groupKey} (solo comisión padre):`, {
        total: groups[groupKey].totalAmount,
        paid: groups[groupKey].paidAmount,
        pending: groups[groupKey].pendingAmount,
        parent_commissions_count: groups[groupKey].commissions.length
      });
    });

    this.groupedByContract = Object.values(groups);

    console.log('📊 Resultado final del agrupamiento:', {
      totalGroups: this.groupedByContract.length,
      groups: this.groupedByContract.map(g => ({
        contractId: g.contractId,
        commissionsCount: g.commissions.length,
        totalAmount: g.totalAmount,
        firstCommissionId: g.commissions[0]?.commission_id
      }))
    });

    console.log('✅ FILTRADO COMPLETADO: Solo se muestran contratos reales, eliminadas todas las comisiones individuales sin contract_id válido');
    console.log('✅ Agrupación completada. Grupos finales:', this.groupedByContract);
    console.log('Final groupedByContract:', this.groupedByContract);
    console.log('=== END DEBUGGING ===');

    // Verificar estados de pago para todas las comisiones
    this.checkPaymentStates();
  }

  // Verificar estados de pago para todas las comisiones
  private checkPaymentStates(): void {
    const allCommissions = this.advisorGroup?.commissions || [];
    const parentCommissions = allCommissions.filter(c => !c.parent_commission_id);

    parentCommissions.forEach(commission => {
      this.checkCommissionPaymentState(commission.commission_id);
    });
  }

  // Verificar estado de pago de una comisión específica
  private checkCommissionPaymentState(commissionId: number): void {
    if (this.paymentStates.has(commissionId)) {
      return; // Ya verificado
    }

    // Temporalmente deshabilitado hasta que la API esté implementada en el backend
    // La verificación de pagos se manejará directamente en el backend al intentar pagar
    this.paymentStates.set(commissionId, {
      canPayFirst: true,
      canPaySecond: true,
      isProcessing: false
    });

    // TODO: Reactivar cuando la API /can-pay-part esté implementada en el backend
    /*
    // Verificar ambas partes del pago
    forkJoin({
      firstPart: this.commissionService.canPayCommissionPart(commissionId, 1),
      secondPart: this.commissionService.canPayCommissionPart(commissionId, 2)
    }).subscribe({
      next: (results) => {
        this.paymentStates.set(commissionId, {
          canPayFirst: results.firstPart.can_pay,
          canPaySecond: results.secondPart.can_pay,
          isProcessing: false
        });
      },
      error: (error) => {
        // Manejar error 404 y otros errores de API silenciosamente
        if (error.status === 404) {
          console.warn(`API endpoint not found for commission ${commissionId}. Payment functionality disabled.`);
        } else {
          console.error('Error verificando estado de pago:', error);
        }
        this.paymentStates.set(commissionId, {
          canPayFirst: false,
          canPaySecond: false,
          isProcessing: false
        });
      }
    });
    */
  }

  // Obtener estado de pago de una comisión
  getPaymentState(commissionId: number) {
    return this.paymentStates.get(commissionId) || {
      canPayFirst: false,
      canPaySecond: false,
      isProcessing: false
    };
  }

  // Pagar primera parte de la comisión
  payFirstPart(commission: Commission): void {
    if (this.processingPayments.has(commission.commission_id)) {
      return;
    }

    const employeeName = this.getCommissionEmployeeName(commission);
    const firstPartCommission = commission.child_commissions?.find(child => child.payment_part === 1);
    const firstPartAmount = firstPartCommission ? firstPartCommission.commission_amount : 0;
    const confirmed = confirm(
      `¿Está seguro de pagar la primera parte de la comisión de ${employeeName}?\n` +
      `Monto: ${this.formatCurrency(firstPartAmount)}\n` +
      `Contrato: ${commission.contract_id || 'Sin Contrato'}`
    );

    if (!confirmed) {
      return;
    }

    this.processingPayments.add(commission.commission_id);
    const currentState = this.getPaymentState(commission.commission_id);
    this.paymentStates.set(commission.commission_id, {
      ...currentState,
      isProcessing: true
    });

    this.commissionService.payCommissionPart(commission.commission_id, 1).subscribe({
      next: (response) => {
        console.log('Primera parte pagada exitosamente:', response);
        alert('Primera parte de la comisión pagada exitosamente');

        // Actualizar estado
        this.processingPayments.delete(commission.commission_id);
        this.paymentStates.set(commission.commission_id, {
          canPayFirst: false,
          canPaySecond: currentState.canPaySecond,
          isProcessing: false
        });

        // Recargar datos
        this.reloadCommissionData();
      },
      error: (error) => {
        console.error('Error pagando primera parte:', error);
        alert('Error al pagar la primera parte de la comisión: ' + (error.error?.message || 'Error desconocido'));

        this.processingPayments.delete(commission.commission_id);
        this.paymentStates.set(commission.commission_id, {
          ...currentState,
          isProcessing: false
        });
      }
    });
  }

  // Pagar segunda parte de la comisión
  paySecondPart(commission: Commission): void {
    if (this.processingPayments.has(commission.commission_id)) {
      return;
    }

    const employeeName = this.getCommissionEmployeeName(commission);
    const secondPartCommission = commission.child_commissions?.find(child => child.payment_part === 2);
    const secondPartAmount = secondPartCommission ? secondPartCommission.commission_amount : 0;
    const confirmed = confirm(
      `¿Está seguro de pagar la segunda parte de la comisión de ${employeeName}?\n` +
      `Monto: ${this.formatCurrency(secondPartAmount)}\n` +
      `Contrato: ${commission.contract_id || 'Sin Contrato'}`
    );

    if (!confirmed) {
      return;
    }

    this.processingPayments.add(commission.commission_id);
    const currentState = this.getPaymentState(commission.commission_id);
    this.paymentStates.set(commission.commission_id, {
      ...currentState,
      isProcessing: true
    });

    this.commissionService.payCommissionPart(commission.commission_id, 2).subscribe({
      next: (response) => {
        console.log('Segunda parte pagada exitosamente:', response);
        alert('Segunda parte de la comisión pagada exitosamente');

        // Actualizar estado
        this.processingPayments.delete(commission.commission_id);
        this.paymentStates.set(commission.commission_id, {
          canPayFirst: currentState.canPayFirst,
          canPaySecond: false,
          isProcessing: false
        });

        // Recargar datos
        this.reloadCommissionData();
      },
      error: (error) => {
        console.error('Error pagando segunda parte:', error);
        alert('Error al pagar la segunda parte de la comisión: ' + (error.error?.message || 'Error desconocido'));

        this.processingPayments.delete(commission.commission_id);
        this.paymentStates.set(commission.commission_id, {
          ...currentState,
          isProcessing: false
        });
      }
    });
  }

  // Recargar datos de comisiones
  private reloadCommissionData(): void {
    // Emitir evento para que el componente padre recargue los datos
    this.paymentSuccess.emit();
    // Limpiar los estados de pago para forzar una nueva verificación
    this.paymentStates.clear();
    this.checkPaymentStates();
  }

  toggleContractExpansion(contractId: number | null): void {
    console.log('=== TOGGLING CONTRACT EXPANSION ===');
    console.log('Contract ID to toggle:', contractId);

    // Usar un string único para identificar contratos null
    const contractKey = contractId !== null ? contractId.toString() : 'null';

    if (this.expandedContracts.has(contractKey)) {
      this.expandedContracts.delete(contractKey);
      console.log('Contract collapsed:', contractId, 'key:', contractKey);
    } else {
      this.expandedContracts.add(contractKey);
      console.log('Contract expanded:', contractId, 'key:', contractKey);
    }

    console.log('New expanded contracts:', Array.from(this.expandedContracts));
  }

  isContractExpanded(contractId: number | null): boolean {
    const contractKey = contractId !== null ? contractId.toString() : 'null';
    const isExpanded = this.expandedContracts.has(contractKey);
    // Removido console.log para evitar spam en consola
    return isExpanded;
  }

  toggleParentCommissionExpansion(commissionId: number): void {
    console.log('=== TOGGLING PARENT COMMISSION EXPANSION ===');
    console.log('Parent commission ID to toggle:', commissionId);

    if (this.expandedParentCommissions.has(commissionId)) {
      this.expandedParentCommissions.delete(commissionId);
      console.log('Parent commission collapsed:', commissionId);
    } else {
      this.expandedParentCommissions.add(commissionId);
      console.log('Parent commission expanded:', commissionId);
    }

    console.log('New expanded parent commissions:', Array.from(this.expandedParentCommissions));
  }

  isParentCommissionExpanded(commissionId: number): boolean {
    const isExpanded = this.expandedParentCommissions.has(commissionId);
    // Removido console.log para evitar spam en consola
    return isExpanded;
  }

  getParentCommissions(commissions: Commission[]): Commission[] {
    console.log('=== GETTING PARENT COMMISSIONS ===');
    console.log('Contract commissions to filter:', commissions);

    const parentCommissions = commissions.filter(commission => this.isParentCommission(commission));
    console.log('Parent commissions found:', parentCommissions.length);
    console.log('Parent commissions:', parentCommissions);

    return parentCommissions;
  }

  getChildCommissions(parentCommission: Commission): Commission[] {
    console.log('=== GETTING CHILD COMMISSIONS ===');
    console.log('=== getChildCommissions called ===');
    console.log('parentCommission:', parentCommission);
    console.log('parentCommission.child_commissions:', parentCommission.child_commissions);

    // USAR LA MISMA LÓGICA QUE advisor-commissions.component.ts
    // Las comisiones hijas vienen en la propiedad child_commissions
    const childCommissions = parentCommission.child_commissions || [];

    console.log(`Child commissions found for parent ${parentCommission.commission_id}:`, childCommissions.length);
    console.log('Child commissions:', childCommissions);
    console.log('=== END getChildCommissions ===');

    return childCommissions;
  }

  viewCommissionDetail(commission: Commission): void {
    // Navegar al detalle de la comisión
    this.router.navigate(['/human-resources/commissions', commission.commission_id]);
    this.onClose();
  }

  // Commission hierarchy methods (EXACTAMENTE como advisor-commissions.component.ts)
  isParentCommission(commission: any): boolean {
    return !commission.parent_commission_id;
  }

  isSplitCommission(commission: any): boolean {
    return !!commission.parent_commission_id;
  }

  getCommissionHierarchyLabel(commission: any): string {
    if (this.isParentCommission(commission)) {
      return commission.child_commissions && commission.child_commissions.length > 0
        ? 'Comisión General (con divisiones)'
        : 'Comisión General';
    } else {
      return `División ${commission.payment_part || 'N/A'}`;
    }
  }

  getCommissionTypeClass(commission: any): string {
    if (this.isParentCommission(commission)) {
      return commission.child_commissions && commission.child_commissions.length > 0
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    } else {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'processing':
      case 'procesando':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getPaymentStatusClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
      case 'pendiente':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'partial':
      case 'parcial':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return 'Pagado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'cancelled':
      case 'cancelado':
        return 'Cancelado';
      case 'processing':
      case 'procesando':
        return 'Procesando';
      case 'partial':
      case 'parcial':
        return 'Parcial';
      default:
        return status || 'Sin Estado';
    }
  }

  getPaymentTypeLabel(paymentType: string | undefined): string {
    switch (paymentType?.toLowerCase()) {
      case 'initial':
      case 'inicial':
        return 'Pago Inicial';
      case 'monthly':
      case 'mensual':
        return 'Pago Mensual';
      case 'final':
        return 'Pago Final';
      case 'bonus':
      case 'bono':
        return 'Bono';
      default:
        return paymentType || 'Pago';
    }
  }

  formatCurrency(amount: number | string | undefined): string {
    // Convertir a número y verificar que sea válido
    let validAmount = 0;
    if (typeof amount === 'number' && !isNaN(amount)) {
      validAmount = amount;
    } else if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      validAmount = !isNaN(parsed) ? parsed : 0;
    }
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(validAmount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  formatPeriod(month: number | undefined, year: number | undefined): string {
    if (!month || !year) return 'Período no especificado';

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${monthNames[month - 1]} ${year}`;
  }

  trackByContractId(index: number, item: ContractGroup): number | null {
    return item.contractId;
  }

  trackByCommissionId(index: number, item: Commission): number {
    return item.commission_id;
  }

  getEmployeeName(): string {
    if (!this.advisorGroup?.employee) {
      return 'Empleado no especificado';
    }

    const employee = this.advisorGroup.employee;

    // Verificar si tenemos first_name y last_name
    if (employee.first_name && employee.last_name) {
      return `${employee.first_name} ${employee.last_name}`;
    }

    // Si tenemos full_name, usarlo
    if (employee.full_name) {
      return employee.full_name;
    }

    // Si solo tenemos first_name
    if (employee.first_name) {
      return employee.first_name;
    }

    // Si solo tenemos last_name
    if (employee.last_name) {
      return employee.last_name;
    }

    // Fallback al código del empleado
    return employee.employee_code || 'Empleado sin nombre';
  }

  getUniqueContractIdentifier(commission: Commission): string | null {
    // Solo retornar identificador si tiene contract_id válido
    const actualContractId = commission.contract?.contract_id || commission.contract_id;
    if (actualContractId && actualContractId > 0) {
      return `contract_${actualContractId}`;
    }

    // Si no tiene contract_id válido, retornar null para excluir del agrupamiento
    return null;
  }

  parseAmount(amount: number | string | undefined): number {
    if (typeof amount === 'number' && !isNaN(amount)) {
      return amount;
    }
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  }

  getContractTitle(contractGroup: ContractGroup): string {
    const firstCommission = contractGroup.commissions[0];

    // Si tenemos contract_number y client_name, mostrar información completa
    if (firstCommission?.contract?.contract_number && firstCommission?.contract?.client?.name) {
      return `Contrato ${firstCommission.contract.contract_number} - ${firstCommission.contract.client.name}`;
    }

    // Si solo tenemos contract_number
    if (firstCommission?.contract?.contract_number) {
      return `Contrato: ${firstCommission.contract.contract_number}`;
    }

    // Si tenemos contract_id válido pero no contract_number
    if (contractGroup.contractId && contractGroup.contractId > 0) {
      const clientInfo = firstCommission?.contract?.client?.name || 'Cliente no especificado';
      return `Contrato #${contractGroup.contractId} - ${clientInfo}`;
    }

    // ELIMINADO: Las condiciones fallback que creaban títulos de comisiones individuales
    // Ya no se permiten comisiones sin contract_id válido en groupCommissionsByContract()

    return 'Contrato Sin Información';
  }

  getCommissionEmployeeName(commission: Commission): string {
    // Try to get employee name from commission's employee object
    if (commission.employee?.user) {
      const user = commission.employee.user;
      const firstName = user.first_name;
      const lastName = user.last_name;

      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }

      return firstName || lastName || 'N/A';
    }

    // Fallback to advisor group employee name
    return this.getEmployeeName();
  }

  // Método para contar solo las comisiones padre (sin parent_commission_id)
  getParentCommissionsCount(): number {
    if (!this.advisorGroup?.commissions) {
      return 0;
    }
    return this.advisorGroup.commissions.filter(commission =>
      !commission.parent_commission_id
    ).length;
  }
}
