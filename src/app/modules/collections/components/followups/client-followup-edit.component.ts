import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ClientFollowupRecord } from '../../models/client-followup';
import { EmployeeService } from '../../../humanResources/services/employee.service';
import { Employee } from '../../../humanResources/models/employee';
import { ClientsService } from '../../../CRM/services/clients.service';
import { Client } from '../../../CRM/models/client';

@Component({
  selector: 'app-client-followup-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  template: `
  <div *ngIf="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ 'collections.followups.title' | translate }}</h3>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="label">{{ 'collections.followups.client' | translate }}</label>
          <select class="input" formControlName="client_id">
            <option [ngValue]="null">{{ 'common.select' | translate }}</option>
            <option *ngFor="let c of clients" [ngValue]="c.client_id">{{ c.first_name }} {{ c.last_name }} - {{ c.doc_number }}</option>
          </select>
        </div>
        <div>
          <label class="label">{{ 'collections.followups.columns.action_taken' | translate }}</label>
          <input class="input" formControlName="action_taken" />
        </div>
        <div>
          <label class="label">{{ 'collections.followups.columns.management_result' | translate }}</label>
          <input class="input" formControlName="management_result" />
        </div>
        <div>
          <label class="label">{{ 'collections.followups.columns.next_action' | translate }}</label>
          <input class="input" formControlName="next_action" />
        </div>
        <div>
          <label class="label">{{ 'collections.followups.columns.owner' | translate }}</label>
          <select class="input" formControlName="assigned_employee_id" (change)="onEmployeeChange($event)">
            <option [ngValue]="null">{{ 'common.select' | translate }}</option>
            <option *ngFor="let e of employees" [ngValue]="e.employee_id">{{ e.user?.first_name }} {{ e.user?.last_name }}</option>
          </select>
        </div>
        <div>
          <label class="label">{{ 'collections.followups.columns.management_status' | translate }}</label>
          <select class="input" formControlName="management_status">
            <option value="pending">{{ 'collections.followups.status.pending' | translate }}</option>
            <option value="in_progress">{{ 'collections.followups.status.in_progress' | translate }}</option>
            <option value="resolved">{{ 'collections.followups.status.resolved' | translate }}</option>
            <option value="unreachable">{{ 'collections.followups.status.unreachable' | translate }}</option>
            <option value="escalated">{{ 'collections.followups.status.escalated' | translate }}</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="label">{{ 'collections.followups.columns.management_notes' | translate }}</label>
          <textarea class="input" rows="3" formControlName="management_notes"></textarea>
        </div>

        <div class="md:col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" (click)="cancel.emit()" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{{ 'common.cancel' | translate }}</button>
          <button type="submit" [disabled]="form.invalid" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">{{ 'common.save' | translate }}</button>
        </div>
      </form>
    </div>
  </div>
  `,
  styles: []
})
export class ClientFollowupEditComponent {
  @Input() visible = false;
  @Input() record?: ClientFollowupRecord;
  @Output() save = new EventEmitter<Partial<ClientFollowupRecord>>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  employees: Employee[] = [];
  clients: Client[] = [];

  constructor(private fb: FormBuilder, private employeeService: EmployeeService, private clientsService: ClientsService) {
    this.form = this.fb.group({
      client_id: [null, [Validators.required]],
      action_taken: ['', [Validators.maxLength(200)]],
      management_result: ['', [Validators.maxLength(200)]],
      next_action: ['', [Validators.maxLength(200)]],
      assigned_employee_id: [null],
      owner: ['', [Validators.maxLength(100)]],
      management_status: ['pending', [Validators.required]],
      management_notes: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnChanges() {
    if (this.record) {
      this.form.patchValue({
        client_id: this.record.client_id ?? null,
        action_taken: this.record.action_taken || '',
        management_result: this.record.management_result || '',
        next_action: this.record.next_action || '',
        assigned_employee_id: this.record.assigned_employee_id ?? null,
        owner: this.record.owner || '',
        management_status: this.record.management_status || 'pending',
        management_notes: this.record.management_notes || '',
      });
    }
  }

  ngOnInit() {
    this.employeeService.getAllEmployees({ employment_status: 'activo' }).subscribe({
      next: (resp) => this.employees = resp.data || [],
      error: () => this.employees = []
    });
    this.clientsService.list().subscribe({
      next: (list) => this.clients = list || [],
      error: () => this.clients = []
    });
  }

  onEmployeeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    const emp = this.employees.find(e => e.employee_id === id);
    this.form.patchValue({ owner: emp ? `${emp.user?.first_name} ${emp.user?.last_name}` : '' });
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
