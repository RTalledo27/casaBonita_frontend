import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Client } from '../models/client';
import { BehaviorSubject, catchError, Observable, of, Subject, Subscription } from 'rxjs';
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

@Component({
  selector: 'app-clients',
  imports: [
    RouterOutlet,
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    RouterModule,
    FormsModule,
    SharedTableComponent,
    
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent {
  clients: Client[] = [];
  filter: string = '';
  type: string = '';
  isModalOpen = false;
  plus = Plus;
  events = ['created', 'updated', 'deleted'];
  idField = 'client_id'; // Asegúrate que este sea el ID único del modelo Client

  @ViewChild('nameTpl') nameTpl!: TemplateRef<any>;
  @ViewChild('emailTpl') emailTpl!: TemplateRef<any>;

  /** Datos reactivos */
  private destroy$ = new Subject<void>();
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  clients$: Observable<Client[]> = this.clientsSubject.asObservable();
  private pusherListenersInitialized = false;

  columns: ColumnDef[] = [
    { field: 'first_name', header: 'crm.clients.first_name' },
    { field: 'last_name', header: 'crm.clients.last_name' },
    { field: 'doc_type', header: 'crm.clients.doc_type' },
    { field: 'doc_number', header: 'crm.clients.doc_number' },
    { field: 'email', header: 'crm.clients.email' },
    { field: 'primary_phone', header: 'crm.clients.primary_phone' },
    { field: 'type', header: 'crm.clients.type', translateContent: true },
  ];

  templates: Record<string, TemplateRef<any>> = {};

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute,
    private pusherService: PusherService,
    private pusherListenerService: PusherListenerService
  ) {}

  ngOnInit(): void {
    this.clients$ = this.clientsSubject.asObservable();
    this.loadClients();

    this.pusherService.resubscribe('client', this.events);
    this.pusherService.subscribeToChannel('client', this.events);

    this.setupPusherListeners();

    console.log(this.clients$)
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isModalOpen = true;
      }
    });
  }

  loadClients(): void {
    this.clientsService.list()
      .pipe(
        catchError(() => {
          this.toast.show('common.errorLoad', 'error');
          return of([]);
        })
    )
      .subscribe((clients) => {
        this.clientsSubject.next(clients); 
      });
  }

  onCreate(): void {
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
    this.isModalOpen = true;
  }

  onEdit(id: number): void {
    this.router.navigate([{ outlets: { modal: [id.toString(), 'edit'] } }], {
      relativeTo: this.route,
    });
    this.isModalOpen = true;
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
    console.log(this.isModalOpen);
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
