import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { RolesService } from '../../services/roles.service';
import { map, Observable, shareReplay, Subject, switchMap, takeUntil } from 'rxjs';

import { Role } from '../../users/models/role';
import { Permission } from '../../users/models/permission';
import { RoleFormComponent } from '../role-form/role-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-role-details',
   standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    RouterOutlet,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './role-details.component.html',
  styleUrl: './role-details.component.scss'
})
export class RoleDetailsComponent implements OnInit {
  // Estado modal
  isModalOpen = false;

  // Flujo de datos
  role$: Observable<Role>;
  vm$: Observable<{ role: Role; groups: Array<{ key: string; value: Permission[] }> }>;

  // Carrusel
  currentModuleIndex = 0;


  // Permisos
  canEditPerm = false;
  canDeletePerm = false;

  // trackBy handlers (estables)
  trackGroupBy = (_: number, g: { key: string }) => g.key;
  trackPermBy = (_: number, p: Permission) =>
    (p as any).permission_id ?? p.name;
  trackUserBy = (_: number, u: any) =>
    u?.user_id ?? u?.email ?? (u?.first_name + u?.last_name);

  constructor(
    private route: ActivatedRoute,
    private rolesService: RolesService,
    private router: Router,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.role$ = this.route.paramMap.pipe(
      switchMap((params) => this.rolesService.get(+params.get('id')!))
    );

    this.vm$ = this.role$.pipe(
      map((role) => ({
        role,
        groups: this.groupPermissionsToArray(role.permissions || [])
      })),
      shareReplay(1)
    );
    
  }

  //

  

  ngOnInit(): void {
      // Permisos (evitamos funciones en template)
  this.canEditPerm = this.authService.hasPermission('security.roles.update');
  this.canDeletePerm = this.authService.hasPermission('security.roles.destroy');

  }

  // helpers
  private groupPermissionsToArray(
    perms: Permission[]
  ): Array<{ key: string; value: Permission[] }> {
    const grouped: Record<string, Permission[]> = {};
    for (const p of perms) {
      const moduleKey = (p.name?.split('.')[0] || 'general').toLowerCase();
      (grouped[moduleKey] ||= []).push(p);
    }
    return Object.entries(grouped).map(([key, value]) => ({ key, value }));
  }

  // Carrusel (sin subscribirse dentro, evita loops)
  nextModule(groupsLen: number) {
    if (this.currentModuleIndex < groupsLen - 1) this.currentModuleIndex++;
  }
  previousModule() {
    if (this.currentModuleIndex > 0) this.currentModuleIndex--;
  }
  goToModule(index: number, groupsLen: number) {
    if (index >= 0 && index < groupsLen) this.currentModuleIndex = index;
  }

  // Acciones UI
  onEdit(role: Role) {
    if (!this.canEditPerm) {
      this.toast.show('No tienes permisos para editar roles', 'error');
      return;
    }
    this.isModalOpen = true;
    this.router.navigate(
      [{ outlets: { modal: [role.role_id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }

  onModalActivate(component: any) {
    if (component instanceof RoleFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.isModalOpen = isOpen;
        this.router.navigate(['security/roles']);
      });

      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        // Refrescar datos del rol
        this.role$ = this.route.paramMap.pipe(
          switchMap((params) => this.rolesService.get(+params.get('id')!))
        );
      });
    }
  }

  onDelete(role: Role) {
    if (!this.canDeletePerm) {
      this.toast.show('No tienes permisos para eliminar roles', 'error');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`)) {
      return;
    }
    this.rolesService.delete(role.role_id).subscribe({
      next: () => {
        this.toast.show('Rol eliminado exitosamente', 'success');
        this.router.navigate(['/security/roles']);
      },
      error: (error: any) => {
        this.toast.show('Error al eliminar el rol', 'error');
        console.error('Error deleting role:', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/security/roles']);
  }
}
