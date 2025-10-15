import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_ROUTES } from '../constants/api.routes';
import { User } from '../../modules/Secutiry/users/models/user';
import { Permission, Role, User as UserType } from '../../../types/permissions';

export interface UserResource {
  id: number;
  name: string;
  email: string;
  permissions: string[];
  roles?: string[];
  must_change_password?: boolean;
  //POR EL MOMENTO ESOS DATOS
}

export interface LoginResponse {
  token: string;
  user: UserResource;
  must_change_password?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  userSubject = new BehaviorSubject<UserResource | null>(null);
  user$ = this.userSubject.asObservable();
  private mustChangePasswordSubject = new BehaviorSubject<boolean>(false);
  mustChangePassword$ = this.mustChangePasswordSubject.asObservable();

  // Signals para manejo reactivo de permisos
  private userSignal = signal<UserResource | null>(null);
  private permissionsSignal = signal<string[]>([]);
  private rolesSignal = signal<string[]>([]);

  // Computed signals para acceso reactivo
  user = this.userSignal.asReadonly();
  permissions = this.permissionsSignal.asReadonly();
  roles = this.rolesSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());
  isAdmin = computed(() => this.rolesSignal().includes('admin'));

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('user');
    const mustChangePassword = localStorage.getItem('must_change_password');
    if (stored) {
      const user = JSON.parse(stored);
      this.userSubject.next(user);
      this.mustChangePasswordSubject.next(mustChangePassword === 'true');
      
      // Actualizar signals
      this.userSignal.set(user);
      this.permissionsSignal.set(user.permissions || []);
      this.rolesSignal.set(user.roles || []);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(API_ROUTES.AUTH.LOGIN, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('must_change_password', String(!!res.must_change_password));
          this.userSubject.next(res.user);
          this.mustChangePasswordSubject.next(!!res.must_change_password);
          
          // Actualizar signals
          this.userSignal.set(res.user);
          this.permissionsSignal.set(res.user.permissions || []);
          this.rolesSignal.set(res.user.roles || []);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('must_change_password');
    this.userSubject.next(null);
    this.mustChangePasswordSubject.next(false);
    
    // Limpiar signals
    this.userSignal.set(null);
    this.permissionsSignal.set([]);
    this.rolesSignal.set([]);
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.userSubject.value;
  }

  hasPermission(perm: string): boolean {
    const user = this.userSubject.value;
    return !!user && Array.isArray(user.permissions) && user.permissions.includes(perm);
  }

  hasRole(role: string): boolean {
    const user = this.userSubject.value;
    return !!user && Array.isArray(user.roles) && user.roles.includes(role);
  }

  /**
   * Refrescar los datos del usuario autenticado
   */
  refreshUser(): Observable<any> {
    return this.http.get(API_ROUTES.AUTH.ME).pipe(
      tap((response: any) => {
        if (response.user) {
          // Actualizar el usuario con los nuevos permisos
          const updatedUser = {
            ...response.user,
            permissions: response.permissions || [],
            roles: response.roles || []
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.userSubject.next(updatedUser);
          
          // Actualizar signals
          this.userSignal.set(updatedUser);
          this.permissionsSignal.set(updatedUser.permissions || []);
          this.rolesSignal.set(updatedUser.roles || []);
        }
      })
    );
  }

  isAdminMethod(): boolean {
    return this.hasRole('admin');
  }

  get mustChangePassword(): boolean {
    return this.mustChangePasswordSubject.value;
  }

  changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Observable<any> {
    return this.http.post(API_ROUTES.AUTH.CHANGE_PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation
    }).pipe(
      tap(() => {
        // Después de cambiar la contraseña exitosamente, actualizar el estado
        localStorage.setItem('must_change_password', 'false');
        this.mustChangePasswordSubject.next(false);
      })
    );
  }

  // Métodos adicionales para manejo de permisos con signals
  hasPermissionSignal = computed(() => {
    return (permission: string): boolean => {
      return this.permissionsSignal().includes(permission);
    };
  });

  hasRoleSignal = computed(() => {
    return (role: string): boolean => {
      return this.rolesSignal().includes(role);
    };
  });

  hasAnyPermission = computed(() => {
    return (permissions: string[]): boolean => {
      const userPermissions = this.permissionsSignal();
      return permissions.some(permission => userPermissions.includes(permission));
    };
  });

  hasAllPermissions = computed(() => {
    return (permissions: string[]): boolean => {
      const userPermissions = this.permissionsSignal();
      return permissions.every(permission => userPermissions.includes(permission));
    };
  });

  hasAnyRole = computed(() => {
    return (roles: string[]): boolean => {
      const userRoles = this.rolesSignal();
      return roles.some(role => userRoles.includes(role));
    };
  });

  // Método para verificar permisos de módulo
  hasModuleAccess = computed(() => {
    return (module: string): boolean => {
      const userPermissions = this.permissionsSignal();
      return userPermissions.some(permission => permission.startsWith(`${module}.`));
    };
  });
}