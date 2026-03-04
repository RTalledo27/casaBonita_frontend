import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
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
    FormsModule,
    TranslateModule,
    PaginationComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent {
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  allPermissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  filter = '';
  loading = false;

  // Propiedades de paginación
  pagination = {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 10,
  };

  constructor(
    private permissionService: PermissionsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.getPermissions();
  }

  getPermissions(page: number = 1): void {
    this.loading = true;
    this.permissionService.list(page, this.pagination.perPage).subscribe({
      next: (res: PaginatedResponse<Permission>) => {
        this.permissionsSubject.next(res.data);
        this.allPermissions = res.data;
        this.applyFilter();
        this.pagination = {
          currentPage: res.meta?.current_page || page,
          totalPages: res.meta?.last_page || 1,
          total: res.meta?.total || 0,
          perPage: res.meta?.per_page || 10,
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

  applyFilter(): void {
    const term = this.filter.toLowerCase().trim();
    if (!term) {
      this.filteredPermissions = [...this.allPermissions];
    } else {
      this.filteredPermissions = this.allPermissions.filter((p) =>
        p.name.toLowerCase().includes(term)
      );
    }
  }

  /** Extraer módulo del nombre del permiso (ej: "users.create" → "users") */
  getModule(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts[0] : 'general';
  }

  trackPerm(_: number, p: Permission): number {
    return p.id;
  }
}
