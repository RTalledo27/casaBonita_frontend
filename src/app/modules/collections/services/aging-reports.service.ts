import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AgingReportData,
  AgingClientData,
  AgingReportFilters,
  AgingPeriodSummary,
  AgingExportOptions
} from '../models/aging-report';

@Injectable({
  providedIn: 'root'
})
export class AgingReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/collections/reports`;

  /**
   * Genera un reporte de antigüedad de saldos
   */
  generateAgingReport(filters?: AgingReportFilters): Observable<{ data: AgingReportData }> {
    let params = new HttpParams().set('type', 'aging');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: AgingReportData }>(`${this.baseUrl}`, { params });
  }

  /**
   * Obtiene el detalle de antigüedad de un cliente específico
   */
  getClientAgingDetail(clientId: number, filters?: Partial<AgingReportFilters>): Observable<{ data: AgingClientData }> {
    let params = new HttpParams()
      .set('type', 'aging')
      .set('client_id', clientId.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: AgingClientData }>(`${this.baseUrl}/client-detail`, { params });
  }

  /**
   * Obtiene resumen por períodos de antigüedad
   */
  getPeriodSummary(filters?: AgingReportFilters): Observable<{ data: AgingPeriodSummary[] }> {
    let params = new HttpParams().set('type', 'aging-summary');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: AgingPeriodSummary[] }>(`${this.baseUrl}/period-summary`, { params });
  }

  /**
   * Exporta reporte de antigüedad a Excel
   */
  exportToExcel(filters?: AgingReportFilters, options?: Partial<AgingExportOptions>): Observable<Blob> {
    let params = new HttpParams()
      .set('type', 'aging')
      .set('format', 'excel');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    if (options) {
      if (options.include_details !== undefined) {
        params = params.set('include_details', options.include_details.toString());
      }
      if (options.group_by_currency !== undefined) {
        params = params.set('group_by_currency', options.group_by_currency.toString());
      }
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Exporta reporte de antigüedad a PDF
   */
  exportToPDF(filters?: AgingReportFilters, options?: Partial<AgingExportOptions>): Observable<Blob> {
    let params = new HttpParams()
      .set('type', 'aging')
      .set('format', 'pdf');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    if (options) {
      if (options.include_details !== undefined) {
        params = params.set('include_details', options.include_details.toString());
      }
      if (options.group_by_currency !== undefined) {
        params = params.set('group_by_currency', options.group_by_currency.toString());
      }
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Generate aging report
   */
  generateReport(filters?: AgingReportFilters): Observable<{ data: AgingReportData }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: AgingReportData }>(`${this.baseUrl}/generate`, { params });
  }

  /**
   * Exporta reporte de antigüedad a CSV
   */
  exportToCSV(filters?: AgingReportFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('type', 'aging')
      .set('format', 'csv');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Obtiene tendencias de antigüedad por período
   */
  getAgingTrends(months: number = 12, currency?: 'PEN' | 'USD'): Observable<{
    data: {
      month: string;
      current: number;
      days_30: number;
      days_60: number;
      days_90: number;
      over_90: number;
    }[]
  }> {
    let params = new HttpParams()
      .set('type', 'aging-trends')
      .set('months', months.toString());
    
    if (currency) {
      params = params.set('currency', currency);
    }

    return this.http.get<{
      data: {
        month: string;
        current: number;
        days_30: number;
        days_60: number;
        days_90: number;
        over_90: number;
      }[]
    }>(`${this.baseUrl}/aging-trends`, { params });
  }

  /**
   * Obtiene comparación de antigüedad entre períodos
   */
  getAgingComparison(currentDate: string, previousDate: string, currency?: 'PEN' | 'USD'): Observable<{
    data: {
      current_period: AgingReportData;
      previous_period: AgingReportData;
      variance: {
        current: number;
        days_30: number;
        days_60: number;
        days_90: number;
        over_90: number;
        total: number;
      };
    }
  }> {
    let params = new HttpParams()
      .set('current_date', currentDate)
      .set('previous_date', previousDate);
    
    if (currency) {
      params = params.set('currency', currency);
    }

    return this.http.get<{
      data: {
        current_period: AgingReportData;
        previous_period: AgingReportData;
        variance: {
          current: number;
          days_30: number;
          days_60: number;
          days_90: number;
          over_90: number;
          total: number;
        };
      }
    }>(`${this.baseUrl}/aging-comparison`, { params });
  }

  /**
   * Programa la generación automática de reportes
   */
  scheduleAutomaticReport(config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'excel' | 'pdf';
    filters?: AgingReportFilters;
  }): Observable<{ message: string; schedule_id: number }> {
    return this.http.post<{ message: string; schedule_id: number }>(`${this.baseUrl}/schedule`, config);
  }
}