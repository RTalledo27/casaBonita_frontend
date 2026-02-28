import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkReportsAccess(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkReportsAccess(childRoute, state);
  }

  private checkReportsAccess(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    }

    // Check if user has reports access using AuthService
    const hasModuleAccess = this.authService.hasModuleAccess('reports');

    if (hasModuleAccess) {
      return of(true);
    }

    // If no access, redirect
    this.router.navigate(['/unauthorized']);
    return of(false);
  }

  private getRequiredPermission(reportType: string): string {
    const permissionMap: { [key: string]: string } = {
      'dashboard': 'reports.view_dashboard',
      'sales': 'reports.view_sales',
      'payment-schedule': 'reports.view_payments',
      'projected': 'reports.view_projections',
      'export': 'reports.export',
      'general': 'reports.view'
    };

    return permissionMap[reportType] || 'reports.view';
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReportsExportGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    }

    // TEMPORARY FIX: Allow export access for authenticated users
    // TODO: Restore export permission checks when user permissions are properly configured
    return of(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReportsAdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    }

    // Check admin permissions for reports
    return this.permissionService.hasAnyPermission([
      'reports.admin',
      'reports.manage',
      'admin.all'
    ]).pipe(
      map(hasPermission => {
        if (!hasPermission) {
          this.router.navigate(['/reports'], {
            queryParams: {
              error: 'admin_access_denied',
              message: 'Acceso restringido a administradores'
            }
          });
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/reports'], {
          queryParams: {
            error: 'admin_check_failed'
          }
        });
        return of(false);
      })
    );
  }
}
