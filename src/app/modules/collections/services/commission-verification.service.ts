import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, throwError, timer } from 'rxjs';
import { map, tap, retry, retryWhen, delayWhen, take, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CommissionPaymentVerification } from '../../humanResources/models/commission';

export interface VerificationStats {
  total_pending: number;
  total_verified: number;
  total_failed: number;
  pending_amount: number;
  verified_amount: number;
}

export interface CommissionRequiringVerification {
  commission_id: number;
  employee_name: string;
  contract_id: number;
  client_name: string;
  commission_amount: number;
  payment_verification_status: string;
  requires_client_payment_verification: boolean;
  first_payment_verified_at?: string;
  second_payment_verified_at?: string;
  created_at: string;
}

export interface VerifyPaymentRequest {
  commission_id: number;
  customer_payment_id: number;
  payment_installment: 'first' | 'second';
  verification_notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommissionVerificationService {
  private apiUrl = `${environment.URL_BACKEND}/v1/hr/commission-payment-verifications`;
  
  // Subject para notificaciones en tiempo real
  private verificationsUpdated = new BehaviorSubject<boolean>(false);
  public verificationsUpdated$ = this.verificationsUpdated.asObservable();
  
  // Subject para notificar actualizaciones
  private verificationsUpdate$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene estadísticas de verificaciones
   */
  getVerificationStats(): Observable<VerificationStats> {
    console.log('🌐 Realizando petición a:', `${this.apiUrl}/stats`);
    
    return this.http.get<{data: VerificationStats}>(`${this.apiUrl}/stats`)
      .pipe(
        tap(() => console.log('📡 Petición de stats enviada')),
        retryWhen(errors => 
          errors.pipe(
            tap(error => {
              console.warn('⚠️ Error en petición de stats, reintentando...', error);
            }),
            delayWhen((error, index) => {
              const delay = Math.min(1000 * Math.pow(2, index), 5000); // Exponential backoff max 5s
              console.log(`⏳ Reintentando en ${delay}ms (intento ${index + 1})`);
              return timer(delay);
            }),
            take(3) // Máximo 3 reintentos
          )
        ),
        map(response => {
          console.log('✅ Respuesta de stats recibida:', response);
          return response.data;
        }),
        catchError(this.handleError('getVerificationStats'))
      );
  }

  /**
   * Obtiene comisiones que requieren verificación
   */
  getCommissionsRequiringVerification(filters?: {
    status?: string;
    employee_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Observable<{data: CommissionRequiringVerification[], meta: any}> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    const url = `${this.apiUrl}/requiring-verification`;
    console.log('🌐 Realizando petición a:', url, 'con filtros:', filters);

    return this.http.get<{data: CommissionRequiringVerification[], meta: any}>(url, { params })
      .pipe(
        tap(() => console.log('📡 Petición de verificaciones enviada')),
        retryWhen(errors => 
          errors.pipe(
            tap(error => {
              console.warn('⚠️ Error en petición de verificaciones, reintentando...', error);
            }),
            delayWhen((error, index) => {
              const delay = Math.min(1000 * Math.pow(2, index), 5000);
              console.log(`⏳ Reintentando verificaciones en ${delay}ms (intento ${index + 1})`);
              return timer(delay);
            }),
            take(2) // Máximo 2 reintentos para esta petición
          )
        ),
        tap(response => {
          console.log('✅ Respuesta de verificaciones recibida:', response);
        }),
        catchError(this.handleError('getCommissionsRequiringVerification'))
      );
  }

  /**
   * Obtiene verificaciones para una comisión específica
   */
  getCommissionVerifications(commissionId: number): Observable<CommissionPaymentVerification[]> {
    return this.http.get<{data: CommissionPaymentVerification[]}>(
      `${this.apiUrl}/${commissionId}/verifications`
    ).pipe(map(response => response.data));
  }

  /**
   * Alias para getCommissionVerifications (para compatibilidad)
   */
  getVerificationsByCommission(commissionId: number): Observable<CommissionPaymentVerification[]> {
    return this.getCommissionVerifications(commissionId);
  }

  /**
   * Obtiene el estado de verificación de una comisión
   */
  getVerificationStatus(commissionId: number): Observable<any> {
    return this.http.get<{data: any}>(`${this.apiUrl}/${commissionId}/status`)
      .pipe(map(response => response.data));
  }

  /**
   * Verifica manualmente un pago de cliente
   */
  verifyPayment(request: VerifyPaymentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-payment`, request)
      .pipe(
        tap(() => this.notifyVerificationsUpdated())
      );
  }

  /**
   * Procesa verificaciones automáticas
   */
  processAutomaticVerifications(commissionIds?: number[]): Observable<any> {
    const body = commissionIds ? { commission_ids: commissionIds } : {};
    return this.http.post<any>(`${this.apiUrl}/process-automatic`, body)
      .pipe(
        tap(() => this.notifyVerificationsUpdated())
      );
  }

  /**
   * Revierte una verificación
   */
  reverseVerification(verificationId: number, reason?: string): Observable<any> {
    const body = reason ? { reason } : {};
    return this.http.post<any>(`${this.apiUrl}/${verificationId}/reverse`, body)
      .pipe(
        tap(() => this.notifyVerificationsUpdated())
      );
  }

  /**
   * Busca comisiones por criterios específicos
   */
  searchCommissions(query: {
    search?: string;
    status?: string;
    employee_id?: number;
    contract_id?: number;
    client_name?: string;
  }): Observable<CommissionRequiringVerification[]> {
    let params = new HttpParams();
    
    Object.keys(query).forEach(key => {
      const value = query[key as keyof typeof query];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{data: CommissionRequiringVerification[]}>(
      `${this.apiUrl}/requiring-verification`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * Notifica que las verificaciones han sido actualizadas
   */
  private notifyVerificationsUpdated(): void {
    this.verificationsUpdated.next(true);
  }

  /**
   * Método público para notificar actualizaciones (para uso con Pusher)
   */
  public triggerVerificationsUpdate(): void {
    this.notifyVerificationsUpdated();
    this.verificationsUpdate$.next();
  }

  /**
   * Obtiene el texto descriptivo del estado de verificación
   */
  getVerificationStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'pending_verification': 'Pendiente de verificación',
      'first_payment_verified': 'Primera cuota verificada',
      'second_payment_verified': 'Segunda cuota verificada',
      'fully_verified': 'Completamente verificado',
      'verification_failed': 'Verificación fallida'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene la clase CSS para el estado de verificación
   */
  getVerificationStatusClass(status: string): string {
    const classMap: {[key: string]: string} = {
      'pending_verification': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'first_payment_verified': 'bg-blue-100 text-blue-800 border-blue-200',
      'second_payment_verified': 'bg-blue-100 text-blue-800 border-blue-200',
      'fully_verified': 'bg-green-100 text-green-800 border-green-200',
      'verification_failed': 'bg-red-100 text-red-800 border-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Observable para escuchar actualizaciones de verificaciones
   */
  getVerificationsUpdateObservable(): Observable<void> {
    return this.verificationsUpdate$.asObservable();
  }
  
  /**
   * Obtiene lista de empleados para filtros
   */
  getEmployees(): Observable<any[]> {
    return this.http.get<{data: any[]}>(`${environment.URL_BACKEND}/v1/hr/employees`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError('getEmployees'))
      );
  }
  
  /**
   * Obtiene lista de clientes para filtros
   */
  getClients(): Observable<any[]> {
    return this.http.get<{data: any[]}>(`${environment.URL_BACKEND}/v1/crm/clients`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError('getClients'))
      );
  }

  /**
   * Maneja errores HTTP de manera consistente
   */
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`❌ Error en ${operation}:`, error);
      
      let errorMessage = 'Ha ocurrido un error inesperado';
      
      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error de red: ${error.error.message}`;
        console.error('🌐 Error de red:', error.error.message);
      } else {
        // Error del lado del servidor
        console.error(`🔴 Código de error: ${error.status}`);
        console.error(`📋 Mensaje: ${error.message}`);
        console.error(`🔗 URL: ${error.url}`);
        
        switch (error.status) {
          case 0:
            errorMessage = 'No se puede conectar al servidor. Verifique su conexión a internet.';
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para realizar esta acción.';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no fue encontrado.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
            break;
          case 503:
            errorMessage = 'Servicio no disponible. Intente nuevamente más tarde.';
            break;
          default:
            errorMessage = `Error del servidor (${error.status}): ${error.message}`;
        }
      }
      
      console.error(`💬 Mensaje de error para el usuario: ${errorMessage}`);
      return throwError(() => new Error(errorMessage));
    };
  }
}