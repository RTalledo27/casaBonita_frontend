import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Collector,
  CollectorAssignment,
  CollectorMetrics,
  CollectorWorkload,
  AssignmentRequest,
  ReassignmentRequest,
  CollectorAction
} from '../models/collector';

@Injectable({
  providedIn: 'root'
})
export class CollectorsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/collections/collectors`;

  /**
   * Obtiene todos los cobradores
   */
  getAll(activeOnly: boolean = true): Observable<{ data: Collector[] }> {
    const params = new HttpParams().set('active_only', activeOnly.toString());
    return this.http.get<{ data: Collector[] }>(`${this.baseUrl}`, { params });
  }

  /**
   * Obtiene un cobrador por ID
   */
  getById(id: number): Observable<{ data: Collector }> {
    return this.http.get<{ data: Collector }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea un nuevo cobrador
   */
  create(collectorData: {
    employee_id: number;
    collection_target: number;
    currency: 'PEN' | 'USD';
  }): Observable<{ data: Collector }> {
    return this.http.post<{ data: Collector }>(`${this.baseUrl}`, collectorData);
  }

  /**
   * Actualiza un cobrador
   */
  update(id: number, collectorData: Partial<Collector>): Observable<{ data: Collector }> {
    return this.http.put<{ data: Collector }>(`${this.baseUrl}/${id}`, collectorData);
  }

  /**
   * Desactiva un cobrador
   */
  deactivate(id: number, reason?: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/deactivate`, { reason });
  }

  /**
   * Activa un cobrador
   */
  activate(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/activate`, {});
  }

  /**
   * Obtiene métricas de un cobrador
   */
  getMetrics(collectorId: number, period?: string): Observable<{ data: CollectorMetrics }> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<{ data: CollectorMetrics }>(`${this.baseUrl}/${collectorId}/metrics`, { params });
  }

  /**
   * Obtiene la carga de trabajo de todos los cobradores
   */
  getWorkload(): Observable<{ data: CollectorWorkload[] }> {
    return this.http.get<{ data: CollectorWorkload[] }>(`${this.baseUrl}/workload`);
  }

  /**
   * Obtiene la carga de trabajo de un cobrador específico
   */
  getCollectorWorkload(collectorId: number): Observable<{ data: CollectorWorkload }> {
    return this.http.get<{ data: CollectorWorkload }>(`${this.baseUrl}/${collectorId}/workload`);
  }

  /**
   * Obtiene asignaciones de un cobrador
   */
  getAssignments(collectorId: number, status?: string): Observable<{ data: CollectorAssignment[] }> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<{ data: CollectorAssignment[] }>(`${this.baseUrl}/${collectorId}/assignments`, { params });
  }

  /**
   * Asigna cuentas a un cobrador
   */
  assignAccounts(assignmentData: AssignmentRequest): Observable<{ message: string; assignments_created: number }> {
    return this.http.post<{ message: string; assignments_created: number }>(`${this.baseUrl}/assign`, assignmentData);
  }

  /**
   * Reasigna una cuenta a otro cobrador
   */
  reassignAccount(reassignmentData: ReassignmentRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reassign`, reassignmentData);
  }

  /**
   * Asignación automática basada en carga de trabajo
   */
  autoAssign(accountIds: number[], criteria?: {
    balance_workload?: boolean;
    consider_expertise?: boolean;
    priority_first?: boolean;
  }): Observable<{ message: string; assignments: { account_id: number; collector_id: number }[] }> {
    return this.http.post<{ message: string; assignments: { account_id: number; collector_id: number }[] }>(`${this.baseUrl}/auto-assign`, {
      account_ids: accountIds,
      criteria
    });
  }

  /**
   * Completa una asignación
   */
  completeAssignment(assignmentId: number, result: {
    status: 'completed' | 'cancelled';
    amount_collected?: number;
    notes?: string;
  }): Observable<{ data: CollectorAssignment }> {
    return this.http.patch<{ data: CollectorAssignment }>(`${this.baseUrl}/assignments/${assignmentId}/complete`, result);
  }

  /**
   * Registra una acción de cobranza
   */
  recordAction(assignmentId: number, actionData: {
    action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal' | 'payment_plan' | 'other';
    description: string;
    result: 'successful' | 'unsuccessful' | 'partial' | 'pending';
    amount_collected?: number;
    next_action_date?: string;
    notes?: string;
  }): Observable<{ data: CollectorAction }> {
    return this.http.post<{ data: CollectorAction }>(`${this.baseUrl}/assignments/${assignmentId}/actions`, actionData);
  }

  /**
   * Obtiene historial de acciones de una asignación
   */
  getActionHistory(assignmentId: number): Observable<{ data: CollectorAction[] }> {
    return this.http.get<{ data: CollectorAction[] }>(`${this.baseUrl}/assignments/${assignmentId}/actions`);
  }

  /**
   * Obtiene ranking de cobradores
   */
  getCollectorRanking(period?: string, metric: 'collection_rate' | 'amount_collected' | 'efficiency' = 'collection_rate'): Observable<{
    data: {
      collector_id: number;
      collector_name: string;
      rank: number;
      metric_value: number;
      change_from_previous: number;
    }[]
  }> {
    let params = new HttpParams().set('metric', metric);
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<{
      data: {
        collector_id: number;
        collector_name: string;
        rank: number;
        metric_value: number;
        change_from_previous: number;
      }[]
    }>(`${this.baseUrl}/ranking`, { params });
  }

  /**
   * Obtiene comparación de rendimiento entre cobradores
   */
  getPerformanceComparison(collectorIds: number[], period?: string): Observable<{
    data: {
      collector_id: number;
      collector_name: string;
      metrics: CollectorMetrics;
    }[]
  }> {
    let params = new HttpParams();
    collectorIds.forEach(id => {
      params = params.append('collector_ids[]', id.toString());
    });
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<{
      data: {
        collector_id: number;
        collector_name: string;
        metrics: CollectorMetrics;
      }[]
    }>(`${this.baseUrl}/performance-comparison`, { params });
  }

  /**
   * Actualiza meta de cobranza de un cobrador
   */
  updateTarget(collectorId: number, targetAmount: number, period?: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${collectorId}/target`, {
      target_amount: targetAmount,
      period
    });
  }

  /**
   * Obtiene historial de metas de un cobrador
   */
  getTargetHistory(collectorId: number): Observable<{
    data: {
      period: string;
      target_amount: number;
      achieved_amount: number;
      achievement_percentage: number;
    }[]
  }> {
    return this.http.get<{
      data: {
        period: string;
        target_amount: number;
        achieved_amount: number;
        achievement_percentage: number;
      }[]
    }>(`${this.baseUrl}/${collectorId}/target-history`);
  }

  /**
   * Exporta datos de cobradores
   */
  exportCollectorData(format: 'excel' | 'pdf', collectorIds?: number[], period?: string): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (collectorIds && collectorIds.length > 0) {
      collectorIds.forEach(id => {
        params = params.append('collector_ids[]', id.toString());
      });
    }
    
    if (period) {
      params = params.set('period', period);
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Obtiene sugerencias de asignación para una cuenta
   */
  getAssignmentSuggestions(accountId: number): Observable<{
    data: {
      collector_id: number;
      collector_name: string;
      score: number;
      reasons: string[];
      current_workload: number;
      estimated_success_rate: number;
    }[]
  }> {
    return this.http.get<{
      data: {
        collector_id: number;
        collector_name: string;
        score: number;
        reasons: string[];
        current_workload: number;
        estimated_success_rate: number;
      }[]
    }>(`${this.baseUrl}/assignment-suggestions/${accountId}`);
  }

  /**
   * Delete a collector
   */
  delete(collectorId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${collectorId}`);
  }

  /**
   * Export collectors data to Excel
   */
  exportToExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/excel`, {
      responseType: 'blob'
    });
  }
}