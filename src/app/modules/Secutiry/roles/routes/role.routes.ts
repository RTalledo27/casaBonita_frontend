import { Route } from "@angular/router";
import { RolesComponent } from "../roles.component";
import { RoleFormComponent } from "../role-form/role-form.component";
import { RoleDetailsComponent } from "../role-details/role-details.component";


export const roleRoutes: Route[] = [
  {
    path: 'roles',
    component: RolesComponent,
    data: { permission: 'security.roles.view' },

    children: [
      {
        path: 'create',
        component: RoleFormComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.store' },
      },
      {
        path: ':id/edit',
        component: RoleFormComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.update' },
      },
    ],
  },
  {
    path: 'roles/:id',
    component: RoleDetailsComponent,
    data: { permission: 'security.roles.view' },
    children: [
      {
        path: ':id/edit',
        component: RoleFormComponent,
        outlet: 'modal',
        data: { permission: 'security.roles.update' },
      },
    ],
  },
];