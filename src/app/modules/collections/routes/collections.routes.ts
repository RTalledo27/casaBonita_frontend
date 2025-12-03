import { Routes } from '@angular/router';
import { PaymentVerificationManagerComponent } from '../components/payment-verification-manager/payment-verification-manager.component';
import { VerificationDashboardComponent } from '../components/verification-dashboard/verification-dashboard.component';
import { HrIntegrationDashboardComponent } from '../components/hr-integration-dashboard/hr-integration-dashboard.component';
import { CollectionsDashboardComponent } from '../components/dashboard/collections-dashboard.component';
import { CollectionsSimplifiedDashboardComponent } from '../components/dashboard/collections-simplified-dashboard.component';
import { ScheduleGeneratorComponent } from '../components/generator/schedule-generator.component';
import { CollectionsReportsComponent } from '../components/reports/collections-reports.component';
import { AccountsReceivableListComponent } from '../components/accounts-receivable/accounts-receivable-list.component';
import { AgingReportsComponent } from '../components/aging-reports/aging-reports.component';
import { OverdueAlertsComponent } from '../components/alerts/overdue-alerts.component';
import { CollectorManagementComponent } from '../components/collectors/collector-management.component';

export const collectionsRoutes: Routes = [
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
      permission: 'collections.dashboard.view'
    }
  },
  {
    path: 'generator',
    component: ScheduleGeneratorComponent,
    data: {
      title: 'Generador de Cronogramas',
      breadcrumb: 'Generador',
      permission: 'collections.schedules.create'
    }
  },
  {
    path: 'installments',
    loadComponent: () => 
      import('../components/installments/installment-management.component').then(
        (m) => m.InstallmentManagementComponent
      ),
    data: {
      title: 'Gestión de Cuotas',
      breadcrumb: 'Cuotas',
      permission: 'collections.schedules.view'
    }
  },
  {
    path: 'reports',
    component: CollectionsReportsComponent,
    data: {
      title: 'Reportes de Cronogramas',
      breadcrumb: 'Reportes',
      permission: 'collections.reports.view'
    }
  },
  {
    path: 'schedules',
    loadComponent: () => 
      import('../components/installments/installment-management.component').then(
        (m) => m.InstallmentManagementComponent
      ),
    data: {
      title: 'Gestión de Cuotas',
      breadcrumb: 'Cuotas',
      permission: 'collections.schedules.view'
    }
  },
  {
    path: 'schedules/:id',
    loadComponent: () => 
      import('../components/installments/installment-management.component').then(
        (m) => m.InstallmentManagementComponent
      ),
    data: {
      title: 'Detalle de Cronograma',
      breadcrumb: 'Detalle',
      permission: 'collections.schedules.view'
    }
  },
  {
    path: 'collections-dashboard',
    component: CollectionsDashboardComponent,
    data: {
      title: 'Dashboard de Cobranzas Completo',
      breadcrumb: 'Dashboard Completo',
      permission: 'collections.dashboard.view'
    }
  },
  {
    path: 'accounts-receivable',
    component: AccountsReceivableListComponent,
    data: {
      title: 'Cuentas por Cobrar',
      breadcrumb: 'Cuentas por Cobrar',
      permission: 'collections.accounts-receivable.view'
    }
  },
  {
    path: 'aging-reports',
    component: AgingReportsComponent,
    data: {
      title: 'Reportes de Antigüedad',
      breadcrumb: 'Reportes de Antigüedad',
      permission: 'collections.reports.view'
    }
  },
  {
    path: 'client-followups',
    loadComponent: () => import('../components/followups/client-followups.component').then(m => m.ClientFollowupsComponent),
    data: {
      title: 'Gestión Telefónica y Domiciliaria',
      breadcrumb: 'Gestión de Cobranzas',
      permission: 'collections.followups.view'
    }
  },
  {
    path: 'alerts',
    component: OverdueAlertsComponent,
    data: {
      title: 'Alertas de Vencimiento',
      breadcrumb: 'Alertas',
      permission: 'collections.alerts.view'
    }
  },
  {
    path: 'collectors',
    component: CollectorManagementComponent,
    data: {
      title: 'Gestión de Cobradores',
      breadcrumb: 'Cobradores',
      permission: 'collections.collectors.view'
    }
  },
  {
    path: 'verification-dashboard',
    component: VerificationDashboardComponent,
    data: {
      title: 'Dashboard de Verificaciones',
      permission: 'collections.customer-payments.view'
    }
  },
  {
    path: 'payment-verification',
    component: PaymentVerificationManagerComponent,
    data: {
      title: 'Gestión de Verificaciones de Pagos',
      breadcrumb: 'Verificaciones de Pagos',
      permission: 'collections.customer-payments.view'
    }
  },
  {
    path: 'hr-integration',
    component: HrIntegrationDashboardComponent,
    data: {
      title: 'Integración HR - Collections',
      breadcrumb: 'Integración HR',
      permission: 'collections.hr-integration.view'
    }
  },
  {
    path: 'payment-management',
    loadComponent: () => import('../components/payment-management/payment-management.component').then(m => m.PaymentManagementComponent),
    data: {
      title: 'Gestión de Pagos',
      breadcrumb: 'Gestión de Pagos',
      permission: 'collections.customer-payments.view'
    }
  }
];
