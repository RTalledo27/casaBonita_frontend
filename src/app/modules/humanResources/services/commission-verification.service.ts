import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Commission, 
  CommissionVerificationFilters, 
  VerificationStats, 
  CommissionVerificationStatus, 
  PaymentVerification, 
  VerificationSettings, 
  AutoVerificationResult 
} from '../models/commission';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root'
})
export class CommissionVerificationService {
  private baseUrl = `${environment.URL_BACKEND}/hr/commissions`;
  
  // Subjects para notificaciones en tiempo real
  private verificationCompleted$ = new Subject<CommissionVerificationStatus>();
  private settingsUpdated$ = new Subject<{ commission_id: number; settings: VerificationSettings }>();
  private autoVerificationProcessed$ = new Subject<AutoVerificationResult>();
  
  // BehaviorSubjects para estado
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // === OBSERVABLES PÚBLICOS ===
  get verificationCompleted(): Observable<CommissionVerificationStatus> {
    return this.verificationCompleted$.asObservable();
  }

  get settingsUpdated(): Observable<{ commission_id: number; settings: VerificationSettings }> {
    return this.settingsUpdated$.asObservable();
  }

  get autoVerificationProcessed(): Observable<AutoVerificationResult> {
    return this.autoVerificationProcessed$.asObservable();
  }

  get loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  get error(): Observable<string | null> {
    return this.error$.asObservable();
  }

  // === MÉTODOS PRINCIPALES ===

  /**
   * Obtiene comisiones que requieren verificación de pagos
   */
  getCommissionsRequiringVerification(filters?: CommissionVerificationFilters): Observable<{
    data: Commission[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    this.setLoading(true);
    
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(`${this.baseUrl}/requiring-verification`, { params })
      .pipe(
        map(response => ({
          data: response.data || response,
          meta: response.meta
        })),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  /**
   * Verifica manualmente los pagos de una comisión
   */
  verifyCommissionPayments(commissionId: number): Observable<{
    first_payment: boolean;
    second_payment: boolean;
    verification_status: string;
    notes: string;
  }> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}/${commissionId}/verify-payments`, {})
      .pipe(
        map(response => response.data || response),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  /**
   * Obtiene el estado de verificación de una comisión
   */
  getVerificationStatus(commissionId: number): Observable<CommissionVerificationStatus> {
    return this.http.get<any>(`${this.baseUrl}/${commissionId}/verification-status`)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Actualiza la configuración de verificación de una comisión
   */
  updateVerificationSettings(
    commissionId: number, 
    settings: Partial<VerificationSettings>
  ): Observable<Commission> {
    this.setLoading(true);
    
    return this.http.put<any>(`${this.baseUrl}/${commissionId}/verification-settings`, settings)
      .pipe(
        map(response => response.data || response),
        tap(commission => {
          this.settingsUpdated$.next({ commission_id: commissionId, settings: settings as VerificationSettings });
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  /**
   * Obtiene estadísticas de verificación
   */
  getVerificationStats(filters?: {
    date_from?: string;
    date_to?: string;
    payment_dependency_type?: string;
  }): Observable<VerificationStats> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(`${this.baseUrl}/verification-stats`, { params })
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Procesa verificaciones automáticas pendientes
   */
  processAutomaticVerifications(limit: number = 50): Observable<AutoVerificationResult> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}/process-automatic-verifications`, { limit })
      .pipe(
        map(response => {
          const data = response.data || response;
          // Mapear las propiedades del backend a las del frontend
          return {
            processed_count: data.processed || data.processed_count,
            verified_count: data.verified || data.verified_count,
            errors_count: data.errors || data.errors_count,
            details: data.details || []
          } as AutoVerificationResult;
        }),
        tap(result => {
          this.autoVerificationProcessed$.next(result);
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  // === MÉTODOS DE CONFIGURACIÓN MASIVA ===

  /**
   * Actualiza configuración de verificación para múltiples comisiones
   */
  updateMultipleVerificationSettings(
    commissionIds: number[],
    settings: Partial<VerificationSettings>
  ): Observable<{
    updated_count: number;
    errors_count: number;
    details: { commission_id: number; success: boolean; error?: string }[];
  }> {
    this.setLoading(true);
    
    return this.http.put<any>(`${this.baseUrl}/bulk-verification-settings`, {
      commission_ids: commissionIds,
      settings
    })
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            updated_count: data.updated || data.updated_count,
            errors_count: data.errors || data.errors_count,
            details: data.details || []
          };
        }),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  /**
   * Verifica múltiples comisiones de forma masiva
   */
  verifyMultipleCommissions(commissionIds: number[]): Observable<{
    processed_count: number;
    verified_count: number;
    errors_count: number;
    details: {
      commission_id: number;
      result?: {
        first_payment: boolean;
        second_payment: boolean;
        verification_status: string;
      };
      error?: string;
    }[];
  }> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}/bulk-verify-payments`, {
      commission_ids: commissionIds
    })
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            processed_count: data.processed || data.processed_count,
            verified_count: data.verified || data.verified_count,
            errors_count: data.errors || data.errors_count,
            details: data.details || []
          };
        }),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  // === MÉTODOS DE REPORTES ===

  /**
   * Obtiene reporte de verificaciones por período
   */
  getVerificationReport(filters: {
    date_from: string;
    date_to: string;
    employee_id?: number;
    payment_dependency_type?: string;
    format?: 'json' | 'excel' | 'pdf';
  }): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const responseType = filters.format === 'json' ? 'json' : 'blob';
    
    return this.http.get(`${this.baseUrl}/verification-report`, { 
      params, 
      responseType: responseType as any
    });
  }

  /**
   * Obtiene historial de verificaciones de una comisión
   */
  getVerificationHistory(commissionId: number): Observable<{
    commission: Commission;
    verification_history: {
      date: string;
      action: string;
      details: any;
      user: string;
    }[];
    payment_verifications: PaymentVerification[];
  }> {
    return this.http.get<any>(`${this.baseUrl}/${commissionId}/verification-history`)
      .pipe(
        map(response => response.data || response)
      );
  }

  // === MÉTODOS DE UTILIDAD ===

  /**
   * Valida configuración de verificación
   */
  validateVerificationSettings(settings: VerificationSettings): Observable<{
    valid: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    return this.http.post<any>(`${this.baseUrl}/validate-verification-settings`, settings)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Obtiene configuración recomendada para una comisión
   */
  getRecommendedSettings(commissionId: number): Observable<{
    recommended_settings: VerificationSettings;
    reasoning: string[];
    confidence_score: number;
  }> {
    return this.http.get<any>(`${this.baseUrl}/${commissionId}/recommended-verification-settings`)
      .pipe(
        map(response => response.data || response)
      );
  }

  // === MÉTODOS PRIVADOS ===

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this.error$.next(null);
  }

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loading$.next(loading);
  }

  /**
   * Establece un error
   */
  setError(error: string): void {
    this.error$.next(error);
    this.setLoading(false);
  }

  /**
   * Resetea el estado del servicio
   */
  resetState(): void {
    this.setLoading(false);
    this.clearError();
  }

  // === MÉTODOS DE NOTIFICACIONES EN TIEMPO REAL ===

  /**
   * Simula notificación de verificación completada
   */
  notifyVerificationCompleted(status: CommissionVerificationStatus): void {
    this.verificationCompleted$.next(status);
  }

  /**
   * Obtiene resumen de verificaciones pendientes
   */
  getPendingVerificationsSummary(): Observable<{
    total_pending: number;
    urgent_count: number;
    auto_processable: number;
    manual_required: number;
    next_auto_run: string | null;
  }> {
    return this.http.get<any>(`${this.baseUrl}/pending-verifications-summary`)
      .pipe(
        map(response => response.data || response)
      );
  }
}