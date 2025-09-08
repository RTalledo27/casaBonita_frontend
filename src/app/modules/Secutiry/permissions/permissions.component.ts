import { Component } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { Role } from '../users/models/role';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { PermissionsService } from '../services/permissions.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../users/models/permission';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// Interfaz para la respuesta paginada
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

@Component({
  selector: 'app-permissions',
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    SharedTableComponent,
    PaginationComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent {
  columns: ColumnDef[] = [
    { field: 'name', header: 'security.permissions.codName',translateContent:false },
    { field: 'name', header: 'security.permissions.name', translateContent:true },
    {
      field: 'created_at',
      header: 'common.created',
      align: 'right',
      width: '160px',
      tpl: 'date', // Nueva plantilla para fechas
    },
  ];

  permissionsSubject = new BehaviorSubject<Permission[]>([]);
  permissions$ = this.permissionsSubject.asObservable();
  loading = false;


  // Propiedades de paginación
  pagination = {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 10
  };

  constructor(
    private permissionService: PermissionsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

    this.getPermissions();
  }

  getPermissions(page: number = 1): void {
    this.loading = true;
    this.permissionService.list(page, this.pagination.perPage).subscribe({
      next: (res: PaginatedResponse<Permission>) => {
        this.permissionsSubject.next(res.data);
        // Actualizar propiedades de paginación desde meta
        this.pagination = {
          currentPage: res.meta?.current_page || page,
          totalPages: res.meta?.last_page || 1,
          total: res.meta?.total || 0,
          perPage: res.meta?.per_page || 10
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('common.errorLoad', 'error');
      },
    });
  }

  onPageChange(page: number): void {
    this.getPermissions(page);
  }


}
