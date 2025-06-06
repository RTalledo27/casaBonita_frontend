import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';
import { Client } from '../models/client';
import { BehaviorSubject, catchError, Observable, of, startWith, Subject, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { PusherService } from '../../../core/services/pusher.service';
import { PusherListenerService } from '../../../core/services/pusher-listener.service';
import { ClientsService } from '../services/clients.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { CrmFilterPipe } from '../crm-filter.pipe';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-clients',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    RouterModule,
    FormsModule,
    SharedTableComponent,
    CrmFilterPipe,
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent {
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  clients$ = this.clientsSubject.asObservable();

  
  filter: string = '';
  type: string = '';
  isModalOpen = false;
  plus = Plus;

  private pusherListenersInitialized = false;
  events = ['created', 'updated', 'deleted'];
  idField = 'client_id';
  @ViewChild('nameTpl') nameTpl!: TemplateRef<any>;
  @ViewChild('emailTpl') emailTpl!: TemplateRef<any>;

  /** Datos reactivos */
  private destroy$ = new Subject<void>();

  columns: ColumnDef[] = [
    { field: 'first_name', header: 'crm.clients.first_name' },
    { field: 'last_name', header: 'crm.clients.last_name' },
    { field: 'doc_type', header: 'crm.clients.doc_type' },
    { field: 'doc_number', header: 'crm.clients.doc_number' },
    { field: 'email', header: 'crm.clients.email' },
    { field: 'primary_phone', header: 'crm.clients.primary_phone' },
    { field: 'type', header: 'crm.clients.type' },
  ];

  templates: Record<string, TemplateRef<any>> = {};

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute,
    private pusherService: PusherService,
    private pusherListenerService: PusherListenerService,
    private modalService: ModalService,
        public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.pusherService.resubscribe('client', this.events);
    this.pusherService.subscribeToChannel('client', this.events);
    this.setupPusherListeners();
  }

  loadClients(): void {
    this.clientsService.list().subscribe({
      next: (list) => this.clientsSubject.next(list),
            error: () => this.toast.show('Error al cargar clientes', 'error'),
    });  }

  onCreate(): void {
    this.modalService.open(['create'], this.route); 
    this.isModalOpen = true;
  }

  canCreate() {
    return this.authService.hasPermission('crm.clients.store');
  }

  onEdit(id: number): void {
    this.modalService.open([id.toString(), 'edit'], this.route);
    this.isModalOpen = true;
  }

  canEdit() {
    return this.authService.hasPermission('crm.clients.update');
  }

  onView(id: number): void {
    this.router.navigate(['crm/clients', id]);

  }

  onDelete(id: number): void {
    this.clientsService.delete(id).subscribe({
      next: () => {
        this.toast.show('Cliente eliminado', 'success');
        //this.loadClients();
      },
      error: () => this.toast.show('Error al eliminar', 'error'),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onModalActivate(component: any) {
    if (component instanceof ClientFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.isModalOpen = isOpen;
        this.router.navigate(['crm/clients']);
        this.loadClients();
      });

      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        this.router.navigate(['crm/clients']);
        this.loadClients();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route); 
  }

  private setupPusherListeners(): void {
    if (this.pusherListenersInitialized) return;
    this.pusherListenersInitialized = true;
    this.pusherListenerService.setupPusherListeners(
      'client',
      this.events,
      this.idField,
      this.clientsSubject,
      this.clientsSubject,
      this.clientsSubject
    );
  }
}
