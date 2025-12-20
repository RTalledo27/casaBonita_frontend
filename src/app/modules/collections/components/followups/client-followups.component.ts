import { Component, computed, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, FileText, Search, Plus, Phone, Mail, MessageSquare, Home, Copy } from 'lucide-angular';
import { EmployeeService } from '../../../humanResources/services/employee.service';
import { Employee } from '../../../humanResources/models/employee';
import { ColumnDef, SharedTableComponent } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupEditComponent } from './client-followup-edit.component';
import { FollowupCommitmentComponent } from './followup-commitment.component';
import { ClientFollowupRecord } from '../../models/client-followup';
import { ClientFollowupsService } from '../../services/client-followups.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-client-followups',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule, RouterModule, SharedTableComponent, ClientFollowupEditComponent, FollowupCommitmentComponent],
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
          <button (click)="openEmailTestGlobal()" class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition">
            <span>Test Email</span>
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 mb-4">
        <div class="flex flex-wrap gap-2 mb-3 items-center">
          <button class="px-3 py-1 rounded-full text-xs border" [ngClass]="{'bg-yellow-50 text-yellow-700 border-yellow-200': status()==='pending', 'bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700': status()!== 'pending'}" (click)="status.set('pending')">Pendiente</button>
          <button class="px-3 py-1 rounded-full text-xs border" [ngClass]="{'bg-blue-50 text-blue-700 border-blue-200': status()==='in_progress', 'bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700': status()!== 'in_progress'}" (click)="status.set('in_progress')">En curso</button>
          <button class="px-3 py-1 rounded-full text-xs border" [ngClass]="{'bg-green-50 text-green-700 border-green-200': status()==='resolved', 'bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700': status()!== 'resolved'}" (click)="status.set('resolved')">Resuelto</button>
          <button class="px-3 py-1 rounded-full text-xs border" [ngClass]="{'bg-red-50 text-red-700 border-red-200': overdueMin()==='1', 'bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700': overdueMin()!=='1'}" (click)="overdueMin.set('1')">Vencidas 1+</button>
          <button class="ml-auto px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" (click)="clearFilters()">Limpiar</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div class="relative">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.search' | translate }}</label>
            <input type="text" [ngModel]="query()" (ngModelChange)="query.set($event)" class="w-full h-9 px-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm" placeholder="{{ 'collections.followups.filters.searchPlaceholder' | translate }}" />
            <lucide-angular [img]="searchIcon" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-angular>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.status' | translate }}</label>
            <select [ngModel]="status()" (ngModelChange)="status.set($event)" class="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm">
              <option value="">{{ 'common.all' | translate }}</option>
              <option value="pending">{{ 'collections.followups.status.pending' | translate }}</option>
              <option value="in_progress">{{ 'collections.followups.status.in_progress' | translate }}</option>
              <option value="resolved">{{ 'collections.followups.status.resolved' | translate }}</option>
              <option value="unreachable">{{ 'collections.followups.status.unreachable' | translate }}</option>
              <option value="escalated">{{ 'collections.followups.status.escalated' | translate }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.owner' | translate }}</label>
            <input type="text" [ngModel]="owner()" (ngModelChange)="owner.set($event)" class="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm" placeholder="Nombre de responsable" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.client' | translate }}</label>
            <input type="text" [ngModel]="clientSearch()" (ngModelChange)="clientSearch.set($event)" class="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm" placeholder="{{ 'collections.followups.filters.clientPlaceholder' | translate }}" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.contract' | translate }}</label>
            <input type="text" [ngModel]="contractSearch()" (ngModelChange)="contractSearch.set($event)" class="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm" placeholder="{{ 'collections.followups.filters.contractPlaceholder' | translate }}" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.overdue' | translate }}</label>
            <select [ngModel]="overdueMin()" (ngModelChange)="overdueMin.set($event)" class="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm">
              <option value="">{{ 'common.all' | translate }}</option>
              <option value="0">0+</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button (click)="clearFilters()" class="px-3 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">{{ 'common.clearFilters' | translate }}</button>
          </div>
        </div>
      </div>

      <app-shared-table [columns]="columns" [data]="filtered()" [templates]="templates" [componentName]="'followups'" [permissionPrefix]="'collections'" [idField]="'sale_code'"
        (onEdit)="openEdit($event)"></app-shared-table>

      <app-client-followup-edit [visible]="editVisible" [record]="selected" (save)="onModalSave($event)" (cancel)="closeEdit()"></app-client-followup-edit>
      <app-followup-commitment [visible]="commitVisible" (save)="saveCommit($event)" (cancel)="commitVisible=false"></app-followup-commitment>
      <ng-template [ngIf]="actionVisible">
        <div class="fixed inset-0 bg-black/50 z-40" (click)="actionVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[520px] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-900 dark:to-indigo-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Registrar Gestión</div>
            <button class="px-2 py-1 rounded bg-white/20 hover:bg-white/30" (click)="actionVisible=false">Cerrar</button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canal</label>
              <input type="text" [value]="actionChannel" disabled class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resultado</label>
              <select [(ngModel)]="actionResult" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="contacted">Contactado</option>
                <option value="sent" *ngIf="actionChannel==='email'">Enviado</option>
                <option value="letter_sent" *ngIf="actionChannel==='letter'">Carta enviada</option>
                <option value="unreachable">No responde</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
              <textarea rows="5" [(ngModel)]="actionNotes" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" (click)="actionVisible=false">Cancelar</button>
              <button class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white" (click)="submitAction()">Guardar</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="visitVisible">
        <div class="fixed inset-0 bg-black/50 z-40" (click)="visitVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[520px] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Registrar Visita Domiciliaria</div>
            <button class="px-2 py-1 rounded bg-white/20 hover:bg-white/30" (click)="visitVisible=false">Cerrar</button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de visita</label>
              <input type="date" [(ngModel)]="visitDate" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
              <input type="text" [(ngModel)]="visitReason" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resultado</label>
              <select [(ngModel)]="visitResult" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="">Selecciona...</option>
                <option value="visita_realizada">Visita realizada</option>
                <option value="no_encontrado">No encontrado</option>
                <option value="compromiso_pago">Compromiso de pago</option>
                <option value="sin_respuesta">Sin respuesta</option>
                <option value="resuelto">Resuelto</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
              <textarea rows="5" [(ngModel)]="visitNotes" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" (click)="visitVisible=false">Cancelar</button>
              <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" (click)="submitVisit()">Guardar</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="emailVisible">
        <div class="fixed inset-0 bg-black/50 z-40" (click)="emailVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[640px] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 dark:from-indigo-900 dark:to-sky-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Enviar Email</div>
            <button class="px-2 py-1 rounded bg-white/20 hover:bg-white/30" (click)="emailVisible=false">Cerrar</button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para</label>
              <input type="text" [(ngModel)]="toEmail" [disabled]="!emailTestMode" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
              <input type="text" [(ngModel)]="emailSubject" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
              <textarea rows="8" [(ngModel)]="emailBody" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" (click)="emailVisible=false">Cancelar</button>
              <button class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white" (click)="sendEmail()">Enviar</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="summaryVisible">
        <div class="fixed inset-0 bg-black/50 z-40" (click)="summaryVisible=false"></div>
        <div class="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-gray-900 z-50 shadow-2xl border-l border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 dark:from-indigo-900 dark:to-sky-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">{{ 'collections.followups.summary.title' | translate }}</div>
            <button class="px-2 py-1 rounded bg-white/20 hover:bg-white/30" (click)="summaryVisible=false">{{ 'common.close' | translate }}</button>
          </div>
          <div class="p-6 space-y-5 h-[calc(100%-64px)] overflow-y-auto">
            <div class="grid grid-cols-1 gap-4">
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.sale_code' | translate }}</div>
                <div class="text-lg font-bold text-gray-900 dark:text-white">{{ selected?.sale_code || '—' }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.client_name' | translate }}</div>
                <div class="text-lg font-semibold"><a *ngIf="selected?.client_id" [routerLink]="['/crm/clients', selected?.client_id]" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ selected?.client_name }}</a></div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.lot' | translate }}</div>
                <div class="text-lg font-semibold"><a *ngIf="selected?.lot_id" [routerLink]="['/inventory/lots', selected?.lot_id]" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ selected?.lot || '—' }}</a></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.due_date' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.due_date || '—' }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.monthly_quota' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ (selected?.monthly_quota || 0) | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.contract_status' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.contract_status || '—' }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.advisor_name' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.advisor_name || '—' }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.amount_due' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ (selected?.amount_due || 0) | number:'1.2-2' }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.pending_amount' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ (selected?.pending_amount || 0) | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.paid_installments' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.paid_installments || 0 }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.pending_installments' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.pending_installments || 0 }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.columns.overdue_installments' | translate }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ selected?.overdue_installments || 0 }}</div>
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ 'collections.followups.summary.lastActions' | translate }}</div>
                <div class="flex items-center gap-2">
                  <div class="hidden sm:flex items-center gap-1">
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Llamada: {{ countChannel('call') }}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">WhatsApp: {{ countChannel('whatsapp') }}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">Email: {{ countChannel('email') }}</span>
                  </div>
                  <button class="px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-600" (click)="logsExpanded=!logsExpanded">
                    {{ logsExpanded ? 'Ver menos' : 'Ver todas' }}
                  </button>
                </div>
              </div>
              <div class="space-y-1">
                <div *ngFor="let l of (logsExpanded ? logs() : logs().slice(0,8))"
                     class="flex items-center gap-3 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 overflow-hidden">
                  <div class="shrink-0 w-20 text-center">
                    <span class="text-xs px-2 py-1 rounded-full" [ngClass]="channelBadgeClass(l.channel)">{{ displayChannel(l.channel) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start gap-2">
                      <span class="text-sm text-gray-900 dark:text-white"
                            [title]="l.notes || 'Sin notas'"
                            [style.display]="isExpanded(l) ? 'block' : '-webkit-box'"
                            [style.-webkitLineClamp]="isExpanded(l) ? 'unset' : '2'"
                            style="-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;white-space:pre-wrap;">
                        {{ l.notes || 'Sin notas' }}
                      </span>
                      <button class="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600"
                              (click)="toggleExpand(l)"
                              *ngIf="(l.notes || '').length > 80">
                        {{ isExpanded(l) ? 'Ocultar' : 'Ver más' }}
                      </button>
                      <button class="ml-1 text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600"
                              (click)="copyNotes(l.notes)"
                              *ngIf="l.notes">
                        Copiar
                      </button>
                    </div>
                    <span *ngIf="l.result" class="ml-2 align-middle text-[11px] px-2 py-0.5 rounded-full" [ngClass]="resultBadgeClass(l.result)">{{ displayResult(l.result) }}</span>
                  </div>
                  <div class="shrink-0 text-xs text-gray-500">{{ l.logged_at | date:'short' }}</div>
                </div>
                <div class="text-sm text-gray-900 dark:text-white" *ngIf="logs().length===0">
                  {{ selected?.management_notes || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

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
      <ng-template #actionsTpl let-row>
        <div class="flex gap-2">
          <button class="px-2 py-1 text-xs rounded bg-emerald-600 text-white" (click)="openCommit(row.sale_code)">Compromiso</button>
          <button class="px-2 py-1 text-xs rounded bg-blue-600 text-white" (click)="openAction(row, 'call')">Llamada</button>
          <button class="px-2 py-1 text-xs rounded bg-teal-600 text-white" (click)="openAction(row, 'whatsapp')">WhatsApp</button>
          <button class="px-2 py-1 text-xs rounded bg-indigo-600 text-white" (click)="openEmail(row)">Email</button>
          <button class="px-2 py-1 text-xs rounded bg-purple-600 text-white" (click)="openEmailTest(row)">Test Email</button>
          <button class="px-2 py-1 text-xs rounded bg-yellow-600 text-white" (click)="openAction(row, 'letter')">Carta</button>
          <button class="px-2 py-1 text-xs rounded bg-rose-600 text-white" (click)="openVisit(row)">Visita</button>
          <button class="px-2 py-1 text-xs rounded bg-slate-600 text-white" (click)="openSummary(row)">Resumen</button>
        </div>
      </ng-template>
      <ng-template #notesTpl let-row>
        <span class="block truncate" [title]="latestNote(row.management_notes)">{{ latestNote(row.management_notes) }}</span>
      </ng-template>
      <ng-template #lastContactTpl let-row>
        <span>{{ row.contact_date || '—' }}</span>
      </ng-template>
      <ng-template #ownerTpl let-row>
        <ng-container *ngIf="ownerEditId !== row['followup_id']; else editOwner">
          <div class="flex items-center gap-2">
            <span class="truncate">{{ row.owner || '—' }}</span>
            <button class="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600" (click)="beginOwnerEdit(row)">Editar</button>
          </div>
        </ng-container>
        <ng-template #editOwner>
          <div class="flex items-center gap-2">
            <select [(ngModel)]="ownerSelectedId" class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-56">
              <option [ngValue]="undefined">Selecciona responsable</option>
              <option *ngFor="let e of employees" [ngValue]="e.employee_id">{{ e.full_name }}</option>
            </select>
            <button class="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white" (click)="saveOwner(row)">Guardar</button>
            <button class="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600" (click)="cancelOwner()">Cancelar</button>
          </div>
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
  phoneIcon = Phone;
  mailIcon = Mail;
  whatsappIcon = MessageSquare;
  homeIcon = Home;
  copyIcon = Copy;
  query = signal('');
  status = signal('');
  owner = signal('');
  clientSearch = signal('');
  contractSearch = signal('');
  overdueMin = signal('');
  editVisible = false;
  selected?: ClientFollowupRecord;
  createVisible = false;
  commitVisible = false;
  summaryVisible = false;
  emailVisible = false;
  emailSubject = '';
  emailBody = '';
  toEmail = '';
  emailTestMode = false;
  logs = signal<any[]>([]);
  actionVisible = false;
  actionRow?: ClientFollowupRecord;
  actionChannel: string = 'call';
  actionNotes: string = '';
  actionResult: string = 'contacted';
  visitVisible = false;
  visitDate = '';
  visitReason = '';
  visitResult = '';
  visitNotes = '';
  logsExpanded = false;
  logsExpandMap = signal<Record<string, boolean>>({});

  data = signal<ClientFollowupRecord[]>([]);
  
  // Filtros aplicados directamente sobre data()
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const s = this.status().trim();
    const o = this.owner().toLowerCase().trim();
    const cq = this.clientSearch().toLowerCase().trim();
    const kq = this.contractSearch().toLowerCase().trim();
    const om = this.overdueMin().trim();
    return this.data().filter(r => (
      (!q || [r.sale_code, r.client_name, r.dni, r.lot].some(v => (v || '').toLowerCase().includes(q))) &&
      (!s || r.management_status === s) &&
      (!o || (r.owner || '').toLowerCase().includes(o)) &&
      (!cq || (r.client_name || '').toLowerCase().includes(cq) || String(r.client_id || '').includes(cq)) &&
      (!kq || (r.sale_code || '').toLowerCase().includes(kq) || String(r.contract_id || '').includes(kq)) &&
      (!om || (Number(r.overdue_installments || 0) >= Number(om)))
    ));
  });

  columns: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code' },
    { header: 'collections.followups.columns.client_name', tpl: 'clientLink' },
    { header: 'collections.followups.columns.lot', tpl: 'lotLink' },
    { field: 'contract_status', header: 'collections.followups.columns.contract_status' },
    { field: 'advisor_name', header: 'collections.followups.columns.advisor_name' },
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
    { header: 'collections.followups.columns.management_notes', tpl: 'notes', width: '260px' },
    { field: 'home_visit_date', header: 'collections.followups.columns.home_visit_date' },
    { field: 'home_visit_reason', header: 'collections.followups.columns.home_visit_reason' },
    { field: 'home_visit_result', header: 'collections.followups.columns.home_visit_result' },
    { field: 'home_visit_notes', header: 'collections.followups.columns.home_visit_notes', width: '260px' },
    { header: 'collections.followups.columns.management_status', tpl: 'status' },
    { header: 'collections.followups.columns.actions', tpl: 'actions' },
    { header: 'collections.followups.columns.last_contact', tpl: 'lastContact' },
    { field: 'next_action', header: 'collections.followups.columns.next_action' },
    { header: 'collections.followups.columns.owner', tpl: 'owner' },
    { field: 'general_notes', header: 'collections.followups.columns.general_notes', width: '260px' },
    { field: 'general_reason', header: 'collections.followups.columns.general_reason' },
  ];

  templates: Record<string, any> = {};
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;
  @ViewChild('clientLinkTpl') clientLinkTpl!: TemplateRef<any>;
  @ViewChild('lotLinkTpl') lotLinkTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<any>;
  @ViewChild('notesTpl') notesTpl!: TemplateRef<any>;
  @ViewChild('ownerTpl') ownerTpl!: TemplateRef<any>;
  @ViewChild('lastContactTpl') lastContactTpl!: TemplateRef<any>;

  constructor(private followups: ClientFollowupsService, private toast: ToastService, private employeesApi: EmployeeService) {
    this.followups.records$.subscribe(list => this.data.set(list));
    // templates se asignan en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.templates['status'] = this.statusTpl;
    this.templates['clientLink'] = this.clientLinkTpl;
    this.templates['lotLink'] = this.lotLinkTpl;
    this.templates['actions'] = this.actionsTpl;
    this.templates['notes'] = this.notesTpl;
    this.templates['owner'] = this.ownerTpl;
    this.templates['lastContact'] = this.lastContactTpl;
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

  openCommit(id: string): void {
    const found = this.data().find(r => r.sale_code === id);
    if (found) {
      this.selected = found;
      this.commitVisible = true;
    }
  }

  saveCommit(data: {commitment_date: string, commitment_amount: number}) {
    if (!this.selected) return;
    const id = Number(this.selected.followup_id || 0);
    if (!id) {
      this.toast.error('No se puede registrar compromiso: seguimiento sin ID');
      this.commitVisible = false;
      return;
    }
    this.followups.setCommitment(id, data).subscribe({
      next: () => {
        this.toast.success('Compromiso registrado');
        this.commitVisible = false;
      },
      error: () => {
        this.toast.error('Error registrando compromiso');
        this.commitVisible = false;
      }
    });
  }

  logAction(row: ClientFollowupRecord, channel: string, note?: string, resultOverride?: string) {
    const payload = {
      followup_id: (row as any).followup_id as number | undefined,
      client_id: (row as any).client_id as number,
      employee_id: undefined,
      channel,
      result: resultOverride ?? ((channel === 'email') ? 'sent' : (channel === 'letter' ? 'letter_sent' : 'contacted')),
      notes: note ?? (window && typeof window.prompt === 'function' ? (window.prompt('Notas de la gestión:', '') || undefined) : undefined),
    };
    this.followups.logAction(payload).subscribe({
      next: () => {
        this.toast.success('Gestión registrada');
        const fid = (row as any).followup_id;
        const cid = (row as any).client_id;
        this.followups.listLogs({ followup_id: fid, client_id: cid }).subscribe(list => this.logs.set(list));
        // Actualizar fila local - status 'in_progress' y fecha contacto
        const updated = this.data().map(r => {
          const same = ((r as any).followup_id === fid);
          if (!same) return r;
          const stamp = new Date();
          const prefix = `[${stamp.toISOString().slice(0,19).replace('T',' ')} ${channel.toUpperCase()}]`;
          const newNotes = ((r.management_notes ? (r.management_notes + '\n') : '') + prefix + (payload.notes ? (' ' + payload.notes) : '')).trim();
          const newStatus: ClientFollowupRecord['management_status'] =
            (payload.result === 'resolved') ? 'resolved' :
            (payload.result === 'unreachable') ? 'unreachable' :
            (r.management_status === 'resolved') ? 'resolved' : 'in_progress';
          return { ...r, management_status: newStatus, contact_date: stamp.toISOString(), action_taken: channel, management_result: payload.result, management_notes: newNotes } as ClientFollowupRecord;
        });
        this.data.set(updated);
        this.followups.setData(updated);
        this.actionVisible = false;
      },
      error: () => this.toast.error('Error registrando gestión')
    });
  }

  openAction(row: ClientFollowupRecord, channel: string) {
    this.actionRow = row;
    this.actionChannel = channel;
    this.actionNotes = '';
    this.actionResult = channel === 'email' ? 'sent' : (channel === 'letter' ? 'letter_sent' : 'contacted');
    this.actionVisible = true;
  }

  submitAction() {
    if (!this.actionRow) { this.actionVisible = false; return; }
    this.logAction(this.actionRow, this.actionChannel, this.actionNotes, this.actionResult);
  }

  openVisit(row: ClientFollowupRecord) {
    this.actionRow = row;
    this.visitDate = '';
    this.visitReason = '';
    this.visitResult = '';
    this.visitNotes = '';
    this.visitVisible = true;
  }

  submitVisit() {
    if (!this.actionRow) { this.visitVisible = false; return; }
    const fid = (this.actionRow as any).followup_id;
    if (!fid) { this.toast.error('Seguimiento sin ID'); this.visitVisible = false; return; }
    const patch: Partial<ClientFollowupRecord> = {
      home_visit_date: this.visitDate || undefined,
      home_visit_reason: this.visitReason || undefined,
      home_visit_result: this.visitResult || undefined,
      home_visit_notes: this.visitNotes || undefined,
      management_status: (this.visitResult === 'resuelto') ? 'resolved' : 'in_progress'
    };
    this.followups.saveRecordPatch(String(fid), patch).then(() => {
      const updated = this.data().map(r => {
        const same = ((r as any).followup_id === fid);
        if (!same) return r;
        return { ...r, ...patch };
      });
      this.data.set(updated);
      this.followups.setData(updated);
      this.logAction(this.actionRow!, 'home_visit', this.visitNotes, (this.visitResult === 'resuelto') ? 'resolved' : 'contacted');
      this.visitVisible = false;
    }).catch(() => {
      this.toast.error('Error registrando visita');
      this.visitVisible = false;
    });
  }

  openEmail(row: ClientFollowupRecord) {
    this.selected = row;
    const name = row.client_name || 'Cliente';
    const contract = row.sale_code || '';
    const due = row.due_date || '';
    const amount = row.monthly_quota || row.amount_due || 0;
    this.emailSubject = `Aviso de seguimiento de cobranza - ${contract}`;
    this.emailBody = `Estimado(a) ${name},\n\n`+
      `Le contactamos para recordarle su compromiso de pago.\n`+
      (due ? `Fecha de vencimiento: ${due}\n` : '')+
      `Monto referencial: S/ ${amount}.\n\n`+
      `Por favor, si ya realizó el pago omita este mensaje. Caso contrario, contáctenos para coordinar.\n\n`+
      `Atentamente,\nEquipo de Cobranzas Casa Bonita`;
    this.toEmail = row.email || '';
    this.emailTestMode = false;
    this.emailVisible = true;
  }

  openEmailTest(row: ClientFollowupRecord) {
    this.selected = row;
    this.emailSubject = '';
    this.emailBody = '';
    this.toEmail = row.email || '';
    this.emailTestMode = true;
    this.emailVisible = true;
  }

  sendEmail() {
    if (!this.toEmail) {
      this.toast.error('El cliente no tiene correo registrado');
      return;
    }
    const to = this.toEmail.trim();
    const subject = this.emailSubject.trim() || 'Aviso de cobranza';
    const html = this.emailBody.replace(/\n/g, '<br/>');
    this.followups.sendEmail(to, subject, html).subscribe({
      next: () => {
        this.toast.success('Email enviado');
        this.emailVisible = false;
        if (this.selected) {
          this.logAction(this.selected, 'email', `Correo enviado: ${subject}`);
          const fid = (this.selected as any).followup_id;
          const cid = (this.selected as any).client_id;
          this.followups.listLogs({ followup_id: fid, client_id: cid }).subscribe(list => this.logs.set(list));
        }
      },
      error: () => this.toast.error('Error enviando email')
    });
  }

  openEmailTestGlobal() {
    this.selected = undefined;
    this.toEmail = '';
    this.emailSubject = '';
    this.emailBody = '';
    this.emailTestMode = true;
    this.emailVisible = true;
  }

  openSummary(row: ClientFollowupRecord) {
    this.selected = row;
    this.summaryVisible = true;
    const fid = (row as any).followup_id;
    const cid = (row as any).client_id;
    this.followups.listLogs({ followup_id: fid, client_id: cid }).subscribe(list => this.logs.set(list));
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

  clearFilters() {
    this.query.set('');
    this.status.set('');
    this.owner.set('');
    this.clientSearch.set('');
    this.contractSearch.set('');
    this.overdueMin.set('');
  }

  latestNote(notes?: string): string {
    if (!notes) return '—';
    const parts = notes.split('\n').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '—';
  }

  ownerEditId?: number;
  ownerDraft: string = '';
  employees: Employee[] = [];
  ownerSelectedId?: number;

  beginOwnerEdit(row: ClientFollowupRecord) {
    this.ownerEditId = (row as any).followup_id;
    this.ownerDraft = row.owner || '';
    this.ownerSelectedId = undefined;
    if (this.employees.length === 0) {
      this.employeesApi.getAllEmployees().subscribe(res => this.employees = res.data || []);
    }
  }

  cancelOwner() {
    this.ownerEditId = undefined;
    this.ownerDraft = '';
  }

  saveOwner(row: ClientFollowupRecord) {
    const fid = (row as any).followup_id;
    let ownerName = (this.ownerDraft || '').trim();
    let assignedId = this.ownerSelectedId;
    if (assignedId) {
      const emp = this.employees.find(e => e.employee_id === assignedId);
      ownerName = emp?.full_name || ownerName;
    }
    const patch: Partial<ClientFollowupRecord> = { owner: ownerName || undefined, assigned_employee_id: assignedId || undefined };
    this.followups.saveRecordPatch(String(fid), patch).then(() => {
      const updated = this.data().map(r => (((r as any).followup_id === fid) ? { ...r, owner: patch.owner, assigned_employee_id: patch.assigned_employee_id } : r));
      this.data.set(updated as any);
      this.followups.setData(updated as any);
      this.cancelOwner();
      this.toast.success('Responsable actualizado');
    }).catch(() => {
      this.toast.error('Error actualizando responsable');
    });
  }

  displayChannel(ch?: string): string {
    switch ((ch || '').toLowerCase()) {
      case 'call': return 'Llamada';
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'Email';
      case 'letter': return 'Carta';
      case 'home_visit': return 'Visita';
      default: return (ch || 'Gestión');
    }
  }

  channelBadgeClass(ch?: string): string {
    const c = (ch || '').toLowerCase();
    if (c === 'call') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
    if (c === 'whatsapp') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200';
    if (c === 'email') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200';
    if (c === 'letter') return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200';
    if (c === 'home_visit') return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }

  displayResult(r?: string): string {
    switch ((r || '').toLowerCase()) {
      case 'contacted': return 'Contactado';
      case 'sent': return 'Enviado';
      case 'letter_sent': return 'Carta enviada';
      case 'unreachable': return 'No responde';
      case 'resolved': return 'Resuelto';
      default: return r || '—';
    }
  }

  resultBadgeClass(r?: string): string {
    const v = (r || '').toLowerCase();
    if (v === 'resolved') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
    if (v === 'unreachable') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    if (v === 'contacted') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
    if (v === 'sent' || v === 'letter_sent') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }

  countChannel(ch: string): number {
    const c = (ch || '').toLowerCase();
    return this.logs().filter(x => (x.channel || '').toLowerCase() === c).length;
  }

  isExpanded(l: any): boolean {
    const id = String(l.log_id ?? `${l.channel}-${l.logged_at}`);
    return !!this.logsExpandMap()[id];
  }

  toggleExpand(l: any): void {
    const id = String(l.log_id ?? `${l.channel}-${l.logged_at}`);
    const map = { ...this.logsExpandMap() };
    map[id] = !map[id];
    this.logsExpandMap.set(map);
  }

  copyNotes(text?: string): void {
    if (!text) return;
    const t = String(text);
    if (navigator && 'clipboard' in navigator) {
      navigator.clipboard.writeText(t).catch(() => {});
    }
  }
}
