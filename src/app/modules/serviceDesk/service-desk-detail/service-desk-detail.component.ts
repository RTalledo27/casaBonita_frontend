import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ArrowUpCircle, Calendar, Calendar1, CheckCircle, Clock, LucideAngularModule, MessageCircle, Pencil, PlusCircle, Repeat, User, UserCircle, UserPlus } from 'lucide-angular';
import { Observable, of, switchMap } from 'rxjs';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import {
  formatDistanceStrict,
  differenceInMinutes,
  isBefore,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale'; // Opcional: para español

@Component({
  selector: 'app-service-desk-detail',
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './service-desk-detail.component.html',
  styleUrl: './service-desk-detail.component.scss',
})
export class ServiceDeskDetailComponent {
  ticket$: Observable<ServiceDeskTicket>;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private ticketService: ServiceDeskTicketsService
  ) {
    this.ticket$ = this.route.paramMap.pipe(
      switchMap((params) => this.ticketService.get(+params.get('id')!))
    );
  }

  getEscalations(ticket: ServiceDeskTicket): number {
    return (
      ticket.actions?.filter((a) => a.action_type === 'escalado').length ?? 0
    );
  }

  // Helpers para UI
  getActionIcon(actionType: string) {
    switch (actionType) {
      case 'comentario':
        return 'message-circle';
      case 'cambio_estado':
        return 'arrow-repeat';
      case 'escalado':
        return 'arrow-up-circle';
      default:
        return 'plus-circle';
    }
  }
  getActionTitle(actionType: string) {
    switch (actionType) {
      case 'comentario':
        return 'Comentario agregado';
      case 'cambio_estado':
        return 'Estado actualizado';
      case 'escalado':
        return 'Escalación';
      default:
        return 'Acción';
    }
  }

  calcElapsedTime(ticket: ServiceDeskTicket): string {
    if (!ticket.opened_at) return '--';
    const opened = parseISO(ticket.opened_at);
    const now = new Date();

    const mins = differenceInMinutes(now, opened);
    const horas = Math.floor(mins / 60);
    const minutos = mins % 60;

    if (horas === 0 && minutos === 0) return 'Menos de 1 min';
    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  }

  calcSlaLeft(ticket: ServiceDeskTicket): string {
    if (!ticket.sla_due_at) return '--';
    const slaDue = parseISO(ticket.sla_due_at);
    const now = new Date();

    if (isBefore(slaDue, now)) return 'Vencido';

    const mins = differenceInMinutes(slaDue, now);
    const horas = Math.floor(mins / 60);
    const minutos = mins % 60;

    if (horas === 0 && minutos === 0) return 'Menos de 1 min';
    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  }

  // Acciones rápidas (dummy)
  markAsResolved(ticket: ServiceDeskTicket) {
    alert('Ticket marcado como resuelto.');
  }
  escalateTicket(ticket: ServiceDeskTicket) {
    alert('Ticket escalado.');
  }
  openAssignTech(ticket: ServiceDeskTicket) {
    alert('Abrir asignar técnico.');
  }
  extendSla(ticket: ServiceDeskTicket) {
    alert('Abrir extensión de SLA.');
  }
  openAddAction(ticket: ServiceDeskTicket) {
    alert('Abrir modal para agregar acción.');
  }

  onEdit(ticket: ServiceDeskTicket) {
    this.router.navigate(
      [{ outlets: { modal: [ticket.ticket_id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }
}