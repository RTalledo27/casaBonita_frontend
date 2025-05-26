import { Route } from "@angular/router";
import { RolesComponent } from "../roles.component";


export const roleRoutes: Route[] = [
  {
    path: 'roles',
    component: RolesComponent,
    data: { permission: 'security.roles.view' },

    children: [
      {
        path: 'create',
        component: RolesComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.store' },
      },
      {
        path: ':id/edit',
        component: RolesComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.update' },
      },
    ],
  },
  {
    path: 'roles/:id',
    component: RolesComponent,
    data: { permission: 'security.roles.view' },
    children: [
      {
        path: ':id/edit',
        component: RolesComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.update' },
      },
    ],
  },
];