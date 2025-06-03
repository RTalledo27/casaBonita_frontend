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
            children: [...clientRoutes],
            canActivateChild: [permissionGuard],
          },
          {
            path: 'unauthorized',
            loadComponent: () =>
              import(
                './core/components/unauthorized/unauthorized/unauthorized.component'
              ).then((m) => m.UnauthorizedComponent),
          },

          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: '**', redirectTo: 'dashboard' },
        ],
      },
    ],
  },
];
  