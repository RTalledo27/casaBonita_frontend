import { Component, computed, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
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
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, SharedTableComponent, ClientFollowupEditComponent, FollowupCommitmentComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-sky-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-sky-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="mb-6">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <!-- Title -->
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-indigo-500 to-sky-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ 'collections.followups.title' | translate }}</h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ 'collections.followups.subtitle' | translate }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <div class="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 border border-gray-200/60 dark:border-gray-600/60">
                  <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    [ngClass]="viewMode() === 'compact' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                    (click)="setViewMode('compact')">
                    Vista compacta
                  </button>
                  <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    [ngClass]="viewMode() === 'full' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                    (click)="setViewMode('full')">
                    Vista completa
                  </button>
                </div>

                <button (click)="openCreate()" class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:bg-emerald-900/50">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  {{ 'collections.followups.new' | translate }}
                </button>
                <button (click)="exportExcel()" class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 dark:hover:bg-blue-900/50">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                  {{ 'collections.followups.exportExcel' | translate }}
                </button>
                <button (click)="openEmailTestGlobal()" class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50 dark:hover:bg-purple-900/50">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                  Test Email
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════ KPI CARDS ═══════════════ -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ globalStats().total }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Total seguimientos</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{{ globalStats().pending }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Pendientes</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ globalStats().resolved }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Resueltos</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">{{ globalStats().overdueCases }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Con mora</p>
          </div>
        </div>

        <!-- ═══════════════ TABLE CARD ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">

          <!-- Filter Chips -->
          <div class="p-4 sm:p-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="flex flex-wrap gap-2 mb-3 items-center">
              <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors" [ngClass]="status()==='pending' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'" (click)="status.set('pending')">Pendiente</button>
              <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors" [ngClass]="status()==='in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'" (click)="status.set('in_progress')">En curso</button>
              <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors" [ngClass]="status()==='resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'" (click)="status.set('resolved')">Resuelto</button>
              <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors" [ngClass]="overdueMin()==='1' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'" (click)="overdueMin.set('1')">Vencidas 1+</button>
              <button class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors" [ngClass]="showCommitments()==='pending' ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'" (click)="toggleCommitmentFilter()">Con Compromiso</button>
              <button class="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" (click)="clearFilters()">Limpiar</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
              <div class="relative">
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.search' | translate }}</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input type="text" [ngModel]="query()" (ngModelChange)="query.set($event)" class="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" placeholder="{{ 'collections.followups.filters.searchPlaceholder' | translate }}" />
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.status' | translate }}</label>
                <div class="relative">
                  <select [ngModel]="status()" (ngModelChange)="status.set($event)" class="w-full h-9 px-3 appearance-none pr-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm">
                    <option value="">{{ 'common.all' | translate }}</option>
                    <option value="pending">{{ 'collections.followups.status.pending' | translate }}</option>
                    <option value="in_progress">{{ 'collections.followups.status.in_progress' | translate }}</option>
                    <option value="resolved">{{ 'collections.followups.status.resolved' | translate }}</option>
                    <option value="unreachable">{{ 'collections.followups.status.unreachable' | translate }}</option>
                    <option value="escalated">{{ 'collections.followups.status.escalated' | translate }}</option>
                  </select>
                  <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.owner' | translate }}</label>
                <input type="text" [ngModel]="owner()" (ngModelChange)="owner.set($event)" class="w-full h-9 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" placeholder="Nombre de responsable" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.client' | translate }}</label>
                <input type="text" [ngModel]="clientSearch()" (ngModelChange)="clientSearch.set($event)" class="w-full h-9 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" placeholder="{{ 'collections.followups.filters.clientPlaceholder' | translate }}" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.contract' | translate }}</label>
                <input type="text" [ngModel]="contractSearch()" (ngModelChange)="contractSearch.set($event)" class="w-full h-9 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" placeholder="{{ 'collections.followups.filters.contractPlaceholder' | translate }}" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.filters.overdue' | translate }}</label>
                <div class="relative">
                  <select [ngModel]="overdueMin()" (ngModelChange)="overdueMin.set($event)" class="w-full h-9 px-3 appearance-none pr-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 text-sm">
                    <option value="">{{ 'common.all' | translate }}</option>
                    <option value="0">0+</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                  <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </div>
              </div>
              <div class="flex gap-2">
                <button (click)="clearFilters()" class="px-3 h-9 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-colors">{{ 'common.clearFilters' | translate }}</button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <app-shared-table [columns]="columnsView()" [data]="paged()" [templates]="templates" [componentName]="'followups'" [permissionPrefix]="'collections'" [idField]="'sale_code'" [loading]="loading()"
          (onEdit)="openEdit($event)"></app-shared-table>

          @if (error()) {
            <div class="p-4 text-sm font-semibold text-red-600">{{ error() }}</div>
          }

          <!-- Pagination -->
          <div class="bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-5 py-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <label class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filas</label>
                <div class="relative">
                  <select class="appearance-none pr-8 pl-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold" [ngModel]="perPage()" (ngModelChange)="setPerPage($event)">
                    <option [ngValue]="25">25</option>
                    <option [ngValue]="50">50</option>
                    <option [ngValue]="100">100</option>
                    <option [ngValue]="200">200</option>
                  </select>
                  <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando <span class="font-semibold text-gray-900 dark:text-gray-100">{{ from() }}</span>–<span class="font-semibold text-gray-900 dark:text-gray-100">{{ to() }}</span> de <span class="font-semibold text-gray-900 dark:text-gray-100">{{ filteredCount() }}</span>
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" class="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors" (click)="goToPage(page() - 1)" [disabled]="pageSafe() <= 1">
                  <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="w-9 h-9 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-sm inline-flex items-center justify-center">{{ pageSafe() }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">/ {{ lastPage() }}</span>
                <button type="button" class="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors" (click)="goToPage(page() + 1)" [disabled]="pageSafe() >= lastPage()">
                  <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      <app-client-followup-edit [visible]="editVisible" [record]="selected" (save)="onModalSave($event)" (cancel)="closeEdit()"></app-client-followup-edit>
      <app-followup-commitment [visible]="commitVisible" (save)="saveCommit($event)" (cancel)="commitVisible=false"></app-followup-commitment>
      <ng-template [ngIf]="actionVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="actionVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,34rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Registrar Gestión</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="actionVisible=false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Canal</label>
              <input type="text" [value]="actionChannel" disabled class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Resultado</label>
              <div class="relative">
                <select [(ngModel)]="actionResult" class="w-full appearance-none pr-10 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold">
                  <option value="contacted">Contactado</option>
                  <option value="sent" *ngIf="actionChannel==='email'">Enviado</option>
                  <option value="letter_sent" *ngIf="actionChannel==='letter'">Carta enviada</option>
                  <option value="unreachable">No responde</option>
                  <option value="resolved">Resuelto</option>
                </select>
                <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Notas</label>
              <textarea rows="5" [(ngModel)]="actionNotes" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 font-semibold" (click)="actionVisible=false" [disabled]="actionSaving">Cancelar</button>
              <button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50" (click)="submitAction()" [disabled]="actionSaving">{{ actionSaving ? 'Guardando...' : 'Guardar' }}</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="visitVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="visitVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,34rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Registrar Visita Domiciliaria</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="visitVisible=false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Fecha de visita</label>
              <input type="date" [(ngModel)]="visitDate" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Motivo</label>
              <input type="text" [(ngModel)]="visitReason" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Resultado</label>
              <div class="relative">
                <select [(ngModel)]="visitResult" class="w-full appearance-none pr-10 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold">
                  <option value="">Selecciona...</option>
                  <option value="visita_realizada">Visita realizada</option>
                  <option value="no_encontrado">No encontrado</option>
                  <option value="compromiso_pago">Compromiso de pago</option>
                  <option value="sin_respuesta">Sin respuesta</option>
                  <option value="resuelto">Resuelto</option>
                </select>
                <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Observaciones</label>
              <textarea rows="5" [(ngModel)]="visitNotes" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 font-semibold" (click)="visitVisible=false">Cancelar</button>
              <button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-500/20" (click)="submitVisit()">Guardar</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="emailVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="emailVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,40rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Enviar Email</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="emailVisible=false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Para</label>
              <input type="text" [(ngModel)]="toEmail" [disabled]="!emailTestMode" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Asunto</label>
              <input type="text" [(ngModel)]="emailSubject" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Contenido</label>
              <textarea rows="8" [(ngModel)]="emailBody" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 font-semibold" (click)="emailVisible=false">Cancelar</button>
              <button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-semibold shadow-md shadow-indigo-500/20" (click)="sendEmail()">Enviar</button>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template [ngIf]="summaryVisible">
        <div class="fixed inset-0 bg-black/50 z-40" (click)="summaryVisible=false"></div>
        <div class="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-gray-900 z-50 shadow-2xl border-l border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">{{ 'collections.followups.summary.title' | translate }}</div>
            <div class="flex gap-2">
              <button class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 flex items-center gap-1 text-sm font-semibold" (click)="downloadPersonalReport()">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                Descargar Reporte
              </button>
              <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="summaryVisible=false">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
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
      <ng-template [ngIf]="commitmentManageVisible">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="commitmentManageVisible=false"></div>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,34rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between">
            <div class="text-lg font-semibold">Gestionar Compromiso de Pago</div>
            <button class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="commitmentManageVisible=false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Información del Compromiso</div>
              <div class="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                <div>📅 Fecha comprometida: <strong>{{ commitmentManageRow?.commitment_date | date:'dd/MM/yyyy' }}</strong></div>
                <div>💰 Monto comprometido: <strong>S/ {{ (commitmentManageRow?.commitment_amount || 0) | number:'1.2-2' }}</strong></div>
                <div>👤 Cliente: <strong>{{ commitmentManageRow?.client_name }}</strong></div>
                <div>📄 Contrato: <strong>{{ commitmentManageRow?.sale_code }}</strong></div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acción</label>
              <div class="flex gap-2">
                <button type="button" class="flex-1 px-4 py-3 rounded-lg border-2 transition" 
                        [ngClass]="commitmentAction === 'fulfill' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'"
                        (click)="commitmentAction = 'fulfill'">
                  <div class="text-2xl mb-1">✅</div>
                  <div class="font-semibold">Cumplido</div>
                  <div class="text-xs">El cliente pagó</div>
                </button>
                <button type="button" class="flex-1 px-4 py-3 rounded-lg border-2 transition" 
                        [ngClass]="commitmentAction === 'break' ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'"
                        (click)="commitmentAction = 'break'">
                  <div class="text-2xl mb-1">❌</div>
                  <div class="font-semibold">Incumplido</div>
                  <div class="text-xs">No pagó</div>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
              <textarea rows="3" [(ngModel)]="commitmentManageNotes" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Detalles adicionales sobre el cumplimiento o incumplimiento..."></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" (click)="commitmentManageVisible=false">Cancelar</button>
              <button class="px-4 py-2 rounded-lg text-white" [ngClass]="commitmentAction === 'fulfill' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'" (click)="submitCommitmentManage()">Guardar</button>
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
      <ng-template #debtTpl let-row>
        <div class="flex flex-col gap-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <div class="text-sm font-bold text-rose-700 dark:text-rose-300 truncate">{{ formatCurrency(row.pending_amount || 0) }}</div>
            <span class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1"
              [ngClass]="(row.overdue_installments || 0) > 0
                ? 'bg-rose-100 text-rose-700 ring-rose-200/70 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800/60'
                : 'bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60'">
              Vencidas: {{ row.overdue_installments || 0 }}
            </span>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-300 truncate">
            Vence: <span class="font-semibold text-slate-800 dark:text-slate-100">{{ row.due_date || '—' }}</span>
          </div>
        </div>
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
      <ng-template #commitmentTpl let-row>
        <div *ngIf="row.commitment_date" class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded-full" [ngClass]="{
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200': row.commitment_status === 'pending',
              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200': row.commitment_status === 'fulfilled',
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200': row.commitment_status === 'broken',
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200': !row.commitment_status
            }">
              {{ row.commitment_status === 'fulfilled' ? '✅ Cumplido' : row.commitment_status === 'broken' ? '❌ Incumplido' : '⏳ Pendiente' }}
            </span>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400">
            <div>📅 {{ row.commitment_date | date:'dd/MM/yyyy' }}</div>
            <div>💰 S/ {{ row.commitment_amount | number:'1.2-2' }}</div>
          </div>
          <button *ngIf="row.commitment_status === 'pending' || !row.commitment_status" 
                  class="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900" 
                  (click)="openCommitmentManage(row)">
            Gestionar
          </button>
        </div>
        <span *ngIf="!row.commitment_date" class="text-gray-400 text-xs">Sin compromiso</span>
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
    </div>
  `,
  styleUrls: ['./client-followups.component.scss']
})
export class ClientFollowupsComponent implements AfterViewInit {
  query = signal('');
  status = signal('');
  owner = signal('');
  clientSearch = signal('');
  contractSearch = signal('');
  overdueMin = signal('');
  showCommitments = signal('');
  viewMode = signal<'compact' | 'full'>('compact');
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
  actionSaving = false;
  visitVisible = false;
  visitDate = '';
  visitReason = '';
  visitResult = '';
  visitNotes = '';
  logsExpanded = false;
  logsExpandMap = signal<Record<string, boolean>>({});
  commitmentManageVisible = false;
  commitmentManageRow?: ClientFollowupRecord;
  commitmentAction: 'fulfill' | 'break' = 'fulfill';
  commitmentManageNotes = '';
  loading = signal(false);
  error = signal<string | null>(null);

  data = signal<ClientFollowupRecord[]>([]);
  
  // Filtros aplicados directamente sobre data()
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const s = this.status().trim();
    const o = this.owner().toLowerCase().trim();
    const cq = this.clientSearch().toLowerCase().trim();
    const kq = this.contractSearch().toLowerCase().trim();
    const om = this.overdueMin().trim();
    const sc = this.showCommitments().trim();
    return this.data().filter(r => (
      (!q || [r.sale_code, r.client_name, r.dni, r.lot].some(v => (v || '').toLowerCase().includes(q))) &&
      (!s || r.management_status === s) &&
      (!o || (r.owner || '').toLowerCase().includes(o)) &&
      (!cq || (r.client_name || '').toLowerCase().includes(cq) || String(r.client_id || '').includes(cq)) &&
      (!kq || (r.sale_code || '').toLowerCase().includes(kq) || String(r.contract_id || '').includes(kq)) &&
      (!om || (Number(r.overdue_installments || 0) >= Number(om))) &&
      (!sc || (sc === 'pending' && r.commitment_date && r.commitment_status === 'pending'))
    ));
  });

  page = signal(1);
  perPage = signal(50);
  filteredCount = computed(() => this.filtered().length);
  lastPage = computed(() => Math.max(1, Math.ceil(this.filteredCount() / Math.max(1, this.perPage()))));
  pageSafe = computed(() => Math.min(this.page(), this.lastPage()));
  from = computed(() => (this.filteredCount() ? ((this.pageSafe() - 1) * this.perPage() + 1) : 0));
  to = computed(() => Math.min(this.filteredCount(), this.pageSafe() * this.perPage()));
  paged = computed(() => {
    const start = (this.pageSafe() - 1) * this.perPage();
    const end = start + this.perPage();
    return this.filtered().slice(start, end);
  });

  globalStats = computed(() => {
    const rows = this.data();
    const total = rows.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let overdueCases = 0;
    let pendingCommitments = 0;
    for (const r of rows) {
      if (r.management_status === 'pending') pending += 1;
      if (r.management_status === 'in_progress') inProgress += 1;
      if (r.management_status === 'resolved') resolved += 1;
      if (Number(r.overdue_installments || 0) > 0) overdueCases += 1;
      if ((r as any).commitment_date && (r as any).commitment_status === 'pending') pendingCommitments += 1;
    }
    return { total, pending, inProgress, resolved, overdueCases, pendingCommitments };
  });

  columnsCompact: ColumnDef[] = [
    { field: 'sale_code', header: 'collections.followups.columns.sale_code', width: '110px' },
    { header: 'Cliente', tpl: 'clientLink', width: '260px', translate: false },
    { header: 'Lote', tpl: 'lotLink', width: '160px', translate: false },
    { header: 'Deuda', tpl: 'debt', width: '220px', translate: false },
    { header: 'Gestión', tpl: 'status', width: '220px', translate: false },
    { header: 'Acciones', tpl: 'actions', width: '170px', translate: false, align: 'right' },
  ];

  columnsView = computed<ColumnDef[]>(() => {
    if (this.viewMode() === 'compact') return this.columnsCompact;
    return this.columns;
  });

  setPerPage(value: any) {
    const n = Number(value) || 50;
    this.perPage.set(Math.max(1, n));
    this.page.set(1);
  }

  goToPage(nextPage: number) {
    const safe = Math.max(1, Math.min(this.lastPage(), nextPage));
    this.page.set(safe);
  }

  setViewMode(mode: 'compact' | 'full') {
    this.viewMode.set(mode);
  }

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
    { header: 'collections.followups.columns.commitment', tpl: 'commitment' },
    { field: 'general_notes', header: 'collections.followups.columns.general_notes', width: '260px' },
    { field: 'general_reason', header: 'collections.followups.columns.general_reason' },
  ];

  templates: Record<string, any> = {};
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;
  @ViewChild('clientLinkTpl') clientLinkTpl!: TemplateRef<any>;
  @ViewChild('lotLinkTpl') lotLinkTpl!: TemplateRef<any>;
  @ViewChild('debtTpl') debtTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<any>;
  @ViewChild('notesTpl') notesTpl!: TemplateRef<any>;
  @ViewChild('ownerTpl') ownerTpl!: TemplateRef<any>;
  @ViewChild('lastContactTpl') lastContactTpl!: TemplateRef<any>;
  @ViewChild('commitmentTpl') commitmentTpl!: TemplateRef<any>;

  constructor(private followups: ClientFollowupsService, private toast: ToastService, private employeesApi: EmployeeService) {
    this.followups.records$.subscribe(list => this.data.set(list));
    // templates se asignan en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.templates['status'] = this.statusTpl;
    this.templates['clientLink'] = this.clientLinkTpl;
    this.templates['lotLink'] = this.lotLinkTpl;
    this.templates['debt'] = this.debtTpl;
    this.templates['actions'] = this.actionsTpl;
    this.templates['notes'] = this.notesTpl;
    this.templates['owner'] = this.ownerTpl;
    this.templates['lastContact'] = this.lastContactTpl;
    this.templates['commitment'] = this.commitmentTpl;
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.followups.list().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar seguimientos');
      }
    });
  }

  formatCurrency(amount: any): string {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value);
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
      next: (res: any) => {
        // Actualizar el registro local con los datos del compromiso
        const updated = this.data().map(r => {
          const same = ((r as any).followup_id === id);
          if (!same) return r;
          return { 
            ...r, 
            commitment_date: data.commitment_date,
            commitment_amount: data.commitment_amount,
            commitment_status: 'pending',
            management_status: 'in_progress'
          } as ClientFollowupRecord;
        });
        this.data.set(updated);
        this.followups.setData(updated);
        
        // Registrar la acción en el log
        this.logAction(this.selected!, 'commitment', `Compromiso de pago registrado: S/ ${data.commitment_amount} para el ${data.commitment_date}`, 'contacted');
        
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
        this.actionSaving = false;
      },
      error: () => {
        this.toast.error('Error registrando gestión');
        this.actionSaving = false;
      }
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
    if (!this.actionRow || this.actionSaving) { return; }
    this.actionSaving = true;
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
    this.showCommitments.set('');
  }

  toggleCommitmentFilter() {
    if (this.showCommitments() === 'pending') {
      this.showCommitments.set('');
    } else {
      this.showCommitments.set('pending');
    }
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

  downloadPersonalReport(): void {
    if (!this.selected) {
      this.toast.error('No hay registro seleccionado');
      return;
    }
    this.followups.exportPersonalReport(this.selected).then(() => {
      this.toast.success('Reporte descargado');
    }).catch(() => {
      this.toast.error('Error al generar reporte');
    });
  }

  openCommitmentManage(row: ClientFollowupRecord): void {
    this.commitmentManageRow = row;
    this.commitmentAction = 'fulfill';
    this.commitmentManageNotes = '';
    this.commitmentManageVisible = true;
  }

  submitCommitmentManage(): void {
    if (!this.commitmentManageRow) {
      this.commitmentManageVisible = false;
      return;
    }

    const fid = (this.commitmentManageRow as any).followup_id;
    if (!fid) {
      this.toast.error('Seguimiento sin ID');
      this.commitmentManageVisible = false;
      return;
    }

    const status = this.commitmentAction === 'fulfill' ? 'fulfilled' : 'broken';
    const patch: Partial<ClientFollowupRecord> = {
      commitment_status: status,
      commitment_notes: this.commitmentManageNotes || undefined,
      commitment_fulfilled_date: this.commitmentAction === 'fulfill' ? new Date().toISOString() : undefined,
      management_status: this.commitmentAction === 'fulfill' ? 'resolved' : 'in_progress'
    };

    this.followups.saveRecordPatch(String(fid), patch).then(() => {
      const updated = this.data().map(r => {
        const same = ((r as any).followup_id === fid);
        if (!same) return r;
        return { ...r, ...patch };
      });
      this.data.set(updated);
      this.followups.setData(updated);
      
      // Registrar la acción en el log
      const logNote = this.commitmentAction === 'fulfill' 
        ? `Compromiso cumplido: S/ ${this.commitmentManageRow?.commitment_amount || 0}. ${this.commitmentManageNotes || ''}`.trim()
        : `Compromiso incumplido. ${this.commitmentManageNotes || ''}`.trim();
      
      this.logAction(this.commitmentManageRow!, 'commitment', logNote, status === 'fulfilled' ? 'resolved' : 'unreachable');
      
      this.toast.success(this.commitmentAction === 'fulfill' ? 'Compromiso marcado como cumplido' : 'Compromiso marcado como incumplido');
      this.commitmentManageVisible = false;
    }).catch(() => {
      this.toast.error('Error actualizando compromiso');
      this.commitmentManageVisible = false;
    });
  }
}
