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
    }
  }

  // Login method
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Logout method
  logout(): void {
    // Llamar al backend para registrar el logout
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
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
    }).pipe(
      tap((response: any) => {
        if (response?.token && response?.user) {
          this.setSession({
            token: response.token,
            user: response.user,
            expiresIn: response.expiresIn
          });
        }
      })
    );
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
      return false;
    }
    
    // Check if user has admin role or specific module permissions
    if (user.role === 'admin' || user.role === 'Administrador') {
      return true;
    }
    
    // Check for specific module access permission
    const moduleAccessPermission = `${module.toLowerCase()}.access`;
    if (user.permissions.includes(moduleAccessPermission)) {
      return true;
    }
    
    // Check for module-specific permissions
    const modulePermissions = user.permissions.filter(p => p.startsWith(module.toLowerCase()));
    const hasModulePermissions = modulePermissions.length > 0;
    return hasModulePermissions;
  }
  
  // Refresh user data from server
  refreshUserData(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => {
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
          last_login_at: response.user.last_login_at
        };

        // IMPORTANTE: Actualizar localStorage PRIMERO, ANTES de emitir
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Legacy method for compatibility
  async refreshUser(): Promise<void> {
    try {
      await this.refreshUserData().toPromise();
    } catch (error) {
    }
  }

  // Private methods
  private setSession(authResult: LoginResponse): void {
    // Si no se proporciona expiresIn, usar un valor por defecto de 24 horas (86400 segundos)
    const expiresInSeconds = authResult.expiresIn || 86400;
    const expiresAt = new Date().getTime() + (expiresInSeconds * 1000);
        
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    localStorage.setItem('tokenExpiry', expiresAt.toString());
    
    this.tokenSubject.next(authResult.token);
    this.currentUserSubject.next(authResult.user);
    
    // Inicializar tracking de sesión
    this.initializeSessionTracking();
  }

}
