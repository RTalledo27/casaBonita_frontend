import { Route } from "@angular/router";
import { ReservationsComponent } from "../reservations/reservations.component";
import { ReservationFormComponent } from "../reservations/components/reservation-form/reservation-form.component";
import { ContractsComponent } from "../contracts/contracts.component";
import { ContractFormComponent } from "../contracts/components/contract-form/contract-form.component";

export const SALES_ROUTES: Route[] = [
  { path: '', redirectTo: 'reservations', pathMatch: 'full' },
  {
    path: 'reservations',
    component: ReservationsComponent,
    data: { permission: 'sales.reservations.view' },
  },
  {
    path: 'reservations/create',
    component: ReservationFormComponent,
    data: { permission: 'sales.reservations.store' },
  },
  {
    path: 'reservations/:id/edit',
    component: ReservationFormComponent,
    data: { permission: 'sales.reservations.update' },
  },
  {
    path: 'contracts',
    component: ContractsComponent,
    data: { permission: 'sales.contracts.view' },
  },
  {
    path: 'contracts/create',
    component: ContractFormComponent,
    data: { permission: 'sales.contracts.store' },
  },
  {
    path: 'contracts/:id/edit',
    component: ContractFormComponent,
    data: { permission: 'sales.contracts.update' },
  },
];
