import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedTableComponent, ColumnDef } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupsService } from '../../services/client-followups.service';
import { ToastService } from '../../../../core/services/toast.service';

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

      <ng-template #actionsTpl let-row>
        <div class="flex gap-1 items-center">
          <button 
            (click)="sendWhatsApp(row)" 
            class="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium flex items-center gap-1"
            title="Enviar WhatsApp">
            <span>📱</span>
          </button>
          <button 
            (click)="sendSMS(row)" 
            class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1"
            title="Enviar SMS">
            <span>💬</span>
          </button>
          <button 
            (click)="sendEmail(row)" 
            class="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1"
            title="Enviar Email">
            <span>📧</span>
          </button>
          <button 
            (click)="registerCall(row)" 
            class="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex items-center gap-1"
            title="Registrar Llamada">
            <span>📞</span>
          </button>
        </div>
      </ng-template>
    </div>
  `,
})
export class MoraListComponent {
  @ViewChild('actionsTpl', { static: false }) actionsTpl!: TemplateRef<any>;
  
  tramo: '1'|'2'|'3' = '1';
  rows: any[] = [];
  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code' },
    { header: 'collections.followups.columns.client_name', tpl: 'client' },
    { header: 'collections.followups.columns.lot', tpl: 'lot' },
    { field: 'due_date', header: 'collections.followups.columns.due_date' },
    { field: 'monthly_quota', header: 'collections.followups.columns.monthly_quota', align: 'right' },
    { field: 'days_overdue', header: 'collections.followups.mora.daysOverdue', align: 'right' },
    { header: 'common.actions', tpl: 'actions', width: '200px' },
  ];
  templates: Record<string, any> = {};
  
  constructor(
    private svc: ClientFollowupsService,
    private toast: ToastService
  ) {}
  
  ngAfterViewInit() {
    this.templates['client'] = (null as any);
    this.templates['lot'] = (null as any);
    this.templates['actions'] = this.actionsTpl;
  }
  
  ngOnInit(){ this.load(); }
  
  load(){ 
    this.svc.listMora(this.tramo).subscribe(d => this.rows = d); 
  }

  sendWhatsApp(row: any) {
    if (!row.followup_id && !row.contract_id) {
      this.toast.error('No se puede enviar WhatsApp sin followup_id');
      return;
    }
    const id = row.followup_id || row.contract_id;
    const useContractId = !row.followup_id;
    this.svc.sendWhatsApp(id, undefined, useContractId).subscribe({
      next: () => {
        this.toast.success('WhatsApp enviado correctamente');
        this.load();
      },
      error: (err) => this.toast.error('Error al enviar WhatsApp: ' + (err.error?.message || err.message))
    });
  }

  sendSMS(row: any) {
    if (!row.followup_id && !row.contract_id) {
      this.toast.error('No se puede enviar SMS sin followup_id');
      return;
    }
    const id = row.followup_id || row.contract_id;
    const useContractId = !row.followup_id;
    this.svc.sendSMS(id, undefined, useContractId).subscribe({
      next: () => {
        this.toast.success('SMS enviado correctamente');
        this.load();
      },
      error: (err) => this.toast.error('Error al enviar SMS: ' + (err.error?.message || err.message))
    });
  }

  sendEmail(row: any) {
    if (!row.followup_id && !row.contract_id) {
      this.toast.error('No se puede enviar Email sin followup_id');
      return;
    }
    const id = row.followup_id || row.contract_id;
    const useContractId = !row.followup_id;
    this.svc.sendEmailAction(id, undefined, undefined, useContractId).subscribe({
      next: () => {
        this.toast.success('Email enviado correctamente');
        this.load();
      },
      error: (err) => this.toast.error('Error al enviar Email: ' + (err.error?.message || err.message))
    });
  }

  registerCall(row: any) {
    if (!row.followup_id && !row.contract_id) {
      this.toast.error('No se puede registrar llamada sin followup_id');
      return;
    }
    const id = row.followup_id || row.contract_id;
    const useContractId = !row.followup_id;
    const notes = prompt('Notas de la llamada:');
    if (notes === null) return;
    
    this.svc.registerCall(id, notes, useContractId).subscribe({
      next: () => {
        this.toast.success('Llamada registrada correctamente');
        this.load();
      },
      error: (err) => this.toast.error('Error al registrar llamada: ' + (err.error?.message || err.message))
    });
  }
}
