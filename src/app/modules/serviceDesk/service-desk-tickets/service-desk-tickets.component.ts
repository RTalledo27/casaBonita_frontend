import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  SharedTableComponent,
  ColumnDef,
} from '../../../shared/components/shared-table/shared-table.component';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ToastService } from '../../../core/services/toast.service';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { ServiceDeskFilterPipe } from '../pipes/service-desk-filter.pipe';
import { FormsModule } from '@angular/forms';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  LucideAngularModule,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ToolCaseIcon,
  Wrench,
  X,
} from 'lucide-angular';
import { EstadoTicketPipe } from '../pipes/estado-ticket.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { TicketFormModalComponent } from '../ticket-form-modal/ticket-form-modal.component';
import { EchoService } from '../../../core/services/echo.service';

@Component({
  selector: 'app-service-desk-tickets',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    ServiceDeskFilterPipe,
    FormsModule,
    LucideAngularModule,
    EstadoTicketPipe,
    TranslateModule,
    RouterModule,
    TicketFormModalComponent,
  ],
  templateUrl: './service-desk-tickets.component.html',
  styleUrl: './service-desk-tickets.component.scss',
})
export class ServiceDeskTicketsComponent implements OnInit, OnDestroy {
  private ticketsSubject = new BehaviorSubject<ServiceDeskTicket[]>([]);
  tickets$ = this.ticketsSubject.asObservable();
  filter = '';
  priority = '';
  status = '';
  isModalOpen = false;
  selectedTicket: ServiceDeskTicket | null = null;
  private echoSubscription?: Subscription;

  // Icons
  clock = Clock;
  plus = Plus;
  checkCircle = CheckCircle;
  search = Search;
  x = X;
  refreshCw = RefreshCw;

  columns: ColumnDef[] = [
    {
      field: 'ticket_id',
      header: 'ID',
      value: (row) => `#${row.ticket_id.toString().padStart(3, '0')}`,
      align: 'left',
    },
    {
      field: 'ticket_type',
      header: 'Tipo',
      tpl: 'tipoTpl',
      align: 'center',
    },
    {
      field: 'description',
      header: 'Descripción',
      value: (row) => {
        const desc = row.description || '';
        return desc.length > 50 ? desc.substring(0, 47) + '...' : desc;
      },
      align: 'left',
    },
    {
      field: 'priority',
      header: 'Prioridad',
      tpl: 'prioridadTpl',
      align: 'center',
    },
    {
      field: 'status',
      header: 'Estado',
      tpl: 'estadoTpl',
      align: 'center',
    },
    {
      value: (row) =>
        row.opened_by?.first_name + ' ' + row.opened_by?.last_name || '',
      header: 'Creado por',
      align: 'left',
    },
    {
      field: 'opened_at',
      header: 'Fecha Apertura',
      value: (row) =>
        row.opened_at
          ? new Date(row.opened_at).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          : '',
      align: 'left',
    },
    {
      field: 'sla',
      header: 'SLA',
      tpl: 'slaTpl',
      align: 'center',
    },
  ];

  idField = 'ticket_id';

  constructor(
    private ticketsService: ServiceDeskTicketsService,
    private toast: ToastService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private echoService: EchoService
  ) { }

  ngOnInit(): void {
    this.loadTickets();

    // Subscribe to real-time ticket updates
    this.echoSubscription = this.echoService.ticketUpdate$.subscribe(update => {
      console.log('🔔 Real-time ticket update received:', update);
      this.toast.info(`Ticket #${update.ticket_id} ${update.action === 'created' ? 'creado' : update.action === 'deleted' ? 'eliminado' : 'actualizado'}`);
      this.loadTickets(); // Reload the list
    });

    // Handle edit queryParam from detail page
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        const ticketId = +params['edit'];
        this.ticketsService.get(ticketId).subscribe(ticket => {
          this.selectedTicket = ticket;
          this.isModalOpen = true;
          // Clear the queryParam after opening
          this.router.navigate([], { relativeTo: this.route, queryParams: {} });
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.echoSubscription?.unsubscribe();
  }

  loadTickets(): void {
    this.ticketsService.list().subscribe((tickets) => {
      this.ticketsSubject.next(tickets);
    });
  }

  onCreate(): void {
    this.selectedTicket = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTicket = null;
  }

  onTicketSaved(ticket: ServiceDeskTicket): void {
    this.closeModal();
    this.loadTickets();
    this.toast.success('Ticket guardado correctamente');
  }

  onEdit(ticketId: number): void {
    // SharedTable emits only the ID, so we need to fetch the full ticket
    this.ticketsService.get(ticketId).subscribe({
      next: (ticket) => {
        this.selectedTicket = ticket;
        this.isModalOpen = true;
      },
      error: (err) => {
        console.error('Error loading ticket for edit:', err);
        this.toast.error('Error al cargar el ticket para editar');
      }
    });
  }

  onView(row: any): void {
    const id = row.ticket_id || row;
    this.router.navigate(['/service-desk/tickets', id]);
  }

  onDelete(ticketOrId: any): void {
    // Handle both: ID from SharedTable or object from custom action buttons
    const ticketId = typeof ticketOrId === 'object' ? ticketOrId.ticket_id : ticketOrId;

    if (!ticketId) {
      console.error('Invalid ticket ID for delete:', ticketOrId);
      this.toast.error('Error: ID de ticket inválido');
      return;
    }

    Swal.fire({
      title: '¿Eliminar ticket?',
      text: `¿Estás seguro de eliminar el ticket #${ticketId}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketsService.delete(ticketId).subscribe({
          next: () => {
            this.toast.success('Ticket eliminado correctamente');
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error deleting ticket:', err);
            this.toast.error('Error al eliminar el ticket');
          },
        });
      }
    });
  }

  onFilterChange(): void {
    // Filters are reactive through the pipe
  }

  clearFilters(): void {
    this.filter = '';
    this.priority = '';
    this.status = '';
  }

  countByStatus(tickets: ServiceDeskTicket[], status: string): number {
    return tickets.filter((t) => t.status === status).length;
  }

  canCreate(): boolean {
    return this.auth.hasPermission('service-desk.tickets.store');
  }

  // SLA Helper methods
  getSlaClass(row: ServiceDeskTicket): string {
    if (row.status === 'cerrado') {
      return this.wasSlaCompleted(row) ? 'cumplido' : 'vencido';
    }
    if (!row.sla_due_at) return 'pendiente';

    const now = new Date();
    const slaDue = new Date(row.sla_due_at);
    const hoursLeft = (slaDue.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return 'vencido';
    if (hoursLeft <= 4) return 'por-vencer';
    return 'pendiente';
  }

  getSlaIcon(row: ServiceDeskTicket): string {
    const slaClass = this.getSlaClass(row);
    switch (slaClass) {
      case 'cumplido':
        return 'check-circle';
      case 'vencido':
        return 'alert-triangle';
      case 'por-vencer':
        return 'alert-circle';
      default:
        return 'clock';
    }
  }

  getSlaText(row: ServiceDeskTicket): string {
    const slaClass = this.getSlaClass(row);

    if (row.status === 'cerrado') {
      return slaClass === 'cumplido' ? 'Cumplido' : 'No cumplido';
    }

    if (!row.sla_due_at) return 'Sin SLA';

    const now = new Date();
    const slaDue = new Date(row.sla_due_at);
    const hoursLeft = (slaDue.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      const hoursOverdue = Math.abs(Math.floor(hoursLeft));
      return `Vencido ${hoursOverdue}h`;
    }

    if (hoursLeft <= 24) {
      return `${Math.floor(hoursLeft)}h restantes`;
    }

    const daysLeft = Math.floor(hoursLeft / 24);
    return `${daysLeft}d restantes`;
  }

  private wasSlaCompleted(row: ServiceDeskTicket): boolean {
    if (!row.sla_due_at || !row.updated_at) return true;
    return new Date(row.updated_at) <= new Date(row.sla_due_at);
  }

  // Type icon helper
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      incidente: 'alert-triangle',
      solicitud: 'message-square',
      cambio: 'refresh-cw',
      garantia: 'shield',
      mantenimiento: 'wrench',
      otro: 'help-circle',
    };
    return icons[type] || 'help-circle';
  }

  // ========== QUICK ACTIONS ==========

  technicians: any[] = [];
  showAssignModal = false;
  showStatusModal = false;
  selectedTicketForAction: ServiceDeskTicket | null = null;
  selectedTechId: number | null = null;
  selectedStatus = '';
  actionLoading = false;

  loadTechnicians(): void {
    this.ticketsService.getTechnicians().subscribe({
      next: (techs) => this.technicians = techs,
      error: () => this.technicians = []
    });
  }

  // Quick Assign
  openAssignModal(ticket: ServiceDeskTicket): void {
    if (this.technicians.length === 0) this.loadTechnicians();
    this.selectedTicketForAction = ticket;
    // assigned_to can be User object or null - User model uses 'id' property
    this.selectedTechId = ticket.assigned_to?.id || null;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedTicketForAction = null;
    this.selectedTechId = null;
  }

  confirmAssign(): void {
    if (!this.selectedTicketForAction || !this.selectedTechId) return;

    this.actionLoading = true;
    this.ticketsService.assign(this.selectedTicketForAction.ticket_id, this.selectedTechId).subscribe({
      next: () => {
        this.toast.success('Técnico asignado correctamente');
        this.closeAssignModal();
        this.loadTickets();
        this.actionLoading = false;
      },
      error: () => {
        this.toast.error('Error al asignar técnico');
        this.actionLoading = false;
      }
    });
  }

  // Quick Status Change
  openStatusModal(ticket: ServiceDeskTicket): void {
    this.selectedTicketForAction = ticket;
    this.selectedStatus = ticket.status;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedTicketForAction = null;
    this.selectedStatus = '';
  }

  confirmStatusChange(): void {
    if (!this.selectedTicketForAction || !this.selectedStatus) return;
    if (this.selectedStatus === this.selectedTicketForAction.status) {
      this.closeStatusModal();
      return;
    }

    this.actionLoading = true;
    this.ticketsService.changeStatus(this.selectedTicketForAction.ticket_id, this.selectedStatus).subscribe({
      next: () => {
        this.toast.success('Estado actualizado correctamente');
        this.closeStatusModal();
        this.loadTickets();
        this.actionLoading = false;
      },
      error: () => {
        this.toast.error('Error al cambiar estado');
        this.actionLoading = false;
      }
    });
  }

  // Quick Escalate
  quickEscalate(ticket: ServiceDeskTicket): void {
    Swal.fire({
      title: '¿Escalar ticket?',
      text: `¿Estás seguro de escalar el ticket #${ticket.ticket_id}? Esto cambiará la prioridad a Crítica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, escalar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc',
      input: 'textarea',
      inputLabel: 'Razón de escalación (opcional)',
      inputPlaceholder: 'Escribe la razón...',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketsService.escalate(ticket.ticket_id, result.value || '').subscribe({
          next: () => {
            this.toast.success('Ticket escalado correctamente');
            this.loadTickets();
          },
          error: () => this.toast.error('Error al escalar ticket')
        });
      }
    });
  }

  // Quick Resolve
  quickResolve(ticket: ServiceDeskTicket): void {
    Swal.fire({
      title: '¿Resolver ticket?',
      text: `¿Marcar el ticket #${ticket.ticket_id} como resuelto?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc',
      input: 'textarea',
      inputLabel: 'Notas de resolución (opcional)',
      inputPlaceholder: 'Escribe las notas...',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketsService.changeStatus(ticket.ticket_id, 'cerrado', result.value || '').subscribe({
          next: () => {
            this.toast.success('Ticket resuelto correctamente');
            this.loadTickets();
          },
          error: () => this.toast.error('Error al resolver ticket')
        });
      }
    });
  }
}

