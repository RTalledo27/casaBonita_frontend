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
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-4xl">📊</span>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">KPIs de Cobranzas</h1>
            <p class="text-gray-600 dark:text-gray-400">Indicadores de rendimiento y gestión</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Periodo</div>
            <select [(ngModel)]="periodPreset" (change)="onFiltersChanged()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="this_month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="range">Rango</option>
            </select>
          </div>

          <div *ngIf="periodPreset !== 'range'">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Mes/Año</div>
            <div class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white">
              {{ (period?.start_date || '') }} → {{ (period?.end_date || '') }}
            </div>
          </div>

          <div *ngIf="periodPreset === 'range'">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Inicio</div>
            <input type="date" [(ngModel)]="startDate" (change)="onFiltersChanged()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>

          <div *ngIf="periodPreset === 'range'">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Fin</div>
            <input type="date" [(ngModel)]="endDate" (change)="onFiltersChanged()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Gestor</div>
            <select [(ngModel)]="selectedEmployeeId" (change)="onFiltersChanged()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let a of agents" [ngValue]="a.employee_id">{{ a.employee_name }}</option>
            </select>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ loading ? 'Cargando KPIs…' : (error ? error : '') }}
          </div>
          <button (click)="refresh()"
            class="px-3 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold">
            Actualizar
          </button>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 mb-6 rounded-r-lg">
        <div class="flex items-start gap-3">
          <span class="text-2xl">ℹ️</span>
          <div class="flex-1">
            <h3 class="font-semibold text-purple-900 dark:text-purple-100 mb-1">¿Qué muestra esta vista?</h3>
            <p class="text-sm text-purple-800 dark:text-purple-200">
              Este dashboard <strong>consolida métricas en tiempo real</strong> del módulo de cobranzas, calculando automáticamente:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm text-purple-700 dark:text-purple-300">
              <div>
                <strong>📋 Estado de Seguimientos:</strong> Total activos, en mora, en progreso y resueltos
              </div>
              <div>
                <strong>📞 Actividad de Gestión:</strong> Conteo de llamadas, WhatsApp, emails enviados
              </div>
              <div>
                <strong>🎯 Efectividad:</strong> Tasa de contacto exitoso vs. no localizados
              </div>
              <div>
                <strong>💼 Compromisos:</strong> Total, cumplidos, pendientes y tasa de cumplimiento
              </div>
              <div>
                <strong>💰 Métricas Financieras:</strong> Montos en gestión, recuperados y tasa de recuperación
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
            <div class="text-blue-100 text-sm font-medium">Seguimientos del Periodo</div>
            <div class="text-3xl">📋</div>
            </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.period_total_followups ?? kpis.due_in_period ?? 0 }}</div>
          <div class="text-blue-100 text-xs">En cartera total: {{ kpis.total_followups || 0 }}</div>
          </div>

          <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
            <div class="text-red-100 text-sm font-medium">Mora del Periodo</div>
            <div class="text-3xl">🔴</div>
            </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.period_overdue_followups ?? kpis.overdue_in_period ?? 0 }}</div>
          <div class="text-red-100 text-xs">En mora total: {{ kpis.overdue_followups || 0 }}</div>
          </div>

          <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
            <div class="text-amber-100 text-sm font-medium">En Progreso (periodo)</div>
            <div class="text-3xl">⚡</div>
            </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.period_in_progress_followups || 0 }}</div>
          <div class="text-amber-100 text-xs">En progreso total: {{ kpis.in_progress_followups || 0 }}</div>
          </div>

          <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
            <div class="text-green-100 text-sm font-medium">Resueltos (periodo)</div>
            <div class="text-3xl">✅</div>
            </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.period_resolved_followups || 0 }}</div>
          <div class="text-green-100 text-xs">Resueltos total: {{ kpis.resolved_followups || 0 }}</div>
          </div>
        </div>

      <!-- Activity KPIs -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📞</span> Gestiones y Actividad
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ kpis.total_logs || 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Gestiones</div>
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
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Emails</div>
          </div>
        </div>
      </div>

      <!-- Effectiveness -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Efectividad de Contacto
          </h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Contactados exitosamente</span>
              <span class="font-bold text-gray-900 dark:text-white">{{ kpis.contacted_count || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">No localizados</span>
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
              <span class="text-gray-600 dark:text-gray-400">Total compromisos</span>
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
            <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Tasa de cumplimiento</span>
                <span class="font-bold text-2xl text-green-600 dark:text-green-400">{{ calculateFulfillmentRate() }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recovery Amount -->
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
            <div class="text-purple-100 text-sm mb-1">Monto Recuperado (periodo)</div>
            <div class="text-3xl font-bold">S/ {{ (kpis.recovered_amount || 0) | number:'1.2-2' }}</div>
          </div>
          <div>
            <div class="text-purple-100 text-sm mb-1">Tasa de Recuperación</div>
            <div class="text-3xl font-bold">{{ calculateRecoveryRate() }}%</div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏆</span> Ranking de Gestores (periodo)
          </h2>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Ordenado por recuperado
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-4">Gestor</th>
                <th class="py-2 pr-4 text-right">Cartera (S/)</th>
                <th class="py-2 pr-4 text-right">Recuperado (S/)</th>
                <th class="py-2 pr-4 text-right">Gestiones</th>
                <th class="py-2 pr-4 text-right">Contacto</th>
                <th class="py-2 pr-4 text-right">Cumplimiento</th>
                <th class="py-2 pr-0 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of leaderboard" class="border-b border-gray-100 dark:border-gray-700/60 text-gray-900 dark:text-gray-100">
                <td class="py-3 pr-4 font-semibold">{{ row.employee_name }}</td>
                <td class="py-3 pr-4 text-right">{{ row.portfolio_pending_amount | number:'1.2-2' }}</td>
                <td class="py-3 pr-4 text-right font-bold text-green-700 dark:text-green-400">{{ row.period_recovered_amount | number:'1.2-2' }}</td>
                <td class="py-3 pr-4 text-right">{{ row.period_logs }}</td>
                <td class="py-3 pr-4 text-right">{{ row.period_contact_rate | number:'1.0-1' }}%</td>
                <td class="py-3 pr-4 text-right">{{ row.period_fulfillment_rate | number:'1.0-1' }}%</td>
                <td class="py-3 pr-0 text-right font-bold">{{ computeScore(row) | number:'1.0-0' }}</td>
              </tr>
              <tr *ngIf="leaderboard.length === 0">
                <td colspan="7" class="py-6 text-center text-gray-500 dark:text-gray-400">
                  Sin datos para el periodo seleccionado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class CollectionsKpisComponent {
  kpis: any = {};
  leaderboard: any[] = [];
  fullLeaderboard: any[] = [];
  agents: any[] = [];
  period: any = null;
  loading = false;
  error: string | null = null;

  periodPreset: 'this_month' | 'last_month' | 'range' = 'this_month';
  startDate: string | null = null;
  endDate: string | null = null;
  selectedEmployeeId: number | null = null;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(){
    this.applyPreset();
    this.loadKpis();
  }

  onFiltersChanged() {
    if (this.periodPreset !== 'range') {
      this.applyPreset();
    }
    this.loadKpis();
  }

  refresh() {
    this.loadKpis(true);
  }

  private applyPreset() {
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const toYmd = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (this.periodPreset === 'this_month') {
      this.startDate = toYmd(new Date(current.getFullYear(), current.getMonth(), 1));
      this.endDate = toYmd(new Date(current.getFullYear(), current.getMonth() + 1, 0));
    }
    if (this.periodPreset === 'last_month') {
      this.startDate = toYmd(new Date(prev.getFullYear(), prev.getMonth(), 1));
      this.endDate = toYmd(new Date(prev.getFullYear(), prev.getMonth() + 1, 0));
    }
  }

  private loadKpis(fresh = false) {
    this.loading = true;
    this.error = null;

    let params = new HttpParams();
    if (this.periodPreset === 'range' || this.periodPreset === 'this_month' || this.periodPreset === 'last_month') {
      if (this.startDate) params = params.set('start', this.startDate);
      if (this.endDate) params = params.set('end', this.endDate);
    }
    if (this.selectedEmployeeId) params = params.set('employee_id', this.selectedEmployeeId.toString());
    if (fresh) params = params.set('fresh', '1');

    this.http.get<any>(`${API_ROUTES.COLLECTIONS.BASE}/kpis`, { params }).subscribe({
      next: (res) => {
        this.kpis = res?.data || {};
        this.period = this.kpis?.period || null;
        this.fullLeaderboard = Array.isArray(this.kpis?.leaderboard) ? this.kpis.leaderboard : [];
        this.leaderboard = this.selectedEmployeeId
          ? this.fullLeaderboard.filter(r => r?.employee_id === this.selectedEmployeeId)
          : this.fullLeaderboard;

        const agents = Array.isArray(this.fullLeaderboard)
          ? this.fullLeaderboard
              .filter((x: any) => x && x.employee_id)
              .map((x: any) => ({ employee_id: x.employee_id, employee_name: x.employee_name }))
          : [];
        const unique = new Map<number, any>();
        for (const a of agents) unique.set(a.employee_id, a);
        this.agents = Array.from(unique.values()).sort((a, b) => a.employee_name.localeCompare(b.employee_name));
      },
      error: () => {
        this.error = 'No se pudo cargar KPIs';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  computeScore(row: any): number {
    const maxRecovered = Math.max(0, ...this.leaderboard.map(r => r?.period_recovered_amount || 0));
    const maxLogs = Math.max(0, ...this.leaderboard.map(r => r?.period_logs || 0));

    const recoveredScore = maxRecovered > 0 ? ((row?.period_recovered_amount || 0) / maxRecovered) * 100 : 0;
    const productivityScore = maxLogs > 0 ? ((row?.period_logs || 0) / maxLogs) * 100 : 0;

    const contactRate = row?.period_contact_rate || 0;
    const fulfillmentRate = row?.period_fulfillment_rate || 0;

    return (recoveredScore * 0.4) + (contactRate * 0.2) + (fulfillmentRate * 0.2) + (productivityScore * 0.2);
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
}
