import { Routes } from '@angular/router';
import { CollectionsSimplifiedDashboardComponent } from './components/dashboard/collections-simplified-dashboard.component';
import { ScheduleGeneratorComponent } from './components/generator/schedule-generator.component';
import { InstallmentManagementComponent } from './components/installments/installment-management.component';
import { CollectionsReportsComponent } from './components/reports/collections-reports.component';

export const COLLECTIONS_SIMPLIFIED_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: CollectionsSimplifiedDashboardComponent,
    data: {
      title: 'Dashboard de Cronogramas',
      breadcrumb: 'Dashboard',
      permissions: ['collections.dashboard.view']
    }
  },
  {
    path: 'generator',
    component: ScheduleGeneratorComponent,
    data: {
      title: 'Generador de Cronogramas',
      breadcrumb: 'Generador',
      permissions: ['collections.schedules.create']
    }
  },
  {
    path: 'schedules',
    component: InstallmentManagementComponent,
    data: {
      title: 'Gestión de Cuotas',
      breadcrumb: 'Cuotas',
      permissions: ['collections.schedules.view']
    }
  },
  {
    path: 'installments',
    component: InstallmentManagementComponent,
    data: {
      title: 'Gestión de Cuotas',
      breadcrumb: 'Cuotas',
      permissions: ['collections.schedules.view']
    }
  },
  {
    path: 'reports',
    component: CollectionsReportsComponent,
    data: {
      title: 'Reportes de Cronogramas',
      breadcrumb: 'Reportes',
      permissions: ['collections.reports.view']
    }
  },
  {
    path: 'schedules/:id',
    component: InstallmentManagementComponent,
    data: {
      title: 'Detalle de Cronograma',
      breadcrumb: 'Detalle',
      permissions: ['collections.schedules.view']
    }
  }
];

// Export individual routes for external use
export const collectionsSimplifiedRoutes = {
  dashboard: '/collections-simplified/dashboard',
  generator: '/collections-simplified/generator',
  schedules: '/collections-simplified/schedules',
  installments: '/collections-simplified/installments',
  reports: '/collections-simplified/reports'
};