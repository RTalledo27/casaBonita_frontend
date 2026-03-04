import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { PaymentSchedule, ContractSummary, MarkPaymentPaidRequest } from '../../models/payment-schedule';

@Component({
  selector: 'app-installment-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.06),transparent_50%)]"></div>

      <div class="relative max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <button routerLink="/collections/dashboard" class="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>
              <div class="bg-blue-600 p-2.5 rounded-xl">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7"/></svg>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">Gestión de Contratos y Cuotas</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Administrar contratos con sus cronogramas de pago</p>
              </div>
            </div>
            <button (click)="exportContracts()" [disabled]="isLoading()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
              Exportar
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="bg-indigo-600 p-2 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              </div>
              <h2 class="text-sm font-bold text-gray-900 dark:text-white">Filtros de Búsqueda</h2>
            </div>
            <button (click)="clearFilters()" class="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              Limpiar Filtros
            </button>
          </div>
          <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Número de Contrato</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" formControlName="contract_number" placeholder="Buscar por contrato..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Cliente</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z"/></svg>
                <input type="text" formControlName="client_name" placeholder="Buscar por cliente..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Estado</label>
              <div class="relative">
                <select formControlName="status" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                </select>
                <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </form>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Total Cuotas -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{{ collectionRate() }}%</span>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ totalSchedules() }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Total cuotas</p>
          </div>

          <!-- Pagadas -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>
              </div>
              <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{{ formatCurrency(paidAmount()) }}</span>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ paidSchedules() }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Cuotas pagadas</p>
          </div>

          <!-- Pendientes -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{{ formatCurrency(pendingAmount()) }}</span>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{{ pendingSchedules() }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Cuotas pendientes</p>
          </div>

          <!-- Vencidas -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <span class="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{{ formatCurrency(overdueAmount()) }}</span>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{{ overdueSchedules() }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Cuotas vencidas</p>
          </div>
        </div>

        <!-- Contracts Table -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="bg-blue-600 p-2 rounded-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7"/></svg>
                </div>
                <h2 class="text-sm font-bold text-gray-900 dark:text-white">Contratos con Cronogramas</h2>
              </div>
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{{ filteredContracts().length }} contratos</span>
            </div>
          </div>

          @if (isLoading()) {
            <div class="text-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p class="text-sm text-gray-500 mt-3">Cargando contratos...</p>
            </div>
          } @else {
            @if (filteredContracts().length > 0) {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="bg-gray-50/80 dark:bg-gray-900/40">
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contrato</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cliente</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Asesor</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Lote</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cuotas</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Progreso</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Próximo Vencimiento</th>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                    @for (contract of paginatedContracts(); track contract.contract_id) {
                      <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 cursor-pointer transition-colors" (click)="toggleContractExpansion(contract)">
                        <td class="px-5 py-4 whitespace-nowrap">
                          <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-gray-400 transition-transform" [ngClass]="{'rotate-90': contract.expanded}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l6-6-6-6"/></svg>
                            <div>
                              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ contract.contract_number }}</p>
                              <p class="text-[11px] text-gray-400">ID: {{ contract.contract_id }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{{ contract.client_name }}</td>
                        <td class="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{{ contract.advisor_name }}</td>
                        <td class="px-5 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-700/50">{{ contract.lot_name }}</span>
                        </td>
                        <td class="px-5 py-4 whitespace-nowrap">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-sm font-bold text-gray-900 dark:text-white">{{ contract.total_schedules }}</span>
                            <span class="text-[11px] text-gray-400">total</span>
                            <span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{{ contract.paid_schedules }}</span>
                            <span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">{{ contract.pending_schedules }}</span>
                            @if (contract.overdue_schedules > 0) {
                              <span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{{ contract.overdue_schedules }}</span>
                            }
                          </div>
                        </td>
                        <td class="px-5 py-4 whitespace-nowrap">
                          <div class="w-28">
                            <div class="flex items-center justify-between mb-1">
                              <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{{ contract.payment_rate }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div class="bg-blue-600 h-1.5 rounded-full transition-all" [style.width.%]="contract.payment_rate"></div>
                            </div>
                          </div>
                        </td>
                        <td class="px-5 py-4 whitespace-nowrap">
                          @if (contract.next_due_date) {
                            <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(contract.next_due_date) }}</span>
                          } @else {
                            <span class="text-xs text-green-600 dark:text-green-400 font-medium">Sin pendientes</span>
                          }
                        </td>
                        <td class="px-5 py-4 whitespace-nowrap">
                          <button (click)="viewContractDetails(contract); $event.stopPropagation()" class="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Ver detalles">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </td>
                      </tr>

                      <!-- Expanded Schedules -->
                      @if (contract.expanded) {
                        <tr>
                          <td colspan="8" class="px-5 py-0 pb-3">
                            <div class="rounded-xl border border-gray-200/70 dark:border-gray-700/50 overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
                              <div class="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/60 border-b border-gray-200/70 dark:border-gray-700/50">
                                Cronograma de Cuotas
                              </div>
                              <div class="overflow-x-auto max-h-[400px] installment-scroll">
                                <table class="w-full text-sm">
                                  <thead class="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/90 backdrop-blur">
                                    <tr>
                                      <th class="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cuota</th>
                                      <th class="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vencimiento</th>
                                      <th class="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Monto</th>
                                      <th class="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pagado</th>
                                      <th class="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Saldo</th>
                                      <th class="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                                      <th class="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Días Vencido</th>
                                      <th class="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700/40">
                                    @for (schedule of contract.schedules; track schedule.schedule_id) {
                                      <tr class="hover:bg-white/70 dark:hover:bg-gray-800/40 transition-colors">
                                        <td class="py-2.5 px-4">
                                          <div class="flex items-center gap-2">
                                            <span class="font-medium text-gray-900 dark:text-white text-sm">{{ schedule.installment_number || 'N/A' }}</span>
                                            @if (schedule.notes) {
                                              <span class="text-[11px] text-gray-400">/ {{ schedule.notes }}</span>
                                            }
                                            @if (schedule.type) {
                                              <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-600/50">{{ schedule.type }}</span>
                                            }
                                          </div>
                                        </td>
                                        <td class="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300">{{ formatDate(schedule.due_date) }}</td>
                                        <td class="py-2.5 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(schedule.amount) }}</td>
                                        <td class="py-2.5 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(schedule.amount_paid || 0) }}</td>
                                        <td class="py-2.5 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency((schedule.amount || 0) - (schedule.amount_paid || 0)) }}</td>
                                        <td class="py-2.5 px-4"><span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span></td>
                                        <td class="py-2.5 px-4">
                                          @if (schedule.status === 'vencido') {
                                            <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-200/70 dark:ring-red-800/60">{{ getDaysOverdue(schedule.due_date) }} días</span>
                                          } @else {
                                            <span class="text-gray-300 dark:text-gray-600">-</span>
                                          }
                                        </td>
                                        <td class="py-2.5 px-4 text-right">
                                          <div class="flex justify-end gap-1">
                                            <button (click)="sendReminder(schedule); $event.stopPropagation()" class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Enviar aviso">
                                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 6l-10 7L2 6"/></svg>
                                            </button>
                                            <button (click)="openCustomMessageModal(schedule); $event.stopPropagation()" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors" title="Mensaje personalizado">
                                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                            @if (schedule.status !== 'pagado') {
                                              <button (click)="openMarkPaidModalWithContext(schedule, contract)" class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors" title="Marcar como pagado">
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>
                                              </button>
                                            }
                                          </div>
                                        </td>
                                      </tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              @if (totalPages() > 1 || contracts().length > 0) {
                <div class="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    @if (paginationInfo()) {
                      <span>{{ paginationInfo()!.from }}–{{ paginationInfo()!.to }} de {{ paginationInfo()!.total }}</span>
                    } @else {
                      <span>{{ contracts().length }} resultados</span>
                    }
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500">Mostrar:</label>
                      <select [value]="pageSize()" (change)="onPageSizeChange($event)" class="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <button (click)="previousPage()" [disabled]="currentPage() === 1" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Anterior</button>
                    @for (page of getPageNumbers(); track page) {
                      <button (click)="goToPage(page)" [class]="page === currentPage() ? 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white' : 'px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'">{{ page }}</button>
                    }
                    <button (click)="nextPage()" [disabled]="currentPage() === totalPages()" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Siguiente</button>
                  </div>
                </div>
              }
            } @else {
              <!-- Empty State -->
              <div class="text-center py-16 px-6">
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">No se encontraron contratos</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">Intenta ajustar los filtros de búsqueda para encontrar los contratos que necesitas</p>
              </div>
            }
          }

        </div> <!-- /Modern Contracts List -->

        <!-- Mark as Paid Modal -->
        @if (showMarkPaidModal()) {
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[min(94vw,56rem)] border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] overflow-y-auto installment-scroll">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <div class="bg-emerald-600 p-2 rounded-lg">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Marcar como Pagado</h3>
                  </div>
                  <button (click)="closeMarkPaidModal()" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                @if (selectedScheduleForPayment()) {
                  <form [formGroup]="markPaidForm" (ngSubmit)="markAsPaid()" class="space-y-5">
                    <!-- Schedule Info Card -->
                    <div class="bg-blue-50/80 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cliente</div>
                          <div class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ selectedScheduleForPayment()!.client_name || '—' }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ selectedScheduleForPayment()!.lot_name || selectedScheduleForPayment()!.lot_number || '' }}</div>
                          <div class="mt-2 flex flex-wrap gap-1.5">
                            <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-700/60">Contrato {{ selectedScheduleForPayment()!.contract_number || selectedScheduleForPayment()!.contract_id }}</span>
                            <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-700/60">Cuota #{{ selectedScheduleForPayment()!.installment_number }}</span>
                            <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-700/60">Cronograma #{{ selectedScheduleForPayment()!.schedule_id }}</span>
                          </div>
                        </div>
                        <div class="text-right shrink-0">
                          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vencimiento</div>
                          <div class="text-sm font-bold text-gray-900 dark:text-white">{{ formatDate(selectedScheduleForPayment()!.due_date) }}</div>
                        </div>
                      </div>
                      <div class="mt-4 grid grid-cols-3 gap-3">
                        <div class="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-200/70 dark:ring-gray-700/50">
                          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Monto</div>
                          <div class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(selectedScheduleForPayment()!.amount) }}</div>
                        </div>
                        <div class="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-200/70 dark:ring-gray-700/50">
                          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pagado</div>
                          <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(selectedScheduleForPayment()!.amount_paid || 0) }}</div>
                        </div>
                        <div class="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-200/70 dark:ring-gray-700/50">
                          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Saldo</div>
                          <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency((selectedScheduleForPayment()!.remaining_amount ?? (selectedScheduleForPayment()!.amount - (selectedScheduleForPayment()!.amount_paid || 0))) || 0) }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Form Fields -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Fecha de Pago</label>
                        <input type="date" formControlName="payment_date" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
                        <div class="mt-1 flex justify-end">
                          <button type="button" (click)="setPayToday()" class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">Hoy</button>
                        </div>
                        @if (markPaidSubmitted && markPaidForm.get('payment_date')?.errors?.['required']) {
                          <div class="mt-1 text-[11px] font-semibold text-red-600">La fecha es requerida</div>
                        }
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Monto Pagado</label>
                        <input type="number" step="0.01" formControlName="amount_paid" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors">
                        <div class="mt-1 flex items-center justify-between gap-2">
                          <span class="text-[11px] text-gray-500">Saldo después: {{ formatCurrency(Math.max(0, num(selectedScheduleForPayment()!.amount) - (num(selectedScheduleForPayment()!.amount_paid) + num(markPaidForm.value.amount_paid)))) }}</span>
                          <button type="button" (click)="setPayRemaining()" class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Completar saldo</button>
                        </div>
                        @if (markPaidSubmitted && markPaidForm.get('amount_paid')?.errors?.['required']) {
                          <div class="mt-1 text-[11px] font-semibold text-red-600">El monto es requerido</div>
                        }
                        @if (markPaidSubmitted && markPaidForm.get('amount_paid')?.errors?.['min']) {
                          <div class="mt-1 text-[11px] font-semibold text-red-600">El monto debe ser mayor a 0</div>
                        }
                      </div>
                    </div>

                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Método de Pago</label>
                      <select formControlName="payment_method" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="check">Cheque</option>
                        <option value="card">Tarjeta</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Referencia (banco)</label>
                      <input type="text" formControlName="reference" placeholder="No. boleta / referencia / autorización" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
                      @if (markPaidSubmitted && markPaidForm.get('reference')?.errors?.['required']) {
                        <div class="mt-1 text-[11px] font-semibold text-red-600">La referencia es requerida para pagos no en efectivo</div>
                      }
                      @if (markPaidSubmitted && markPaidForm.get('reference')?.errors?.['maxlength']) {
                        <div class="mt-1 text-[11px] font-semibold text-red-600">Máximo 60 caracteres</div>
                      }
                    </div>

                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Voucher / Comprobante</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" (change)="onVoucherSelected($event)" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors">
                      <div class="mt-1 flex items-center justify-between gap-3 text-[11px] text-gray-500">
                        <span class="truncate">{{ selectedVoucherFile?.name || 'Sin archivo seleccionado' }}</span>
                        @if (selectedVoucherFile) {
                          <button type="button" (click)="clearVoucher()" class="font-semibold text-gray-600 dark:text-gray-300 hover:underline">Quitar</button>
                        }
                      </div>
                      @if (voucherFieldError) {
                        <div class="mt-1 text-[11px] font-semibold text-red-600">{{ voucherFieldError }}</div>
                      }
                    </div>

                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Notas</label>
                      <textarea formControlName="notes" rows="3" placeholder="Notas adicionales sobre el pago..." class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"></textarea>
                      @if (markPaidSubmitted && markPaidForm.get('notes')?.errors?.['maxlength']) {
                        <div class="mt-1 text-[11px] font-semibold text-red-600">Máximo 500 caracteres</div>
                      }
                    </div>

                    <div class="flex gap-3 pt-4">
                      <button type="submit" [disabled]="isMarkingPaid()" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        @if (isMarkingPaid()) {
                          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Procesando...
                        } @else {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>
                          Marcar como Pagado
                        }
                      </button>
                      <button type="button" (click)="closeMarkPaidModal()" class="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </div>
        }

        <!-- Messages -->
        @if (errorMessage()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl p-4 flex items-center gap-3">
            <div class="bg-red-600 p-1.5 rounded-lg shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">{{ errorMessage() }}</p>
          </div>
        }

        @if (successMessage()) {
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-4 flex items-center gap-3">
            <div class="bg-emerald-600 p-1.5 rounded-lg shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>
            </div>
            <p class="text-sm font-medium text-green-800 dark:text-green-200">{{ successMessage() }}</p>
          </div>
        }
      </div>
    </div>

    <!-- Custom Message Modal -->
    @if (showCustomMessageModal()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] overflow-y-auto installment-scroll">
          <div class="p-6">
            <div class="flex justify-between items-center mb-5">
              <div class="flex items-center gap-3">
                <div class="bg-indigo-600 p-2 rounded-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Mensaje personalizado</h3>
              </div>
              <button (click)="closeCustomMessageModal()" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form [formGroup]="customMessageForm" (ngSubmit)="sendCustomMessage()" class="space-y-4">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Asunto</label>
                <input type="text" formControlName="subject" aria-label="Asunto" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Plantilla</label>
                <select formControlName="template" aria-label="Plantilla" (change)="applyTemplate($event)" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors">
                  <option value="">Sin plantilla</option>
                  <option value="friendly">Recordatorio amistoso</option>
                  <option value="last_notice">Último aviso</option>
                  <option value="thanks">Gracias por su pago</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Mensaje</label>
                <textarea formControlName="message" rows="4" aria-label="Mensaje" placeholder="Escribe tu mensaje..." class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"></textarea>
                <div class="text-[11px] mt-1" [class]="customMessageForm.controls['message'].invalid && customMessageForm.controls['message'].touched ? 'text-red-600' : 'text-gray-400'">Mínimo 10 y máximo 500 caracteres</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Fuente</label>
                  <select formControlName="font" aria-label="Fuente" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors">
                    <option>Arial</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Verdana</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Color</label>
                  <input type="color" formControlName="color" aria-label="Color" class="w-10 h-10 p-0 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer">
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Imagen (URL)</label>
                <input type="url" formControlName="imageUrl" aria-label="Imagen" placeholder="https://..." class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors">
              </div>
              <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <div [ngStyle]="{ 'font-family': customMessageForm.value.font, 'color': customMessageForm.value.color }">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Vista previa</p>
                  <div [innerHTML]="previewHtml()"></div>
                </div>
              </div>
              <button type="submit" [disabled]="customMessageForm.invalid" class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Enviar mensaje</button>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .installment-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .installment-scroll::-webkit-scrollbar-track { background: transparent; }
    .installment-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
    .installment-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
    :host-context(.dark) .installment-scroll::-webkit-scrollbar-thumb { background: #4b5563; }
    :host-context(.dark) .installment-scroll::-webkit-scrollbar-thumb:hover { background: #6b7280; }
  `]
})
export class InstallmentManagementComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Signals
  contracts = signal<ContractSummary[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showMarkPaidModal = signal(false);
  showCustomMessageModal = signal(false);
  selectedScheduleForPayment = signal<PaymentSchedule | null>(null);
  selectedScheduleForMessage = signal<PaymentSchedule | null>(null);
  isMarkingPaid = signal(false);
  isSendingReminder = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  paginationInfo = signal<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  // Forms
  filterForm: FormGroup;
  markPaidForm: FormGroup;
  customMessageForm: FormGroup;
  selectedVoucherFile: File | null = null;
  voucherFieldError: string | null = null;
  markPaidSubmitted = false;

  // Computed properties - Now using backend pagination
  paginatedContracts = computed(() => {
    return this.contracts();
  });

  totalPages = computed(() => {
    const paginationInfo = this.paginationInfo();
    return paginationInfo ? paginationInfo.last_page : 1;
  });

  filteredContracts = computed(() => {
    return this.contracts();
  });

  // KPI global summary (from backend, not per-page)
  kpiSummary = signal<{
    total_schedules: number;
    paid_schedules: number;
    pending_schedules: number;
    overdue_schedules: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
    collection_rate: number;
  }>({ total_schedules: 0, paid_schedules: 0, pending_schedules: 0, overdue_schedules: 0, total_amount: 0, paid_amount: 0, pending_amount: 0, overdue_amount: 0, collection_rate: 0 });

  // KPI computed properties (read from global summary)
  totalSchedules = computed(() => this.kpiSummary().total_schedules);
  paidSchedules = computed(() => this.kpiSummary().paid_schedules);
  pendingSchedules = computed(() => this.kpiSummary().pending_schedules);
  overdueSchedules = computed(() => this.kpiSummary().overdue_schedules);
  totalAmount = computed(() => this.kpiSummary().total_amount);
  paidAmount = computed(() => this.kpiSummary().paid_amount);
  pendingAmount = computed(() => this.kpiSummary().pending_amount);
  overdueAmount = computed(() => this.kpiSummary().overdue_amount);
  collectionRate = computed(() => this.kpiSummary().collection_rate);

  Math = Math;
  currentDate =  new Date();
  currentDateFormat = this.currentDate.toISOString().split('T')[0];

  constructor() {
    this.filterForm = this.fb.group({
      contract_number: [''],
      client_name: [''],
      status: ['']
    });

    this.markPaidForm = this.fb.group({
      payment_date: [new Date().toISOString().split('T')[0], Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0.01)]],
      payment_method: ['cash', Validators.required],
      reference: ['', [Validators.maxLength(60)]],
      notes: ['', [Validators.maxLength(500)]]
    });

    this.markPaidForm.get('payment_method')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((method: string) => {
        const referenceControl = this.markPaidForm.get('reference');
        if (!referenceControl) return;
        const validators = method === 'cash'
          ? [Validators.maxLength(60)]
          : [Validators.required, Validators.maxLength(60)];
        referenceControl.setValidators(validators);
        referenceControl.updateValueAndValidity({ emitEvent: false });
      });

    this.customMessageForm = this.fb.group({
      subject: ['Mensaje de Cobranzas', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      template: [''],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      font: ['Arial', Validators.required],
      color: ['#111827', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit() {
    this.loadContracts();


    
    // Setup filter changes
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadContracts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContracts() {
    this.isLoading.set(true);
    this.clearMessages();
    
    const filters = this.filterForm.value;
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
    );
    
    // Add pagination parameters
    const paginationFilters = {
      ...cleanFilters,
      page: this.currentPage(),
      per_page: this.pageSize()
    };
    
this.collectionsService.getContractsWithSchedulesSummary(paginationFilters)
  .pipe(
    takeUntil(this.destroy$),
    catchError(error => {
      console.error('Error loading contracts:', error);
      this.errorMessage.set('Error cargando contratos: ' + (error?.error?.message || error.message));
      // Emitimos un “fallo” controlado
      return of({ success: false, data: [], pagination: null });
    }),
    finalize(() => this.isLoading.set(false))
  )
  .subscribe((response: any) => {
    if (!response?.success) {
      // Manejo claro del caso de error
      this.contracts.set([]);
      this.paginationInfo.set(null);
      return;
    }

    // Success
    const safeData = Array.isArray(response.data) ? response.data : [];
    const contractsWithExpanded = safeData.map((contract: ContractSummary) => ({
      ...contract,
      expanded: false
    }));
    this.contracts.set(contractsWithExpanded);

    // Update global KPI summary
    if (response.summary) {
      this.kpiSummary.set(response.summary);
    }

    if (response.pagination) {
      this.paginationInfo.set(response.pagination);
      this.totalItems.set(response.pagination.total);
    } else {
      // (Opcional) Fallback si el backend no manda paginación
      const total = contractsWithExpanded.length;
      this.paginationInfo.set({
        current_page: 1,
        last_page: 1,
        per_page: total || this.pageSize(),
        total,
        from: total ? 1 : 0,
        to: total
      });
      this.totalItems.set(total);
    }
  });
}

  toggleContractExpansion(contract: ContractSummary) {
    const contracts = this.contracts();
    const updatedContracts = contracts.map(c => 
      c.contract_id === contract.contract_id 
        ? { ...c, expanded: !c.expanded }
        : c
    );
    this.contracts.set(updatedContracts);
  }

  clearFilters() {
    this.filterForm.reset({
      contract_number: '',
      client_name: '',
      status: ''
    });
    this.currentPage.set(1);
  }

  viewContractDetails(contract: ContractSummary) {
    console.log('View contract details:', contract);
    // TODO: Navigate to contract details page
  }

  openMarkPaidModal(schedule: PaymentSchedule) {
    console.log('DEBUG: openMarkPaidModal called with schedule:', schedule);
    console.log('DEBUG: schedule_id value:', schedule.schedule_id);
    this.selectedScheduleForPayment.set(schedule);
    const amount = Number(schedule.amount || 0);
    const alreadyPaid = Number(schedule.amount_paid || 0);
    const remaining = Math.max(0, amount - alreadyPaid);
    this.markPaidForm.patchValue({
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: Number(remaining.toFixed(2)),
      payment_method: 'cash',
      reference: '',
      notes: ''
    });
    this.showMarkPaidModal.set(true);
  }

  openMarkPaidModalWithContext(schedule: PaymentSchedule, contract: ContractSummary) {
    const enriched: PaymentSchedule = {
      ...schedule,
      contract_number: contract.contract_number,
      client_name: contract.client_name,
      lot_name: contract.lot_name,
    };
    this.openMarkPaidModal(enriched);
  }

  openCustomMessageModal(schedule: PaymentSchedule) {
    this.selectedScheduleForMessage.set(schedule);
    this.customMessageForm.reset({
      subject: 'Mensaje de Cobranzas',
      template: '',
      message: '',
      font: 'Arial',
      color: '#111827',
      imageUrl: ''
    });
    this.showCustomMessageModal.set(true);
  }

  closeCustomMessageModal() {
    this.showCustomMessageModal.set(false);
    this.selectedScheduleForMessage.set(null);
  }

  applyTemplate(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const templates: Record<string, string> = {
      friendly: 'Hola, te recordamos tu próxima cuota. Muchas gracias por tu confianza. 😊',
      last_notice: 'Último aviso: tu cuota está próxima a vencer. Evita cargos adicionales realizando tu pago a tiempo.',
      thanks: 'Gracias por su pago. ¡Seguimos a tu disposición para cualquier consulta!'
    };
    if (templates[value]) {
      this.customMessageForm.controls['message'].setValue(templates[value]);
    }
  }

  previewHtml(): string {
    const v = this.customMessageForm.value;
    const msg = this.escapeHtml(v.message || '');
    const emojiMsg = msg;
    const imgTag = v.imageUrl ? `<div><img src="${v.imageUrl}" alt="imagen" style="max-width:100%;border-radius:12px"/></div>` : '';
    return `<div style="font-family:${v.font};color:${v.color};line-height:1.5">${emojiMsg}${imgTag}</div>`;
  }

  private escapeHtml(s: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return s.replace(/[&<>"']/g, c => map[c]);
  }

  sendCustomMessage() {
    if (this.customMessageForm.invalid) return;
    const schedule = this.selectedScheduleForMessage();
    if (!schedule) return;
    const v = this.customMessageForm.value;
    const html = this.previewHtml();
    this.collectionsService.sendCustomEmailForSchedule(schedule.schedule_id, v.subject, html)
      .pipe(
        catchError(error => {
          this.errorMessage.set('Error enviando mensaje: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        if (res?.success) {
          this.successMessage.set('Mensaje enviado');
          this.closeCustomMessageModal();
        }
      });
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
    this.selectedScheduleForPayment.set(null);
    this.selectedVoucherFile = null;
    this.voucherFieldError = null;
    this.markPaidSubmitted = false;
  }

  clearVoucher() {
    this.selectedVoucherFile = null;
    this.voucherFieldError = null;
  }

  onVoucherSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.selectedVoucherFile = file;
    this.voucherFieldError = null;
  }

  setPayToday() {
    this.markPaidForm.patchValue({
      payment_date: new Date().toISOString().split('T')[0],
    });
  }

  setPayRemaining() {
    const s = this.selectedScheduleForPayment();
    if (!s) return;
    const amount = Number(s.amount || 0);
    const paid = Number((s as any).amount_paid || 0);
    const remaining = Math.max(0, amount - paid);
    this.markPaidForm.patchValue({ amount_paid: Number(remaining.toFixed(2)) });
  }

  markAsPaid() {
    this.markPaidSubmitted = true;
    this.voucherFieldError = null;
    if (this.markPaidForm.invalid) {
      this.markPaidForm.markAllAsTouched();
      return;
    }

    const selectedSchedule = this.selectedScheduleForPayment();
    if (!selectedSchedule) return;

    console.log('DEBUG: markAsPaid - selectedSchedule:', selectedSchedule);
    console.log('DEBUG: markAsPaid - schedule_id:', selectedSchedule.schedule_id);

    const method = this.markPaidForm.value.payment_method;
    if (method !== 'cash' && !this.selectedVoucherFile) {
      this.voucherFieldError = 'Voucher requerido para pagos no en efectivo';
      return;
    }

    this.isMarkingPaid.set(true);
    this.clearMessages();

    const request: MarkPaymentPaidRequest = {
      payment_date: this.markPaidForm.value.payment_date,
      amount_paid: this.num(this.markPaidForm.value.amount_paid),
      payment_method: this.markPaidForm.value.payment_method,
      reference: this.markPaidForm.value.reference,
      notes: this.markPaidForm.value.notes
    };

    console.log('DEBUG: About to call markPaymentPaid with schedule_id:', selectedSchedule.schedule_id, 'and request:', request);
    this.collectionsService.markPaymentPaid(selectedSchedule.schedule_id, request)
      .pipe(
        catchError(error => {
          console.error('Error marking payment as paid:', error);
          this.errorMessage.set('Error marcando pago: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isMarkingPaid.set(false);
        if (response.success) {
          const allocation = response.allocation;
          if (allocation && typeof allocation === 'object') {
            const applied = allocation.applied_amount ?? null;
            const unapplied = allocation.unapplied_amount ?? null;
            const allocationsCount = Array.isArray(allocation.allocations) ? allocation.allocations.length : null;
            const parts: string[] = [];
            if (applied !== null) parts.push(`aplicado ${applied}`);
            if (unapplied !== null && unapplied > 0) parts.push(`sobrante ${unapplied}`);
            if (allocationsCount !== null) parts.push(`${allocationsCount} cuota(s)`);
            const suffix = parts.length ? ` (${parts.join(', ')})` : '';
            this.successMessage.set('Pago registrado exitosamente' + suffix);
          } else {
            this.successMessage.set('Pago marcado como pagado exitosamente');
          }

          const voucher = this.selectedVoucherFile;
          const transactionId = response?.transaction?.transaction_id ?? allocation?.transaction_id ?? null;

          if (voucher && typeof transactionId === 'number') {
            this.collectionsService.uploadTransactionVoucher(transactionId, voucher)
              .pipe(
                catchError(() => of({ success: false })),
                takeUntil(this.destroy$)
              )
              .subscribe((res: any) => {
                if (res?.success) {
                  this.successMessage.set('Pago registrado y voucher subido');
                } else {
                  this.errorMessage.set('Pago registrado, pero no se pudo subir el voucher');
                }
                this.closeMarkPaidModal();
                this.loadContracts();
              });
          } else {
            this.closeMarkPaidModal();
            this.loadContracts(); // Reload to get updated data
          }
        }
      });
  }

  sendReminder(schedule: PaymentSchedule) {
    this.isSendingReminder.set(true);
    this.clearMessages();
    this.collectionsService.sendInstallmentReminder(schedule.schedule_id)
      .pipe(
        catchError(error => {
          this.errorMessage.set('Error enviando aviso: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isSendingReminder.set(false);
        if (response?.success) {
          this.successMessage.set('Aviso enviado correctamente');
        }
      });
  }

  exportContracts() {
    console.log('Export contracts');
    // TODO: Implement export functionality
  }

  //calcular dias vencidos
 

  // Pagination methods
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadContracts();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadContracts();
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadContracts();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageSize.set(newPageSize);
    this.currentPage.set(1); // Reset to first page
    this.loadContracts();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  num(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

getStatusClass(status: string): string {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1';
  switch (status) {
    case 'pagado':
      return `${base} bg-green-100 text-green-700 ring-green-200/70 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-800/60`;
    case 'pendiente':
      return `${base} bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800/60`;
    case 'vencido':
      return `${base} bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800/60`;
    default:
      return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-700/60`;
  }
}


  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  }

  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    
    // Normalizar las fechas al inicio del día para evitar problemas de zona horaria
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Si no está vencido, retornar 0
    if (now <= due) {
      return 0;
    }
    
    // Calcular días exactos sin decimales
    const diffTime = now.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Función adicional para mostrar días y horas de forma más detallada
  getOverdueDisplay(dueDate: string): string {
    const due = new Date(dueDate);
    const now = new Date();
    
    // Si no está vencido
    if (now <= due) {
      return '';
    }
    
    const diffTime = now.getTime() - due.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days === 0) {
      return `${hours}h`;
    } else if (days === 1) {
      return '1 día';
    } else {
      return `${days} días`;
    }
  }
}
