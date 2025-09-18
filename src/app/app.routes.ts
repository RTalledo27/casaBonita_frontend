import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { userRoutes } from './modules/Secutiry/users/routes/user.routes';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './modules/Secutiry/users/guards/permission.guard';
import { roleRoutes } from './modules/Secutiry/roles/routes/role.routes';
import { permissionRoutes } from './modules/Secutiry/permissions/routes/permission.routes';
import {clientRoutes} from './modules/CRM/routes/client.routes'
export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./modules/Secutiry/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./modules/Secutiry/auth/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./app.component').then((m) => m.AppComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./core/layouts/layout/layout.component').then(
            (m) => m.LayoutComponent
          ),
        canActivateChild: [authGuard], // protege sólo aquí
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./modules/dashboard/pages/dashboard.component').then(
                (m) => m.DashboardComponent
              ),
          },
          {
            path: 'security',
            children: [...userRoutes, ...roleRoutes, ...permissionRoutes],
            canActivateChild: [permissionGuard], // opcional, si quieres aplicarlo en bloque
          },
          {
            path: 'crm',
            loadChildren: () =>
              import('./modules/CRM/routes/crm.routes').then(
                (m) => m.CRM_ROUTES
              ),
            canActivateChild: [permissionGuard],
          },
          {
            path: 'inventory',
            loadChildren: () =>
              import('./modules/inventory/routes/inventory.routes').then(
                (m) => m.INVENTORY_ROUTES
              ),
            canActivateChild: [permissionGuard],
          },
          {
            path: 'hr',
            loadChildren: () =>
              import('./modules/humanResources/routes/hr.routes').then(
                (m) => m.HR_ROUTES
              )
          },
          {
            path: 'collections',
            loadChildren: () =>
              import('./modules/collections/routes/collections.routes').then(
                (m) => m.collectionsRoutes
              ),
            //canActivateChild: [permissionGuard],
          },
          {
            path: 'collections-simplified',
            loadChildren: () =>
              import('./modules/collections/collections-simplified.routes').then(
                (m) => m.COLLECTIONS_SIMPLIFIED_ROUTES
              ),
            canActivateChild: [permissionGuard],
          },
          {
            path: 'sales',
            loadChildren: () =>
              import('./modules/sales/routes/sales.routes').then(
                (m) => m.SALES_ROUTES
              ),
            canActivateChild: [permissionGuard],
          },
          {
            path: 'service-desk',
            loadChildren: () =>
              import('./modules/serviceDesk/routes/service-desk.routes').then(
                (m) => m.serviceDeskRoutes
              ),
            canActivateChild: [permissionGuard],
          },
          {
            path: 'unauthorized',
            loadComponent: () =>
              import(
                './core/components/unauthorized/unauthorized/unauthorized.component'
              ).then((m) => m.UnauthorizedComponent),
          },
          {
            path: 'theme-test',
            loadComponent: () =>
              import('./shared/components/theme-test/theme-test.component').then(
                (m) => m.ThemeTestComponent
              ),
          },
          {
            path: 'debug-permissions',
            loadComponent: () =>
              import('./debug/user-permissions.component').then(
                (m) => m.UserPermissionsComponent
              ),
          },
          {
            path: 'debug-perms-temp',
            loadComponent: () =>
              import('./debug-permissions.component').then(
                (m) => m.DebugPermissionsComponent
              ),
          },

          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: '**', redirectTo: 'dashboard' },
        ],
      },
    ],
  },
];
  