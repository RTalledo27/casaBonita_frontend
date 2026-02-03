import { Route } from "@angular/router";
import { ServiceDeskTicketsComponent } from "../service-desk-tickets/service-desk-tickets.component";
import { DashboardServiceDeskComponent } from "../dashboard-service-desk/dashboard-service-desk.component";
import { ServiceDeskDetailComponent } from "../service-desk-detail/service-desk-detail.component";
import { ServiceDeskReportsComponent } from "../service-desk-reports/service-desk-reports.component";
import { ServiceDeskSettingsComponent } from "../service-desk-settings/service-desk-settings.component";
import { ServiceDeskCategoriesComponent } from "../service-desk-categories/service-desk-categories.component";

export const serviceDeskRoutes: Route[] = [
  {
    path: 'dashboard',
    component: DashboardServiceDeskComponent,
    data: { permission: 'service-desk.tickets.view' },
  },
  {
    path: 'tickets',
    component: ServiceDeskTicketsComponent,
    data: { permission: 'service-desk.tickets.view' },
    children: [
      {
        path: 'create',
        component: ServiceDeskTicketsComponent,
        outlet: 'modal',
        data: { permission: 'service-desk.tickets.store' },
      },
      {
        path: ':id/edit',
        component: ServiceDeskTicketsComponent,
        outlet: 'modal',
        data: { permission: 'service-desk.tickets.update' },
      },
    ],
  },
  {
    path: 'tickets/:id',
    component: ServiceDeskDetailComponent,
    data: { permission: 'service-desk.tickets.view' },
    children: [
      {
        path: 'edit',
        component: ServiceDeskDetailComponent,
        outlet: 'modal',
        data: { permission: 'service-desk.tickets.update' },
      },
    ],
  },
  {
    path: 'reports',
    component: ServiceDeskReportsComponent,
    data: { permission: 'service-desk.tickets.view' },
  },
  {
    path: 'categories',
    component: ServiceDeskCategoriesComponent,
    data: { permission: 'service-desk.access' },
  },
  {
    path: 'settings',
    component: ServiceDeskSettingsComponent,
    data: { permission: 'service-desk.access' },
  },
];
