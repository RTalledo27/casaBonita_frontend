import { Component, computed, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, FileText, Search, Plus } from 'lucide-angular';
import { ColumnDef, SharedTableComponent } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupEditComponent } from './client-followup-edit.component';
import { ClientFollowupRecord } from '../../models/client-followup';
import { ClientFollowupsService } from '../../services/client-followups.service';

@Component({
  selector: 'app-client-followups',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule, RouterModule, SharedTableComponent, ClientFollowupEditComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ 'collections.followups.title' | translate }}</h1>
          <p class="text-gray-600 dark:text-gray-400">{{ 'collections.followups.subtitle' | translate }}</p>
        </div>
        <div class="flex gap-2">
          <button (click)="openCreate()" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition">
            <lucide-angular [img]="plusIcon" [size]="18"></lucide-angular>
            <span>{{ 'collections.followups.new' | translate }}</span>
          </button>
          <button (click)="exportExcel()" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition">
            <lucide-angular [img]="fileIcon" [size]="18"></lucide-angular>
            <span>{{ 'collections.followups.exportExcel' | translate }}</span>
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'collections.followups.filters.search' | translate }}</label>
            <input type="text" [(ngModel)]="query" class="w-full px-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" placeholder="{{ 'collections.followups.filters.searchPlaceholder' | translate }}" />
            <lucide-angular [img]="searchIcon" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-angular>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'collections.followups.filters.status' | translate }}</label>
            <select [(ngModel)]="status" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
              <option value="">{{ 'common.all' | translate }}</option>
              <option value="pending">{{ 'collections.followups.status.pending' | translate }}</option>
              <option value="in_progress">{{ 'collections.followups.status.in_progress' | translate }}</option>
              <option value="resolved">{{ 'collections.followups.status.resolved' | translate }}</option>
              <option value="unreachable">{{ 'collections.followups.status.unreachable' | translate }}</option>
              <option value="escalated">{{ 'collections.followups.status.escalated' | translate }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'collections.followups.filters.owner' | translate }}</label>
            <input type="text" [(ngModel)]="owner" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'collections.followups.filters.client' | translate }}</label>
            <input type="text" [(ngModel)]="clientSearch" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" placeholder="{{ 'collections.followups.filters.clientPlaceholder' | translate }}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'collections.followups.filters.contract' | translate }}</label>
            <input type="text" [(ngModel)]="contractSearch" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" placeholder="{{ 'collections.followups.filters.contractPlaceholder' | translate }}" />
          </div>
          <div class="flex gap-2">
            <button (click)="clearFilters()" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">{{ 'common.clearFilters' | translate }}</button>
          </div>
        </div>
      </div>

      <app-shared-table [columns]="columns" [data]="filtered()" [templates]="templates" [componentName]="'followups'" [permissionPrefix]="'collections'" [idField]="'sale_code'"
        (onEdit)="openEdit($event)"></app-shared-table>

      <app-client-followup-edit [visible]="editVisible" [record]="selected" (save)="onModalSave($event)" (cancel)="closeEdit()"></app-client-followup-edit>

      <ng-template #statusTpl let-row>
        <span [class]="statusClass(row.management_status)">{{ ('collections.followups.status.' + row.management_status) | translate }}</span>
      </ng-template>
      <ng-template #clientLinkTpl let-row>
        <a [routerLink]="['/crm/clients', row.client_id]" class="text-blue-600 dark:text-blue-400 hover:underline">{{ row.client_name }}</a>
      </ng-template>
      <ng-template #lotLinkTpl let-row>
        <ng-container *ngIf="row.lot_id; else noLot">
          <a [routerLink]="['/inventory/lots', row.lot_id]" class="text-indigo-600 dark:text-indigo-400 hover:underline" 
             [title]="('Lote: ' + (row.lot || '—') + '\nÁrea: ' + (row.lot_area_m2 || '—') + ' m²' + '\nEstado: ' + (row.lot_status || '—'))">
            {{ row.lot || '—' }}
          </a>
        </ng-container>
        <ng-template #noLot>
          <span class="text-slate-500" [title]="('Lote: ' + (row.lot || '—'))">{{ row.lot || '—' }}</span>
        </ng-template>
      </ng-template>
    </div>
  `,
  styleUrls: ['./client-followups.component.scss']
})
export class ClientFollowupsComponent implements AfterViewInit {
  fileIcon = FileText;
  searchIcon = Search;
  plusIcon = Plus;
  query = '';
  status = '';
  owner = '';
  clientSearch = '';
  contractSearch = '';
  editVisible = false;
  selected?: ClientFollowupRecord;
  createVisible = false;

  data = signal<ClientFollowupRecord[]>([]);
  filtered = computed(() => {
    const q = this.query.toLowerCase();
    const s = this.status;
    const o = this.owner.toLowerCase();
    const cq = this.clientSearch.toLowerCase();
    const kq = this.contractSearch.toLowerCase();
    return this.data().filter(r => (
      (!q || [r.sale_code, r.client_name, r.dni, r.lot].some(v => (v || '').toLowerCase().includes(q))) &&
      (!s || r.management_status === s) &&
      (!o || (r.owner || '').toLowerCase().includes(o)) &&
      (!cq || (r.client_name || '').toLowerCase().includes(cq) || String(r.client_id || '').includes(cq)) &&
      (!kq || (r.sale_code || '').toLowerCase().includes(kq) || String(r.contract_id || '').includes(kq))
    ));
  });

  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code' },
    { header: 'collections.followups.columns.client_name', tpl: 'clientLink' },
    { header: 'collections.followups.columns.lot', tpl: 'lotLink' },
    { field: 'dni', header: 'collections.followups.columns.dni' },
    { field: 'phone1', header: 'collections.followups.columns.phone1' },
    { field: 'phone2', header: 'collections.followups.columns.phone2' },
    { field: 'email', header: 'collections.followups.columns.email' },
    { field: 'address', header: 'collections.followups.columns.address', width: '240px' },
    { field: 'district', header: 'collections.followups.columns.district' },
    { field: 'province', header: 'collections.followups.columns.province' },
    { field: 'department', header: 'collections.followups.columns.department' },
    { field: 'due_date', header: 'collections.followups.columns.due_date' },
    { field: 'sale_price', header: 'collections.followups.columns.sale_price', align: 'right' },
    { field: 'amount_paid', header: 'collections.followups.columns.amount_paid', align: 'right' },
    { field: 'amount_due', header: 'collections.followups.columns.amount_due', align: 'right' },
    { field: 'monthly_quota', header: 'collections.followups.columns.monthly_quota', align: 'right' },
    { field: 'paid_installments', header: 'collections.followups.columns.paid_installments', align: 'right' },
    { field: 'pending_installments', header: 'collections.followups.columns.pending_installments', align: 'right' },
    { field: 'total_installments', header: 'collections.followups.columns.total_installments', align: 'right' },
    { field: 'overdue_installments', header: 'collections.followups.columns.overdue_installments', align: 'right' },
    { field: 'pending_amount', header: 'collections.followups.columns.pending_amount', align: 'right' },
    { field: 'contact_date', header: 'collections.followups.columns.contact_date' },
    { field: 'action_taken', header: 'collections.followups.columns.action_taken' },
    { field: 'management_result', header: 'collections.followups.columns.management_result' },
    { field: 'management_notes', header: 'collections.followups.columns.management_notes', width: '260px' },
    { field: 'home_visit_date', header: 'collections.followups.columns.home_visit_date' },
    { field: 'home_visit_reason', header: 'collections.followups.columns.home_visit_reason' },
    { field: 'home_visit_result', header: 'collections.followups.columns.home_visit_result' },
    { field: 'home_visit_notes', header: 'collections.followups.columns.home_visit_notes', width: '260px' },
    { header: 'collections.followups.columns.management_status', tpl: 'status' },
    { field: 'last_contact', header: 'collections.followups.columns.last_contact' },
    { field: 'next_action', header: 'collections.followups.columns.next_action' },
    { field: 'owner', header: 'collections.followups.columns.owner' },
    { field: 'general_notes', header: 'collections.followups.columns.general_notes', width: '260px' },
    { field: 'general_reason', header: 'collections.followups.columns.general_reason' },
  ];

  templates: Record<string, any> = {};
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;
  @ViewChild('clientLinkTpl') clientLinkTpl!: TemplateRef<any>;
  @ViewChild('lotLinkTpl') lotLinkTpl!: TemplateRef<any>;

  constructor(private followups: ClientFollowupsService) {
    this.followups.records$.subscribe(list => this.data.set(list));
    // templates se asignan en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.templates['status'] = this.statusTpl;
    this.templates['clientLink'] = this.clientLinkTpl;
    this.templates['lotLink'] = this.lotLinkTpl;
  }

  ngOnInit(): void {
    this.followups.list().subscribe();
  }

  exportExcel(): void {
    this.followups.exportToExcel(this.filtered());
  }

  openEdit(id: number | string): void {
    const idStr = String(id);
    const found = this.data().find(r => r.sale_code === idStr);
    if (found) {
      this.selected = found;
      this.editVisible = true;
    }
  }

  closeEdit(): void {
    this.editVisible = false;
    this.selected = undefined;
  }

  async onModalSave(patch: Partial<ClientFollowupRecord>): Promise<void> {
    if (!this.selected) {
      await this.saveCreate(patch);
      return;
    }
    const updated = this.data().map(r => r.sale_code === this.selected!.sale_code ? { ...r, ...patch } : r);
    this.data.set(updated);
    this.followups.setData(updated);
    await this.followups.saveRecordPatch(this.selected!.sale_code, patch);
    this.closeEdit();
  }

  openCreate(): void {
    this.selected = undefined;
    this.editVisible = true; // reuse modal for create
  }

  async saveCreate(patch: Partial<ClientFollowupRecord>): Promise<void> {
    const base: ClientFollowupRecord = {
      client_id: patch.client_id as number | undefined,
      sale_code: `C-${Math.floor(Math.random()*100000)}`,
      client_name: patch.client_name || 'Nuevo Cliente',
      lot: patch.lot || '',
      dni: patch.dni || '',
      phone1: patch.phone1 || '',
      phone2: patch.phone2,
      email: patch.email,
      address: patch.address,
      district: patch.district,
      province: patch.province,
      department: patch.department,
      due_date: patch.due_date,
      sale_price: patch.sale_price,
      amount_paid: patch.amount_paid,
      amount_due: patch.amount_due,
      monthly_quota: patch.monthly_quota,
      paid_installments: patch.paid_installments,
      pending_installments: patch.pending_installments,
      total_installments: patch.total_installments,
      overdue_installments: patch.overdue_installments,
      pending_amount: patch.pending_amount,
      contact_date: patch.contact_date,
      action_taken: patch.action_taken,
      management_result: patch.management_result,
      management_notes: patch.management_notes,
      home_visit_date: patch.home_visit_date,
      home_visit_reason: patch.home_visit_reason,
      home_visit_result: patch.home_visit_result,
      home_visit_notes: patch.home_visit_notes,
      management_status: patch.management_status as any || 'pending',
      last_contact: patch.last_contact,
      next_action: patch.next_action,
      owner: patch.owner,
      assigned_employee_id: patch.assigned_employee_id as number | undefined,
      general_notes: patch.general_notes,
      general_reason: patch.general_reason,
    };
    const created = await this.followups.createRecord(base);
    this.closeEdit();
  }

  statusClass(s?: string): string {
    switch (s) {
      case 'pending': return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress': return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'unreachable': return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
      case 'escalated': return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default: return 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
    }
  }

  clearFilters(): void {
    this.query = '';
    this.status = '';
    this.owner = '';
    this.clientSearch = '';
    this.contractSearch = '';
  }
}
