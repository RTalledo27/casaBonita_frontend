import { Route } from "@angular/router";

export const INVENTORY_ROUTES: Route[] = [
  { path: '', redirectTo: 'lots', pathMatch: 'full' },
  {
    path: 'lots',
    loadComponent: () => import('../lots/lots.component').then(m => m.LotsComponent),
    data: { permission: 'inventory.lots.view' },
  },
  {
    path: 'lots/import',
    loadComponent: () => import('../components/lot-import/lot-import.component').then(m => m.LotImportComponent),
    data: { permission: 'inventory.lots.store' },
  },
  {
    path: 'lots/external-import',
    loadComponent: () => import('../components/external-lot-import/external-lot-import.component').then(m => m.ExternalLotImportComponent),
    data: { permission: 'inventory.lots.store' },
  },
  {
    path: 'manzanas/financing-rules',
    loadComponent: () => import('../components/manzana-financing-rules/manzana-financing-rules.component').then(m => m.ManzanaFinancingRulesComponent),
    data: { permission: 'inventory.manzanas.update' },
  },
  {
    path: 'lots/create',
    loadComponent: () => import('../lots/lot-form/lot-form.component').then(m => m.LotFormComponent),
    data: { permission: 'inventory.lots.store' },
  },
  {
    path: 'lots/:id/edit',
    loadComponent: () => import('../lots/lot-form/lot-form.component').then(m => m.LotFormComponent),
    data: { permission: 'inventory.lots.update' },
  },
  {
    path: 'lots/:id',
    loadComponent: () => import('../lots/lot-detail/lot-detail.component').then(m => m.LotDetailComponent),
    data: { permission: 'inventory.lots.view' },
  },
];
