import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, of } from 'rxjs';
import { startWith, switchMap, catchError, tap } from 'rxjs/operators';
import { CollectionsSimplifiedService, CollectionsSimplifiedDashboard } from '../../services/collections-simplified.service';
import { PaymentSchedule } from '../../models/payment-schedule';
import { RecentContract } from '../../models/recent-contract';

@Component({
  selector: 'app-collections-simplified-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Cronogramas</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestión simplificada de cronogramas de pagos</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button (click)="refreshDashboard()" [disabled]="isLoading()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50">
                <svg class="w-4 h-4" [class.animate-spin]="isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ isLoading() ? 'Actualizando...' : 'Actualizar' }}
              </button>
              <button routerLink="/collections-simplified/generator"
                class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Generar Cronograma
              </button>
            </div>
          </div>
        </div>

        <!-- ═══════════════ KPI STATS ═══════════════ -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Contratos Activos -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData()?.total_contracts || 0 }}</p>
            <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Contratos Activos</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Con cronogramas</p>
          </div>

          <!-- Monto Pendiente -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(dashboardData()?.pending_amount || 0) }}</p>
            <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Monto Pendiente</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Por cobrar</p>
          </div>

          <!-- Monto Vencido -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatCurrency(dashboardData()?.overdue_amount || 0) }}</p>
            <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Monto Vencido</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ dashboardData()?.overdue_count || 0 }} cuotas</p>
          </div>

          <!-- Tasa de Pago -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ (dashboardData()?.payment_rate || 0).toFixed(1) }}%</p>
            <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Tasa de Pago</p>
            <div class="flex items-center gap-1 mt-0.5">
              <svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Este mes</span>
            </div>
          </div>
        </div>

        <!-- ═══════════════ THREE SECTIONS ═══════════════ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Cronogramas Recién Creados -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">Recién Creados</h3>
              </div>
              <a routerLink="/collections-simplified/schedules" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Ver todos</a>
            </div>
            <div class="p-4">
              @if (recentCreatedSchedules().length > 0) {
                <div class="space-y-3">
                  @for (contract of recentCreatedSchedules(); track contract.contract_id) {
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ contract.contract_number }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ contract.client_name }}</p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ contract.lot_name }}</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ contract.total_schedules }}</p>
                        <p class="text-[10px] text-emerald-500 font-semibold uppercase">cuotas</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-10">
                  <div class="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Sin cronogramas recientes</p>
                </div>
              }
            </div>
          </div>

          <!-- Cuotas Próximas a Vencer -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">Próximas a Vencer</h3>
              </div>
              <a routerLink="/collections-simplified/schedules" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Ver todas</a>
            </div>
            <div class="p-4">
              @if (recentSchedules().length > 0) {
                <div class="space-y-3">
                  @for (schedule of recentSchedules(); track schedule.schedule_id) {
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Contrato #{{ schedule.contract_number }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Vence: {{ formatDate(schedule.due_date) }}</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(schedule.amount) }}</p>
                        <span [class]="getStatusClass(schedule.status)">{{ getStatusLabel(schedule.status) }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-10">
                  <div class="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Sin cuotas próximas</p>
                </div>
              }
            </div>
          </div>

          <!-- Cuotas Vencidas -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">Cuotas Vencidas</h3>
              </div>
              <a routerLink="/collections-simplified/installments" [queryParams]="{ status: 'vencido' }" class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">Ver todas</a>
            </div>
            <div class="p-4">
              @if (overdueSchedules().length > 0) {
                <div class="space-y-3">
                  @for (schedule of overdueSchedules(); track schedule.schedule_id) {
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors group">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Contrato #{{ schedule.contract_number }}</p>
                        <p class="text-xs text-red-500 dark:text-red-400">Vencido: {{ formatDate(schedule.due_date) }}</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-sm font-bold text-red-600 dark:text-red-400 mb-1">{{ formatCurrency(schedule.amount) }}</p>
                        <button (click)="markAsPaid(schedule)"
                          class="text-[10px] font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors">
                          Marcar Pagado
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-10">
                  <div class="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 inline-flex mb-3">
                    <svg class="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">Sin cuotas vencidas</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- ═══════════════ QUICK ACTIONS ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Acciones Rápidas</h3>
            </div>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a routerLink="/collections-simplified/generator"
              class="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/30 hover:bg-blue-50/60 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/30 transition-all group">
              <div class="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">Generar Cronograma</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Crear nuevo cronograma de pagos</p>
              </div>
            </a>
            <a routerLink="/collections-simplified/installments"
              class="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/30 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 border border-transparent hover:border-emerald-200/50 dark:hover:border-emerald-800/30 transition-all group">
              <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">Gestionar Cuotas</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Marcar pagos y gestionar cuotas</p>
              </div>
            </a>
            <a routerLink="/collections-simplified/reports"
              class="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/30 hover:bg-violet-50/60 dark:hover:bg-violet-900/10 border border-transparent hover:border-violet-200/50 dark:hover:border-violet-800/30 transition-all group">
              <div class="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">Ver Reportes</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Reportes de estado de pagos</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class CollectionsSimplifiedDashboardComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  dashboardData = signal<CollectionsSimplifiedDashboard | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed values
  recentCreatedSchedules = computed(() => this.dashboardData()?.recent_created_schedules || [] as RecentContract[]);
  recentSchedules = computed(() => this.dashboardData()?.recent_schedules || []);
  overdueSchedules = computed(() => this.dashboardData()?.overdue_schedules || []);

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadDashboardData()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.collectionsService.getDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error.set('Error al cargar los datos del dashboard');
          this.isLoading.set(false);
          return of(null);
        }),
        tap((data) => {
          if (data) {
            this.dashboardData.set(data);
          }
          this.isLoading.set(false);
        })
      );
  }

  refreshDashboard() {
    this.loadDashboardData().subscribe();
  }

  markAsPaid(schedule: PaymentSchedule) {
    const today = new Date().toISOString().split('T')[0];
    
    this.collectionsService.markPaymentPaid(schedule.schedule_id, {
      payment_date: today,
      amount_paid: schedule.amount,
      payment_method: 'transfer',
      notes: 'Marcado como pagado desde dashboard'
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error marking payment as paid:', error);
        this.error.set('Error al marcar el pago como pagado');
      }
    });
  }

  formatCurrency(amount: number): string {
    const currency = this.dashboardData()?.currency || 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full';
      case 'vencido':
        return 'text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full';
      case 'pendiente':
      default:
        return 'text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }
}