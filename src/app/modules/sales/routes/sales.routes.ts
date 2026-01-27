import { Route } from "@angular/router";
import { ReservationsComponent } from "../reservations/reservations.component";
import { ReservationFormComponent } from "../reservations/components/reservation-form/reservation-form.component";
import { ContractsComponent } from "../contracts/contracts.component";
import { ContractFormComponent } from "../contracts/components/contract-form/contract-form.component";
import { PaymentsComponent } from "../payments/payments.component";
import { PaymentFormComponent } from "../payments/payment-form/payment-form.component";
import { CutsDashboardComponent } from "../components/cuts/cuts-dashboard.component";
import { TodayCutComponent } from "../components/cuts/today-cut.component";
import { CutDetailComponent } from "../components/cuts/cut-detail.component";

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
    //falta agregar el permiso de sales.payments.view
    data: { permission: 'sales.contracts.view' },
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
  {
    path: 'cuts',
    data: { permission: 'sales.cuts.view' },
    children: [
      {
        path: '',
        component: CutsDashboardComponent,
        data: { permission: 'sales.cuts.view' },
      },
      {
        path: 'today',
        component: TodayCutComponent,
        data: { permission: 'sales.cuts.view' },
      },
      {
        path: ':id',
        component: CutDetailComponent,
        data: { permission: 'sales.cuts.view' },
      },
    ]
  },
];
