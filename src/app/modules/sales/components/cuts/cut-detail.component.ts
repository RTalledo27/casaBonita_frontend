import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SalesCutService } from '../../services/sales-cut.service';
import { SalesCut, SalesCutItem } from '../../models/sales-cut.model';

@Component({
  selector: 'app-cut-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

        @if (isLoading() && !cut()) {
          <div class="flex items-center justify-center py-32">
            <div class="flex flex-col items-center gap-4">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay:0.1s"></div>
                <div class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay:0.2s"></div>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Cargando detalle del corte...</span>
            </div>
          </div>
        } @else if (error()) {
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
            <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl inline-block mb-4">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-4">{{ error() }}</p>
            <button (click)="goBack()" class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 transition-all">
              Volver
            </button>
          </div>
        } @else if (cut()) {

          <!-- ═══════════════ HEADER CARD ═══════════════ -->
          <div class="mb-6">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <!-- Title -->
                <div class="flex items-center gap-4">
                  <button (click)="goBack()"
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                  </button>
                  <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-3">
                      <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Corte #{{ cut()!.cut_id }}</h1>
                      <span class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        [ngClass]="{
                          'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40': cut()!.status === 'open',
                          'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40': cut()!.status === 'closed',
                          'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40': cut()!.status === 'reviewed',
                          'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/40': cut()!.status === 'exported'
                        }">
                        <span class="w-1.5 h-1.5 rounded-full"
                          [ngClass]="{
                            'bg-blue-500': cut()!.status === 'open',
                            'bg-amber-500': cut()!.status === 'closed',
                            'bg-emerald-500': cut()!.status === 'reviewed',
                            'bg-violet-500': cut()!.status === 'exported'
                          }"></span>
                        {{ cutService.getStatusLabel(cut()!.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ formatDate(cut()!.cut_date) }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button (click)="exportToExcel()"
                    class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200/50 dark:border-emerald-700/50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span class="hidden sm:inline">Exportar</span>
                  </button>
                  @if (cut()!.status === 'open') {
                    <button (click)="closeCut()"
                      class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Cerrar Corte</span>
                    </button>
                  } @else if (cut()!.status === 'closed') {
                    <button (click)="reviewCut()"
                      class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                      <span>Marcar Revisado</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════ KPI CARDS ═══════════════ -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <!-- Ventas -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{{ salesItems().length }} items</span>
              </div>
              <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ cut()!.total_sales_count }}</div>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas</p>
              <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-xs text-gray-500 dark:text-gray-400">Ingresos: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ cutService.formatCurrency(cut()!.total_revenue) }}</span></p>
              </div>
            </div>

            <!-- Pagos -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{{ paymentItems().length }} items</span>
              </div>
              <div class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ cut()!.total_payments_count }}</div>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Pagos</p>
              <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-xs text-gray-500 dark:text-gray-400">Recibido: <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ cutService.formatCurrency(cut()!.total_payments_received) }}</span></p>
              </div>
            </div>

            <!-- Comisiones -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                  <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">{{ commissionItems().length }} items</span>
              </div>
              <div class="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">{{ cutService.formatCurrency(cut()!.total_commissions) }}</div>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Comisiones</p>
              <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <p class="text-xs text-gray-500 dark:text-gray-400">Tasa: <span class="font-semibold text-violet-600 dark:text-violet-400">3% de ventas</span></p>
              </div>
            </div>

            <!-- Saldos -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ cutService.formatCurrency(cut()!.cash_balance + cut()!.bank_balance) }}</div>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Saldo Total</p>
              <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] text-gray-500 dark:text-gray-400">Efectivo: <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ cutService.formatCurrency(cut()!.cash_balance) }}</span></span>
                  <span class="text-[10px] text-gray-500 dark:text-gray-400">Banco: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ cutService.formatCurrency(cut()!.bank_balance) }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════ TABS TABLE CARD ═══════════════ -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">

            <!-- Tab Navigation -->
            <div class="border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-5">
              <div class="flex gap-0.5 overflow-x-auto">
                <button (click)="activeTab.set('sales')"
                  class="px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2"
                  [ngClass]="activeTab() === 'sales' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  Ventas
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="activeTab() === 'sales' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
                    {{ salesItems().length }}
                  </span>
                </button>
                <button (click)="activeTab.set('payments')"
                  class="px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2"
                  [ngClass]="activeTab() === 'payments' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  Pagos
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="activeTab() === 'payments' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
                    {{ paymentItems().length }}
                  </span>
                </button>
                <button (click)="activeTab.set('commissions')"
                  class="px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2"
                  [ngClass]="activeTab() === 'commissions' ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Comisiones
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="activeTab() === 'commissions' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
                    {{ commissionItems().length }}
                  </span>
                </button>
                <button (click)="activeTab.set('notes')"
                  class="px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2"
                  [ngClass]="activeTab() === 'notes' ? 'border-gray-900 text-gray-900 dark:text-white dark:border-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Notas
                </button>
              </div>
            </div>

            <!-- ── Sales Tab ── -->
            @if (activeTab() === 'sales') {
              @if (salesItems().length === 0) {
                <div class="px-5 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No hay ventas en este corte</p>
                  </div>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200/80 dark:border-gray-700/80">
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contrato</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mz</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lote</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asesor</th>
                        <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                        <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comisión</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                      @for (item of salesItems(); track item.item_id) {
                        <tr class="group hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                          <td class="px-5 py-3.5">
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {{ item.contract?.client ? (item.contract?.client?.first_name + ' ' + item.contract?.client?.last_name) : 'Cliente' }}
                            </p>
                          </td>
                          <td class="px-5 py-3.5">
                            <span class="text-sm font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md">
                              {{ item.contract?.contract_number || 'N/A' }}
                            </span>
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.contract?.lot?.manzana?.name) {
                              <span class="inline-flex items-center text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-md">
                                {{ item.contract?.lot?.manzana?.name }}
                              </span>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.contract?.lot?.num_lot) {
                              <span class="inline-flex items-center text-sm font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 rounded-md">
                                {{ item.contract?.lot?.num_lot }}
                              </span>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.employee?.user) {
                              <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                                  {{ item.employee?.user?.first_name?.charAt(0) }}{{ item.employee?.user?.last_name?.charAt(0) }}
                                </div>
                                <span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                                  {{ item.employee?.user?.first_name }} {{ item.employee?.user?.last_name }}
                                </span>
                              </div>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5 text-right">
                            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{{ cutService.formatCurrency(item.amount) }}</span>
                          </td>
                          <td class="px-5 py-3.5 text-right">
                            @if (item.commission) {
                              <span class="text-sm font-semibold text-violet-600 dark:text-violet-400 tabular-nums">{{ cutService.formatCurrency(item.commission) }}</span>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                        <td colspan="5" class="px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">Total ({{ salesItems().length }} ventas)</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-gray-900 dark:text-white tabular-nums">{{ cutService.formatCurrency(cut()!.total_revenue) }}</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">{{ cutService.formatCurrency(cut()!.total_commissions) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            }

            <!-- ── Payments Tab ── -->
            @if (activeTab() === 'payments') {
              @if (paymentItems().length === 0) {
                <div class="px-5 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No hay pagos en este corte</p>
                  </div>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200/80 dark:border-gray-700/80">
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contrato</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cuota</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                        <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                      @for (item of paymentItems(); track item.item_id) {
                        <tr class="group hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors">
                          <td class="px-5 py-3.5">
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {{ item.contract?.client ? (item.contract?.client?.first_name + ' ' + item.contract?.client?.last_name) : 'Cliente' }}
                            </p>
                          </td>
                          <td class="px-5 py-3.5">
                            <span class="text-sm font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md">
                              {{ item.contract?.contract_number || 'N/A' }}
                            </span>
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.payment_schedule) {
                              <div>
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">#{{ item.payment_schedule.installment_number }}</span>
                                <span class="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{{ item.payment_schedule.type }}</span>
                              </div>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.payment_method) {
                              <span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {{ cutService.getPaymentMethodLabel(item.payment_method) }}
                              </span>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5 text-right">
                            <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{{ cutService.formatCurrency(item.amount) }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                        <td colspan="4" class="px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">Total ({{ paymentItems().length }} pagos)</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{{ cutService.formatCurrency(cut()!.total_payments_received) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            }

            <!-- ── Commissions Tab ── -->
            @if (activeTab() === 'commissions') {
              @if (commissionItems().length === 0) {
                <div class="px-5 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No hay comisiones en este corte</p>
                  </div>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200/80 dark:border-gray-700/80">
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asesor</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contrato</th>
                        <th class="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                        <th class="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comisión</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                      @for (item of commissionItems(); track item.item_id) {
                        <tr class="group hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors">
                          <td class="px-5 py-3.5">
                            <div class="flex items-center gap-2.5">
                              <div class="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">
                                {{ item.employee?.user ? (item.employee?.user?.first_name?.charAt(0) || '') + (item.employee?.user?.last_name?.charAt(0) || '') : 'A' }}
                              </div>
                              <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
                                {{ item.employee?.user ? (item.employee?.user?.first_name + ' ' + item.employee?.user?.last_name) : 'Asesor' }}
                              </span>
                            </div>
                          </td>
                          <td class="px-5 py-3.5">
                            <span class="text-sm font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md">
                              {{ item.contract?.contract_number || 'N/A' }}
                            </span>
                          </td>
                          <td class="px-5 py-3.5">
                            @if (item.description) {
                              <p class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{{ item.description }}</p>
                            } @else {
                              <span class="text-sm text-gray-400">—</span>
                            }
                          </td>
                          <td class="px-5 py-3.5 text-right">
                            <span class="text-sm font-semibold text-violet-600 dark:text-violet-400 tabular-nums">{{ cutService.formatCurrency(item.amount) }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                        <td colspan="3" class="px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">Total ({{ commissionItems().length }} comisiones)</td>
                        <td class="px-5 py-3.5 text-right text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">{{ cutService.formatCurrency(cut()!.total_commissions) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            }

            <!-- ── Notes Tab ── -->
            @if (activeTab() === 'notes') {
              <div class="p-5 sm:p-6 space-y-5">
                <!-- Notes Input -->
                <div class="bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-5">
                  <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div class="p-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg">
                      <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </div>
                    Notas del Corte
                  </h3>
                  <textarea [(ngModel)]="notes" rows="5" placeholder="Agrega notas o comentarios sobre este corte..."
                    class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"></textarea>
                  <div class="flex justify-end mt-3">
                    <button (click)="saveNotes()" [disabled]="isSavingNotes()"
                      class="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all inline-flex items-center gap-2">
                      @if (isSavingNotes()) {
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      }
                      {{ isSavingNotes() ? 'Guardando...' : 'Guardar Notas' }}
                    </button>
                  </div>
                </div>

                <!-- Audit Trail -->
                @if (cut()!.closed_by_user || cut()!.reviewed_by_user) {
                  <div class="bg-gray-50/80 dark:bg-gray-700/20 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-5">
                    <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      Historial de Auditoría
                    </h3>
                    <div class="space-y-2">
                      @if (cut()!.closed_by_user) {
                        <div class="flex items-center gap-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30">
                          <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex-shrink-0">
                            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div class="flex-1">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">Cerrado por {{ cut()!.closed_by_user?.first_name }} {{ cut()!.closed_by_user?.last_name }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ cut()!.closed_at | date: 'medium' }}</p>
                          </div>
                          <span class="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Cierre</span>
                        </div>
                      }
                      @if (cut()!.reviewed_by_user) {
                        <div class="flex items-center gap-3 p-3.5 bg-violet-50/80 dark:bg-violet-900/10 rounded-xl border border-violet-200/50 dark:border-violet-700/30">
                          <div class="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex-shrink-0">
                            <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                          </div>
                          <div class="flex-1">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">Revisado por {{ cut()!.reviewed_by_user?.first_name }} {{ cut()!.reviewed_by_user?.last_name }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ cut()!.reviewed_at | date: 'medium' }}</p>
                          </div>
                          <span class="text-[10px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">Revisión</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Tab Footer Info -->
            @if (activeTab() !== 'notes') {
              <div class="px-5 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <p class="text-xs text-center text-gray-500 dark:text-gray-400">
                  @if (activeTab() === 'sales') {
                    {{ salesItems().length }} venta{{ salesItems().length !== 1 ? 's' : '' }} registrada{{ salesItems().length !== 1 ? 's' : '' }} en este corte
                  } @else if (activeTab() === 'payments') {
                    {{ paymentItems().length }} pago{{ paymentItems().length !== 1 ? 's' : '' }} registrado{{ paymentItems().length !== 1 ? 's' : '' }} en este corte
                  } @else if (activeTab() === 'commissions') {
                    {{ commissionItems().length }} comisi{{ commissionItems().length !== 1 ? 'ones' : 'ón' }} registrada{{ commissionItems().length !== 1 ? 's' : '' }} en este corte
                  }
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class CutDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  cutService = inject(SalesCutService);

  cut = signal<SalesCut | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'sales' | 'payments' | 'commissions' | 'notes'>('sales');
  isSavingNotes = signal(false);
  notes = '';

  salesItems = signal<SalesCutItem[]>([]);
  paymentItems = signal<SalesCutItem[]>([]);
  commissionItems = signal<SalesCutItem[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const cutId = +params['id'];
      if (cutId) {
        this.loadCutDetail(cutId);
      }
    });
  }

  loadCutDetail(cutId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.cutService.getCutById(cutId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cut.set(response.data);
          this.notes = response.data.notes || '';
          
          // Filter items by type
          if (response.data.items) {
            this.salesItems.set(response.data.items.filter(item => item.item_type === 'sale'));
            this.paymentItems.set(response.data.items.filter(item => item.item_type === 'payment'));
            this.commissionItems.set(response.data.items.filter(item => item.item_type === 'commission'));
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el detalle del corte.');
        this.isLoading.set(false);
        console.error('Error loading cut detail:', err);
      }
    });
  }

  closeCut() {
    if (!this.cut()) return;

    if (confirm('¿Estás seguro de cerrar este corte? Esta acción no se puede deshacer.')) {
      this.cutService.closeCut(this.cut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte cerrado exitosamente');
            this.loadCutDetail(this.cut()!.cut_id);
          }
        },
        error: (err) => {
          alert('❌ Error al cerrar el corte');
          console.error('Error closing cut:', err);
        }
      });
    }
  }

  reviewCut() {
    if (!this.cut()) return;

    if (confirm('¿Marcar este corte como revisado?')) {
      this.cutService.reviewCut(this.cut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte marcado como revisado');
            this.loadCutDetail(this.cut()!.cut_id);
          }
        },
        error: (err) => {
          alert('❌ Error al revisar el corte');
          console.error('Error reviewing cut:', err);
        }
      });
    }
  }

  saveNotes() {
    if (!this.cut()) return;

    this.isSavingNotes.set(true);
    this.cutService.updateNotes(this.cut()!.cut_id, { notes: this.notes }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Notas guardadas exitosamente');
          this.cut.set(response.data);
        }
        this.isSavingNotes.set(false);
      },
      error: (err) => {
        alert('❌ Error al guardar notas');
        this.isSavingNotes.set(false);
        console.error('Error saving notes:', err);
      }
    });
  }

  exportToExcel(): void {
    if (!this.cut()) return;
    this.cutService.exportToExcel(this.cut()!.cut_id);
  }

  goBack() {
    this.router.navigate(['/sales/cuts']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
