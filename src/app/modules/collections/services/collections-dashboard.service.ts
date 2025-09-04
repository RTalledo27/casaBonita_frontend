import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CollectionMetrics,
  CollectionTrends,
  MonthlyCollectionData,
  StatusDistribution,
  CollectorPerformance,
  DelinquentClient,
  CollectionTarget,
  DashboardKPI
} from '../models/collection-metrics';

@Injectable({
  providedIn: 'root'
})
export class CollectionsDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/collections/dashboard`;

  /**
   * Obtiene métricas generales del dashboard
   */
  getMetrics(currency?: 'PEN'): Observable<{ data: CollectionMetrics }> {
    let params = new HttpParams();
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: CollectionMetrics }>(`${this.baseUrl}/metrics`, { params });
  }

  /**
   * Obtiene tendencias de cobranza
   */
  getTrends(period: string = '12months', currency?: 'PEN'): Observable<{ data: CollectionTrends }> {
    let params = new HttpParams().set('period', period);
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: CollectionTrends }>(`${this.baseUrl}/trends`, { params });
  }

  /**
   * Obtiene datos mensuales de cobranza
   */
  getMonthlyData(months: number = 12, currency?: 'PEN'): Observable<{ data: MonthlyCollectionData[] }> {
    let params = new HttpParams().set('months', months.toString());
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: MonthlyCollectionData[] }>(`${this.baseUrl}/monthly-data`, { params });
  }

  /**
   * Obtiene distribución por estado
   */
  getStatusDistribution(currency?: 'PEN'): Observable<{ data: StatusDistribution[] }> {
    let params = new HttpParams();
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: StatusDistribution[] }>(`${this.baseUrl}/status-distribution`, { params });
  }

  /**
   * Obtiene top clientes morosos
   */
  getTopDelinquent(limit: number = 10, currency?: 'PEN'): Observable<{ data: DelinquentClient[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: DelinquentClient[] }>(`${this.baseUrl}/top-delinquent`, { params });
  }

  /**
   * Obtiene efectividad por cobrador
   */
  getCollectorEffectiveness(period?: string): Observable<{ data: CollectorPerformance[] }> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<{ data: CollectorPerformance[] }>(`${this.baseUrl}/collector-effectiveness`, { params });
  }

  /**
   * Obtiene KPIs principales del dashboard
   */
  getKPIs(currency?: 'PEN'): Observable<{ data: DashboardKPI[] }> {
    let params = new HttpParams();
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: DashboardKPI[] }>(`${this.baseUrl}/kpis`, { params });
  }

  /**
   * Obtiene metas de cobranza
   */
  getCollectionTargets(year?: number, currency?: 'PEN'): Observable<{ data: CollectionTarget[] }> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: CollectionTarget[] }>(`${this.baseUrl}/targets`, { params });
  }

  /**
   * Actualiza meta de cobranza
   */
  updateCollectionTarget(targetId: number, targetAmount: number): Observable<{ data: CollectionTarget }> {
    return this.http.put<{ data: CollectionTarget }>(`${this.baseUrl}/targets/${targetId}`, {
      target_amount: targetAmount
    });
  }

  /**
   * Obtiene comparación de períodos
   */
  getPeriodComparison(currentPeriod: string, previousPeriod: string, currency?: 'PEN'): Observable<{
    data: {
      current: CollectionMetrics;
      previous: CollectionMetrics;
      variance: {
        total_receivable: number;
        total_overdue: number;
        collection_rate: number;
        monthly_collections: number;
      };
    }
  }> {
    let params = new HttpParams()
      .set('current_period', currentPeriod)
      .set('previous_period', previousPeriod);
    
    if (currency) {
      params = params.set('currency', currency);
    }

    return this.http.get<{
      data: {
        current: CollectionMetrics;
        previous: CollectionMetrics;
        variance: {
          total_receivable: number;
          total_overdue: number;
          collection_rate: number;
          monthly_collections: number;
        };
      }
    }>(`${this.baseUrl}/period-comparison`, { params });
  }

  /**
   * Obtiene alertas del dashboard
   */
  getDashboardAlerts(): Observable<{
    data: {
      type: 'warning' | 'error' | 'info';
      title: string;
      message: string;
      count?: number;
      action_url?: string;
    }[]
  }> {
    return this.http.get<{
      data: {
        type: 'warning' | 'error' | 'info';
        title: string;
        message: string;
        count?: number;
        action_url?: string;
      }[]
    }>(`${this.baseUrl}/alerts`);
  }

  /**
   * Obtiene resumen de actividad reciente
   */
  getRecentActivity(limit: number = 10): Observable<{
    data: {
      activity_id: number;
      type: 'payment' | 'assignment' | 'status_change' | 'action';
      description: string;
      amount?: number;
      currency?: 'PEN';
      client_name?: string;
      collector_name?: string;
      created_at: string;
    }[]
  }> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{
      data: {
        activity_id: number;
        type: 'payment' | 'assignment' | 'status_change' | 'action';
        description: string;
        amount?: number;
        currency?: 'PEN';
        client_name?: string;
        collector_name?: string;
        created_at: string;
      }[]
    }>(`${this.baseUrl}/recent-activity`, { params });
  }

  /**
   * Exporta datos del dashboard
   */
  exportDashboardData(format: 'excel' | 'pdf', currency?: 'PEN'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (currency) {
      params = params.set('currency', currency);
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Refresca todas las métricas del dashboard
   */
  refreshDashboard(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/refresh`, {});
  }
}