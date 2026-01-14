import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private base = API_ROUTES.SALES.PAYMENTS;

  constructor(private http: HttpClient) {}

  list(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  ledger(params?: { start_date?: string; end_date?: string; per_page?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    return this.http.get<any>(`${this.base}/ledger`, { params: httpParams });
  }

  summary(params?: { start_date?: string; end_date?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    return this.http.get<any>(`${this.base}/summary`, { params: httpParams });
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

  uploadVoucher(paymentId: number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('voucher', file);
    return this.http.post<any>(`${this.base}/${paymentId}/voucher`, fd);
  }

  downloadVoucher(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${paymentId}/voucher`, { responseType: 'blob' });
  }
}
