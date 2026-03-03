import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService, Invoice } from '../../services/billing.service';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
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
                <button routerLink="/billing/dashboard" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600 transition-all shadow-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div class="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Historial de Comprobantes
                  </h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Registro completo de facturas y boletas emitidas
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <a routerLink="/billing/emitir/boleta"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200/50 dark:border-blue-700/50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/></svg>
                  <span class="hidden sm:inline">Boleta</span>
                </a>
                <a routerLink="/billing/emitir/factura"
                  class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/></svg>
                  <span>Factura</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════ KPI SUMMARY ═══════════════ -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ filteredInvoices.length }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Total resultados</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">{{ countFacturas }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Facturas</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-lg">
                <svg class="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">{{ countBoletas }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Boletas</p>
          </div>

          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{{ totalAmount | currency:'PEN':'symbol':'1.0-0' }}</div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Monto total (S/)</p>
          </div>
        </div>

        <!-- ═══════════════ TABLE ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">

          <!-- Filters -->
          <div class="px-5 sm:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Search -->
              <div class="relative flex-1">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Buscar por cliente, serie, documento..."
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors">
              </div>

              <!-- Type filter -->
              <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()"
                class="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white text-sm px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                <option value="">Todos los tipos</option>
                <option value="01">Facturas</option>
                <option value="03">Boletas</option>
              </select>

              <!-- Status filter -->
              <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()"
                class="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white text-sm px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                <option value="">Todos los estados</option>
                <option value="aceptado">Aceptado</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="bg-gray-50/80 dark:bg-gray-900/30">
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comprobante</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Monto</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Estado</th>
                  <th class="px-5 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr *ngFor="let invoice of paginatedInvoices" class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
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
                        <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{{ invoice.document_type === '01' ? 'Factura' : 'Boleta' }}</div>
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
                  <td class="px-5 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {{ invoice.issue_date | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="px-5 sm:px-6 py-4 text-right">
                    <span class="font-bold text-gray-900 dark:text-white tabular-nums">{{ invoice.total | currency:(invoice.currency || 'PEN') }}</span>
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
                    <span *ngIf="invoice.sunat_status === 'anulado'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
                      <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Anulado
                    </span>
                  </td>
                  <td class="px-5 sm:px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="downloadPdf(invoice.invoice_id)"
                        class="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                        title="Descargar PDF">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </button>
                      <button (click)="resend(invoice)"
                        *ngIf="invoice.sunat_status === 'pendiente' || invoice.sunat_status === 'rechazado'"
                        class="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-all"
                        title="Reenviar a SUNAT">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Empty state -->
            <div *ngIf="filteredInvoices.length === 0 && !loading" class="text-center py-16">
              <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                </svg>
              </div>
              <p class="font-semibold text-gray-500 dark:text-gray-400">Sin comprobantes encontrados</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Intente con otros filtros de búsqueda</p>
            </div>

            <!-- Loading -->
            <div *ngIf="loading" class="flex items-center justify-center py-16">
              <svg class="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="filteredInvoices.length > pageSize" class="px-5 sm:px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {{ (currentPage - 1) * pageSize + 1 }}-{{ min(currentPage * pageSize, filteredInvoices.length) }} de {{ filteredInvoices.length }}
            </p>
            <div class="flex items-center gap-1">
              <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1"
                class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span class="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{{ currentPage }} / {{ totalPages }}</span>
              <button (click)="currentPage = currentPage + 1" [disabled]="currentPage === totalPages"
                class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class InvoiceListComponent implements OnInit {
    invoices: Invoice[] = [];
    filteredInvoices: Invoice[] = [];
    loading = false;
    searchTerm = '';
    filterType = '';
    filterStatus = '';
    currentPage = 1;
    pageSize = 15;

    constructor(private billingService: BillingService) {}

    ngOnInit() {
        this.loadInvoices();
    }

    loadInvoices() {
        this.loading = true;
        this.billingService.getInvoices().subscribe({
            next: (res: any) => {
                this.invoices = Array.isArray(res) ? res : (res.data || []);
                this.applyFilters();
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    applyFilters() {
        this.currentPage = 1;
        let result = [...this.invoices];

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(i =>
                i.client_name?.toLowerCase().includes(term) ||
                i.client_document_number?.toLowerCase().includes(term) ||
                i.series?.toLowerCase().includes(term) ||
                String(i.correlative).includes(term)
            );
        }
        if (this.filterType) {
            result = result.filter(i => i.document_type === this.filterType);
        }
        if (this.filterStatus) {
            result = result.filter(i => i.sunat_status === this.filterStatus);
        }

        this.filteredInvoices = result;
    }

    get paginatedInvoices(): Invoice[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredInvoices.slice(start, start + this.pageSize);
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredInvoices.length / this.pageSize));
    }

    get countFacturas(): number {
        return this.filteredInvoices.filter(i => i.document_type === '01').length;
    }

    get countBoletas(): number {
        return this.filteredInvoices.filter(i => i.document_type === '03').length;
    }

    get totalAmount(): number {
        return this.filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
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
            }
        });
    }

    resend(invoice: Invoice) {
        this.billingService.resendInvoice(invoice.invoice_id).subscribe({
            next: () => { this.loadInvoices(); }
        });
    }
}
