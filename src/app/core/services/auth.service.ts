import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
  department?: string;
  position?: string;
  must_change_password?: boolean;
  password_changed_at?: string;
  last_login_at?: string;
  employee_id?: number;
  employee_type?: string;
}

export interface UserResource {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
  department?: string;
  position?: string;
  must_change_password?: boolean;
  password_changed_at?: string;
  last_login_at?: string;
  employee_id?: number;
  employee_type?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.URL_BACKEND}/v1/security`;
  private baseApiUrl = environment.URL_BACKEND; // Para rutas públicas sin /v1/security
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public user$ = this.currentUserSubject.asObservable();
  public userSubject = this.currentUserSubject;

  constructor(
    private http: HttpClient,
    private router: Router,
    private injector: Injector
  ) {
    // Initialize from localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const expiry = localStorage.getItem('tokenExpiry');
    
    // Check if token is valid and not expired
    if (token && user && expiry) {
      const now = new Date().getTime();
      const expiryTime = parseInt(expiry, 10);
      
      if (now < expiryTime) {
        this.tokenSubject.next(token);
        this.currentUserSubject.next(JSON.parse(user));
        // Inicializar tracking si hay sesión válida (lazy load para evitar circular dependency)
        setTimeout(() => this.initializeSessionTracking(), 0);
      } else {
        // Token expired, clear localStorage
        this.clearSession();
      }
    }
  }

  /**
   * Inicializar tracking de sesión (lazy loading para evitar dependencia circular)
   */
  private initializeSessionTracking(): void {
    try {
      import('./user-session.service').then(module => {
        const sessionService = this.injector.get(module.UserSessionService);
        sessionService.initialize();
      });
    } catch (error) {
      console.error('Error al inicializar tracking:', error);
    }
  }

  /**
   * Limpiar tracking de sesión
   */
  private cleanupSessionTracking(): void {
    try {
      import('./user-session.service').then(module => {
        const sessionService = this.injector.get(module.UserSessionService);
        sessionService.cleanup();
      });
    } catch (error) {
      console.error('Error al limpiar tracking:', error);
    }
  }

  // Login method
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        console.log('Login successful:', response);
        this.setSession(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // Re-throw the error instead of using mock token
        throw error;
        
        // COMMENTED OUT: Mock login fallback
        // const mockResponse: LoginResponse = {
        //   token: 'mock-jwt-token-' + Date.now(),
        //   user: this.getMockUser(),
        //   expiresIn: 3600
        // };
        // this.setSession(mockResponse);
        // return of(mockResponse);
      })
    );
  }

  // Logout method
  logout(): void {
    // Llamar al backend para registrar el logout
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        console.log('Logout registrado en el servidor');
      },
      error: (error) => {
        console.error('Error al registrar logout:', error);
      },
      complete: () => {
        // Limpiar sesión local independientemente del resultado
        this.clearSession();
        this.router.navigate(['/auth/login']);
      }
    });
  }

    // Clear session helper method
  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    
    // Limpiar tracking de sesión
    this.cleanupSessionTracking();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    const now = new Date().getTime();
    const expiryTime = parseInt(expiry, 10);
    
    if (now > expiryTime) {
      this.logout();
      return false;
    }
    
    return true;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get token property (for compatibility)
  get token(): string | null {
    return this.getToken();
  }

  // Check if user is logged in
  get isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // Check if user must change password
  get mustChangePassword(): boolean {
    const user = this.getCurrentUser();
    return user ? (user as any).must_change_password === true : false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Refresh token
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(() => {
        this.logout();
        return of();
      })
    );
  }

  // Update user profile
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword
    });
  }

  // Forgot password (ruta pública, sin /v1/security)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/forgot-password`, { email });
  }

  // Reset password (ruta pública, sin /v1/security)
  resetPassword(token: string, email: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/reset-password`, {
      token,
      email,
      password,
      password_confirmation
    });
  }

  // Verify reset token (ruta pública, sin /v1/security)
  verifyResetToken(token: string, email: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/verify-reset-token`, {
      token,
      email
    });
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true; // If no permissions specified, return true
    }
    const user = this.getCurrentUser();
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  // Check if user has module access
  hasModuleAccess(module?: string): boolean {
    if (!module) return true; // If no module specified, return true
    const user = this.getCurrentUser();
    if (!user) {
      console.log('🔍 DEBUG - hasModuleAccess: No user found');
      return false;
    }
    
    // Debug: Log user permissions
    console.log('🔍 DEBUG - hasModuleAccess:', {
      module,
      userRole: user.role,
      userPermissions: user.permissions,
      modulePermissions: user.permissions.filter(p => p.startsWith(module.toLowerCase())),
      hasReportsAccess: user.permissions.includes('reports.access'),
      hasReportsView: user.permissions.includes('reports.view'),
      allReportsPermissions: user.permissions.filter(p => p.includes('reports'))
    });
    
    // Check if user has admin role or specific module permissions
    if (user.role === 'admin' || user.role === 'Administrador') {
      console.log('🔍 DEBUG - User has admin role, allowing access');
      return true;
    }
    
    // Check for specific module access permission
    const moduleAccessPermission = `${module.toLowerCase()}.access`;
    if (user.permissions.includes(moduleAccessPermission)) {
      console.log('🔍 DEBUG - User has module access permission:', moduleAccessPermission);
      return true;
    }
    
    // Check for module-specific permissions
    const modulePermissions = user.permissions.filter(p => p.startsWith(module.toLowerCase()));
    const hasModulePermissions = modulePermissions.length > 0;
    
    console.log('🔍 DEBUG - Module permissions check result:', {
      hasModulePermissions,
      modulePermissions
    });
    
    return hasModulePermissions;
  }
  
  // Refresh user data from server
  refreshUserData(): Observable<User> {
    console.log('🔄 AuthService: Fetching fresh user data from /me endpoint...');
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => {
        console.log('📦 AuthService: Raw response from /me:', response);
        
        const user: User = {
          id: response.user.user_id || response.user.id,
          name: response.user.full_name || response.user.name || response.user.username,
          email: response.user.email,
          role: response.user.roles[0]?.name || response.roles?.[0] || 'user',
          permissions: response.permissions || [],
          avatar: response.user.avatar || response.user.photo_profile,
          department: response.user.department,
          position: response.user.position,
          must_change_password: response.user.must_change_password,
          password_changed_at: response.user.password_changed_at,
          last_login_at: response.user.last_login_at,
          employee_id: response.user.employee_id,
          employee_type: response.user.employee_type
        };

        console.log('✅ AuthService: Mapped user object:', {
          id: user.id,
          name: user.name,
          role: user.role,
          permissionCount: user.permissions.length,
          permissions: user.permissions.slice(0, 10) // Solo primeros 10 para no saturar console
        });

        // IMPORTANTE: Actualizar localStorage PRIMERO, ANTES de emitir
        localStorage.setItem('user', JSON.stringify(user));
        console.log('� AuthService: User saved to localStorage');
        
        // NO emitir a currentUserSubject - dejamos que SidebarService maneje la actualización
        // Al no emitir, evitamos efectos secundarios no deseados
        console.log('⏭️ AuthService: Skipping currentUserSubject emission for manual refresh');
        
        return user;
      }),
      catchError(error => {
        console.error('❌ AuthService: Error refreshing user data:', error);
        throw error;
      })
    );
  }

  // Legacy method for compatibility
  async refreshUser(): Promise<void> {
    try {
      await this.refreshUserData().toPromise();
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  // Private methods
  private setSession(authResult: LoginResponse): void {
    // Si no se proporciona expiresIn, usar un valor por defecto de 24 horas (86400 segundos)
    const expiresInSeconds = authResult.expiresIn || 86400;
    const expiresAt = new Date().getTime() + (expiresInSeconds * 1000);
    
    console.log('Setting session with expiry:', {
      expiresIn: authResult.expiresIn,
      expiresInSeconds,
      expiresAt,
      expiresAtDate: new Date(expiresAt)
    });
    
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    localStorage.setItem('tokenExpiry', expiresAt.toString());
    
    this.tokenSubject.next(authResult.token);
    this.currentUserSubject.next(authResult.user);
    
    // Inicializar tracking de sesión
    this.initializeSessionTracking();
  }

  private getMockUser(): User {
    return {
      id: 1,
      name: 'Administrador Casa Bonita',
      email: 'admin@casabonita.com',
      role: 'admin',
      department: 'Administración',
      position: 'Administrador General',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=3B82F6&color=fff',
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
        'reports.admin',
        
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
        'admin.permissions',
        'admin.all'
      ]
    };
  }
}