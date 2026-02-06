import { Route } from '@angular/router';
import { BillingDashboardComponent } from './components/billing-dashboard/billing-dashboard.component';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';

export const BILLING_ROUTES: Route[] = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: BillingDashboardComponent
    },
    {
        path: 'invoices',
        component: InvoiceListComponent
    },
    {
        path: 'emitir',
        component: InvoiceFormComponent
    },
    {
        path: 'emitir/:type', // boleta, factura, nota-credito
        component: InvoiceFormComponent
    }
];
