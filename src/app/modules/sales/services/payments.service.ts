import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private base = API_ROUTES.SALES.PAYMENTS;

  constructor(private http: HttpClient) {}

  list(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  get(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.base, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  updateSchedule(scheduleId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/schedule/${scheduleId}`, data);
  }

  revertSchedule(scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/schedule/${scheduleId}`);
  }

  ledger(params: {
    start_date?: string;
    end_date?: string;
    per_page?: number;
    page?: number;
    q?: string;
    movement_type?: string;
    method?: string;
    has_voucher?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.movement_type) httpParams = httpParams.set('movement_type', params.movement_type);
    if (params?.method) httpParams = httpParams.set('method', params.method);
    if (params?.has_voucher !== undefined && params?.has_voucher !== null) httpParams = httpParams.set('has_voucher', String(params.has_voucher));
    return this.http.get<any>(`${this.base}/ledger`, { params: httpParams });
  }

  summary(params: { start_date?: string; end_date?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    return this.http.get<any>(`${this.base}/summary`, { params: httpParams });
  }

  fivePercentReport(params?: { start_date?: string; end_date?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    return this.http.get<any>(`${this.base}/five-percent-report`, { params: httpParams });
  }

  exportFivePercentReport(params?: { start_date?: string; end_date?: string }): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    return this.http.get(`${this.base}/five-percent-report/export`, { responseType: 'blob', params: httpParams });
  }

  uploadVoucher(paymentId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('voucher', file);
    return this.http.post<any>(`${this.base}/${paymentId}/voucher`, form);
  }

  downloadVoucher(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${paymentId}/voucher`, { responseType: 'blob' });
  }

  uploadTransactionVoucher(transactionId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('voucher', file);
    return this.http.post<any>(`${API_ROUTES.SALES.PAYMENT_TRANSACTIONS}/${transactionId}/voucher`, form);
  }

  downloadTransactionVoucher(transactionId: number): Observable<Blob> {
    return this.http.get(`${API_ROUTES.SALES.PAYMENT_TRANSACTIONS}/${transactionId}/voucher`, { responseType: 'blob' });
  }
}
