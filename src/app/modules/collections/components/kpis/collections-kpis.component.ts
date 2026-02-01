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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div class="max-w-[1400px] mx-auto">
        <div class="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl mb-6">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600"></div>
          <div class="p-6 sm:p-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <span class="text-xl">📊</span>
                </div>
                <div class="min-w-0">
                  <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate">KPIs de Cobranzas</h1>
                  <p class="text-gray-600 dark:text-gray-400">Evaluación de gestión · desempeño del equipo · trazabilidad</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/70 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/70 dark:ring-slate-700/60" *ngIf="kpis?.period">
                  Periodo: {{ kpis.period.start }} → {{ kpis.period.end }}
                </span>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200 ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                  Alcance: {{ selectedEmployeeId ? 'Por integrante' : 'Global' }}
                </span>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div class="inline-flex rounded-2xl bg-gray-100 dark:bg-gray-700/60 p-1 border border-gray-200/60 dark:border-gray-600/60">
                <button type="button" class="px-3 py-2 rounded-xl text-sm font-semibold"
                  [ngClass]="activeTab === 'summary' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                  (click)="activeTab = 'summary'">
                  Resumen
                </button>
                <button type="button" class="px-3 py-2 rounded-xl text-sm font-semibold"
                  [disabled]="!!selectedEmployeeId"
                  [ngClass]="activeTab === 'team' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'"
                  (click)="activeTab = 'team'">
                  Equipo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white/90 dark:bg-gray-800/90 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Desde</label>
              <input type="date" class="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 font-semibold" [(ngModel)]="startDate" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
              <input type="date" class="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 font-semibold" [(ngModel)]="endDate" />
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Integrante</label>
              <select class="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 font-semibold" [(ngModel)]="selectedEmployeeId">
                <option [ngValue]="null">Todos (Global)</option>
                <option *ngFor="let opt of employeeOptions" [ngValue]="opt.employee_id">{{ opt.employee_name }}</option>
              </select>
            </div>
            <div class="md:col-span-2 flex items-center justify-end gap-3">
              <button type="button" class="px-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold disabled:opacity-50" (click)="resetToGlobal()" [disabled]="loading || !selectedEmployeeId">
                Ver global
              </button>
              <button type="button" class="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50" (click)="load()" [disabled]="loading">
                {{ loading ? 'Cargando...' : 'Actualizar' }}
              </button>
            </div>
          </div>
          <div *ngIf="error" class="mt-3 text-sm font-semibold text-red-600">{{ error }}</div>
        </div>

        <ng-container *ngIf="activeTab === 'summary'">
          <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            <div class="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            <div class="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            <div class="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          </div>

          <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-2">
                <div class="text-blue-100 text-sm font-medium">Total Seguimientos</div>
                <div class="text-3xl">📋</div>
              </div>
              <div class="text-4xl font-bold mb-1">{{ kpis.total_followups || 0 }}</div>
              <div class="text-blue-100 text-xs">Casos en gestión</div>
            </div>

            <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-2">
                <div class="text-red-100 text-sm font-medium">En Mora</div>
                <div class="text-3xl">🔴</div>
              </div>
              <div class="text-4xl font-bold mb-1">{{ kpis.overdue_followups || 0 }}</div>
              <div class="text-red-100 text-xs">Pagos vencidos</div>
            </div>

            <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-2">
                <div class="text-amber-100 text-sm font-medium">En Progreso</div>
                <div class="text-3xl">⚡</div>
              </div>
              <div class="text-4xl font-bold mb-1">{{ kpis.in_progress_followups || 0 }}</div>
              <div class="text-amber-100 text-xs">Casos activos</div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-2">
                <div class="text-green-100 text-sm font-medium">Resueltos</div>
                <div class="text-3xl">✅</div>
              </div>
              <div class="text-4xl font-bold mb-1">{{ kpis.resolved_followups || 0 }}</div>
              <div class="text-green-100 text-xs">Casos cerrados</div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📞</span> Gestiones y Actividad
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ kpis.total_logs || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-green-600 dark:text-green-400">{{ kpis.calls_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Llamadas</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ kpis.whatsapp_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">WhatsApp</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ kpis.email_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Email</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-sky-600 dark:text-sky-400">{{ kpis.sms_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">SMS</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ kpis.letter_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Carta</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-teal-600 dark:text-teal-400">{{ kpis.commitment_logs_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Comp.</div>
              </div>
              <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ kpis.payment_count || 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Pagos</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🎯</span> Efectividad de Contacto
              </h2>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Contactados</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ kpis.contacted_count || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">No responde</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ kpis.unreachable_count || 0 }}</span>
                </div>
                <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700 dark:text-gray-300 font-medium">Tasa de contacto</span>
                    <span class="font-bold text-2xl text-green-600 dark:text-green-400">{{ calculateContactRate() }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>💼</span> Compromisos de Pago
              </h2>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Total</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ kpis.commitments_total || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Cumplidos</span>
                  <span class="font-bold text-green-600 dark:text-green-400">{{ kpis.commitments_fulfilled || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Pendientes</span>
                  <span class="font-bold text-amber-600 dark:text-amber-400">{{ kpis.commitments_pending || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Vencidos</span>
                  <span class="font-bold text-rose-600 dark:text-rose-400">{{ kpis.commitments_overdue || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Vencen 7 días</span>
                  <span class="font-bold text-sky-600 dark:text-sky-400">{{ kpis.commitments_due_7d || 0 }}</span>
                </div>
                <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700 dark:text-gray-300 font-medium">Tasa de cumplimiento</span>
                    <span class="font-bold text-2xl text-green-600 dark:text-green-400">{{ calculateFulfillmentRate() }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-700 dark:to-pink-800 rounded-xl shadow-lg p-6 text-white">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
              <span>💰</span> Métricas Financieras
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div class="text-purple-100 text-sm mb-1">Monto en Gestión</div>
                <div class="text-3xl font-bold">S/ {{ (kpis.total_amount || 0) | number:'1.2-2' }}</div>
              </div>
              <div>
                <div class="text-purple-100 text-sm mb-1">Recuperado (periodo)</div>
                <div class="text-3xl font-bold">S/ {{ (kpis.recovered_amount || 0) | number:'1.2-2' }}</div>
              </div>
              <div>
                <div class="text-purple-100 text-sm mb-1">Tasa de Recuperación</div>
                <div class="text-3xl font-bold">{{ calculateRecoveryRate() }}%</div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-container *ngIf="activeTab === 'team'">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-200/60 dark:border-gray-700/60">
              <div class="text-lg font-bold text-gray-900 dark:text-white">Desempeño por integrante</div>
              <div class="flex items-center gap-3">
                <input type="text" [(ngModel)]="teamSearch" class="h-10 w-72 max-w-[70vw] px-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" placeholder="Buscar integrante..." />
              </div>
            </div>
            <div class="relative overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th class="text-left px-4 py-3 font-extrabold">Integrante</th>
                    <th class="text-right px-4 py-3 font-extrabold">Recuperado</th>
                    <th class="text-right px-4 py-3 font-extrabold">Cartera (mora)</th>
                    <th class="text-right px-4 py-3 font-extrabold">Acciones</th>
                    <th class="text-right px-4 py-3 font-extrabold">Contacto</th>
                    <th class="text-right px-4 py-3 font-extrabold">Comp. pend.</th>
                    <th class="text-right px-4 py-3 font-extrabold">Comp. venc.</th>
                    <th class="text-right px-4 py-3 font-extrabold">Casos mora</th>
                    <th class="text-right px-4 py-3 font-extrabold"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of filteredTeam()" class="border-t border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-50/60 dark:hover:bg-gray-900/30">
                    <td class="px-4 py-3">
                      <div class="font-bold text-gray-900 dark:text-white">{{ row.employee_name }}</div>
                      <div class="text-[11px] text-gray-500 dark:text-gray-400">Followups: {{ row.assigned_followups || 0 }} · En progreso: {{ row.in_progress_followups || 0 }}</div>
                    </td>
                    <td class="px-4 py-3 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                      {{ formatCurrency(row.recovered_amount || 0) }}
                      <div class="mt-1 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500" [style.width.%]="percentOfMax(row.recovered_amount || 0, maxRecovered())"></div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-300">{{ formatCurrency(row.pending_amount || 0) }}</td>
                    <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{{ row.total_logs || 0 }}</td>
                    <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{{ calcContactRate(row) }}%</td>
                    <td class="px-4 py-3 text-right font-bold text-amber-700 dark:text-amber-300">{{ row.commitments_pending || 0 }}</td>
                    <td class="px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-300">{{ row.commitments_overdue || 0 }}</td>
                    <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{{ row.overdue_followups || 0 }}</td>
                    <td class="px-4 py-3 text-right">
                      <button type="button" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold" (click)="focusEmployee(row.employee_id)">Ver KPI</button>
                    </td>
                  </tr>
                  <tr *ngIf="!filteredTeam().length">
                    <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Sin datos para el periodo seleccionado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>
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
