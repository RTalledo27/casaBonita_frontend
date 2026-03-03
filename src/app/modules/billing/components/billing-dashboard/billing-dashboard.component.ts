import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService, BillingDashboardStats } from '../../services/billing.service';

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="mb-6">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <!-- Title -->
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Facturación Electrónica
                  </h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Gestión de emisión y control SUNAT
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <a routerLink="../invoices"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:hover:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  <span class="hidden sm:inline">Historial</span>
                </a>
                <a routerLink="../emitir/boleta"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200/50 dark:border-blue-700/50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/></svg>
                  <span class="hidden sm:inline">Boleta</span>
                </a>
                <a routerLink="../emitir/factura"
                  class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/></svg>
                  <span>Factura</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════ KPI CARDS ═══════════════ -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6" *ngIf="stats">

          <!-- Card 1: Ventas Hoy -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">+{{ stats.today.count }} hoy</span>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{{ stats.today.total | currency:'PEN':'symbol':'1.0-0' }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas del Día</p>
          </div>

          <!-- Card 2: Ventas Mes -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{{ stats.month.total | currency:'PEN':'symbol':'1.0-0' }}</div>
            <div class="flex gap-2 text-[10px] sm:text-xs mt-2">
              <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium">{{ stats.month.facturas }} Fact.</span>
              <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">{{ stats.month.boletas }} Bol.</span>
            </div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Acumulado Mes</p>
          </div>

          <!-- Card 3: Pendientes -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.pending }}</div>
            <p class="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center">
              <span class="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
              Pendientes de Envío
            </p>
          </div>

          <!-- Card 4: Rechazados -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">{{ stats.rejected }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Errores / Rechazos</p>
          </div>
        </div>

        <!-- ═══════════════ RECENT INVOICES TABLE ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div class="px-5 sm:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Últimos Comprobantes</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Transacciones recientes en el sistema</p>
              </div>
            </div>
            <a routerLink="../invoices" class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              Ver Todo
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="bg-gray-50/80 dark:bg-gray-900/30">
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comprobante</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Monto Total</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Estado</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr *ngFor="let invoice of stats?.recent" class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
                  <td class="px-5 sm:px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                        [ngClass]="{
                          'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300': invoice.document_type === '01',
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': invoice.document_type === '03'
                        }">
                        {{ invoice.document_type === '01' ? 'FAC' : 'BOL' }}
                      </div>
                      <div>
                        <div class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {{ invoice.series }}-{{ invoice.correlative }}
                        </div>
                        <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ invoice.issue_date | date:'dd/MM/yyyy' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 sm:px-6 py-4">
                    <div class="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{{ invoice.client_name }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                      <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                      {{ invoice.client_document_number }}
                    </div>
                  </td>
                  <td class="px-5 sm:px-6 py-4 text-right">
                    <span class="font-bold text-gray-900 dark:text-white tabular-nums">{{ invoice.total | currency:invoice.currency }}</span>
                  </td>
                  <td class="px-5 sm:px-6 py-4 text-center">
                    <span *ngIf="invoice.sunat_status === 'aceptado'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aceptado
                    </span>
                    <span *ngIf="invoice.sunat_status === 'rechazado'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rechazado
                    </span>
                    <span *ngIf="invoice.sunat_status === 'pendiente'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pendiente
                    </span>
                    <span *ngIf="invoice.sunat_status === 'enviado'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Enviado
                    </span>
                  </td>
                  <td class="px-5 sm:px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="downloadPdf(invoice.invoice_id)"
                        class="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                        title="Descargar PDF">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Empty state -->
            <div *ngIf="!stats?.recent?.length" class="text-center py-16">
              <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                </svg>
              </div>
              <p class="font-semibold text-gray-500 dark:text-gray-400">Sin comprobantes recientes</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Los comprobantes emitidos aparecerán aquí</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class BillingDashboardComponent implements OnInit {
  stats: BillingDashboardStats | null = null;

  constructor(private billingService: BillingService) { }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.billingService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  downloadPdf(id: number) {
    this.billingService.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error al descargar PDF:', err)
    });
  }
}
