import { CommonModule, DatePipe } from '@angular/common';
import { Component, SimpleChange, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { UsersService } from '../../../services/users.service';
import { Observable, switchMap } from 'rxjs';
import { LucideAngularModule, User as userIcon } from 'lucide-angular';
import { User } from '../../models/user';
import { UserFormComponent } from '../user-form/user-form.component';
import { environment } from '../../../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../../core/services/toast.service';



@Component({
  selector: 'app-user-detail',
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    LucideAngularModule,
    RouterOutlet,
    TranslateModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent {
  isModalOpen = false;
  user$: Observable<any>;

  backendBaseUrl = environment.BACKEND_BASE_URL;

  User = userIcon;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private toast: ToastService
  ) {
    this.user$ = this.route.paramMap.pipe(
      switchMap((p) => this.usersService.get(+p.get('id')!))
    );
  }

  onEdit(user: User) {
    this.isModalOpen = true;
    this.router.navigate(
      [{ outlets: { modal: [user.id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }

  onModalActivate(component: any) {
    if (component instanceof UserFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.isModalOpen = isOpen; // Actualiza el estado
        this.router.navigate(['security/users']); // Opcional: Navega
      });
    }
  }

  onDelete(id: number) {
    if (!confirm('¿Eliminar usuario?')) return;
    this.usersService.delete(id).subscribe(() => {
      this.toast.show('Usuario eliminado', 'success');
      this.router.navigate(['/security/users']);
    });
  }
}




