import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  action: string;
}

export interface UserPermissions {
  userId: number;
  permissions: string[];
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.URL_BACKEND}/permissions`;
  private userPermissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  public userPermissions$ = this.userPermissionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserPermissions();
  }

  // Load user permissions from API
  loadUserPermissions(): Observable<UserPermissions> {
    return this.http.get<UserPermissions>(`${this.apiUrl}/user`).pipe(
      tap(permissions => this.userPermissionsSubject.next(permissions)),
      catchError(() => {
        // Return mock permissions on error for development
        const mockPermissions = this.getMockUserPermissions();
        this.userPermissionsSubject.next(mockPermissions);
        return of(mockPermissions);
      })
    );
  }

  // Check if user has specific permission
  hasPermission(permission: string): Observable<boolean> {
    const currentPermissions = this.userPermissionsSubject.value;
    
    if (!currentPermissions) {
      return this.loadUserPermissions().pipe(
        map(permissions => permissions.permissions.includes(permission))
      );
    }

    return of(currentPermissions.permissions.includes(permission));
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): Observable<boolean> {
    const currentPermissions = this.userPermissionsSubject.value;
    
    if (!currentPermissions) {
      return this.loadUserPermissions().pipe(
        map(userPerms => permissions.some(perm => userPerms.permissions.includes(perm)))
      );
    }

    return of(permissions.some(perm => currentPermissions.permissions.includes(perm)));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions: string[]): Observable<boolean> {
    const currentPermissions = this.userPermissionsSubject.value;
    
    if (!currentPermissions) {
      return this.loadUserPermissions().pipe(
        map(userPerms => permissions.every(perm => userPerms.permissions.includes(perm)))
      );
    }

    return of(permissions.every(perm => currentPermissions.permissions.includes(perm)));
  }

  // Check if user has specific role
  hasRole(role: string): Observable<boolean> {
    const currentPermissions = this.userPermissionsSubject.value;
    
    if (!currentPermissions) {
      return this.loadUserPermissions().pipe(
        map(permissions => permissions.roles.includes(role))
      );
    }

    return of(currentPermissions.roles.includes(role));
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): Observable<boolean> {
    const currentPermissions = this.userPermissionsSubject.value;
    
    if (!currentPermissions) {
      return this.loadUserPermissions().pipe(
        map(userPerms => roles.some(role => userPerms.roles.includes(role)))
      );
    }

    return of(roles.some(role => currentPermissions.roles.includes(role)));
  }

  // Get all available permissions
  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/all`).pipe(
      catchError(() => of(this.getMockPermissions()))
    );
  }

  // Get permissions by module
  getPermissionsByModule(module: string): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/module/${module}`).pipe(
      catchError(() => of(this.getMockPermissions().filter(p => p.module === module)))
    );
  }

  // Refresh user permissions
  refreshPermissions(): Observable<UserPermissions> {
    return this.loadUserPermissions();
  }

  // Clear permissions (on logout)
  clearPermissions(): void {
    this.userPermissionsSubject.next(null);
  }

  // Mock data for development
  private getMockUserPermissions(): UserPermissions {
    return {
      userId: 1,
      permissions: [
        // Reports permissions
        'reports.view',
        'reports.view_dashboard',
        'reports.view_sales',
        'reports.view_payments',
        'reports.view_projections',
        'reports.export',
        'reports.create',
        'reports.edit',
        'reports.delete',
        
        // Sales permissions
        'sales.view',
        'sales.create',
        'sales.edit',
        'sales.delete',
        'sales.manage',
        
        // Collections permissions
        'collections.view',
        'collections.manage',
        'collections.edit_schedule',
        
        // HR permissions
        'hr.view',
        'hr.manage_employees',
        
        // Finance permissions
        'finance.view',
        'finance.manage',
        
        // Admin permissions
        'admin.users',
        'admin.settings',
        'admin.permissions'
      ],
      roles: [
        'admin',
        'manager',
        'sales_manager',
        'finance_manager'
      ]
    };
  }

  private getMockPermissions(): Permission[] {
    return [
      // Reports module permissions
      { id: 1, name: 'reports.view', description: 'Ver reportes', module: 'reports', action: 'view' },
      { id: 2, name: 'reports.view_dashboard', description: 'Ver dashboard de reportes', module: 'reports', action: 'view_dashboard' },
      { id: 3, name: 'reports.view_sales', description: 'Ver reportes de ventas', module: 'reports', action: 'view_sales' },
      { id: 4, name: 'reports.view_payments', description: 'Ver cronogramas de pagos', module: 'reports', action: 'view_payments' },
      { id: 5, name: 'reports.view_projections', description: 'Ver reportes proyectados', module: 'reports', action: 'view_projections' },
      { id: 6, name: 'reports.export', description: 'Exportar reportes', module: 'reports', action: 'export' },
      { id: 7, name: 'reports.create', description: 'Crear reportes', module: 'reports', action: 'create' },
      { id: 8, name: 'reports.edit', description: 'Editar reportes', module: 'reports', action: 'edit' },
      { id: 9, name: 'reports.delete', description: 'Eliminar reportes', module: 'reports', action: 'delete' },
      { id: 10, name: 'reports.admin', description: 'Administrar módulo de reportes', module: 'reports', action: 'admin' },
      
      // Sales module permissions
      { id: 11, name: 'sales.view', description: 'Ver ventas', module: 'sales', action: 'view' },
      { id: 12, name: 'sales.create', description: 'Crear ventas', module: 'sales', action: 'create' },
      { id: 13, name: 'sales.edit', description: 'Editar ventas', module: 'sales', action: 'edit' },
      { id: 14, name: 'sales.delete', description: 'Eliminar ventas', module: 'sales', action: 'delete' },
      { id: 15, name: 'sales.manage', description: 'Gestionar ventas', module: 'sales', action: 'manage' },
      
      // Collections module permissions
      { id: 16, name: 'collections.view', description: 'Ver cobranzas', module: 'collections', action: 'view' },
      { id: 17, name: 'collections.manage', description: 'Gestionar cobranzas', module: 'collections', action: 'manage' },
      { id: 18, name: 'collections.edit_schedule', description: 'Editar cronogramas', module: 'collections', action: 'edit_schedule' },
      
      // HR module permissions
      { id: 19, name: 'hr.view', description: 'Ver recursos humanos', module: 'hr', action: 'view' },
      { id: 20, name: 'hr.manage_employees', description: 'Gestionar empleados', module: 'hr', action: 'manage_employees' },
      
      // Finance module permissions
      { id: 21, name: 'finance.view', description: 'Ver finanzas', module: 'finance', action: 'view' },
      { id: 22, name: 'finance.manage', description: 'Gestionar finanzas', module: 'finance', action: 'manage' },
      
      // Admin permissions
      { id: 23, name: 'admin.users', description: 'Administrar usuarios', module: 'admin', action: 'users' },
      { id: 24, name: 'admin.settings', description: 'Configurar sistema', module: 'admin', action: 'settings' },
      { id: 25, name: 'admin.permissions', description: 'Gestionar permisos', module: 'admin', action: 'permissions' },
      { id: 26, name: 'admin.all', description: 'Acceso total de administrador', module: 'admin', action: 'all' }
    ];
  }
}