import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Client } from '../models/client';
import { BehaviorSubject, Subscription } from 'rxjs';
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
    CrmFilterPipe,
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

  @ViewChild('nameTpl') nameTpl!: TemplateRef<any>;
  @ViewChild('emailTpl') emailTpl!: TemplateRef<any>;

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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientsService.list().subscribe({
      next: (res) => {
        this.clients = res;
      },
      error: () => this.toast.show('Error al cargar clientes', 'error'),
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
        this.loadClients();
      },
      error: () => this.toast.show('Error al eliminar', 'error'),
    });
  }

  onModalActivate(component: any) {
    console.log('oa');
    if (component instanceof ClientFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        //this.getUsers(); // Vuelve a cargar la lista completa

        this.isModalOpen = isOpen; // Actualiza el estado
        console.log(this.isModalOpen);
        this.router.navigate(['security/users']); // Opcional: Navega
      });

      component.submitForm.subscribe(({ data, isEdit }) => {
        this.isModalOpen = false; // Cierra el modal
        console.log(this.isModalOpen);
        //this.getUsers();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    console.log(this.isModalOpen);
  }
}
