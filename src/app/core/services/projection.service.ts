import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api.routes';

export interface MonthData {
  year: number;
  month: number;
  period: string;
  month_label: string;
  sales_count: number;
  total_revenue: number;
  avg_sale_value: number;
  total_down_payments: number;
  total_financing: number;
}

export interface ProjectionData {
  year: number;
  month: number;
  period: string;
  month_label: string;
  projected_revenue: number;
  projected_revenue_base?: number;
  confidence: number;
  seasonal_factor?: number;
  is_projection: true;
}

export interface CurrentMonthData {
  year: number;
  month: number;
  period: string;
  month_label: string;
  actual_revenue: number;
  sales_count: number;
  avg_sale_value: number;
  days_elapsed: number;
  days_remaining: number;
  days_in_month: number;
  progress_percentage: number;
  projected_month_end: number;
  daily_rate: number;
}

// Keep old interfaces for backward compatibility
export interface QuarterData extends MonthData {}
export interface CurrentQuarterData extends CurrentMonthData {}

export interface GrowthAnalysis {
  quarterly_growth: Array<{
    quarter_label?: string;
    month_label?: string;
    growth_rate: number;
    previous_revenue: number;
    current_revenue: number;
    absolute_change: number;
  }>;
  average_growth_rate: number;
}

export interface RegressionQuality {
  r_squared: number;
  slope: number;
  interpretation: string;
}

export interface ProjectionSummary {
  last_quarter_revenue: number;
  current_quarter_actual: number;
  current_quarter_projected_end: number;
  next_quarter_projection: number;
  total_historical_revenue: number;
  total_projected_revenue: number;
  average_growth_rate: number;
  quarters_analyzed: number;
  quarters_projected: number;
  trend: string;
}

export interface RevenueProjection {
  historical_data: MonthData[];
  current_month?: CurrentMonthData;
  current_quarter?: CurrentQuarterData; // Backward compatibility
  projections: ProjectionData[];
  growth_analysis: GrowthAnalysis;
  seasonal_factors: { [key: string]: number };
  regression_quality: RegressionQuality;
  summary: ProjectionSummary;
}

export interface QuarterComparison {
  quarter: string;
  actual_revenue: number;
  projected_revenue: number | null;
  variance: number;
  variance_percent: number;
  performance: string;
}

export interface ProjectionSummaryResponse {
  current_quarter: {
    label: string;
    actual_revenue: number;
    projected_end: number;
    progress: number;
  };
  growth_rate: number;
  trend: string;
  next_quarter_projection: number;
  quarters_analyzed: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectionService {
  constructor(private http: HttpClient) {}

  /**
   * Get comprehensive revenue projection with historical data and future projections (MONTHLY)
   */
  getRevenueProjection(monthsAhead: number = 6, monthsBack: number = 12): Observable<{ success: boolean; data: RevenueProjection; message: string }> {
    console.log('🔮 ProjectionService: Getting monthly revenue projection', { monthsAhead, monthsBack });
    
    let params = new HttpParams()
      .set('months_ahead', monthsAhead.toString())
      .set('months_back', monthsBack.toString());

    return this.http.get<{ success: boolean; data: RevenueProjection; message: string }>(
      API_ROUTES.REPORTS.PROJECTIONS.REVENUE,
      { params }
    );
  }

  /**
   * Get quick summary for dashboard cards
   */
  getProjectionSummary(): Observable<{ success: boolean; data: ProjectionSummaryResponse }> {
    console.log('📊 ProjectionService: Getting projection summary');
    
    return this.http.get<{ success: boolean; data: ProjectionSummaryResponse }>(
      API_ROUTES.REPORTS.PROJECTIONS.REVENUE_SUMMARY
    );
  }

  /**
   * Compare actual vs projected for specific quarter
   */
  getQuarterComparison(year: number, quarter: number): Observable<{ success: boolean; data: QuarterComparison }> {
    console.log('🎯 ProjectionService: Getting quarter comparison', { year, quarter });
    
    let params = new HttpParams()
      .set('year', year.toString())
      .set('quarter', quarter.toString());

    return this.http.get<{ success: boolean; data: QuarterComparison }>(
      API_ROUTES.REPORTS.PROJECTIONS.REVENUE_COMPARE,
      { params }
    );
  }
}
