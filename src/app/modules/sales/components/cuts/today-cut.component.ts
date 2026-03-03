import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SalesCutService } from '../../services/sales-cut.service';
import { SalesCut, SalesCutItem } from '../../models/sales-cut.model';

@Component({
  selector: 'app-today-cut',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <button (click)="goToDashboard()"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </button>
            <div class="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">Corte de Hoy</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentDate() }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="refreshCut()" [disabled]="isLoading()"
              class="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
              <svg class="w-4 h-4" [class.animate-spin]="isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
            @if (todayCut()) {
              <button (click)="exportToExcel()"
                class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Exportar Reporte
              </button>
            }
            @if (todayCut() && todayCut()!.status === 'open') {
              <button (click)="closeCut()"
                class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Cerrar Corte
              </button>
            }
          </div>
        </div>

        @if (isLoading() && !todayCut()) {
          <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 dark:border-blue-900 border-t-blue-600"></div>
          </div>
        } @else if (error()) {
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
            <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl inline-block mb-4">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-4">{{ error() }}</p>
            <button (click)="loadTodayCut()" class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 transition-all">
              Reintentar
            </button>
          </div>
        } @else if (todayCut()) {
          <!-- ═══════════════ STATUS BANNER ═══════════════ -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-xl"
                  [ngClass]="{
                    'bg-blue-100 dark:bg-blue-900/40': todayCut()!.status === 'open',
                    'bg-emerald-100 dark:bg-emerald-900/40': todayCut()!.status === 'closed',
                    'bg-violet-100 dark:bg-violet-900/40': todayCut()!.status === 'reviewed',
                    'bg-amber-100 dark:bg-amber-900/40': todayCut()!.status === 'exported'
                  }">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    [ngClass]="{
                      'text-blue-600 dark:text-blue-400': todayCut()!.status === 'open',
                      'text-emerald-600 dark:text-emerald-400': todayCut()!.status === 'closed',
                      'text-violet-600 dark:text-violet-400': todayCut()!.status === 'reviewed',
                      'text-amber-600 dark:text-amber-400': todayCut()!.status === 'exported'
                    }">
                    @if (todayCut()!.status === 'open') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    } @else {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    }
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ cutService.getStatusLabel(todayCut()!.status) }}</h3>
                    <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40': todayCut()!.status === 'open',
                        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40': todayCut()!.status === 'closed',
                        'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40': todayCut()!.status === 'reviewed',
                        'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40': todayCut()!.status === 'exported'
                      }">
                      {{ cutService.getTypeLabel(todayCut()!.cut_type) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Corte #{{ todayCut()!.cut_id }}</p>
                </div>
              </div>
              @if (todayCut()!.closed_by_user) {
                <div class="text-right">
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cerrado por</p>
                  <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ todayCut()!.closed_by_user?.first_name }} {{ todayCut()!.closed_by_user?.last_name }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ todayCut()!.closed_at | date: 'short' }}</p>
                </div>
              }
            </div>
          </div>

          <!-- ═══════════════ KPI CARDS ═══════════════ -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ todayCut()!.total_sales_count }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ventas · {{ cutService.formatCurrency(todayCut()!.total_revenue) }}</p>
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-[10px] text-gray-500 dark:text-gray-400">Inicial: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ cutService.formatCurrency(todayCut()!.total_down_payments) }}</span></p>
              </div>
            </div>
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ todayCut()!.total_payments_count }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pagos · {{ cutService.formatCurrency(todayCut()!.total_payments_received) }}</p>
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ todayCut()!.paid_installments_count }} cuotas pagadas</p>
              </div>
            </div>
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ cutService.formatCurrency(todayCut()!.total_commissions) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Comisiones · 3% de ventas</p>
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-[10px] text-gray-500 dark:text-gray-400">Sobre <span class="font-semibold">{{ cutService.formatCurrency(todayCut()!.total_revenue) }}</span></p>
              </div>
            </div>
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ cutService.formatCurrency((todayCut()!.cash_balance ?? 0) + (todayCut()!.bank_balance ?? 0)) }}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-[10px] text-gray-500 dark:text-gray-400">Efectivo: <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ cutService.formatCurrency(todayCut()!.cash_balance ?? 0) }}</span></span>
                <span class="text-[10px] text-gray-500 dark:text-gray-400">Banco: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ cutService.formatCurrency(todayCut()!.bank_balance ?? 0) }}</span></span>
              </div>
            </div>
          </div>

          <!-- ═══════════════ ADVISOR SALES & TOP SALES ═══════════════ -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Sales by Advisor -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  Ventas por Asesor
                </h3>
              </div>
              @if (todayCut()!.summary_data?.sales_by_advisor && todayCut()!.summary_data!.sales_by_advisor.length > 0) {
                <div class="p-4 space-y-2">
                  @for (advisor of todayCut()!.summary_data!.sales_by_advisor; track advisor.advisor_name) {
                    <div class="flex items-center justify-between p-3.5 bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-200 dark:hover:border-blue-800/40 transition-colors">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ advisor.advisor_name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ advisor.sales_count }} ventas</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">{{ cutService.formatCurrency(advisor.total_amount) }}</p>
                        <p class="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Com: {{ cutService.formatCurrency(advisor.total_commission) }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-8 text-center">
                  <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl inline-block mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Sin ventas registradas</p>
                </div>
              }
            </div>

            <!-- Top Sales -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <div class="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                    <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  Top 5 Ventas
                </h3>
              </div>
              @if (todayCut()!.summary_data?.top_sales && todayCut()!.summary_data!.top_sales.length > 0) {
                <div class="p-4 space-y-2">
                  @for (sale of todayCut()!.summary_data!.top_sales; track sale.contract_number; let i = $index) {
                    <div class="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:border-amber-200 dark:hover:border-amber-800/40 transition-colors">
                      <div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 flex-shrink-0">
                        {{ i + 1 }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ sale.client_name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ sale.contract_number }} · {{ sale.advisor_name }}</p>
                      </div>
                      <div class="text-right flex-shrink-0 ml-3">
                        <p class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ cutService.formatCurrency(sale.amount) }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-8 text-center">
                  <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl inline-block mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Sin ventas registradas</p>
                </div>
              }
            </div>
          </div>

          <!-- ═══════════════ PAYMENTS BY METHOD ═══════════════ -->
          @if (todayCut()!.summary_data?.payments_by_method && todayCut()!.summary_data!.payments_by_method.length > 0) {
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <div class="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                    <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                  </div>
                  Pagos por Método
                </h3>
              </div>
              <div class="p-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (method of todayCut()!.summary_data!.payments_by_method; track method.method) {
                    <div class="p-4 bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ cutService.getPaymentMethodLabel(method.method) }}</span>
                        <span class="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 rounded-lg">{{ method.count }}</span>
                      </div>
                      <p class="text-xl font-bold text-gray-900 dark:text-white">{{ cutService.formatCurrency(method.total) }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: []
})
export class TodayCutComponent implements OnInit {
  private router = inject(Router);
  cutService = inject(SalesCutService);

  todayCut = signal<SalesCut | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadTodayCut();
    // Auto-refresh every 30 seconds
    setInterval(() => this.refreshCut(), 30000);
  }

  loadTodayCut() {
    this.isLoading.set(true);
    this.error.set(null);

    this.cutService.getTodayCut().subscribe({
      next: (response) => {
        if (response.success) {
          this.todayCut.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el corte de hoy. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
        console.error('Error loading today cut:', err);
      }
    });
  }

  refreshCut() {
    if (!this.isLoading()) {
      this.loadTodayCut();
    }
  }

  closeCut() {
    if (!this.todayCut()) return;

    if (confirm('¿Estás seguro de cerrar el corte de hoy? Esta acción no se puede deshacer.')) {
      this.cutService.closeCut(this.todayCut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte cerrado exitosamente');
            this.loadTodayCut();
          }
        },
        error: (err) => {
          alert('❌ Error al cerrar el corte');
          console.error('Error closing cut:', err);
        }
      });
    }
  }

  goToDashboard() {
    this.router.navigate(['/sales/cuts']);
  }

  currentDate(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBorderClass(): string {
    if (!this.todayCut()) return 'border-gray-300';
    const classes: Record<string, string> = {
      'open': 'border-blue-500',
      'closed': 'border-green-500',
      'reviewed': 'border-purple-500',
      'exported': 'border-yellow-500'
    };
    return classes[this.todayCut()!.status] || 'border-gray-300';
  }

  getStatusBgClass(): string {
    if (!this.todayCut()) return 'bg-gray-100';
    const classes: Record<string, string> = {
      'open': 'bg-blue-100',
      'closed': 'bg-green-100',
      'reviewed': 'bg-purple-100',
      'exported': 'bg-yellow-100'
    };
    return classes[this.todayCut()!.status] || 'bg-gray-100';
  }

  getStatusTextClass(): string {
    if (!this.todayCut()) return 'text-gray-600';
    const classes: Record<string, string> = {
      'open': 'text-blue-600',
      'closed': 'text-green-600',
      'reviewed': 'text-purple-600',
      'exported': 'text-yellow-600'
    };
    return classes[this.todayCut()!.status] || 'text-gray-600';
  }

  exportToExcel(): void {
    if (this.todayCut()) {
      this.cutService.exportToExcel(this.todayCut()!.cut_id);
    }
  }
}
