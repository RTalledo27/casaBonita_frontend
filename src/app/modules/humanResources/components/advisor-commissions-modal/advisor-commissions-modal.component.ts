import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, X, FileText, Calendar, DollarSign, Hash, ChevronUp, ChevronDown, Eye, GitBranch } from 'lucide-angular';
import { Router } from '@angular/router';

interface Commission {
  commission_id: number;
  commission_amount: number;
  commission_percentage?: number;
  commission_type?: string;
  status?: string;
  payment_status?: string;
  payment_type?: string;
  payment_date?: string;
  payment_part?: number;
  sale_amount?: number;
  period_month: number;
  period_year: number;
  contract_id?: number;
  child_commissions?: Commission[];
}

import { Employee } from '../../models/employee';

interface AdvisorGroup {
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
  totalAmount: number;
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

  groupedByContract: ContractGroup[] = [];
  expandedContracts: Set<number | null> = new Set();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.groupCommissionsByContract();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['advisorGroup'] && this.advisorGroup) {
      this.groupCommissionsByContract();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  groupCommissionsByContract(): void {
    if (!this.advisorGroup?.commissions) {
      this.groupedByContract = [];
      return;
    }

    const contractMap = new Map<number | null, Commission[]>();

    // Agrupar comisiones por contract_id
    this.advisorGroup.commissions.forEach(commission => {
      const contractId = commission.contract_id || null;
      if (!contractMap.has(contractId)) {
        contractMap.set(contractId, []);
      }
      contractMap.get(contractId)!.push(commission);
    });

    // Convertir a array y calcular totales
    this.groupedByContract = Array.from(contractMap.entries()).map(([contractId, commissions]) => {
      const totalAmount = commissions.reduce((sum, commission) => sum + commission.commission_amount, 0);
      return {
        contractId,
        commissions,
        totalAmount
      };
    });

    // Ordenar por contract_id (nulls al final)
    this.groupedByContract.sort((a, b) => {
      if (a.contractId === null) return 1;
      if (b.contractId === null) return -1;
      return (a.contractId as number) - (b.contractId as number);
    });
  }

  toggleContractExpansion(contractId: number | null): void {
    if (this.expandedContracts.has(contractId)) {
      this.expandedContracts.delete(contractId);
    } else {
      this.expandedContracts.add(contractId);
    }
  }

  isContractExpanded(contractId: number | null): boolean {
    return this.expandedContracts.has(contractId);
  }

  viewCommissionDetail(commission: Commission): void {
    // Navegar al detalle de la comisión
    this.router.navigate(['/human-resources/commissions', commission.commission_id]);
    this.onClose();
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
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
}