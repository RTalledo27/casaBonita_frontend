import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ExportFormat,
  ExportRequest,
  ExportResponse,
  SalesReport,
  PaymentSchedule,
  ProjectedReport
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = `${environment.URL_BACKEND}/v1/reports`;

  //inicializamos el constructor
  constructor(private http: HttpClient) { }

  // Método principal para exportar reportes
  exportReport(
    reportType: string,
    format: ExportFormat,
    filters?: any
  ): Observable<Blob> {
    const exportData: any = {
      format: format,
      type: reportType
    };

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          exportData[key] = value;
        }
      });
    }

    return this.http.post(`${this.apiUrl}/export`, exportData, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting report:', error);
        return of(new Blob());
      })
    );
  }

  // Sales Reports Export
  exportSalesReport(
    salesData: SalesReport[],
    format: ExportFormat,
    filters?: any
  ): Observable<Blob> {
    return this.exportReport('sales', format, filters);
  }

  // Payment Schedule Export
  exportPaymentSchedule(
    scheduleData: PaymentSchedule[],
    format: ExportFormat,
    filters?: any
  ): Observable<Blob> {
    return this.exportReport('payment_schedules', format, filters);
  }

  // Projected Reports Export
  exportProjectedReport(
    projectionIds: number[],
    format: ExportFormat,
    filters?: any
  ): Observable<Blob> {
    const filtersWithIds = { ...filters, projectionIds };
    return this.exportReport('projections', format, filtersWithIds);
  }

  // Dashboard Export
  exportDashboard(
    format: ExportFormat,
    filters?: any
  ): Observable<Blob> {
    return this.exportReport('dashboard', format, filters);
  }



  // Método para obtener el estado de exportación
  getExportStatus(exportId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/export/status/${exportId}`).pipe(
      catchError(error => {
        console.error('Error getting export status:', error);
        return of({ status: 'error', message: 'Error al obtener el estado' });
      })
    );
  }

  // Método para descargar reporte generado
  downloadReport(exportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${exportId}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading report:', error);
        return of(new Blob());
      })
    );
  }

  // Método para obtener historial de reportes
  getReportsHistory(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${this.apiUrl}/history`, { params }).pipe(
      catchError(error => {
        console.error('Error getting reports history:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  // Método para obtener tipos de reporte disponibles
  getReportTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/types`).pipe(
      catchError(error => {
        console.error('Error getting report types:', error);
        return of([
          { id: 'sales', name: 'Reportes de Ventas' },
          { id: 'payment-schedules', name: 'Cronogramas de Pago' },
          { id: 'projections', name: 'Proyecciones' },
          { id: 'dashboard', name: 'Dashboard' }
        ]);
      })
    );
  }

  // NEW: Specific Excel Export Methods (matching user's provided images)

  /**
   * Export Monthly Income Report (Format from Image 1)
   * Columns for each month grouped by advisor
   */
  exportMonthlyIncome(year: number, filters?: any): Observable<Blob> {
    let params = new HttpParams().set('year', year.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/monthly-income`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting monthly income:', error);
        return of(new Blob());
      })
    );
  }

  /**
   * Export Detailed Sales Report (Format from Image 2)
   * Includes payment schedules and cuotas
   */
  exportDetailedSales(filters?: any): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/detailed-sales`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting detailed sales:', error);
        return of(new Blob());
      })
    );
  }

  /**
   * Export Client Details Report (Format from Image 3)
   * Comprehensive client information
   */
  exportClientDetails(filters?: any): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/client-details`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting client details:', error);
        return of(new Blob());
      })
    );
  }

  /**
   * Download any of the specific Excel exports
   */
  downloadExcel(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${this.getDateString()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Métodos de utilidad
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.saveFile(data, `${fileName}.xlsx`);
  }

  private saveAsFile(data: string, fileName: string, type: string): void {
    const blob = new Blob([data], { type });
    this.saveFile(blob, fileName);
  }

  private saveFile(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  // Mock data for fallback
  private getMockExportResponse(type: string): ExportResponse {
    return {
      success: true,
      fileName: `mock-${type}-export.xlsx`,
      downloadUrl: '#',
      fileSize: 1024
    };
  }
}