import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService, BillingDashboardStats } from '../../services/billing.service';

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full w-full p-6 md:p-8 bg-gray-50 dark:bg-[#0f172a] min-h-screen font-sans">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 tracking-tight">
            Facturación Electrónica
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Gestión de emisión y control SUNAT</p>
        </div>
        
        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <a routerLink="../emitir/boleta" class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 font-medium flex items-center group">
            <span class="bg-white/20 p-1 rounded-full mr-2 group-hover:rotate-90 transition-transform duration-300">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
            </span>
            Emitir Boleta
          </a>
          <a routerLink="../emitir/factura" class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 font-medium flex items-center group">
             <span class="bg-white/20 p-1 rounded-full mr-2 group-hover:rotate-90 transition-transform duration-300">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
            </span>
            Emitir Factura
          </a>
          <!--
          <a routerLink="../invoices" class="px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium">
            Historial
          </a>
          -->
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10" *ngIf="stats">
        
        <!-- Card 1: Ventas Hoy -->
        <div class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 group hover:border-blue-500/30 transition-all duration-300">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 
              </div>
              <span class="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">+{{ stats.today.count }} hoy</span>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">{{ stats.today.total | currency:'PEN':'symbol':'1.0-0' }}<span class="text-lg text-gray-400 font-normal">.{{ ((stats.today.total | currency:'PEN') || '').split('.')[1] || '00' }}</span></h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Ventas del Día</p>
          </div>
        </div>

        <!-- Card 2: Ventas Mes -->
        <div class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 group hover:border-indigo-500/30 transition-all duration-300">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
               <div class="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">{{ stats.month.total | currency:'PEN':'symbol':'1.0-0' }}</h3>
             <div class="flex gap-2 text-xs mt-2">
                <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium">{{ stats.month.facturas }} Fact.</span>
                <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">{{ stats.month.boletas }} Bol.</span>
             </div>
             <p class="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Acumulado Mes</p>
          </div>
        </div>

        <!-- Card 3: Pendientes -->
        <div class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 group hover:border-amber-500/30 transition-all duration-300">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div class="relative z-10">
             <div class="flex items-center justify-between mb-4">
               <div class="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                 <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">{{ stats.pending }}</h3>
            <p class="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center">
              <span class="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
              Pendientes de Envío
            </p>
          </div>
        </div>

        <!-- Card 4: Rechazados -->
         <div class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 group hover:border-rose-500/30 transition-all duration-300">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
               <div class="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                 <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">{{ stats.rejected }}</h3>
             <p class="text-sm text-rose-600 dark:text-rose-400 font-medium">Errores / Rechazos</p>
          </div>
        </div>
      </div>

      <!-- Recent Invoices Table -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-slate-700/60 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-slate-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-white">Últimos Comprobantes</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Transacciones recientes en el sistema</p>
          </div>
          <button class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Ver Todo →
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50/80 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th class="px-6 py-4">Comprobante</th>
                <th class="px-6 py-4">Cliente</th>
                <th class="px-6 py-4 text-right">Monto Total</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-700/60">
              <tr *ngFor="let invoice of stats?.recent" class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 font-bold text-xs"
                      [ngClass]="{
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300': invoice.document_type === '01',
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': invoice.document_type === '03'
                      }">
                      {{ invoice.document_type === '01' ? 'FAC' : 'BOL' }}
                    </div>
                    <div>
                      <div class="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ invoice.series }}-{{ invoice.correlative }}
                      </div>
                      <div class="text-xs text-gray-400">{{ invoice.issue_date | date:'shortDate' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-700 dark:text-gray-300">{{ invoice.client_name }}</div>
                  <div class="text-xs text-gray-400 flex items-center mt-0.5">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                    {{ invoice.client_document_number }}
                  </div>
                </td>
                <td class="px-6 py-4 text-right font-bold text-gray-800 dark:text-white tabular-nums">
                  {{ invoice.total | currency:invoice.currency }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span *ngIf="invoice.sunat_status === 'aceptado'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Aceptado
                  </span>
                  <span *ngIf="invoice.sunat_status === 'rechazado'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span> Rechazado
                  </span>
                  <span *ngIf="invoice.sunat_status === 'pendiente'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span> Pendiente
                  </span>
                   <span *ngIf="invoice.sunat_status === 'enviado'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span> Enviado
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button (click)="downloadPdf(invoice.invoice_id)" 
                    class="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" 
                    title="Descargar PDF">
                    <i class="fas fa-file-pdf text-lg"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!stats?.recent?.length" class="text-center">
                  <td colspan="5" class="py-8 text-gray-500 dark:text-gray-400 italic">No hay comprobantes recientes</td>
              </tr>
            </tbody>
          </table>
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
