import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Observable, switchMap } from 'rxjs';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import {
  formatDistanceStrict,
  differenceInMinutes,
  differenceInHours,
  isBefore,
  parseISO,
  addHours,
} from 'date-fns';

@Component({
  selector: 'app-service-desk-detail',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './service-desk-detail.component.html',
  styleUrl: './service-desk-detail.component.scss',
})
export class ServiceDeskDetailComponent implements OnInit {
  ticket$!: Observable<ServiceDeskTicket>;
  currentTicket: ServiceDeskTicket | null = null;

  // Modal state
  showActionModal = false;
  actionModalType: 'add' | 'resolve' | 'escalate' | 'assign' | 'extend' = 'add';
  actionModalTitle = '';
  actionNotes = '';
  newActionType = 'comentario';
  selectedTechId: number | null = null;
  newSlaDate = '';
  actionLoading = false;

  // Technicians list (should be loaded from API)
  technicians: any[] = [];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private ticketService: ServiceDeskTicketsService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.ticket$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = +params.get('id')!;
        return this.ticketService.get(id);
      })
    );

    // Subscribe to keep track of current ticket
    this.ticket$.subscribe((ticket) => {
      this.currentTicket = ticket;
    });

    // Load technicians (mock - should be from API)
    this.loadTechnicians();
  }

  loadTechnicians(): void {
    this.ticketService.getTechnicians().subscribe({
      next: (techs) => {
        this.technicians = techs;
      },
      error: () => {
        this.technicians = [];
      }
    });
  }

  reloadTicket(): void {
    if (this.currentTicket) {
      this.ticket$ = this.ticketService.get(this.currentTicket.ticket_id);
      this.ticket$.subscribe((ticket) => {
        this.currentTicket = ticket;
      });
    }
  }

  // Status helpers
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      abierto: 'Abierto',
      en_proceso: 'En Proceso',
      cerrado: 'Cerrado',
    };
    return labels[status] || status;
  }

  isSlaExpired(ticket: ServiceDeskTicket): boolean {
    if (!ticket.sla_due_at || ticket.status === 'cerrado') return false;
    return isBefore(parseISO(ticket.sla_due_at), new Date());
  }

  isSlaWarning(ticket: ServiceDeskTicket): boolean {
    if (!ticket.sla_due_at || ticket.status === 'cerrado') return false;
    const slaDue = parseISO(ticket.sla_due_at);
    const hoursLeft = differenceInHours(slaDue, new Date());
    return hoursLeft > 0 && hoursLeft <= 4;
  }

  // Action helpers
  getEscalations(ticket: ServiceDeskTicket): number {
    return ticket.actions?.filter((a) => a.action_type === 'escalado' || a.action_type === 'escalation').length ?? 0;
  }

  getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      comentario: 'message-circle',
      comment: 'message-circle',
      cambio_estado: 'refresh-cw',
      status_change: 'refresh-cw',
      escalado: 'arrow-up-circle',
      escalation: 'arrow-up-circle',
      asignacion: 'user-plus',
      assignment: 'user-plus',
    };
    return icons[actionType] || 'plus-circle';
  }

  getActionTitle(actionType: string): string {
    const titles: Record<string, string> = {
      comentario: 'Comentario agregado',
      comment: 'Comentario agregado',
      cambio_estado: 'Estado actualizado',
      status_change: 'Estado actualizado',
      escalado: 'Escalación',
      escalation: 'Escalación',
      asignacion: 'Asignación de técnico',
      assignment: 'Asignación de técnico',
    };
    return titles[actionType] || 'Acción';
  }

  // Time calculations
  calcElapsedTime(ticket: ServiceDeskTicket): string {
    if (!ticket.opened_at) return '--';
    const opened = parseISO(ticket.opened_at);

    // Use closed_at time if ticket is closed, otherwise use current time
    let endTime: Date;
    if (ticket.status === 'cerrado' && ticket.closed_at) {
      endTime = parseISO(ticket.closed_at);
    } else if (ticket.status === 'cerrado' && ticket.updated_at) {
      endTime = parseISO(ticket.updated_at);
    } else {
      endTime = new Date();
    }

    const mins = differenceInMinutes(endTime, opened);
    const horas = Math.floor(mins / 60);
    const minutos = mins % 60;

    if (horas === 0 && minutos === 0) return '< 1m';
    if (horas === 0) return `${minutos}m`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}m`;
  }

  calcSlaLeft(ticket: ServiceDeskTicket): string {
    if (!ticket.sla_due_at) return 'Sin SLA';

    const slaDue = parseISO(ticket.sla_due_at);

    // For closed tickets, check if SLA was met
    if (ticket.status === 'cerrado') {
      const closedTime = ticket.closed_at
        ? parseISO(ticket.closed_at)
        : ticket.updated_at
          ? parseISO(ticket.updated_at)
          : new Date();

      if (isBefore(closedTime, slaDue)) {
        return '✓ Cumplido';
      } else {
        return '✗ No cumplido';
      }
    }

    const now = new Date();

    if (isBefore(slaDue, now)) return 'Vencido';

    const mins = differenceInMinutes(slaDue, now);
    const horas = Math.floor(mins / 60);
    const minutos = mins % 60;

    if (horas === 0 && minutos === 0) return '< 1m';
    if (horas === 0) return `${minutos}m`;
    if (horas < 24) return `${horas}h ${minutos}m`;
    return `${Math.floor(horas / 24)}d`;
  }

  // Modal openers
  openAddAction(ticket: ServiceDeskTicket): void {
    this.actionModalType = 'add';
    this.actionModalTitle = 'Agregar Acción';
    this.newActionType = 'comentario';
    this.actionNotes = '';
    this.showActionModal = true;
  }

  openMarkAsResolved(ticket: ServiceDeskTicket): void {
    this.actionModalType = 'resolve';
    this.actionModalTitle = 'Marcar como Resuelto';
    this.actionNotes = '';
    this.showActionModal = true;
  }

  openEscalateModal(ticket: ServiceDeskTicket): void {
    this.actionModalType = 'escalate';
    this.actionModalTitle = 'Escalar Ticket';
    this.actionNotes = '';
    this.showActionModal = true;
  }

  openAssignTechModal(ticket: ServiceDeskTicket): void {
    this.actionModalType = 'assign';
    this.actionModalTitle = 'Asignar Técnico';
    this.selectedTechId = null;
    this.actionNotes = '';
    this.showActionModal = true;
  }

  openExtendSlaModal(ticket: ServiceDeskTicket): void {
    this.actionModalType = 'extend';
    this.actionModalTitle = 'Extender SLA';
    this.newSlaDate = '';
    this.actionNotes = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.actionNotes = '';
    this.newActionType = 'comentario';
    this.selectedTechId = null;
    this.newSlaDate = '';
  }

  submitAction(): void {
    if (!this.currentTicket) return;

    this.actionLoading = true;
    const ticketId = this.currentTicket.ticket_id;

    switch (this.actionModalType) {
      case 'add':
        // Add comment / generic action
        this.ticketService.addComment(ticketId, this.actionNotes, this.newActionType).subscribe({
          next: () => this.handleActionSuccess('Acción registrada correctamente'),
          error: () => this.handleActionError('Error al registrar acción')
        });
        break;

      case 'resolve':
        // Change status to closed
        this.ticketService.changeStatus(ticketId, 'cerrado', this.actionNotes).subscribe({
          next: () => this.handleActionSuccess('Ticket marcado como resuelto'),
          error: () => this.handleActionError('Error al resolver ticket')
        });
        break;

      case 'escalate':
        // Escalate ticket
        this.ticketService.escalate(ticketId, this.actionNotes).subscribe({
          next: () => this.handleActionSuccess('Ticket escalado correctamente'),
          error: () => this.handleActionError('Error al escalar ticket')
        });
        break;

      case 'assign':
        // Assign technician
        if (!this.selectedTechId) {
          this.toast.error('Seleccione un técnico');
          this.actionLoading = false;
          return;
        }
        this.ticketService.assign(ticketId, this.selectedTechId).subscribe({
          next: () => this.handleActionSuccess('Técnico asignado correctamente'),
          error: () => this.handleActionError('Error al asignar técnico')
        });
        break;

      case 'extend':
        // Extend SLA - update ticket with new SLA date
        this.ticketService.update(ticketId, { sla_due_at: this.newSlaDate } as any).subscribe({
          next: () => this.handleActionSuccess('SLA extendido correctamente'),
          error: () => this.handleActionError('Error al extender SLA')
        });
        break;
    }
  }

  private handleActionSuccess(message: string): void {
    this.actionLoading = false;
    this.closeActionModal();
    this.toast.success(message);
    this.reloadTicket();
  }

  private handleActionError(message: string): void {
    this.actionLoading = false;
    this.toast.error(message);
  }

  // Navigation
  onEdit(ticket: ServiceDeskTicket): void {
    // Navigate back to tickets list where the edit modal can be triggered
    this.router.navigate(['/service-desk/tickets'], {
      queryParams: { edit: ticket.ticket_id }
    });
  }

  // Legacy methods for compatibility
  markAsResolved(ticket: ServiceDeskTicket): void {
    this.openMarkAsResolved(ticket);
  }

  escalateTicket(ticket: ServiceDeskTicket): void {
    this.openEscalateModal(ticket);
  }

  openAssignTech(ticket: ServiceDeskTicket): void {
    this.openAssignTechModal(ticket);
  }

  extendSla(ticket: ServiceDeskTicket): void {
    this.openExtendSlaModal(ticket);
  }
}