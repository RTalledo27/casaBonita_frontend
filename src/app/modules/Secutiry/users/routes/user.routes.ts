import { Route } from "@angular/router";
import { UsersComponent } from "../users.component";
import { UserFormComponent } from "../components/user-form/user-form.component";
import { UserDetailComponent } from "../components/user-detail/user-detail.component";
import { permissionGuard } from "../guards/permission.guard";

export const userRoutes: Route[] = [
    {
        path: 'users',
        component: UsersComponent,
        //canActivate: [permissionGuard],
        data: { permission: 'security.users.index' }
      },
      {
        path: 'users/create',
        component: UserFormComponent,
        //canActivate: [permissionGuard],
        data: { permission: 'security.users.store' }
      },
      {
        path: 'users/:id/edit',
        component: UserFormComponent,
        //canActivate: [permissionGuard],
        data: { permission: 'security.users.update' }
      },
      {
        path: 'users/:id',
        component: UserDetailComponent,
        //canActivate: [permissionGuard],
        data: { permission: 'security.users.destroy' }
      } ];