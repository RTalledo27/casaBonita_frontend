import { Component } from '@angular/core';
import { Role } from '../users/models/role';
import { RolesService } from '../services/roles.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, Observable, of, Subject, take } from 'rxjs';
import { RoleFormComponent } from './role-form/role-form.component';
import { SharedDeleteComponent } from '../../../shared/components/shared-delete/shared-delete.component';
import { PusherService } from '../../../core/services/pusher.service';
import { Subscription } from 'rxjs';
import { PusherListenerService } from '../../../core/services/pusher-listener.service';



@Component({
  selector: 'app-roles',
  imports: [
    TranslateModule,
    CommonModule,
    DatePipe,
    FormsModule,
    RouterOutlet,
    SharedDeleteComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  loading = true;
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  filter = '';

  isModalOpen = false;
  showDeleteModal = false;
  private pusherSubscriptions = new Subscription();

  selectedItemId: number | null = null;
  selectedItemName: string = '';

  /** Datos del backend */
  private destroy$ = new Subject<void>();
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private pusherListenersInitialized = false;
  events = ['created', 'updated', 'deleted'];
  idField = 'role_id';

  roles$: Observable<Role[]> = this.rolesSubject.asObservable();

  get totalPermissions(): number {
    const set = new Set<number>();
    this.allRoles.forEach(r => r.permissions?.forEach(p => set.add(p.id)));
    return set.size;
  }

  constructor(
    public router: Router,
    private roleService: RolesService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private pusherService: PusherService,
    private pusherListenerService: PusherListenerService,
    public authService: AuthService // plantillas acceden a auth.has()
  ) {}

  ngOnInit(): void {
    this.roles$ = this.rolesSubject.asObservable();
    this.getRoles();

    this.roles$.subscribe(roles => {
      this.allRoles = roles;
      this.applyFilter();
    });

    this.pusherService.resubscribe('role', this.events);
    this.pusherService.subscribeToChannel('role', this.events);
    this.setupPusherListeners();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isModalOpen = true;
      }
    });
  }

  getRoles(): void {
    this.loading = true;
    this.roleService
      .getAllRoles()
      .pipe(
        catchError(() => {
          this.toast.show('common.errorLoad', 'error');
          return of([]);
        })
      )
      .subscribe((roles) => {
        this.rolesSubject.next(roles);
        this.loading = false;
      });
  }

  applyFilter(): void {
    const q = this.filter.toLowerCase().trim();
    if (!q) {
      this.filteredRoles = [...this.allRoles];
    } else {
      this.filteredRoles = this.allRoles.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
  }

  trackRole(_: number, r: Role): number {
    return r.role_id;
  }

  delete(id: number): void {
    this.onAskDelete(id);
    this.showDeleteModal = true;

    /*if (!confirm('¿Eliminar rol?')) return;
    this.roleService.delete(id).subscribe({
      next: () => {
        this.toast.show('common.deleted', 'success');
        this.getRoles();
      },
      error: () => this.toast.show('common.errorSave', 'error'),
    });*/
  }

  canCreate(): boolean {
    return this.authService.hasPermission('security.roles.store');
  }

  canEdit(): boolean {
    return this.authService.hasPermission('security.roles.update');
  }

  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }
  onEdit(id: number) {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: [id.toString(), 'edit'] } }], {
      relativeTo: this.route,
    });
  }

  onViewDetails(id: number) {
    this.router.navigate(['/security/roles', id]);
  }

  //ABRIR RUTA COMO MODAL:
  onModalActivate(component: any) {
    if (component instanceof RoleFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.isModalOpen = isOpen; // Actualiza el estado
        this.router.navigate(['security/roles']); // Opcional: Navega
      });

      component.submitForm.subscribe(({ data, isEdit }) => {
        this.isModalOpen = false;
        this.getRoles();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAskDelete(id: number) {
    this.roles$.pipe(take(1)).subscribe((roles) => {
      const item = roles.find((r) => r.role_id === id);
      this.selectedItemId = id;
      this.selectedItemName = item?.name || 'este registro';
      this.showDeleteModal = true;
    });
  }

  // Método para configurar los listeners de Pusher
  private setupPusherListeners(): void {
    if (this.pusherListenersInitialized) return; // ✅ evitar duplicación
    this.pusherListenersInitialized = true;

    // Configuramos los listeners para eventos genericos (created, updated, deleted)
    this.pusherListenerService.setupPusherListeners(
      'role',
      this.events,
      this.idField,
      this.rolesSubject,
      this.rolesSubject, // Actualizamos roles tanto en 'created' como en 'updated'
      this.rolesSubject // Eliminamos roles en 'deleted'
    );
  }

  /* private setupPusherListeners(): void {
    if (this.pusherListenersInitialized) return; // ✅ evitar duplicación
    this.pusherListenersInitialized = true;

    this.pusherSubscriptions.add(
      this.pusherService.roleCreated$.subscribe((data) => {
        const currentRoles = this.rolesSubject.value;
        this.rolesSubject.next([data.role, ...currentRoles]);
        this.toast.show('Se ha creado un nuevo rol', 'info');
      })
    );

    this.pusherSubscriptions.add(
      this.pusherService.roleUpdated$.subscribe((data) => {
        const updatedRole = data.role;
        const currentRoles = this.rolesSubject.value.map((role) =>
          role.role_id === updatedRole.role_id ? updatedRole : role
        );
        this.rolesSubject.next(currentRoles);
        this.toast.show('Rol actualizado', 'info');
      })
    );

    this.pusherSubscriptions.add(
      this.pusherService.roleDeleted$.subscribe((data) => {
        const deletedRoleId = data.role.role_id;
        const currentRoles = this.rolesSubject.value.filter(
          (role) => role.role_id !== deletedRoleId
        );
        this.rolesSubject.next(currentRoles);
        this.toast.show('Rol eliminado', 'info');
      })
    );
  }*/

  deleteConfirmed() {
    if (this.selectedItemId !== null) {
      this.roleService.delete(this.selectedItemId).subscribe(() => {
        this.getRoles(); // Recarga la lista
        this.toast.show(`Se ha elimando el elemento seleccionado.`, 'info');
        this.showDeleteModal = false;
      });
    }
  }
}

