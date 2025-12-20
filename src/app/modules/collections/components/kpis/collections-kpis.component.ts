import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES } from '../../../../core/constants/api.routes';

@Component({
  selector: 'app-collections-kpis',
  standalone: true,
  imports: [CommonModule, TranslateModule],
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
            <div class="text-blue-100 text-sm font-medium">Total Seguimientos</div>
            <div class="text-3xl">📋</div>
          </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.total_followups || 0 }}</div>
          <div class="text-blue-100 text-xs">Casos activos en gestión</div>
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
          <div class="text-amber-100 text-xs">Casos siendo gestionados</div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <div class="text-green-100 text-sm font-medium">Resueltos</div>
            <div class="text-3xl">✅</div>
          </div>
          <div class="text-4xl font-bold mb-1">{{ kpis.resolved_followups || 0 }}</div>
          <div class="text-green-100 text-xs">Casos cerrados exitosamente</div>
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
            <div class="text-purple-100 text-sm mb-1">Monto Recuperado (mes)</div>
            <div class="text-3xl font-bold">S/ {{ (kpis.recovered_amount || 0) | number:'1.2-2' }}</div>
          </div>
          <div>
            <div class="text-purple-100 text-sm mb-1">Tasa de Recuperación</div>
            <div class="text-3xl font-bold">{{ calculateRecoveryRate() }}%</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CollectionsKpisComponent {
  kpis: any = {};
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(){
    this.http.get<any>(`${API_ROUTES.COLLECTIONS.BASE}/kpis`).subscribe(res => this.kpis = res?.data || {});
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
