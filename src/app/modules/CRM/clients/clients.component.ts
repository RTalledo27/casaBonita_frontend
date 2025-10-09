import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Eraser, LucideAngularModule, Plus, PlusIcon, Search, Users } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { Client } from '../models/client';
import { ClientsService } from '../services/clients.service';
import { SharedTableComponent, ColumnDef } from '../../../shared/components/shared-table/shared-table.component';
import { CrmFilterPipe } from '../crm-filter.pipe';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    LucideAngularModule,
    TranslateModule,
    SharedTableComponent,
    CrmFilterPipe
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients$: Observable<Client[]>;
  filter = '';
  type = '';
  isModalOpen = false;
  plus = Plus;
  idField = 'client_id';
  Users = Users;
  Search = Search;
  Eraser  = Eraser;
  Plus = PlusIcon;


  columns: ColumnDef[] = [
    { field: 'first_name', header: 'First Name' },
    { field: 'last_name', header: 'Last Name' },
    { field: 'email', header: 'Email' },
    { field: 'phone', header: 'Phone' },
    { field: 'type', header: 'Type' }
  ];

  templates: any = {};

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.clients$ = this.clientsService.list();
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clients$ = this.clientsService.list();
  }

  canCreate(): boolean {
    // Implement permission logic here
    return true;
  }

  onCreate(): void {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], { relativeTo: this.route });
  }

  onEdit(id: number): void {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: ['edit', id] } }], { relativeTo: this.route });
  }

  onView(id: number): void {
    this.router.navigate(['/crm/clients', id]);
  }

  onDelete(id: number): void {
    if (confirm('Estas seguro de eliminar este cliente?')) {
      this.clientsService.delete(id).subscribe(() => {
        this.loadClients();
      });
    }
  }

  onModalActivate(component: any): void {
    this.isModalOpen = true;
    // Subscribe to modal close event if component has modalClosed emitter
    if (component && component.modalClosed) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.loadClients(); // Reload clients after modal closes
      });
    }
  }

  onModalDeactivate(): void {
    this.isModalOpen = false;
  }
}