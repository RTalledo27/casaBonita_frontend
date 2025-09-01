import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedTableComponent, ColumnDef } from '../../../shared/components/shared-table/shared-table.component';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ToastService } from '../../../core/services/toast.service';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
import { Observable, BehaviorSubject } from 'rxjs';
import { ServiceDeskFilterPipe } from '../pipes/service-desk-filter.pipe';
import { FormsModule } from '@angular/forms';
import { CheckCircle, Clock, LucideAngularModule, Plus } from 'lucide-angular';
import { EstadoTicketPipe } from '../pipes/estado-ticket.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-desk-tickets',
  imports: [
    CommonModule,
    SharedTableComponent,
    ServiceDeskFilterPipe,
    FormsModule,
    LucideAngularModule,
    EstadoTicketPipe,
    TranslateModule
  ],
  templateUrl: './service-desk-tickets.component.html',
  styleUrl: './service-desk-tickets.component.scss',
})
export class ServiceDeskTicketsComponent {
  private ticketsSubject = new BehaviorSubject<ServiceDeskTicket[]>([]);
  tickets$ = this.ticketsSubject.asObservable();
  filter = '';
  priority = '';
  status = '';
  isModalOpen = false;
  selectedTicket: ServiceDeskTicket | null = null;
  clock = Clock;
  plus = Plus;
  checkCircle = CheckCircle;

  // Define tus columnas según tu tabla compartida
  /*columns: ColumnDef[] = [
    { field: 'ticket_id', header: 'ID' },
    { field: 'ticket_type', header: 'Tipo' },
    { field: 'priority', header: 'Prioridad' },
    { field: 'status', header: 'Estado' },
    { field: 'opened_at', header: 'Fecha' },
    //{ field: 'opened_by', header: 'Solicitante' },
    {
      value: (t) =>
        t.opened_by?.first_name + ' ' + t.opened_by?.last_name || '',
      header: 'Solicitante',
    },
    // ... otros campos
    { field: 'actions', header: 'Acciones' },
  ];*/

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
    private toast: ToastService, // Si usas notificaciones
    private auth: AuthService, // Si usas permisos en frontend
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketsService.list().subscribe((tickets) => {
      this.ticketsSubject.next(tickets);
    });
  }

  onCreate(): void {
    this.selectedTicket = null;
    this.isModalOpen = true;
    // Lógica para abrir formulario en modo creación
  }

  onEdit(event: any): void {
    this.selectedTicket = event;
    this.isModalOpen = true;
    // Lógica para cargar datos en el formulario
  }

  onView(id: any): void {
    this.isModalOpen = true;
    console.log('Ver ticket:', id);
    // Puedes abrir modal de solo lectura
    this.router.navigate(['service-desk/tickets', id]);
  }

  onDelete(ticket: any): void {
    if (confirm('¿Seguro de eliminar el ticket?')) {
      this.ticketsService
        .delete(ticket.ticket_id)
        .subscribe(() => this.loadTickets());
    }
  }

  onModalActivate(event: any): void {
    // Cuando el modal se activa (ej: guardar ticket), recarga la lista
    this.loadTickets();
    this.isModalOpen = false;
  }

  canCreate(): boolean {
    // Reemplaza esto con tu lógica de permisos real
    return this.auth.hasPermission('service-desk.tickets.store');
  }
}
