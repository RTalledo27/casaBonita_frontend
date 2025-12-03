import { Component } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { Client } from '../../../models/client';
import { LucideAngularModule, UserIcon } from 'lucide-angular';
import { ActivatedRoute, Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { ClientsService } from '../../../services/clients.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientFormComponent } from '../client-form/client-form.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslateModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
})
export class ClientDetailComponent {
  isModalOpen = false;
  client$: Observable<Client>;
  private currentId?: number;

  User = UserIcon;

  constructor(
    private route: ActivatedRoute,
    private clientsService: ClientsService,
    private router: Router,
  ) {
    this.client$ = this.route.paramMap.pipe(
      switchMap((p) => {
        this.currentId = +p.get('id')!;
        return this.clientsService.get(this.currentId!);
      })
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
        // Cerrar outlet modal y refrescar el detalle en la misma página
        this.router.navigate([{ outlets: { modal: null } }], { relativeTo: this.route }).finally(() => {
          if (this.currentId) {
            this.client$ = this.clientsService.get(this.currentId);
          }
        });
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
