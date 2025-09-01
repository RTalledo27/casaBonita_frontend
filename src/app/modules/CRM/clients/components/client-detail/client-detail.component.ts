import { Component } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { Client } from '../../../models/client';
import { LucideAngularModule, UserIcon } from 'lucide-angular';
import { ActivatedRoute, Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { ClientsService } from '../../../services/clients.service';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-detail',
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
})
export class ClientDetailComponent {
  isModalOpen = false;
  client$: Observable<Client>;

  User = UserIcon;

  constructor(
    private route: ActivatedRoute,
    private clientsService: ClientsService,
    private router: Router,
  ) {
    this.client$ = this.route.paramMap.pipe(
      switchMap((p) => this.clientsService.get(+p.get('id')!))
    );
  }

  onEdit(client: Client) {
    this.isModalOpen = true;
    this.router.navigate(
      [{ outlets: { modal: [client.client_id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }

  onModalActivate(component: any) {
    if (component instanceof ClientFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.isModalOpen = isOpen;
        this.router.navigate(['crm/clients']);
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('¿Eliminar cliente?')) return;
    this.clientsService.delete(id).subscribe(() => {
      this.router.navigate(['/crm/clients']);
    });
  }

}
