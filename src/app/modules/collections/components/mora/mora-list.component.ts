import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedTableComponent, ColumnDef } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupsService } from '../../services/client-followups.service';

@Component({
  selector: 'app-mora-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule, SharedTableComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-2">{{ 'collections.followups.mora.title' | translate }}</h1>
      <div class="mb-4">
        <label class="label">Tramo</label>
        <select [(ngModel)]="tramo" class="input w-40">
          <option value="1">Tramo 1 (1-30)</option>
          <option value="2">Tramo 2 (31-60)</option>
          <option value="3">Tramo 3 (61+)</option>
        </select>
        <button class="ml-2 px-3 py-2 rounded bg-blue-600 text-white" (click)="load()">{{ 'common.refresh' | translate }}</button>
      </div>
      <app-shared-table [columns]="columns" [data]="rows" [templates]="templates" [componentName]="'mora'" [permissionPrefix]="'collections'" [idField]="'sale_code'"></app-shared-table>
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
export class MoraListComponent {
  tramo: '1'|'2'|'3' = '1';
  rows: any[] = [];
  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code' },
    { header: 'collections.followups.columns.client_name', tpl: 'client' },
    { header: 'collections.followups.columns.lot', tpl: 'lot' },
    { field: 'due_date', header: 'collections.followups.columns.due_date' },
    { field: 'monthly_quota', header: 'collections.followups.columns.monthly_quota', align: 'right' },
    { field: 'days_overdue', header: 'collections.followups.mora.daysOverdue', align: 'right' },
  ];
  templates: Record<string, any> = {};
  constructor(private svc: ClientFollowupsService) {}
  ngAfterViewInit() {
    this.templates['client'] = (null as any);
    this.templates['lot'] = (null as any);
  }
  ngOnInit(){ this.load(); }
  load(){ this.svc.listMora(this.tramo).subscribe(d => this.rows = d); }
}
