import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AccountReceivable,
  AccountReceivableFilters,
  CreateAccountReceivableRequest,
  UpdateAccountReceivableRequest,
  AccountReceivableMetrics
} from '../models/account-receivable';

@Injectable({
  providedIn: 'root'
})
export class AccountsReceivableService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/collections/accounts-receivable`;

  /**
   * Obtiene todas las cuentas por cobrar con filtros opcionales
   */
  getAll(filters?: AccountReceivableFilters): Observable<{
    data: AccountReceivable[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{
      data: AccountReceivable[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    }>(`${this.baseUrl}`, { params });
  }

  /**
   * Obtiene una cuenta por cobrar por ID
   */
  getById(id: number): Observable<{ data: AccountReceivable }> {
    return this.http.get<{ data: AccountReceivable }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea una nueva cuenta por cobrar
   */
  create(data: CreateAccountReceivableRequest): Observable<{ data: AccountReceivable }> {
    return this.http.post<{ data: AccountReceivable }>(`${this.baseUrl}`, data);
  }

  /**
   * Actualiza una cuenta por cobrar existente
   */
  update(id: number, data: UpdateAccountReceivableRequest): Observable<{ data: AccountReceivable }> {
    return this.http.put<{ data: AccountReceivable }>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Elimina una cuenta por cobrar
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene cuentas vencidas
   */
  getOverdue(): Observable<{ data: AccountReceivable[] }> {
    return this.http.get<{ data: AccountReceivable[] }>(`${this.baseUrl}/overdue`);
  }

  /**
   * Obtiene cuentas próximas a vencer
   */
  getUpcomingDue(days: number = 7): Observable<{ data: AccountReceivable[] }> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<{ data: AccountReceivable[] }>(`${this.baseUrl}/upcoming-due`, { params });
  }

  /**
   * Obtiene métricas de cuentas por cobrar
   */
  getMetrics(currency?: 'PEN'): Observable<{ data: AccountReceivableMetrics }> {
    let params = new HttpParams();
    if (currency) {
      params = params.set('currency', currency);
    }
    return this.http.get<{ data: AccountReceivableMetrics }>(`${this.baseUrl}/metrics`, { params });
  }

  /**
   * Marca una cuenta como pagada
   */
  markAsPaid(id: number, paymentData?: {
    amount: number;
    payment_date: string;
    payment_method: string;
    notes?: string;
  }): Observable<{ data: AccountReceivable }> {
    return this.http.post<{ data: AccountReceivable }>(`${this.baseUrl}/${id}/mark-paid`, paymentData || {});
  }

  /**
   * Asigna un cobrador a una cuenta
   */
  assignCollector(accountId: number, collectorId: number, notes?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${accountId}/assign-collector`, {
      collector_id: collectorId,
      notes
    });
  }

  /**
   * Reasigna una cuenta a otro cobrador
   */
  reassignCollector(accountId: number, newCollectorId: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${accountId}/reassign-collector`, {
      new_collector_id: newCollectorId,
      reason
    });
  }

  /**
   * Actualiza la prioridad de una cuenta
   */
  updatePriority(id: number, priority: 'low' | 'normal' | 'high' | 'critical'): Observable<{ data: AccountReceivable }> {
    return this.http.patch<{ data: AccountReceivable }>(`${this.baseUrl}/${id}/priority`, { priority });
  }

  /**
   * Registra una acción de cobranza
   */
  recordCollectionAction(accountId: number, actionData: {
    action_type: string;
    description: string;
    result: 'successful' | 'unsuccessful' | 'partial' | 'pending';
    amount_collected?: number;
    next_action_date?: string;
    notes?: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${accountId}/actions`, actionData);
  }

  /**
   * Obtiene el historial de acciones de una cuenta
   */
  getActionHistory(accountId: number): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/${accountId}/actions`);
  }

  /**
   * Exporta cuentas por cobrar a Excel
   */
  exportToExcel(filters?: AccountReceivableFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.baseUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Obtiene estadísticas por estado
   */
  getStatusStatistics(): Observable<{
    data: {
      status: string;
      count: number;
      total_amount: number;
      percentage: number;
    }[]
  }> {
    return this.http.get<{
      data: {
        status: string;
        count: number;
        total_amount: number;
        percentage: number;
      }[]
    }>(`${this.baseUrl}/statistics/status`);
  }
}