import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SalesCut,
  SalesCutFilters,
  MonthlyStats,
  CreateCutRequest,
  UpdateNotesRequest
} from '../models/sales-cut.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalesCutService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/v1/sales/cuts`;

  /**
   * Obtener lista de cortes con paginación y filtros
   */
  getCuts(filters?: SalesCutFilters): Observable<ApiResponse<PaginatedResponse<SalesCut>>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
    }

    return this.http.get<ApiResponse<PaginatedResponse<SalesCut>>>(this.apiUrl, { params });
  }

  /**
   * Obtener corte del día actual
   */
  getTodayCut(): Observable<ApiResponse<SalesCut>> {
    return this.http.get<ApiResponse<SalesCut>>(`${this.apiUrl}/today`);
  }

  /**
   * Obtener detalle de un corte específico
   */
  getCutById(id: number): Observable<ApiResponse<SalesCut>> {
    return this.http.get<ApiResponse<SalesCut>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear corte diario manualmente
   */
  createDailyCut(data?: CreateCutRequest): Observable<ApiResponse<SalesCut>> {
    return this.http.post<ApiResponse<SalesCut>>(`${this.apiUrl}/create-daily`, data || {});
  }

  /**
   * Cerrar un corte
   */
  closeCut(id: number): Observable<ApiResponse<SalesCut>> {
    return this.http.post<ApiResponse<SalesCut>>(`${this.apiUrl}/${id}/close`, {});
  }

  /**
   * Marcar corte como revisado
   */
  reviewCut(id: number): Observable<ApiResponse<SalesCut>> {
    return this.http.post<ApiResponse<SalesCut>>(`${this.apiUrl}/${id}/review`, {});
  }

  /**
   * Actualizar notas del corte
   */
  updateNotes(id: number, data: UpdateNotesRequest): Observable<ApiResponse<SalesCut>> {
    return this.http.patch<ApiResponse<SalesCut>>(`${this.apiUrl}/${id}/notes`, data);
  }

  /**
   * Obtener estadísticas del mes actual
   */
  getMonthlyStats(): Observable<ApiResponse<MonthlyStats>> {
    return this.http.get<ApiResponse<MonthlyStats>>(`${this.apiUrl}/monthly-stats`);
  }

  /**
   * Formatear número como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  /**
   * Obtener etiqueta de estado en español
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'open': 'Abierto',
      'closed': 'Cerrado',
      'reviewed': 'Revisado',
      'exported': 'Exportado'
    };
    return labels[status] || status;
  }

  /**
   * Obtener clase CSS para estado
   */
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'open': 'bg-blue-100 text-blue-800',
      'closed': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-green-100 text-green-800',
      'exported': 'bg-purple-100 text-purple-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener etiqueta de tipo en español
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual'
    };
    return labels[type] || type;
  }

  /**
   * Obtener etiqueta de método de pago en español
   */
  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash': 'Efectivo',
      'bank_transfer': 'Transferencia',
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'check': 'Cheque'
    };
    return labels[method] || method;
  }
}
