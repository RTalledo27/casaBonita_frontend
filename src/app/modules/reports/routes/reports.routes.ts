import { Routes } from '@angular/router';
import { ReportsGuard, ReportsExportGuard, ReportsAdminGuard } from '../guards/reports.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: { permission: 'reports.access' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../components/dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
    title: 'Dashboard de Reportes',
    canActivate: [ReportsGuard],
    data: { 
      reportType: 'dashboard',
      permission: 'reports.view_dashboard'
    }
  },
  {
    path: 'sales',
    loadComponent: () => import('../components/sales/sales-reports.component').then(m => m.SalesReportsComponent),
    title: 'Reportes de Ventas',
    canActivate: [ReportsGuard],
    data: { 
      reportType: 'sales',
      permission: 'reports.view_sales'
    }
  },
  {
    path: 'payment-schedule',
    loadComponent: () => import('../components/payments/payment-schedule.component').then(m => m.PaymentScheduleComponent),
    title: 'Cronograma de Pagos',
    canActivate: [ReportsGuard],
    data: { 
      reportType: 'payment-schedule',
      permission: 'reports.view_payments'
    }
  },
  {
    path: 'projected',
    loadComponent: () => import('../components/projected/projected-reports.component').then(m => m.ProjectedReportsComponent),
    title: 'Reportes Proyectados',
    canActivate: [ReportsGuard],
    data: { 
      reportType: 'projected',
      permission: 'reports.view_projections'
    }
  },
  {
    path: 'export-manager',
    loadComponent: () => import('../components/export-manager/export-manager.component').then(m => m.ExportManagerComponent),
    title: 'Gestor de Exportaciones',
    canActivate: [ReportsExportGuard],
    data: { 
      reportType: 'export',
      permission: 'reports.export'
    }
  }
];