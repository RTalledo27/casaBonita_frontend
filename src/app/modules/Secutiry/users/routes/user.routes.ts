import { Route } from "@angular/router";
import { UsersComponent } from "../users.component";
import { UserFormComponent } from "../components/user-form/user-form.component";
import { UserDetailComponent } from "../components/user-detail/user-detail.component";
// import { UserImportComponent } from "../components/user-import/user-import.component";
import { permissionGuard } from "../guards/permission.guard";
import { Permission } from '../models/permission';

export const userRoutes: Route[] = [
  {
    path: 'users',
    component: UsersComponent,
    //canActivate: [permissionGuard],
    data: { permission: 'security.users.index' },
    children: [
      {
        path: 'create',
        component: UserFormComponent,
        outlet: 'modal',
        data: { permission: 'security.users.store' },
      },
      {
        path: ':id/edit',
        component: UserFormComponent,
        outlet: 'modal',
        data: { permission: 'security.users.update' },
      },
      // {
      //   path: 'import',
      //   component: UserImportComponent,
      //   outlet: 'modal',
      //   data: { permission: 'security.users.store' },
      // },
    ],
  },
  {
    path: 'users/:id',
    component: UserDetailComponent,
    //canActivate: [permissionGuard],
    // data: { permission: 'security.users.destroy' }
    data: { permission: 'security.users.index' },
    children: [
      {
        path: ':id/edit',
        component: UserFormComponent,
        outlet: 'modal',
        data: { permission: 'security.users.update' },
      },
    ],
  },
];