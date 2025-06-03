import { Route } from "@angular/router";
import { ClientsComponent } from "../clients/clients.component";
import { UserFormComponent } from "../../Secutiry/users/components/user-form/user-form.component";
import { ClientFormComponent } from "../clients/client-form/client-form.component";

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
    ],
  },
];