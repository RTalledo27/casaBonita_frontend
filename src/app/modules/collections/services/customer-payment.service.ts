import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CustomerPayment } from '../models/customer-payment';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface PaymentDetectionResult {
  payment_id: number;
  installment_type: 'first' | 'second' | 'regular';
  affects_commissions: boolean;
  detection_notes: string;
  commission_count: number;
}

export interface PaymentFilters {
  contract_id?: number;
  client_id?: number;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  installment_type?: string;
  affects_commissions?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  commission_affecting_payments: number;
  commission_affecting_amount: number;
  first_payments: number;
  second_payments: number;
  regular_payments: number;
}

export interface CreatePaymentRequest {
  account_receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'check' | 'card';
  reference?: string;
  notes?: string;
  process_commissions?: boolean;
}

export interface UpdatePaymentRequest {
  amount?: number;
  payment_date?: string;
  payment_method?: 'cash' | 'transfer' | 'check' | 'card';
  reference?: string;
  notes?: string;
  reprocess_commissions?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerPaymentService {
  private baseUrl = `${environment.URL_BACKEND}/v1/collections/customer-payments`;
  
  // Subjects para notificaciones en tiempo real
  private paymentCreated$ = new Subject<CustomerPayment>();
  private paymentUpdated$ = new Subject<CustomerPayment>();
  private paymentDeleted$ = new Subject<number>();
  private commissionProcessed$ = new Subject<PaymentDetectionResult>();
  
  // BehaviorSubjects para estado
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // === OBSERVABLES PÚBLICOS ===
  get paymentCreated(): Observable<CustomerPayment> {
    return this.paymentCreated$.asObservable();
  }

  get paymentUpdated(): Observable<CustomerPayment> {
    return this.paymentUpdated$.asObservable();
  }

  get paymentDeleted(): Observable<number> {
    return this.paymentDeleted$.asObservable();
  }

  get commissionProcessed(): Observable<PaymentDetectionResult> {
    return this.commissionProcessed$.asObservable();
  }

  get loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  get error(): Observable<string | null> {
    return this.error$.asObservable();
  }

  // === MÉTODOS CRUD ===
  
  /**
   * Obtiene todos los pagos con filtros
   */
  getPayments(filters?: PaymentFilters): Observable<{
    data: CustomerPayment[];
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

    return this.http.get<any>(`${this.baseUrl}`, { params })
      .pipe(
        map(response => ({
          data: response.data?.data || response.data || response,
          meta: response.data?.meta || response.meta
        })),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  /**
   * Obtiene un pago específico
   */
  getPayment(paymentId: number): Observable<CustomerPayment> {
    this.setLoading(true);
    
    return this.http.get<any>(`${this.baseUrl}/${paymentId}`)
      .pipe(
        map(response => response.data || response),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  /**
   * Crea un nuevo pago
   */
  createPayment(paymentData: CreatePaymentRequest): Observable<CustomerPayment> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}`, paymentData)
      .pipe(
        map(response => response.data || response),
        tap(payment => {
          this.paymentCreated$.next(payment);
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  /**
   * Actualiza un pago existente
   */
  updatePayment(paymentId: number, paymentData: UpdatePaymentRequest): Observable<CustomerPayment> {
    this.setLoading(true);
    
    return this.http.put<any>(`${this.baseUrl}/${paymentId}`, paymentData)
      .pipe(
        map(response => response.data || response),
        tap(payment => {
          this.paymentUpdated$.next(payment);
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  /**
   * Elimina un pago
   */
  deletePayment(paymentId: number): Observable<void> {
    this.setLoading(true);
    
    return this.http.delete<void>(`${this.baseUrl}/${paymentId}`)
      .pipe(
        tap(() => {
          this.paymentDeleted$.next(paymentId);
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  // === MÉTODOS ESPECÍFICOS PARA COMISIONES CONDICIONADAS ===

  /**
   * Obtiene pagos que afectan comisiones
   */
  getCommissionAffectingPayments(filters?: PaymentFilters): Observable<CustomerPayment[]> {
    const commissionFilters = { ...filters, affects_commissions: true };
    
    return this.getPayments(commissionFilters)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Re-detecta el tipo de cuota de un pago
   */
  redetectInstallmentType(paymentId: number): Observable<PaymentDetectionResult> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}/${paymentId}/redetect-installment`, {})
      .pipe(
        map(response => response.data || response),
        tap(result => {
          this.commissionProcessed$.next(result);
          this.setLoading(false);
          this.clearError();
        })
      );
  }

  /**
   * Obtiene estadísticas de detección de pagos
   */
  getDetectionStats(filters?: {
    date_from?: string;
    date_to?: string;
    contract_id?: number;
  }): Observable<PaymentStats> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(`${this.baseUrl}/stats/detection`, { params })
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Obtiene pagos por contrato
   */
  getPaymentsByContract(contractId: number): Observable<CustomerPayment[]> {
    return this.getPayments({ contract_id: contractId })
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtiene pagos por cliente
   */
  getPaymentsByClient(clientId: number): Observable<CustomerPayment[]> {
    return this.getPayments({ client_id: clientId })
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Procesa múltiples pagos para comisiones
   */
  processMultiplePaymentsForCommissions(paymentIds: number[]): Observable<{
    processed: number;
    results: PaymentDetectionResult[];
    errors: any[];
  }> {
    this.setLoading(true);
    
    return this.http.post<any>(`${this.baseUrl}/process-multiple-commissions`, {
      payment_ids: paymentIds
    })
      .pipe(
        map(response => response.data || response),
        tap(() => this.setLoading(false)),
        tap(() => this.clearError())
      );
  }

  // === MÉTODOS DE UTILIDAD ===

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

  /**
   * Obtiene el resumen de un pago específico
   */
  getPaymentSummary(paymentId: number): Observable<{
    payment: CustomerPayment;
    detection_result: PaymentDetectionResult;
    affected_commissions: any[];
  }> {
    return this.http.get<any>(`${this.baseUrl}/${paymentId}/summary`)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Valida si un pago puede ser procesado para comisiones
   */
  validatePaymentForCommissions(paymentData: CreatePaymentRequest): Observable<{
    valid: boolean;
    reasons: string[];
    estimated_commissions: number;
  }> {
    return this.http.post<any>(`${this.baseUrl}/validate-for-commissions`, paymentData)
      .pipe(
        map(response => response.data || response)
      );
  }
}