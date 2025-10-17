import { Route } from "@angular/router";
import { ReservationsComponent } from "../reservations/reservations.component";
import { ReservationFormComponent } from "../reservations/components/reservation-form/reservation-form.component";
import { ContractsComponent } from "../contracts/contracts.component";
import { ContractFormComponent } from "../contracts/components/contract-form/contract-form.component";
import { PaymentsComponent } from "../payments/payments.component";
import { PaymentFormComponent } from "../payments/payment-form/payment-form.component";

export const SALES_ROUTES: Route[] = [
  { path: '', redirectTo: 'reservations', pathMatch: 'full' },
  {
    path: 'reservations',
    component: ReservationsComponent,
    data: { permission: 'sales.reservations.view' },
    children: [
      {
        path: 'create',
        component: ReservationFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.reservations.store' },
      },
      {
        path: ':id/edit',
        component: ReservationFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.reservations.update' },
      },
    ]
  },
  {
    path: 'contracts',
    component: ContractsComponent,
    data: { permission: 'sales.contracts.view' },
    children: [
      {
        path: 'create',
        component: ContractFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.contracts.store' },
      },
      {
        path: ':id/edit',
        component: ContractFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.contracts.update' },
      },
    ]
  },
  {
    path: 'payments',
    component: PaymentsComponent,
    data: { permission: 'sales.payments.view' },
    children: [
      {
        path: 'create',
        component: PaymentFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.payments.store' },
      },
      {
        path: ':id/edit',
        component: PaymentFormComponent,
        outlet: 'modal',
        data: { permission: 'sales.payments.update' },
      },
    ]
  },
];
