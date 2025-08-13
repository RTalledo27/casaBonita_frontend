import { Routes } from '@angular/router';
import { PaymentVerificationManagerComponent } from '../components/payment-verification-manager/payment-verification-manager.component';
import { VerificationDashboardComponent } from '../components/verification-dashboard/verification-dashboard.component';
import { HrIntegrationDashboardComponent } from '../components/hr-integration-dashboard/hr-integration-dashboard.component';
import { CollectionsDashboardComponent } from '../components/dashboard/collections-dashboard.component';
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
    component: CollectionsDashboardComponent,
    data: {
      title: 'Dashboard de Cobranzas',
      breadcrumb: 'Dashboard',
      permission: 'collections.access'
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
      permission: 'collections.access'
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