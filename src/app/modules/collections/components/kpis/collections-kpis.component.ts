import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES } from '../../../../core/constants/api.routes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-collections-kpis',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>
      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

        <!-- Header -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-7">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div class="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-purple-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                </div>
                <div class="min-w-0">
                  <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">KPIs de Cobranzas</h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Evaluaci&oacute;n de gesti&oacute;n &middot; desempe&ntilde;o del equipo &middot; trazabilidad</p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                @if (kpis?.period) {
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-600/50">
                    Periodo: {{ kpis.period.start }} &rarr; {{ kpis.period.end }}
                  </span>
                }
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200/70 dark:ring-purple-800/50">
                  Alcance: {{ selectedEmployeeId ? 'Por integrante' : 'Global' }}
                </span>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div class="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 border border-gray-200/60 dark:border-gray-600/60">
                <button type="button" class="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  [ngClass]="activeTab === 'summary' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'"
                  (click)="activeTab = 'summary'">
                  Resumen
                </button>
                <button type="button" class="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  [disabled]="!!selectedEmployeeId"
                  [ngClass]="activeTab === 'team' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'"
                  (click)="activeTab = 'team'">
                  Equipo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5">
          <div class="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Desde</label>
              <input type="date" class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition" [(ngModel)]="startDate" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Hasta</label>
              <input type="date" class="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition" [(ngModel)]="endDate" />
            </div>
            <div class="md:col-span-3">
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Integrante</label>
              <div class="relative">
                <select class="w-full h-10 px-3 pr-10 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium appearance-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition" [(ngModel)]="selectedEmployeeId">
                  <option [ngValue]="null">Todos (Global)</option>
                  @for (opt of employeeOptions; track opt.employee_id) {
                    <option [ngValue]="opt.employee_id">{{ opt.employee_name }}</option>
                  }
                </select>
                <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
              </div>
            </div>
            <div class="md:col-span-2 flex items-center justify-end gap-2">
              <button type="button" class="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-40" (click)="resetToGlobal()" [disabled]="loading || !selectedEmployeeId">
                Ver global
              </button>
              <button type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-purple-500/20 transition disabled:opacity-40" (click)="load()" [disabled]="loading">
                {{ loading ? 'Cargando...' : 'Actualizar' }}
              </button>
            </div>
          </div>
          @if (error) {
            <div class="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
              <span class="text-sm font-medium text-red-700 dark:text-red-300">{{ error }}</span>
            </div>
          }
        </div>

        @if (activeTab === 'summary') {
          <!-- Loading skeleton -->
          @if (loading) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
              }
            </div>
          }

          @if (!loading) {
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Total Followups -->
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200/70 dark:ring-blue-800/50">Total</span>
                </div>
                <div class="mt-3">
                  <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ kpis.total_followups || 0 }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Casos en gesti&oacute;n</div>
                </div>
              </div>

              <!-- Overdue -->
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-200/70 dark:ring-red-800/50">Mora</span>
                </div>
                <div class="mt-3">
                  <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ kpis.overdue_followups || 0 }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pagos vencidos</div>
                </div>
              </div>

              <!-- In Progress -->
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-800/50">Activos</span>
                </div>
                <div class="mt-3">
                  <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ kpis.in_progress_followups || 0 }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Casos activos</div>
                </div>
              </div>

              <!-- Resolved -->
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-800/50">Cerrados</span>
                </div>
                <div class="mt-3">
                  <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ kpis.resolved_followups || 0 }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Casos cerrados</div>
                </div>
              </div>
            </div>

            <!-- Activity Section -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                </div>
                <h2 class="text-base font-bold text-gray-900 dark:text-white">Gestiones y Actividad</h2>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                @for (item of activityItems(); track item.label) {
                  <div class="text-center p-3 rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/40">
                    <div class="text-2xl font-bold" [class]="item.colorClass">{{ item.value }}</div>
                    <div class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">{{ item.label }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Contact & Commitments -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
                  </div>
                  <h2 class="text-base font-bold text-gray-900 dark:text-white">Efectividad de Contacto</h2>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Contactados</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white">{{ kpis.contacted_count || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">No responde</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white">{{ kpis.unreachable_count || 0 }}</span>
                  </div>
                  <div class="pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Tasa de contacto</span>
                      <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ calculateContactRate() }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>
                  </div>
                  <h2 class="text-base font-bold text-gray-900 dark:text-white">Compromisos de Pago</h2>
                </div>
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white">{{ kpis.commitments_total || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Cumplidos</span>
                    <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ kpis.commitments_fulfilled || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Pendientes</span>
                    <span class="text-sm font-bold text-amber-600 dark:text-amber-400">{{ kpis.commitments_pending || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Vencidos</span>
                    <span class="text-sm font-bold text-red-600 dark:text-red-400">{{ kpis.commitments_overdue || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Vencen 7 d&iacute;as</span>
                    <span class="text-sm font-bold text-sky-600 dark:text-sky-400">{{ kpis.commitments_due_7d || 0 }}</span>
                  </div>
                  <div class="pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Tasa de cumplimiento</span>
                      <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ calculateFulfillmentRate() }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Financial Metrics -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
              <div class="flex items-center gap-2 mb-5">
                <div class="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h2 class="text-base font-bold text-gray-900 dark:text-white">M&eacute;tricas Financieras</h2>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                  <div class="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Monto en Gesti&oacute;n</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">S/ {{ (kpis.total_amount || 0) | number:'1.2-2' }}</div>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                  <div class="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Recuperado (periodo)</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">S/ {{ (kpis.recovered_amount || 0) | number:'1.2-2' }}</div>
                </div>
                <div class="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                  <div class="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Tasa de Recuperaci&oacute;n</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ calculateRecoveryRate() }}%</div>
                </div>
              </div>
            </div>
          }
        }

        @if (activeTab === 'team') {
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div class="p-4 sm:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-200/60 dark:border-gray-700/60">
              <h2 class="text-base font-bold text-gray-900 dark:text-white">Desempe&ntilde;o por integrante</h2>
              <input type="text" [(ngModel)]="teamSearch" class="h-9 w-72 max-w-[70vw] px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition" placeholder="Buscar integrante..." />
            </div>
            <div class="relative overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="bg-gray-50/80 dark:bg-gray-900/40">
                    <th class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Integrante</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recuperado</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cartera</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contacto</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Comp.pend.</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Comp.venc.</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mora</th>
                    <th class="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  @for (row of filteredTeam(); track row.employee_id) {
                    <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                      <td class="px-4 py-3">
                        <div class="font-semibold text-gray-900 dark:text-white">{{ row.employee_name }}</div>
                        <div class="text-[11px] text-gray-500 dark:text-gray-400">Followups: {{ row.assigned_followups || 0 }} &middot; En progreso: {{ row.in_progress_followups || 0 }}</div>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="font-bold text-emerald-700 dark:text-emerald-300">{{ formatCurrency(row.recovered_amount || 0) }}</div>
                        <div class="mt-1 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div class="h-full bg-emerald-500 rounded-full transition-all" [style.width.%]="percentOfMax(row.recovered_amount || 0, maxRecovered())"></div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-right font-semibold text-red-700 dark:text-red-300">{{ formatCurrency(row.pending_amount || 0) }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ row.total_logs || 0 }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ calcContactRate(row) }}%</td>
                      <td class="px-4 py-3 text-right font-semibold text-amber-700 dark:text-amber-300">{{ row.commitments_pending || 0 }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-red-700 dark:text-red-300">{{ row.commitments_overdue || 0 }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ row.overdue_followups || 0 }}</td>
                      <td class="px-4 py-3 text-right">
                        <button type="button" class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition" (click)="focusEmployee(row.employee_id)">Ver KPI</button>
                      </td>
                    </tr>
                  }
                  @if (!filteredTeam().length) {
                    <tr>
                      <td colspan="9" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos para el periodo seleccionado</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class CollectionsKpisComponent {
  kpis: any = {};
  team: any[] = [];
  employeeOptions: Array<{ employee_id: number; employee_name: string }> = [];
  activeTab: 'summary' | 'team' = 'summary';
  selectedEmployeeId: number | null = null;
  teamSearch = '';
  loading = false;
  error: string | null = null;
  startDate = this.getMonthStartString();
  endDate = this.getTodayString();
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(){
    this.load();
  }

  activityItems(): Array<{ value: number; label: string; colorClass: string }> {
    return [
      { value: this.kpis.total_logs || 0, label: 'Total', colorClass: 'text-blue-600 dark:text-blue-400' },
      { value: this.kpis.calls_count || 0, label: 'Llamadas', colorClass: 'text-green-600 dark:text-green-400' },
      { value: this.kpis.whatsapp_count || 0, label: 'WhatsApp', colorClass: 'text-emerald-600 dark:text-emerald-400' },
      { value: this.kpis.email_count || 0, label: 'Email', colorClass: 'text-indigo-600 dark:text-indigo-400' },
      { value: this.kpis.sms_count || 0, label: 'SMS', colorClass: 'text-sky-600 dark:text-sky-400' },
      { value: this.kpis.letter_count || 0, label: 'Carta', colorClass: 'text-amber-600 dark:text-amber-400' },
      { value: this.kpis.commitment_logs_count || 0, label: 'Comp.', colorClass: 'text-teal-600 dark:text-teal-400' },
      { value: this.kpis.payment_count || 0, label: 'Pagos', colorClass: 'text-purple-600 dark:text-purple-400' },
    ];
  }

  load() {
    this.loading = true;
    this.error = null;
    let params = new HttpParams();
    if (this.startDate) params = params.set('start_date', this.startDate);
    if (this.endDate) params = params.set('end_date', this.endDate);
    if (this.selectedEmployeeId) params = params.set('employee_id', String(this.selectedEmployeeId));
    this.http.get<any>(`${API_ROUTES.COLLECTIONS.BASE}/kpis`, { params }).subscribe({
      next: (res) => {
        this.kpis = res?.data || {};
        this.team = Array.isArray(this.kpis?.team) ? this.kpis.team : [];
        this.employeeOptions = this.team
          .map((t: any) => ({ employee_id: Number(t.employee_id), employee_name: String(t.employee_name || `Empleado #${t.employee_id}`) }))
          .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
        if (this.selectedEmployeeId) this.activeTab = 'summary';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar KPIs';
      }
    });
  }

  calculateContactRate(): number {
    const total = (this.kpis.contacted_count || 0) + (this.kpis.unreachable_count || 0);
    if (total === 0) return 0;
    return Math.round((this.kpis.contacted_count || 0) / total * 100);
  }

  calculateFulfillmentRate(): number {
    const total = this.kpis.commitments_total || 0;
    if (total === 0) return 0;
    return Math.round((this.kpis.commitments_fulfilled || 0) / total * 100);
  }

  calculateRecoveryRate(): number {
    const total = this.kpis.total_amount || 0;
    if (total === 0) return 0;
    return Math.round((this.kpis.recovered_amount || 0) / total * 100);
  }

  resetToGlobal() {
    this.selectedEmployeeId = null;
    this.activeTab = 'summary';
    this.load();
  }

  focusEmployee(employeeId: number) {
    this.selectedEmployeeId = Number(employeeId);
    this.activeTab = 'summary';
    this.load();
  }

  filteredTeam(): any[] {
    const q = (this.teamSearch || '').toLowerCase().trim();
    const list = Array.isArray(this.team) ? this.team : [];
    if (!q) return list;
    return list.filter((r: any) => String(r?.employee_name || '').toLowerCase().includes(q));
  }

  maxRecovered(): number {
    const list = Array.isArray(this.team) ? this.team : [];
    return list.reduce((max, r: any) => Math.max(max, Number(r?.recovered_amount || 0)), 0);
  }

  percentOfMax(value: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.max(0, Math.min(100, (Number(value || 0) / max) * 100));
  }

  calcContactRate(row: any): number {
    const contacted = Number(row?.contacted_count || 0);
    const unreachable = Number(row?.unreachable_count || 0);
    const total = contacted + unreachable;
    if (!total) return 0;
    return Math.round((contacted / total) * 100);
  }

  formatCurrency(amount: any): string {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value);
  }

  private getTodayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getMonthStartString(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  }
}