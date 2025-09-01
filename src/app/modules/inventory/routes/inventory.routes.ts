import { Route } from "@angular/router";
import { LotsComponent } from "../lots/lots.component";
import { LotFormComponent } from "../lots/lot-form/lot-form.component";
import { LotDetailComponent } from "../lots/lot-detail/lot-detail.component";
import { LotImportComponent } from "../components/lot-import/lot-import.component";

export const INVENTORY_ROUTES: Route[] = [
  { path: '', redirectTo: 'lots', pathMatch: 'full' },
  {
    path: 'lots',
    component: LotsComponent,
    data: { permission: 'inventory.lots.view' },
  },
  {
    path: 'lots/create',
    component: LotFormComponent,
    data: { permission: 'inventory.lots.store' },
  },
  {
    path: 'lots/:id/edit',
    component: LotFormComponent,
    data: { permission: 'inventory.lots.update' },
  },
  {
    path: 'lots/:id',
    component: LotDetailComponent,
    data: { permission: 'inventory.lots.view' },
  },
  {
    path: 'lots/import',
    component: LotImportComponent,
    data: { permission: 'inventory.lots.store' },
  },
];
