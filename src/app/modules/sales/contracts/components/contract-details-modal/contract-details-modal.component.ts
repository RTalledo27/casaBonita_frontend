import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal, computed } from '@angular/core';
import { LucideAngularModule, X, User, MapPin, DollarSign, Calendar, FileText, CreditCard } from 'lucide-angular';
import { ContractsService } from '../../../services/contracts.service';
import { Contract } from '../../../models/contract';
import { ClientsService } from '../../../../CRM/services/clients.service';
import { Client } from '../../../../CRM/models/client';
import { AuthService } from '../../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contract-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './contract-details-modal.component.html',
  styleUrl: './contract-details-modal.component.scss'
})
export class ContractDetailsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() contractId: number | null = null;
  @Output() closeModal = new EventEmitter<void>();

  // Icons
  XIcon = X;
  UserIcon = User;
  MapPinIcon = MapPin;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  FileTextIcon = FileText;
  CreditCardIcon = CreditCard;

  // State
  contract = signal<Contract | null>(null);
  data = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  clientData = signal<Client | null>(null);
  clientLoading = signal(false);
  schedules = signal<any[]>([]);
  schedulesLoading = signal(false);
  schedulesError = signal<string | null>(null);
  showAllSchedules = signal(false);
  sortedSchedules = computed(() => {
    const rows = [...this.schedules()];
    return rows.sort((a, b) => {
      const dateCmp = String(a?.due_date || '').localeCompare(String(b?.due_date || ''));
      if (dateCmp !== 0) return dateCmp;
      const instCmp = Number(a?.installment_number || 0) - Number(b?.installment_number || 0);
      if (instCmp !== 0) return instCmp;
      return Number(a?.schedule_id || 0) - Number(b?.schedule_id || 0);
    });
  });
  scheduleSummary = computed(() => {
    const schedules = this.schedules();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = schedules.length;
    const paid = schedules.filter((s) => String(s?.status || '').toLowerCase() === 'pagado').length;
    const overdue = schedules.filter((s) => {
      const status = String(s?.status || '').toLowerCase();
      if (status === 'pagado') return false;
      const due = s?.due_date ? new Date(s.due_date) : null;
      return due ? due.getTime() < today.getTime() : false;
    }).length;
    const pending = Math.max(0, total - paid);
    const nextDue = schedules
      .filter((s) => {
        const status = String(s?.status || '').toLowerCase();
        if (status === 'pagado') return false;
        const due = s?.due_date ? new Date(s.due_date) : null;
        return due ? due.getTime() >= today.getTime() : false;
      })
      .sort((a, b) => String(a?.due_date || '').localeCompare(String(b?.due_date || '')))[0]?.due_date;

    return { total, paid, pending, overdue, nextDue };
  });

  constructor(
    private contractsService: ContractsService,
    private clientsService: ClientsService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.contractId && this.isOpen) {
      this.loadContractDetails();
    }
  }

  ngOnChanges() {
    if (this.contractId && this.isOpen) {
      this.loadContractDetails();
    }
  }

  private loadContractDetails() {
    if (!this.contractId) {
      this.error.set('No se proporcionó un ID de contrato válido');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.contract.set(null);
    this.schedules.set([]);
    this.schedulesError.set(null);

    this.contractsService.get(this.contractId).subscribe({
      next: (contract) => {
        this.data.set(contract);
        this.contract.set(contract);
        this.loading.set(false);
        
        // Buscar información adicional del cliente
        const clientName = (contract as any)?.client_name || (contract as any)?.data?.client_name;
        if (clientName) {
          this.searchClientByName(clientName);
        }

        const id = (contract as any)?.data?.contract_id ?? (contract as any)?.contract_id ?? this.contractId;
        if (Number.isFinite(Number(id))) {
          this.loadSchedules(Number(id));
        }
      },
      error: (err) => {
        this.error.set(`Error al cargar los detalles del contrato: ${err.message || err.error?.message || 'Error desconocido'}`);
        this.loading.set(false);
      }
    });
  }

  private searchClientByName(clientName: string) {
    this.clientLoading.set(true);
    
    this.clientsService.searchByName(clientName).subscribe({
      next: (clients) => {
        if (clients && clients.length > 0) {
          // Buscar coincidencia exacta o la más cercana
          const exactMatch = clients.find(client => 
            `${client.first_name} ${client.last_name}`.toLowerCase() === clientName.toLowerCase()
          );
          
          const selectedClient = exactMatch || clients[0];
          this.clientData.set(selectedClient);
        } else {
          this.clientData.set(null);
        }
        this.clientLoading.set(false);
      },
      error: (err) => {
        this.clientData.set(null);
        this.clientLoading.set(false);
      }
    });
  }

  private loadSchedules(contractId: number): void {
    this.schedulesLoading.set(true);
    this.schedulesError.set(null);
    this.contractsService.getSchedules(contractId).subscribe({
      next: (res: any) => {
        const rows = res?.data ?? res;
        this.schedules.set(Array.isArray(rows) ? rows : []);
        this.showAllSchedules.set(false);
        this.schedulesLoading.set(false);
      },
      error: () => {
        this.schedulesError.set('No se pudo cargar el cronograma');
        this.schedulesLoading.set(false);
      },
    });
  }

  onClose() {
    this.closeModal.emit();
    this.contract.set(null);
    this.error.set(null);
    this.clientData.set(null);
    this.schedules.set([]);
    this.schedulesError.set(null);
    this.showAllSchedules.set(false);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'vigente': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'resuelto': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'pendiente_aprobacion': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'aprobado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'anulado': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'vigente': 'Vigente',
      'resuelto': 'Resuelto',
      'cancelado': 'Cancelado',
      'active': 'Activo',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'completed': 'Completado',
      'pendiente_aprobacion': 'Pendiente aprobación',
      'aprobado': 'Aprobado',
      'anulado': 'Anulado'
    };
    return statusTexts[status] || status;
  }

  getAdvisorInitials(): string {
    const fullName = this.contract()?.advisor?.full_name;
    if (!fullName) return 'SA';
    
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  goToCollectionsInstallments(): void {
    this.onClose();
    this.router.navigate(['/collections/installments'], {
      queryParams: {
        contract_number: this.data()?.data?.contract_number || this.data()?.contract_number || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  generateScheduleNow(): void {
    const contractId = this.data()?.data?.contract_id || this.data()?.contract_id || this.contractId;
    if (!Number.isFinite(Number(contractId))) return;
    this.schedulesLoading.set(true);
    this.schedulesError.set(null);
    const today = new Date().toISOString().slice(0, 10);
    this.contractsService
      .generateSchedule(Number(contractId), {
        start_date: today,
        frequency: 'monthly',
        notes: 'Generado desde Ventas',
      })
      .subscribe({
        next: () => this.loadSchedules(Number(contractId)),
        error: () => {
          this.schedulesError.set('No se pudo generar el cronograma');
          this.schedulesLoading.set(false);
        },
      });
  }

  getScheduleTypeLabel(s: any): string {
    const type = String(s?.type || '').toLowerCase();
    const notes = String(s?.notes || '').toLowerCase();
    const amount = Number(s?.amount || 0);
    const depositAmount = Number(this.data()?.data?.reservation?.deposit_amount || 0);

    if (
      type === 'inicial' &&
      (notes.includes('separ') ||
        notes.includes('reserva') ||
        notes.includes('sep') ||
        (depositAmount > 0 && Math.abs(amount - depositAmount) < 0.01) ||
        Math.abs(amount - 100) < 0.01)
    ) {
      return 'Separación';
    }
    if (type.includes('bono')) return 'Bono';
    if (type.includes('bpp')) return 'Bono BPP';
    if (type.includes('balon')) return 'Balón';
    if (type.includes('inicial')) return 'Inicial';
    if (type.includes('finan')) return 'Financiamiento';
    return s?.type || '—';
  }

  private isOverdueSchedule(s: any): boolean {
    const status = String(s?.status || '').toLowerCase();
    if (status === 'pagado') return false;
    const due = s?.due_date ? new Date(s.due_date) : null;
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }

  getScheduleVisualStatus(s: any): string {
    const status = String(s?.status || '').toLowerCase();
    if (status === 'pagado') return 'pagado';
    if (this.isOverdueSchedule(s)) return 'vencido';
    if (status === 'parcial') return 'parcial';
    if (status === 'pendiente') return 'pendiente';
    return status || '—';
  }

  getScheduleStatusText(s: any): string {
    const status = this.getScheduleVisualStatus(s);
    const map: Record<string, string> = {
      pagado: 'Pagado',
      vencido: 'Vencido',
      pendiente: 'Pendiente',
      parcial: 'Parcial',
    };
    return map[status] || (s?.status || '—');
  }

  getScheduleStatusBadgeClass(s: any): string {
    const status = this.getScheduleVisualStatus(s);
    const map: Record<string, string> = {
      pagado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pendiente: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      parcial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}
