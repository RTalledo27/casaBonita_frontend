import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CollectorEfficiency {
  collector_id: number;
  collector_name: string;
  total_assigned: number;
  total_collected: number;
  collection_rate: number;
  avg_collection_time: number;
  overdue_accounts: number;
  efficiency_score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendData {
  period: string;
  collected_amount: number;
  target_amount: number;
  collection_rate: number;
  accounts_resolved: number;
  avg_resolution_time: number;
}

export interface PredictionData {
  period: string;
  predicted_collection: number;
  confidence_level: number;
  factors: {
    seasonal_trend: number;
    historical_performance: number;
    current_portfolio: number;
  };
}

export interface AgingAnalysis {
  age_range: string;
  total_amount: number;
  account_count: number;
  percentage: number;
  recovery_probability: number;
}

export interface ProductivityMetrics {
  collector_id: number;
  collector_name: string;
  calls_made: number;
  contacts_successful: number;
  promises_obtained: number;
  payments_received: number;
  productivity_score: number;
  daily_average: number;
}

export interface CashFlowProjection {
  date: string;
  projected_inflow: number;
  confirmed_payments: number;
  probable_payments: number;
  optimistic_scenario: number;
  pessimistic_scenario: number;
}

export interface DashboardMetrics {
  total_portfolio: number;
  collected_this_month: number;
  collection_rate: number;
  overdue_amount: number;
  active_collectors: number;
  avg_resolution_time: number;
  trend_vs_last_month: number;
  top_performer: {
    name: string;
    efficiency: number;
  };
}

export interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
  collectorIds?: number[];
  amountRange?: {
    min: number;
    max: number;
  };
  statusFilter?: string[];
  comparisonPeriod?: 'previous_month' | 'previous_quarter' | 'previous_year';
  groupBy?: 'collector' | 'status' | 'month' | 'week';
  includeInactive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.URL_BACKEND}/collections/reports`;

  // Dashboard Metrics
  getDashboardMetrics(filters?: Partial<AdvancedFilters>): Observable<DashboardMetrics> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: DashboardMetrics }>(`${this.apiUrl}/dashboard`, { params })
      .pipe(map(response => response.data));
  }

  // Collector Efficiency Analysis
  getCollectorEfficiency(filters?: AdvancedFilters): Observable<CollectorEfficiency[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: CollectorEfficiency[] }>(`${this.apiUrl}/collector-efficiency`, { params })
      .pipe(map(response => response.data || []));
  }

  // Trend Analysis
  getTrendAnalysis(period: 'daily' | 'weekly' | 'monthly' = 'monthly', filters?: AdvancedFilters): Observable<TrendData[]> {
    let params = new HttpParams().set('period', period);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: TrendData[] }>(`${this.apiUrl}/trends`, { params })
      .pipe(map(response => response.data || []));
  }

  // Predictions
  getCollectionPredictions(months: number = 3, filters?: AdvancedFilters): Observable<PredictionData[]> {
    let params = new HttpParams().set('months', months.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: PredictionData[] }>(`${this.apiUrl}/predictions`, { params })
      .pipe(map(response => response.data || []));
  }

  // Aging Analysis
  getAgingAnalysis(filters?: AdvancedFilters): Observable<AgingAnalysis[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: AgingAnalysis[] }>(`${this.apiUrl}/aging-analysis`, { params })
      .pipe(map(response => response.data || []));
  }

  // Productivity Metrics
  getProductivityMetrics(filters?: AdvancedFilters): Observable<ProductivityMetrics[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: ProductivityMetrics[] }>(`${this.apiUrl}/productivity`, { params })
      .pipe(map(response => response.data || []));
  }

  // Cash Flow Projections
  getCashFlowProjections(days: number = 30, filters?: AdvancedFilters): Observable<CashFlowProjection[]> {
    let params = new HttpParams().set('days', days.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: CashFlowProjection[] }>(`${this.apiUrl}/cash-flow`, { params })
      .pipe(map(response => response.data || []));
  }

  // Comparison Analysis
  getComparisonAnalysis(currentFilters: AdvancedFilters, comparisonPeriod: string): Observable<{
    current: DashboardMetrics;
    comparison: DashboardMetrics;
    variance: {
      collection_rate: number;
      total_collected: number;
      efficiency_change: number;
    };
  }> {
    const params = new HttpParams()
      .set('current_period', JSON.stringify(currentFilters))
      .set('comparison_period', comparisonPeriod);

    return this.http.get<{ data: any }>(`${this.apiUrl}/comparison`, { params })
      .pipe(map(response => response.data));
  }

  // Export Enhanced Reports
  exportAdvancedReport(reportType: string, filters: AdvancedFilters, format: 'excel' | 'pdf' = 'excel'): Observable<Blob> {
    let params = new HttpParams()
      .set('report_type', reportType)
      .set('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Comprehensive Report (combines multiple data sources)
  getComprehensiveReport(filters: AdvancedFilters): Observable<{
    dashboard: DashboardMetrics;
    efficiency: CollectorEfficiency[];
    trends: TrendData[];
    aging: AgingAnalysis[];
    productivity: ProductivityMetrics[];
    predictions: PredictionData[];
  }> {
    return forkJoin({
      dashboard: this.getDashboardMetrics(filters),
      efficiency: this.getCollectorEfficiency(filters),
      trends: this.getTrendAnalysis('monthly', filters),
      aging: this.getAgingAnalysis(filters),
      productivity: this.getProductivityMetrics(filters),
      predictions: this.getCollectionPredictions(3, filters)
    });
  }

  // Real-time metrics (for live dashboard updates)
  getRealTimeMetrics(): Observable<{
    active_calls: number;
    payments_today: number;
    collection_rate_today: number;
    online_collectors: number;
  }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/realtime`)
      .pipe(map(response => response.data));
  }

  // Heatmap data for calendar view
  getCollectionHeatmap(year: number, filters?: AdvancedFilters): Observable<{
    date: string;
    value: number;
    level: number;
  }[]> {
    let params = new HttpParams().set('year', year.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });
    }

    return this.http.get<{ data: any[] }>(`${this.apiUrl}/heatmap`, { params })
      .pipe(map(response => response.data || []));
  }
}