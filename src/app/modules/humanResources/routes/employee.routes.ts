import { Routes } from "@angular/router";
import { authGuard } from "../../../core/guards/auth.guard";
import { AdvisorDashboardComponent } from "../components/advisor-dashboard/advisor-dashboard.component";
import { AdminDashhooardComponent } from "../components/admin-dashhoard/admin-dashhoard.component";
import { EmployeeListComponent } from "../components/employee-list/employee-list.component";
import { EmployeeFormComponent } from "../components/employee-form/employee-form.component";
import { EmployeeDetailComponent } from "../components/employee-detail/employee-detail.component";

export const employeeROUTES: Routes = [
  {
    path: '',
    redirectTo: 'employees',
    pathMatch: 'full',
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: EmployeeListComponent
      },
      {
        path: 'create',
        component: EmployeeFormComponent
      },
      {
        path: 'edit/:id',
        component: EmployeeFormComponent
      },
      {
        path: 'view/:id',
        component: EmployeeDetailComponent
      },
      {
        path: 'dashboard/:id',
        component: AdvisorDashboardComponent
      }
    ]
  },
  {
    path: 'admin-dashboard',
    canActivate: [authGuard],
    component: AdminDashhooardComponent
  }

];