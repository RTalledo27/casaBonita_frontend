import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedTableComponent, ColumnDef } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupsService } from '../../services/client-followups.service';

@Component({
  selector: 'app-preventive-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule, SharedTableComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-2">{{ 'collections.followups.preventive.title' | translate }}</h1>
      <p class="text-slate-600 mb-4">{{ 'collections.followups.preventive.subtitle' | translate }}</p>
      <div class="mb-4">
        <label class="label">Ventana (días)</label>
        <input type="number" [(ngModel)]="window" class="input w-32"/>
        <button class="ml-2 px-3 py-2 rounded bg-blue-600 text-white" (click)="load()">{{ 'common.refresh' | translate }}</button>
      </div>
      <app-shared-table [columns]="columns" [data]="rows" [templates]="templates" [componentName]="'preventive'" [permissionPrefix]="'collections'" [idField]="'sale_code'"></app-shared-table>
      <ng-template #clientTpl let-row>
        <a [routerLink]="['/crm/clients', row.client_id]" class="text-blue-600 hover:underline">{{ row.client_name }}</a>
      </ng-template>
      <ng-template #lotTpl let-row>
        <a *ngIf="row.lot_id" [routerLink]="['/inventory/lots', row.lot_id]" class="text-indigo-600 hover:underline">{{ row.lot }}</a>
        <span *ngIf="!row.lot_id" class="text-slate-500">{{ row.lot || '—' }}</span>
      </ng-template>
    </div>
  `,
})
export class PreventiveListComponent {
  window = 15;
  rows: any[] = [];
  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code' },
    { header: 'collections.followups.columns.client_name', tpl: 'client' },
    { header: 'collections.followups.columns.lot', tpl: 'lot' },
    { field: 'due_date', header: 'collections.followups.columns.due_date' },
    { field: 'monthly_quota', header: 'collections.followups.columns.monthly_quota', align: 'right' },
  ];
  templates: Record<string, any> = {};
  constructor(private svc: ClientFollowupsService) {}
  ngAfterViewInit() {
    this.templates['client'] = (null as any);
    this.templates['lot'] = (null as any);
  }
  ngOnInit(){ this.load(); }
  load(){ this.svc.listPreventive(this.window).subscribe(d => this.rows = d); }
}
