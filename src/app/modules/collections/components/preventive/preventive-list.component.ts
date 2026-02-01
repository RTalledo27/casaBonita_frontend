import { Component, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedTableComponent, ColumnDef } from '../../../../shared/components/shared-table/shared-table.component';
import { ClientFollowupsService } from '../../services/client-followups.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, MessageSquare, Phone, Mail, MoreVertical, Send, FileText, Calendar, CheckCircle2, Ban, X } from 'lucide-angular';

@Component({
  selector: 'app-preventive-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule, SharedTableComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div class="max-w-[1400px] mx-auto">
        <div class="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl mb-6">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"></div>
          <div class="p-6 sm:p-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-lg">
                  <span class="text-xl">⚠️</span>
                </div>
                <div class="min-w-0">
                  <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate">Gestión Preventiva</h1>
                  <p class="text-gray-600 dark:text-gray-400">Pagos próximos a vencer · Contacto anticipado</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/70 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                  Ventana: {{ window }} días
                </span>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/70 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                  Rango: {{ getRangeLabel() }}
                </span>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 ring-1 ring-amber-200/70 dark:ring-amber-800/60">
                  Casos: {{ rows.length }}
                </span>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 ring-1 ring-rose-200/70 dark:ring-rose-800/60">
                  Sin seguimiento: {{ countWithoutFollowup() }}
                </span>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 ring-1 ring-emerald-200/70 dark:ring-emerald-800/60">
                  Monto total: {{ formatCurrency(sumAmount(rows)) }}
                </span>
              </div>

              <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Esta vista muestra cuotas próximas a vencer para gestionar antes de que entren en mora.
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div class="inline-flex rounded-2xl bg-gray-100 dark:bg-gray-700/60 p-1 border border-gray-200/60 dark:border-gray-600/60">
                <button type="button" class="px-3 py-2 rounded-xl text-sm font-semibold"
                  [ngClass]="viewMode === 'compact' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                  (click)="viewMode = 'compact'">
                  Vista compacta
                </button>
                <button type="button" class="px-3 py-2 rounded-xl text-sm font-semibold"
                  [ngClass]="viewMode === 'full' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                  (click)="viewMode = 'full'">
                  Vista completa
                </button>
              </div>

              <div class="flex items-center gap-2 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/30 px-3 py-2">
                <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">Días</div>
                <div class="flex items-center gap-2">
                  <button type="button" class="px-2 py-1 rounded-xl text-xs font-semibold bg-amber-100 text-amber-700" (click)="setWindow(7)">7</button>
                  <button type="button" class="px-2 py-1 rounded-xl text-xs font-semibold bg-amber-100 text-amber-700" (click)="setWindow(15)">15</button>
                  <button type="button" class="px-2 py-1 rounded-xl text-xs font-semibold bg-amber-100 text-amber-700" (click)="setWindow(30)">30</button>
                  <input type="number" min="1" max="90" class="w-20 h-9 px-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 font-semibold text-center" [(ngModel)]="window" />
                </div>
              </div>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-2xl shadow-lg transition font-semibold disabled:opacity-50"
                (click)="load()"
                [disabled]="loading"
              >
                {{ loading ? 'Cargando...' : 'Actualizar' }}
              </button>
            </div>
          </div>
        </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Buscar</label>
            <input
              type="text"
              [(ngModel)]="search"
              (ngModelChange)="applyFilters()"
              class="w-full h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm"
              placeholder="Cliente, lote, teléfono, email, contrato..."
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <input type="checkbox" class="h-4 w-4 rounded border-gray-300" [(ngModel)]="onlyWithoutFollowup" (ngModelChange)="applyFilters()" />
              Solo sin seguimiento
            </label>
          </div>
          <div class="flex items-center justify-end gap-3">
            <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">Filas</label>
            <select class="px-3 h-10 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 font-semibold" [(ngModel)]="perPage" (ngModelChange)="setPerPage($event)">
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
              <option [ngValue]="200">200</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <app-shared-table [columns]="columnsView()" [data]="pagedRows" [templates]="templates" [componentName]="'preventive'" [permissionPrefix]="'collections'" [idField]="'sale_code'" [loading]="loading"></app-shared-table>
        <div *ngIf="error" class="p-4 text-sm font-semibold text-red-600">{{ error }}</div>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border-t border-gray-200/60 dark:border-gray-700/60">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Mostrando <span class="font-semibold text-gray-900 dark:text-gray-100">{{ from }}</span> - <span class="font-semibold text-gray-900 dark:text-gray-100">{{ to }}</span>
            de <span class="font-semibold text-gray-900 dark:text-gray-100">{{ total }}</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold disabled:opacity-50" (click)="goToPage(page - 1)" [disabled]="page <= 1 || loading">
              Anterior
            </button>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Página <span class="text-gray-900 dark:text-gray-100">{{ page }}</span> / <span class="text-gray-900 dark:text-gray-100">{{ lastPage }}</span>
            </div>
            <button type="button" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold disabled:opacity-50" (click)="goToPage(page + 1)" [disabled]="page >= lastPage || loading">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <ng-template #clientTpl let-row>
        <div class="flex flex-col min-w-0">
          <a [routerLink]="['/crm/clients', row.client_id]" class="text-blue-700 dark:text-blue-300 font-semibold hover:underline truncate">{{ row.client_name }}</a>
          <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate">Cod: {{ row.sale_code || '—' }} · Contrato: {{ row.contract_id || '—' }}</div>
        </div>
      </ng-template>
      
      <ng-template #lotTpl let-row>
        <a *ngIf="row.lot_id" [routerLink]="['/inventory/lots', row.lot_id]" class="text-indigo-700 dark:text-indigo-300 font-semibold hover:underline">{{ row.lot }}</a>
        <span *ngIf="!row.lot_id" class="text-slate-500">{{ row.lot || '—' }}</span>
      </ng-template>

      <ng-template #contactTpl let-row>
        <div class="flex flex-col gap-1">
          <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ row.phone1 || '—' }}</div>
          <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ row.email || '—' }}</div>
        </div>
      </ng-template>

      <ng-template #dueTpl let-row>
        <div class="flex flex-col gap-1">
          <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ row.due_date ? (row.due_date | date:'dd/MM/yyyy') : '—' }}</div>
          <span class="inline-flex items-center w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1"
            [ngClass]="(row.days_until_due || 0) <= 3
              ? 'bg-rose-100 text-rose-700 ring-rose-200/70 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800/60'
              : (row.days_until_due || 0) <= 7
                ? 'bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/60'
                : 'bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800/60'">
            {{ row.days_until_due || 0 }} días
          </span>
        </div>
      </ng-template>

      <ng-template #quotaTpl let-row>
        <div class="text-sm font-bold text-emerald-700 dark:text-emerald-300">{{ formatCurrency(row.monthly_quota || 0) }}</div>
      </ng-template>

      <ng-template #statusTpl let-row>
        <div class="flex flex-wrap items-center gap-2">
          <span *ngIf="row.has_followup" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            En seguimiento
          </span>
          <span *ngIf="!row.has_followup" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
            Sin seguimiento
          </span>

          <span *ngIf="row.commitment_date && row.commitment_status === 'pending'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            Compromiso: {{ row.commitment_date | date:'dd/MM' }} · {{ formatCurrency(row.commitment_amount || 0) }}
          </span>

          <a *ngIf="row.has_followup" [routerLink]="['/collections/client-followups', row.followup_id]" class="text-blue-600 hover:underline text-xs font-semibold" title="Ver seguimiento">
            Ver
          </a>
        </div>
      </ng-template>

      <ng-template #actionsTpl let-row>
        <div class="flex items-center justify-end gap-2 relative" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
            [disabled]="isRowLoading(row)"
            (click)="runQuick(row, 'whatsapp')"
            title="Enviar WhatsApp (mensaje por defecto)"
          >
            <lucide-angular [img]="whatsappIcon" [size]="18"></lucide-angular>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50"
            [disabled]="isRowLoading(row)"
            (click)="openActionModal(row, 'call')"
            title="Registrar llamada"
          >
            <lucide-angular [img]="phoneIcon" [size]="18"></lucide-angular>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow disabled:opacity-50"
            [disabled]="isRowLoading(row)"
            (click)="openCommitmentModal(row)"
            title="Compromiso de pago"
          >
            <lucide-angular [img]="calendarIcon" [size]="18"></lucide-angular>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow disabled:opacity-50"
            [disabled]="isRowLoading(row)"
            (click)="toggleMenu(row)"
            title="Más acciones"
          >
            <lucide-angular [img]="moreIcon" [size]="18"></lucide-angular>
          </button>

          <div *ngIf="menuKey === rowKey(row)" class="absolute right-0 top-11 w-64 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden z-50">
            <button type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="openActionModal(row, 'whatsapp')">
              <lucide-angular [img]="whatsappIcon" [size]="18"></lucide-angular>
              WhatsApp (personalizar)
            </button>
            <button type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="openActionModal(row, 'sms')">
              <lucide-angular [img]="sendIcon" [size]="18"></lucide-angular>
              SMS (personalizar)
            </button>
            <button type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="openActionModal(row, 'email')">
              <lucide-angular [img]="mailIcon" [size]="18"></lucide-angular>
              Email (personalizar)
            </button>
            <button type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="openCommitmentModal(row)">
              <lucide-angular [img]="calendarIcon" [size]="18"></lucide-angular>
              Compromiso de pago
            </button>
            <button *ngIf="row.commitment_date && row.commitment_status === 'pending' && row.has_followup" type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="markCommitmentFulfilled(row)">
              <lucide-angular [img]="checkIcon" [size]="18"></lucide-angular>
              Marcar compromiso cumplido
            </button>
            <button *ngIf="row.commitment_date && row.commitment_status === 'pending' && row.has_followup" type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="cancelCommitment(row)">
              <lucide-angular [img]="cancelIcon" [size]="18"></lucide-angular>
              Cancelar compromiso
            </button>
            <button type="button" class="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" (click)="openActionModal(row, 'letter')">
              <lucide-angular [img]="letterIcon" [size]="18"></lucide-angular>
              Registrar carta
            </button>
          </div>
        </div>
      </ng-template>
      
      <ng-template [ngIf]="actionVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="closeActionModal()"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,44rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-900 dark:to-orange-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Registrar acción</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="closeActionModal()">
              <lucide-angular [img]="closeIcon" [size]="18"></lucide-angular>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Canal</label>
                <select [(ngModel)]="actionChannel" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 font-semibold">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="call">Llamada</option>
                  <option value="letter">Carta</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Resultado</label>
                <select [(ngModel)]="actionResult" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 font-semibold">
                  <option value="sent">Enviado</option>
                  <option value="contacted">Contactado</option>
                  <option value="unreachable">No responde</option>
                  <option value="resolved">Resuelto</option>
                  <option value="failed">Falló</option>
                </select>
              </div>
            </div>

            <div *ngIf="actionChannel === 'email'">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
              <input type="text" [(ngModel)]="actionSubject" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Recordatorio de Pago - Casa Bonita" />
            </div>

            <div *ngIf="actionChannel === 'whatsapp' || actionChannel === 'sms' || actionChannel === 'email'">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
              <textarea rows="4" [(ngModel)]="actionMessage" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Escribe el mensaje..."></textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas (se guardan en el historial)</label>
              <textarea rows="3" [(ngModel)]="actionNotes" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Ej: cliente confirma pago mañana a las 6pm..."></textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button type="button" class="px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 font-semibold" (click)="closeActionModal()" [disabled]="actionSaving">
                Cancelar
              </button>
              <button type="button" class="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50" (click)="submitActionModal()" [disabled]="actionSaving">
                {{ actionSaving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </ng-template>

      <ng-template [ngIf]="commitmentVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="closeCommitmentModal()"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,44rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-900 dark:to-orange-900 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Compromiso de pago</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="closeCommitmentModal()">
              <lucide-angular [img]="closeIcon" [size]="18"></lucide-angular>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-4">
              <div class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{{ commitmentRow?.client_name || 'Cliente' }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-300 truncate">
                {{ commitmentRow?.lot || '—' }} · Vence: {{ commitmentRow?.due_date ? (commitmentRow.due_date | date:'dd/MM/yyyy') : '—' }} · Cuota: {{ formatCurrency(commitmentRow?.monthly_quota || 0) }}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha compromiso</label>
                <input type="date" [(ngModel)]="commitmentDate" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                <input type="number" step="0.01" [(ngModel)]="commitmentAmount" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 font-semibold" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas (opcional)</label>
              <textarea rows="3" [(ngModel)]="commitmentNotes" class="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Ej: se compromete a pagar por transferencia mañana antes de las 5pm."></textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button type="button" class="px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 font-semibold" (click)="closeCommitmentModal()" [disabled]="commitmentSaving">
                Cancelar
              </button>
              <button type="button" class="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50" (click)="submitCommitment()" [disabled]="commitmentSaving">
                {{ commitmentSaving ? 'Guardando...' : 'Guardar compromiso' }}
              </button>
            </div>
          </div>
        </div>
      </ng-template>
      </div>
  `,
})
export class PreventiveListComponent {
  @ViewChild('actionsTpl', { static: false }) actionsTpl!: TemplateRef<any>;
  @ViewChild('clientTpl', { static: false }) clientTpl!: TemplateRef<any>;
  @ViewChild('lotTpl', { static: false }) lotTpl!: TemplateRef<any>;
  @ViewChild('contactTpl', { static: false }) contactTpl!: TemplateRef<any>;
  @ViewChild('dueTpl', { static: false }) dueTpl!: TemplateRef<any>;
  @ViewChild('quotaTpl', { static: false }) quotaTpl!: TemplateRef<any>;
  
  window = 15;
  rows: any[] = [];
  viewRows: any[] = [];
  pagedRows: any[] = [];
  search = '';
  onlyWithoutFollowup = false;
  loading = false;
  error: string | null = null;
  viewMode: 'compact' | 'full' = 'compact';
  menuKey: string | null = null;
  rowLoading: Record<string, boolean> = {};
  actionVisible = false;
  actionRow: any | null = null;
  actionChannel: 'whatsapp' | 'sms' | 'email' | 'call' | 'letter' = 'call';
  actionMessage = '';
  actionSubject = '';
  actionNotes = '';
  actionResult: 'sent' | 'contacted' | 'unreachable' | 'resolved' | 'failed' = 'contacted';
  actionSaving = false;
  commitmentVisible = false;
  commitmentRow: any | null = null;
  commitmentDate = '';
  commitmentAmount: any = '';
  commitmentNotes = '';
  commitmentSaving = false;

  whatsappIcon = MessageSquare;
  phoneIcon = Phone;
  mailIcon = Mail;
  moreIcon = MoreVertical;
  sendIcon = Send;
  letterIcon = FileText;
  calendarIcon = Calendar;
  checkIcon = CheckCircle2;
  cancelIcon = Ban;
  closeIcon = X;
  perPage = 50;
  page = 1;
  total = 0;
  lastPage = 1;
  from = 0;
  to = 0;
  columnsCompact: ColumnDef[] = [
    { header: 'Cliente', tpl: 'client', width: '320px', translate: false },
    { header: 'Lote', tpl: 'lot', width: '160px', translate: false },
    { header: 'Contacto', tpl: 'contact', width: '220px', translate: false },
    { header: 'Vence', tpl: 'due', width: '160px', translate: false },
    { header: 'Cuota', tpl: 'quota', width: '140px', translate: false, align: 'right' },
    { header: 'Estado', tpl: 'status', width: '170px', translate: false },
    { header: 'Acciones', tpl: 'actions', width: '180px', translate: false, align: 'right' },
  ];

  columnsFull: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code', width: '120px' },
    { header: 'collections.followups.columns.client_name', tpl: 'client', width: '260px' },
    { header: 'collections.followups.columns.lot', tpl: 'lot', width: '140px' },
    { header: 'collections.followups.columns.phone1', tpl: 'contact', width: '220px' },
    { header: 'collections.followups.columns.due_date', tpl: 'due', width: '160px' },
    { header: 'collections.followups.columns.monthly_quota', tpl: 'quota', align: 'right', width: '140px' },
    { header: 'Estado', tpl: 'status', width: '150px', translate: false },
    { header: 'common.actions', tpl: 'actions', width: '200px' },
  ];
  templates: Record<string, any> = {};

  columnsView(): ColumnDef[] {
    return this.viewMode === 'compact' ? this.columnsCompact : this.columnsFull;
  }
  
  constructor(
    private svc: ClientFollowupsService,
    private toast: ToastService
  ) {}
  
  @ViewChild('statusTpl', { static: false }) statusTpl!: TemplateRef<any>;
  
  ngAfterViewInit() {
    this.templates['client'] = this.clientTpl;
    this.templates['lot'] = this.lotTpl;
    this.templates['contact'] = this.contactTpl;
    this.templates['due'] = this.dueTpl;
    this.templates['quota'] = this.quotaTpl;
    this.templates['status'] = this.statusTpl;
    this.templates['actions'] = this.actionsTpl;
  }
  
  ngOnInit(){ this.load(); }
  
  load(){ 
    this.loading = true;
    this.error = null;
    this.svc.listPreventive(this.window).subscribe({
      next: (d) => {
        this.rows = Array.isArray(d) ? d : [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.applyFilters();
        this.loading = false;
        this.error = 'No se pudo cargar preventivo';
        this.toast.error('No se pudo cargar preventivo');
      }
    });
  }

  applyFilters() {
    const q = (this.search || '').toLowerCase().trim();
    this.viewRows = this.rows.filter((r) => {
      if (this.onlyWithoutFollowup && r.has_followup) return false;
      if (!q) return true;
      const hay = [
        r.client_name,
        r.sale_code,
        r.lot,
        r.phone1,
        r.email,
        r.contract_id,
        r.followup_id,
      ].filter((v: any) => v !== null && v !== undefined).map((v: any) => String(v).toLowerCase()).join(' | ');
      return hay.includes(q);
    });
    this.viewRows.sort((a, b) => (Number(a.days_until_due || 0) - Number(b.days_until_due || 0)));
    this.total = this.viewRows.length;
    this.lastPage = Math.max(1, Math.ceil(this.total / Math.max(1, this.perPage)));
    this.page = Math.min(this.page, this.lastPage);
    this.slicePage();
  }

  setPerPage(value: any) {
    const n = Number(value) || 50;
    this.perPage = Math.max(1, n);
    this.page = 1;
    this.applyFilters();
  }

  goToPage(next: number) {
    const safe = Math.max(1, Math.min(this.lastPage, next));
    if (safe === this.page) return;
    this.page = safe;
    this.slicePage();
  }

  private slicePage() {
    const start = (this.page - 1) * this.perPage;
    const end = start + this.perPage;
    this.pagedRows = this.viewRows.slice(start, end);
    this.from = this.total ? start + 1 : 0;
    this.to = Math.min(this.total, end);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(Number(amount || 0));
  }

  rowKey(row: any): string {
    return String(row?.sale_code || row?.contract_id || row?.client_id || Math.random());
  }

  isRowLoading(row: any): boolean {
    return !!this.rowLoading[this.rowKey(row)];
  }

  toggleMenu(row: any) {
    const key = this.rowKey(row);
    this.menuKey = this.menuKey === key ? null : key;
  }

  @HostListener('document:click')
  onDocClick() {
    this.menuKey = null;
  }

  runQuick(row: any, channel: 'whatsapp' | 'sms' | 'email') {
    const id = row.followup_id || row.contract_id;
    if (!id) {
      this.toast.error('No se puede ejecutar la acción sin followup_id/contract_id');
      return;
    }
    const useContractId = !row.followup_id;
    const key = this.rowKey(row);
    this.rowLoading[key] = true;
    const req$ = channel === 'whatsapp'
      ? this.svc.sendWhatsApp(id, undefined, useContractId)
      : channel === 'sms'
        ? this.svc.sendSMS(id, undefined, useContractId)
        : this.svc.sendEmailAction(id, undefined, undefined, useContractId);
    req$.subscribe({
      next: (res: any) => {
        this.rowLoading[key] = false;
        this.menuKey = null;
        const followup = res?.data?.followup;
        if (followup?.followup_id) {
          row.has_followup = 1;
          row.followup_id = followup.followup_id;
        }
        this.toast.success(res?.message || 'Acción ejecutada');
        this.applyFilters();
      },
      error: (err: any) => {
        this.rowLoading[key] = false;
        this.menuKey = null;
        this.toast.error('Error al ejecutar acción: ' + (err?.error?.message || err?.message || ''));
      }
    });
  }

  openActionModal(row: any, channel: 'whatsapp' | 'sms' | 'email' | 'call' | 'letter') {
    this.menuKey = null;
    this.actionVisible = true;
    this.actionRow = row;
    this.actionChannel = channel;
    this.actionMessage = '';
    this.actionSubject = '';
    this.actionNotes = '';
    this.actionResult = channel === 'call' ? 'contacted' : 'sent';
  }

  closeActionModal() {
    if (this.actionSaving) return;
    this.actionVisible = false;
    this.actionRow = null;
  }

  submitActionModal() {
    const row = this.actionRow;
    if (!row) return;
    const id = row.followup_id || row.contract_id;
    if (!id) {
      this.toast.error('No se puede ejecutar la acción sin followup_id/contract_id');
      return;
    }
    const useContractId = !row.followup_id;
    const key = this.rowKey(row);
    this.actionSaving = true;
    this.rowLoading[key] = true;

    this.svc.quickAction(
      id,
      this.actionChannel,
      this.actionMessage || undefined,
      this.actionChannel === 'email' ? (this.actionSubject || undefined) : undefined,
      useContractId,
      { notes: this.actionNotes || undefined, result: this.actionResult || undefined }
    ).subscribe({
      next: (res: any) => {
        this.actionSaving = false;
        this.rowLoading[key] = false;
        const followup = res?.data?.followup;
        if (followup?.followup_id) {
          row.has_followup = 1;
          row.followup_id = followup.followup_id;
        }
        this.toast.success(res?.message || 'Acción registrada');
        this.closeActionModal();
        this.applyFilters();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.rowLoading[key] = false;
        this.toast.error('Error al ejecutar acción: ' + (err?.error?.message || err?.message || ''));
      }
    });
  }

  markCommitmentFulfilled(row: any) {
    if (!row?.followup_id) {
      this.toast.error('No hay seguimiento para marcar el compromiso');
      return;
    }
    const ok = confirm('¿Marcar este compromiso como CUMPLIDO? Úsalo solo si el pago ya fue confirmado.');
    if (!ok) return;
    const key = this.rowKey(row);
    this.rowLoading[key] = true;
    this.svc.setCommitmentStatus(Number(row.followup_id), 'fulfilled').subscribe({
      next: (res: any) => {
        this.rowLoading[key] = false;
        const updated = res?.data;
        if (updated) {
          row.commitment_status = updated.commitment_status;
          row.management_status = updated.management_status;
        } else {
          row.commitment_status = 'fulfilled';
          row.management_status = 'resolved';
        }
        this.svc.logAction({
          followup_id: Number(row.followup_id),
          client_id: Number(row.client_id),
          channel: 'commitment',
          result: 'fulfilled',
          notes: 'Compromiso marcado como cumplido',
        }).subscribe({ next: () => {}, error: () => {} });
        this.toast.success('Compromiso marcado como cumplido');
        this.menuKey = null;
        this.applyFilters();
      },
      error: (err: any) => {
        this.rowLoading[key] = false;
        this.toast.error('No se pudo actualizar el compromiso: ' + (err?.error?.message || err?.message || ''));
      }
    });
  }

  cancelCommitment(row: any) {
    if (!row?.followup_id) {
      this.toast.error('No hay seguimiento para cancelar el compromiso');
      return;
    }
    const ok = confirm('¿Cancelar este compromiso? Se limpiará fecha y monto.');
    if (!ok) return;
    const key = this.rowKey(row);
    this.rowLoading[key] = true;
    this.svc.setCommitmentStatus(Number(row.followup_id), 'cancelled').subscribe({
      next: (res: any) => {
        this.rowLoading[key] = false;
        const updated = res?.data;
        row.commitment_date = updated?.commitment_date ?? null;
        row.commitment_amount = updated?.commitment_amount ?? null;
        row.commitment_status = updated?.commitment_status ?? 'cancelled';
        row.management_status = updated?.management_status ?? row.management_status;
        this.svc.logAction({
          followup_id: Number(row.followup_id),
          client_id: Number(row.client_id),
          channel: 'commitment',
          result: 'cancelled',
          notes: 'Compromiso cancelado',
        }).subscribe({ next: () => {}, error: () => {} });
        this.toast.success('Compromiso cancelado');
        this.menuKey = null;
        this.applyFilters();
      },
      error: (err: any) => {
        this.rowLoading[key] = false;
        this.toast.error('No se pudo cancelar el compromiso: ' + (err?.error?.message || err?.message || ''));
      }
    });
  }

  openCommitmentModal(row: any) {
    this.menuKey = null;
    this.commitmentVisible = true;
    this.commitmentRow = row;
    const due = this.toDateInput(row?.due_date);
    this.commitmentDate = due || this.toDateInput(new Date().toISOString());
    const amt = Number(row?.monthly_quota || 0);
    this.commitmentAmount = amt ? amt : '';
    this.commitmentNotes = '';
  }

  closeCommitmentModal() {
    if (this.commitmentSaving) return;
    this.commitmentVisible = false;
    this.commitmentRow = null;
  }

  submitCommitment() {
    const row = this.commitmentRow;
    if (!row) return;
    if (!this.commitmentDate) {
      this.toast.error('La fecha de compromiso es requerida');
      return;
    }
    const amount = Number(this.commitmentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.toast.error('El monto del compromiso debe ser mayor a 0');
      return;
    }

    const key = this.rowKey(row);
    this.commitmentSaving = true;
    this.rowLoading[key] = true;

    const ensure$ = row.followup_id
      ? null
      : (row.contract_id ? this.svc.ensureFromContract(Number(row.contract_id)) : null);

    const proceed = (followupId: number, clientId: number) => {
      this.svc.setCommitment(followupId, { commitment_date: this.commitmentDate, commitment_amount: amount }).subscribe({
        next: (res: any) => {
          const updated = res?.data;
          if (updated) {
            row.has_followup = 1;
            row.followup_id = updated.followup_id;
            row.commitment_date = updated.commitment_date;
            row.commitment_amount = updated.commitment_amount;
            row.commitment_status = updated.commitment_status;
          }
          this.svc.logAction({
            followup_id: followupId,
            client_id: clientId,
            channel: 'commitment',
            result: 'pending',
            notes: this.commitmentNotes || undefined,
          }).subscribe({ next: () => {}, error: () => {} });

          this.toast.success('Compromiso registrado');
          this.commitmentSaving = false;
          this.rowLoading[key] = false;
          this.closeCommitmentModal();
          this.applyFilters();
        },
        error: (err: any) => {
          this.commitmentSaving = false;
          this.rowLoading[key] = false;
          this.toast.error('No se pudo registrar el compromiso: ' + (err?.error?.message || err?.message || ''));
        }
      });
    };

    if (ensure$) {
      ensure$.subscribe({
        next: (res: any) => {
          const followup = res?.data?.followup;
          if (followup?.followup_id) {
            row.has_followup = 1;
            row.followup_id = followup.followup_id;
            proceed(followup.followup_id, Number(followup.client_id || row.client_id));
          } else {
            this.commitmentSaving = false;
            this.rowLoading[key] = false;
            this.toast.error('No se pudo crear/encontrar el seguimiento');
          }
        },
        error: (err: any) => {
          this.commitmentSaving = false;
          this.rowLoading[key] = false;
          this.toast.error('No se pudo crear/encontrar el seguimiento: ' + (err?.error?.message || err?.message || ''));
        }
      });
    } else {
      if (!row.followup_id) {
        this.commitmentSaving = false;
        this.rowLoading[key] = false;
        this.toast.error('No se puede registrar compromiso sin contrato/seguimiento');
        return;
      }
      proceed(Number(row.followup_id), Number(row.client_id));
    }
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  setWindow(days: number) {
    const safe = Math.max(1, Math.min(90, Number(days) || 15));
    this.window = safe;
    this.load();
  }

  sumAmount(list: any[]): number {
    return (list || []).reduce((sum, row) => sum + (Number(row.monthly_quota || 0)), 0);
  }

  countWithoutFollowup(): number {
    return (this.rows || []).reduce((sum, r) => sum + (!r.has_followup ? 1 : 0), 0);
  }

  getRangeLabel(): string {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + (Number(this.window) || 0));
    return `${start.toLocaleDateString('es-PE')} → ${end.toLocaleDateString('es-PE')}`;
  }

}
