import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
export const routes: Routes = [
    {
      path: '',
      loadComponent: () => import('./app.component').then(m => m.AppComponent),
      children: [
        {
          path: '',
          loadComponent: () => import('./core/layouts/layout/layout.component').then(m => m.LayoutComponent),
          children: [
            {
              path: 'dashboard',
              loadComponent: () => import('./modules/dashboard/pages/dashboard.component').then(m => m.DashboardComponent),
              },
             // {
                
             // },
              {
                'path': 'security',
                  children: [
                      {
                        'path': 'users',
                        loadComponent: () => import('./modules/Secutiry/users/users.component').then(m => m.UsersComponent),
                    }
                  ]
            },
              
            {
              path: '**',
              redirectTo: 'dashboard'
            }
          ]
        }
      ]
    }
  ];
  