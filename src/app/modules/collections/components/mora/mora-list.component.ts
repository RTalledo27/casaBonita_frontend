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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-4xl">🔴</span>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Mora</h1>
            <p class="text-gray-600 dark:text-gray-400">Pagos vencidos - Seguimiento prioritario</p>
          </div>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
        <div class="flex items-start gap-3">
          <span class="text-2xl">ℹ️</span>
          <div class="flex-1">
            <h3 class="font-semibold text-red-900 dark:text-red-100 mb-1">¿Qué hace esta vista?</h3>
            <p class="text-sm text-red-800 dark:text-red-200">
              Esta vista <strong>busca automáticamente en la base de datos</strong> todas las cuotas que ya están <strong>vencidas</strong> (mora) 
              y las <strong>segmenta por antigüedad</strong> en 3 tramos según la gravedad de la mora.
            </p>
            <ul class="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>🟡 <strong>Tramo 1 (1-30 días):</strong> Mora reciente - Prioridad MEDIA</li>
              <li>🟠 <strong>Tramo 2 (31-60 días):</strong> Mora intermedia - Prioridad ALTA</li>
              <li>🔴 <strong>Tramo 3 (61+ días):</strong> Mora crítica - Prioridad MUY ALTA</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Selector de Tramo -->
      <div class="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-700 dark:to-rose-800 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold mb-2">Segmentación por Mora</h2>
            <p class="text-red-50 text-sm">Filtrado automático: Cuotas vencidas hace {{ getTramoDescription() }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Seleccionar Tramo:</label>
              <select 
                [(ngModel)]="tramo" 
                (ngModelChange)="load()"
                class="px-4 py-2 rounded-lg border-2 border-red-300 bg-white/90 text-gray-900 font-semibold">
                <option value="1">🟡 Tramo 1 (1-30 días)</option>
                <option value="2">🟠 Tramo 2 (31-60 días)</option>
                <option value="3">🔴 Tramo 3 (61+ días)</option>
              </select>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold">{{ rows.length }}</div>
              <div class="text-xs text-red-100">Casos</div>
            </div>
            <button 
              class="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/40 font-medium transition"
              (click)="load()">
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">👥</div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Total Casos</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ rows.length }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl">💰</div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Monto en Mora</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ calculateTotal() | number:'1.0-0' }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-2xl">⏱️</div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Días Promedio</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ calculateAvgDays() | number:'1.0-0' }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">🎯</div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Prioridad</div>
              <div class="text-lg font-bold text-gray-900 dark:text-white">{{ getPriority() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <app-shared-table [columns]="columns" [data]="rows" [templates]="templates" [componentName]="'mora'" [permissionPrefix]="'collections'" [idField]="'sale_code'"></app-shared-table>
      </div>

      <!-- Templates -->
      <ng-template #clientTpl let-row>
        <a [routerLink]="['/crm/clients', row.client_id]" class="text-blue-600 hover:underline">{{ row.client_name }}</a>
      </ng-template>
      
      <ng-template #lotTpl let-row>
        <a *ngIf="row.lot_id" [routerLink]="['/inventory/lots', row.lot_id]" class="text-indigo-600 hover:underline">{{ row.lot }}</a>
        <span *ngIf="!row.lot_id" class="text-slate-500">{{ row.lot || '—' }}</span>
      </ng-template>

      <ng-template #statusTpl let-row>
        <div *ngIf="row.has_followup" class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            ✓ En seguimiento
          </span>
          <a [routerLink]="['/collections/client-followups', row.followup_id]" 
             class="text-blue-600 hover:underline text-xs"
             title="Ver seguimiento">
            Ver
          </a>
        </div>
        <span *ngIf="!row.has_followup" 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
          🔴 Sin seguimiento
        </span>
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
  @ViewChild('statusTpl', { static: false }) statusTpl!: TemplateRef<any>;
  
  tramo: '1'|'2'|'3' = '1';
  rows: any[] = [];
  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code', width: '120px' },
    { header: 'collections.followups.columns.client_name', tpl: 'client', width: '180px' },
    { header: 'collections.followups.columns.lot', tpl: 'lot', width: '100px' },
    { field: 'phone1', header: 'collections.followups.columns.phone1', width: '120px' },
    { field: 'email', header: 'collections.followups.columns.email', width: '180px' },
    { field: 'due_date', header: 'collections.followups.columns.due_date', width: '110px' },
    { field: 'monthly_quota', header: 'collections.followups.columns.monthly_quota', align: 'right', width: '120px' },
    { field: 'days_overdue', header: 'Días en mora', align: 'center', width: '100px' },
    { field: 'overdue_installments', header: 'Cuotas vencidas', align: 'center', width: '100px' },
    { header: 'Estado', tpl: 'status', width: '150px' },
    { header: 'common.actions', tpl: 'actions', width: '200px' },
  ];
  templates: Record<string, any> = {};

  calculateTotal(): number {
    return this.rows.reduce((sum, row) => sum + (row.monthly_quota || 0), 0);
  }

  calculateAvgDays(): number {
    if (this.rows.length === 0) return 0;
    const total = this.rows.reduce((sum, row) => sum + (row.days_overdue || 0), 0);
    return total / this.rows.length;
  }

  getPriority(): string {
    if (this.tramo === '3') return 'MUY ALTA';
    if (this.tramo === '2') return 'ALTA';
    return 'MEDIA';
  }

  getTramoDescription(): string {
    if (this.tramo === '1') return '1-30 días';
    if (this.tramo === '2') return '31-60 días';
    return '61+ días';
  }
  
  constructor(
    private svc: ClientFollowupsService,
    private toast: ToastService
  ) {}
  
  ngAfterViewInit() {
    this.templates['client'] = (null as any);
    this.templates['lot'] = (null as any);
    this.templates['status'] = this.statusTpl;
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
      next: (response: any) => {
        const wasCreated = response?.data?.was_created;
        this.toast.success(wasCreated ? '✅ Seguimiento creado automáticamente y WhatsApp enviado' : 'WhatsApp enviado correctamente');
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
      next: (response: any) => {
        const wasCreated = response?.data?.was_created;
        this.toast.success(wasCreated ? '✅ Seguimiento creado y SMS enviado' : 'SMS enviado correctamente');
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
      next: (response: any) => {
        const wasCreated = response?.data?.was_created;
        this.toast.success(wasCreated ? '✅ Seguimiento creado y Email enviado' : 'Email enviado correctamente');
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
      next: (response: any) => {
        const wasCreated = response?.data?.was_created;
        this.toast.success(wasCreated ? '✅ Seguimiento creado y llamada registrada' : 'Llamada registrada correctamente');
        this.load();
      },
      error: (err) => this.toast.error('Error al registrar llamada: ' + (err.error?.message || err.message))
    });
  }
}
