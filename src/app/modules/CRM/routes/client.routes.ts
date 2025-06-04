import { Route } from "@angular/router";
import { ClientsComponent } from "../clients/clients.component";
import { UserFormComponent } from "../../Secutiry/users/components/user-form/user-form.component";
import { ClientFormComponent } from "../clients/components/client-form/client-form.component";
import { ClientDetailComponent } from "../clients/components/client-detail/client-detail.component";

export const clientRoutes: Route[] = [
  {
    path: 'clients',
    component: ClientsComponent,
    data: { permission: 'crm.clients.view' },
    children: [
      {
        path: 'create',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.store' },
      },
      {
        path: ':id/edit',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.update' },
      },
    ],
  },
  {
    path: 'clients/:id',
    component: ClientDetailComponent,
    data: { permission: 'crm.clients.view' },
    children: [
      {
        path: ':id/edit',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.update' },
      },
    ],
  },
];