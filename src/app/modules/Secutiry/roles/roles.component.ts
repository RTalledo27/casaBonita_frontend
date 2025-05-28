import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { ColumnDef, SharedTableComponent } from "../../../shared/components/shared-table/shared-table.component";
import { Role } from '../users/models/role';
import { RolesService } from '../services/roles.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ActivatedRoute, Route, Router, RouterOutlet } from '@angular/router';
import { Permission } from '../users/models/permission';
import { CommonModule, DatePipe } from '@angular/common';
import { catchError, Observable, of } from 'rxjs';
import { RoleFormComponent } from './role-form/role-form.component';



@Component({
  selector: 'app-roles',
  imports: [
    SharedTableComponent,
    TranslateModule,
    LucideAngularModule,
    CommonModule,
    DatePipe,
    RouterOutlet,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  /** Columnas a mostrar */
  columns: ColumnDef[] = [
    { field: 'name', header: 'security.roles.name' },
    { field: 'description', header: 'security.roles.description' },
    {
      field: 'created_at',
      header: 'common.created',
      align: 'right',
      width: '160px',
      tpl: 'date', // Nueva plantilla para fechas
    },
  ];
  permission: Permission[] = [];
  isModalOpen = false;

  plus = Plus;

  /** Datos del backend */
  roles$: Observable<Role[]> = of([]);

  constructor(
    public router: Router,
    private roleService: RolesService,
    private toast: ToastService,
    private route: ActivatedRoute,
    public authService: AuthService // plantillas acceden a auth.has()
  ) {}

  ngOnInit(): void {
    this.getRoles();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isModalOpen = true;
      }
    });
  }

  getRoles(): void {
    this.roles$ = this.roleService.getAllRoles().pipe(
      //CATH ERROR
      catchError(() => {
        this.toast.show('common.errorLoad', 'error');
        return of([]);
      })
    );
  }

  delete(id: number): void {
    if (!confirm('¿Eliminar rol?')) return;
    this.roleService.delete(id).subscribe({
      next: () => {
        this.toast.show('common.deleted', 'success');
        this.getRoles();
      },
      error: () => this.toast.show('common.errorSave', 'error'),
    });
  }

  canCreate(): boolean {
    return this.authService.hasPermission('security.roles.store');
  }

  canEdit(): boolean {
    return this.authService.hasPermission('security.roles.update');
  }


  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{outlets:{modal:'create'}}], {
      relativeTo: this.route,
    })
  }
  onEdit(id:number) {
    this.isModalOpen = true;
    this.router.navigate(
      [{ outlets: { modal: [id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }

  onViewDetails(id: number) {
    this.router.navigate(['/security/roles',id]);
    
  }


  //ABRIR RUTA COMO MODAL:
  onModalActivate(component: any) {
    console.log('oa');
    if (component instanceof RoleFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        this.getRoles(); // Vuelve a cargar la lista completa

        this.isModalOpen = isOpen; // Actualiza el estado
        console.log(this.isModalOpen);
        this.router.navigate(['security/roles']); // Opcional: Navega
      });

      component.submitForm.subscribe(({ data, isEdit }) => {
        this.isModalOpen = false;
        this.getRoles();
      });
    }
  }
}

