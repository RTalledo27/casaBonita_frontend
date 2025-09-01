import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AlertConfiguration,
  Alert,
  AlertAction,
  AlertSummary,
  NotificationTemplate,
  AlertFilters,
  EscalationLevel
} from '../models/alert-configuration';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/collections/alerts`;

  /**
   * Obtiene la configuración de alertas
   */
  getConfiguration(): Observable<{ data: AlertConfiguration }> {
    return this.http.get<{ data: AlertConfiguration }>(`${this.baseUrl}/configuration`);
  }

  /**
   * Actualiza la configuración de alertas
   */
  updateConfiguration(config: Partial<AlertConfiguration>): Observable<{ data: AlertConfiguration }> {
    return this.http.put<{ data: AlertConfiguration }>(`${this.baseUrl}/configuration`, config);
  }

  /**
   * Obtiene todas las alertas con filtros
   */
  getAlerts(filters?: AlertFilters): Observable<{
    data: Alert[];
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
      data: Alert[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    }>(`${this.baseUrl}`, { params });
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(filters?: AlertFilters): Observable<{ data: Alert[]; total: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: Alert[]; total: number }>(`${this.baseUrl}/active`, { params });
  }

  /**
   * Obtiene alertas pendientes
   */
  getPendingAlerts(): Observable<{ data: Alert[] }> {
    return this.http.get<{ data: Alert[] }>(`${this.baseUrl}/pending`);
  }

  /**
   * Obtiene alertas vencidas
   */
  getOverdueAlerts(): Observable<{ data: Alert[] }> {
    return this.http.get<{ data: Alert[] }>(`${this.baseUrl}/overdue`);
  }

  /**
   * Obtiene resumen de alertas
   */
  getAlertSummary(): Observable<{ data: AlertSummary }> {
    return this.http.get<{ data: AlertSummary }>(`${this.baseUrl}/summary`);
  }

  /**
   * Crea una nueva alerta manual
   */
  createAlert(alertData: {
    account_receivable_id: number;
    alert_type: 'due_soon' | 'overdue' | 'escalation' | 'payment_received';
    priority: 'low' | 'normal' | 'high' | 'critical';
    message: string;
    scheduled_date: string;
    recipient_type: 'client' | 'collector' | 'manager';
    recipient_id?: number;
  }): Observable<{ data: Alert }> {
    return this.http.post<{ data: Alert }>(`${this.baseUrl}`, alertData);
  }

  /**
   * Actualiza una alerta
   */
  updateAlert(alertId: number, updateData: Partial<Alert>): Observable<{ data: Alert }> {
    return this.http.put<{ data: Alert }>(`${this.baseUrl}/${alertId}`, updateData);
  }

  /**
   * Marca una alerta como enviada
   */
  markAsSent(alertId: number): Observable<{ data: Alert }> {
    return this.http.patch<{ data: Alert }>(`${this.baseUrl}/${alertId}/mark-sent`, {});
  }

  /**
   * Marca una alerta como reconocida
   */
  acknowledgeAlert(alertId: string, data: { notes: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${alertId}/acknowledge`, {
      ...data,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: 'current_user' // This should come from auth service
    });
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string, data: { resolution: string; notes: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${alertId}/resolve`, {
      ...data,
      resolved_at: new Date().toISOString(),
      resolved_by: 'current_user' // This should come from auth service
    });
  }

  /**
   * Cancela una alerta
   */
  cancelAlert(alertId: string, data: { reason: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${alertId}/cancel`, {
      ...data,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'current_user' // This should come from auth service
    });
  }

  /**
   * Create alert configuration
   */
  createConfiguration(config: Partial<AlertConfiguration>): Observable<{ data: AlertConfiguration }> {
    return this.http.post<{ data: AlertConfiguration }>(`${this.baseUrl}/configuration`, config);
  }

  /**
   * Escala una alerta al siguiente nivel
   */
  escalateAlert(alertId: number, notes?: string): Observable<{ data: Alert }> {
    return this.http.post<{ data: Alert }>(`${this.baseUrl}/${alertId}/escalate`, { notes });
  }

  /**
   * Envía una alerta manualmente
   */
  sendAlert(alertId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${alertId}/send`, {});
  }

  /**
   * Programa alertas automáticas para cuentas próximas a vencer
   */
  scheduleUpcomingDueAlerts(days: number = 7): Observable<{ message: string; alerts_created: number }> {
    return this.http.post<{ message: string; alerts_created: number }>(`${this.baseUrl}/schedule-upcoming`, {
      days_before_due: days
    });
  }

  /**
   * Programa alertas automáticas para cuentas vencidas
   */
  scheduleOverdueAlerts(): Observable<{ message: string; alerts_created: number }> {
    return this.http.post<{ message: string; alerts_created: number }>(`${this.baseUrl}/schedule-overdue`, {});
  }

  /**
   * Obtiene historial de acciones de una alerta
   */
  getAlertActions(alertId: number): Observable<{ data: AlertAction[] }> {
    return this.http.get<{ data: AlertAction[] }>(`${this.baseUrl}/${alertId}/actions`);
  }

  /**
   * Registra una acción en una alerta
   */
  recordAction(alertId: number, actionData: {
    action_type: 'email_sent' | 'sms_sent' | 'call_made' | 'acknowledged' | 'resolved' | 'escalated';
    result: 'successful' | 'failed' | 'partial';
    notes?: string;
    next_action_date?: string;
  }): Observable<{ data: AlertAction }> {
    return this.http.post<{ data: AlertAction }>(`${this.baseUrl}/${alertId}/actions`, actionData);
  }

  /**
   * Obtiene plantillas de notificación
   */
  getNotificationTemplates(): Observable<{ data: NotificationTemplate[] }> {
    return this.http.get<{ data: NotificationTemplate[] }>(`${this.baseUrl}/templates`);
  }

  /**
   * Crea una nueva plantilla de notificación
   */
  createNotificationTemplate(templateData: {
    name: string;
    type: 'email' | 'sms';
    subject?: string;
    content: string;
    variables: string[];
  }): Observable<{ data: NotificationTemplate }> {
    return this.http.post<{ data: NotificationTemplate }>(`${this.baseUrl}/templates`, templateData);
  }

  /**
   * Actualiza una plantilla de notificación
   */
  updateNotificationTemplate(templateId: number, templateData: Partial<NotificationTemplate>): Observable<{ data: NotificationTemplate }> {
    return this.http.put<{ data: NotificationTemplate }>(`${this.baseUrl}/templates/${templateId}`, templateData);
  }

  /**
   * Elimina una plantilla de notificación
   */
  deleteNotificationTemplate(templateId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/templates/${templateId}`);
  }

  /**
   * Prueba el envío de una notificación
   */
  testNotification(templateId: number, recipient: string, testData?: any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/templates/${templateId}/test`, {
      recipient,
      test_data: testData
    });
  }

  /**
   * Obtiene estadísticas de alertas
   */
  getAlertStatistics(period?: string): Observable<{
    data: {
      total_sent: number;
      success_rate: number;
      response_rate: number;
      resolution_rate: number;
      avg_resolution_time: number;
      by_type: { [key: string]: number };
      by_priority: { [key: string]: number };
    }
  }> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<{
      data: {
        total_sent: number;
        success_rate: number;
        response_rate: number;
        resolution_rate: number;
        avg_resolution_time: number;
        by_type: { [key: string]: number };
        by_priority: { [key: string]: number };
      }
    }>(`${this.baseUrl}/statistics`, { params });
  }

  /**
   * Exporta alertas a Excel
   */
  exportAlerts(filters?: AlertFilters): Observable<Blob> {
    let params = new HttpParams();
    
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
}