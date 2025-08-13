import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Commission, CommissionPaymentVerification } from '../../humanResources/models/commission';
import { Employee } from '../../humanResources/models/employee';
import { CommissionService } from '../../humanResources/services/commission.service';
import { CommissionVerificationService } from './commission-verification.service';

export interface HRIntegrationStats {
  total_commissions: number;
  pending_verification_commissions: number;
  verified_commissions: number;
  failed_verification_commissions: number;
  total_commission_amount: number;
  pending_amount: number;
  verified_amount: number;
  verification_rate: number;
}

export interface CommissionWithVerification extends Commission {
  verification_summary?: {
    total_verifications: number;
    pending_verifications: number;
    verified_verifications: number;
    failed_verifications: number;
    can_be_paid: boolean;
  };
}

export interface HRCollectionsIntegrationData {
  stats: HRIntegrationStats;
  commissions: CommissionWithVerification[];
  employees: Employee[];
  recent_verifications: CommissionPaymentVerification[];
}

@Injectable({
  providedIn: 'root'
})
export class HrIntegrationService {
  private integrationDataSubject = new BehaviorSubject<HRCollectionsIntegrationData | null>(null);
  public integrationData$ = this.integrationDataSubject.asObservable();

  constructor(
    private http: HttpClient,
    private commissionService: CommissionService,
    private verificationService: CommissionVerificationService
  ) {}

  /**
   * Obtiene datos integrados de HR y Collections
   */
  getIntegrationData(filters: any = {}): Observable<HRCollectionsIntegrationData> {
    return combineLatest([
      this.getCommissionsWithVerifications(filters),
      this.getHRStats(filters),
      this.getEmployeesForCommissions(),
      this.getRecentVerifications()
    ]).pipe(
      map(([commissions, stats, employees, recentVerifications]) => ({
        commissions,
        stats,
        employees,
        recent_verifications: recentVerifications
      })),
      tap(data => this.integrationDataSubject.next(data))
    );
  }

  /**
   * Obtiene comisiones con información de verificaciones
   */
  getCommissionsWithVerifications(filters: any = {}): Observable<CommissionWithVerification[]> {
    // Primero obtener comisiones que requieren verificación
    const verificationFilters = {
      status: filters.verification_status || undefined,
      employee_id: filters.employee_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      search: filters.search || undefined,
      per_page: 50 // Aumentar límite para mostrar más comisiones
    };

    return this.verificationService.getCommissionsRequiringVerification(verificationFilters).pipe(
      switchMap(response => {
        // Validar que response y response.data existan y sean arrays
        let commissionsRequiringVerification: any[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          commissionsRequiringVerification = response.data;
        } else if (response && Array.isArray(response)) {
          commissionsRequiringVerification = response;
        } else {
          console.warn('Respuesta inesperada del servicio de verificaciones:', response);
          commissionsRequiringVerification = [];
        }
        
        // Asegurar que commissionsRequiringVerification sea un array antes de usar map
        if (!Array.isArray(commissionsRequiringVerification)) {
          console.error('commissionsRequiringVerification no es un array:', commissionsRequiringVerification);
          commissionsRequiringVerification = [];
        }
        
        if (commissionsRequiringVerification.length === 0) {
          return of([]); // Retornar Observable de array vacío si no hay comisiones
        }
        
        // Para cada comisión que requiere verificación, obtener datos completos
        const commissionsWithVerifications$ = commissionsRequiringVerification.map(commissionData => 
          this.commissionService.getCommission(commissionData.commission_id).pipe(
            switchMap(commissionResponse => {
              const commission = commissionResponse.data;
              return this.getVerificationSummaryForCommission(commission.commission_id).pipe(
                map(verificationSummary => ({
                  ...commission,
                  verification_summary: verificationSummary,
                  payment_verification_status: commissionData.payment_verification_status as Commission['payment_verification_status']
                } as CommissionWithVerification))
              );
            })
          )
        );

        return combineLatest(commissionsWithVerifications$);
      }),
      catchError(error => {
        console.error('Error obteniendo comisiones con verificaciones:', error);
        return of([]); // Retornar Observable de array vacío en caso de error
      })
    );
  }

  /**
   * Obtiene resumen de verificaciones para una comisión específica
   */
  getVerificationSummaryForCommission(commissionId: number): Observable<any> {
    return this.verificationService.getVerificationsByCommission(commissionId).pipe(
      map((verifications: any[]) => {
        const total = (verifications as any[]).length;
        const pending = (verifications as any[]).filter((v: any) => v.verification_status === 'pending').length;
        const verified = (verifications as any[]).filter((v: any) => v.verification_status === 'verified').length;
        const failed = (verifications as any[]).filter((v: any) => v.verification_status === 'failed').length;
        
        // Una comisión puede ser pagada si todas sus verificaciones requeridas están verificadas
        const canBePaid = total > 0 && pending === 0 && failed === 0;

        return {
          total_verifications: total,
          pending_verifications: pending,
          verified_verifications: verified,
          failed_verifications: failed,
          can_be_paid: canBePaid
        };
      })
    );
  }

  /**
   * Obtiene estadísticas de integración HR-Collections
   */
  getHRStats(filters: any = {}): Observable<HRIntegrationStats> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<{success: boolean; data: HRIntegrationStats}>(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/stats`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene empleados que tienen comisiones
   */
  getEmployeesForCommissions(): Observable<Employee[]> {
    return this.http.get<{success: boolean; data: Employee[]}>(
      `${API_ROUTES.HR.EMPLOYEES}/with-commissions`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene verificaciones recientes
   */
  getRecentVerifications(limit: number = 10): Observable<CommissionPaymentVerification[]> {
    return this.verificationService.getCommissionsRequiringVerification({ per_page: limit }).pipe(
      map((response: any) => {
        // Asegurar que siempre retornemos un array
        const data = response?.data || response || [];
        return Array.isArray(data) ? data : [];
      }),
      catchError(error => {
        console.error('Error obteniendo verificaciones recientes:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    );
  }

  /**
   * Procesa comisiones elegibles para pago
   */
  processEligibleCommissions(commissionIds: number[]): Observable<any> {
    return this.http.post(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/process-eligible`,
      { commission_ids: commissionIds }
    );
  }

  /**
   * Marca comisiones como elegibles para pago después de verificación
   */
  markCommissionsAsEligible(commissionIds: number[]): Observable<any> {
    return this.http.post(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/mark-eligible`,
      { commission_ids: commissionIds }
    );
  }

  /**
   * Sincroniza datos entre HR y Collections
   */
  syncHRCollectionsData(): Observable<any> {
    return this.http.post(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/sync`,
      {}
    );
  }

  /**
   * Obtiene comisiones que requieren verificación de pagos del cliente
   */
  getCommissionsRequiringVerification(filters: any = {}): Observable<Commission[]> {
    const commissionFilters = {
      ...filters,
      requires_client_payment_verification: true,
      payment_verification_status: 'pending_verification'
    };

    return this.commissionService.getCommissions(commissionFilters).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actualiza el estado de verificación de una comisión
   */
  updateCommissionVerificationStatus(
    commissionId: number, 
    status: string, 
    notes?: string
  ): Observable<any> {
    return this.http.put(
      `${API_ROUTES.HR.COMMISSIONS}/${commissionId}/verification-status`,
      {
        payment_verification_status: status,
        verification_notes: notes
      }
    );
  }

  /**
   * Obtiene el dashboard integrado de HR y Collections
   */
  getIntegratedDashboard(period?: string): Observable<any> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }

    return this.http.get(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/dashboard`,
      { params }
    );
  }

  /**
   * Exporta datos de integración
   */
  exportIntegrationData(filters: any = {}, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get(
      `${API_ROUTES.COLLECTIONS.HR_INTEGRATION}/export`,
      { params, responseType: 'blob' }
    );
  }

  /**
   * Refresca los datos de integración
   */
  refreshIntegrationData(filters: any = {}): void {
    this.getIntegrationData(filters).subscribe();
  }

  /**
   * Obtiene los datos actuales de integración del cache
   */
  getCurrentIntegrationData(): HRCollectionsIntegrationData | null {
    return this.integrationDataSubject.value;
  }
}