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

  ledger(params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
    search?: string;
    movement_type?: string;
    source?: string;
    method?: string;
    advisor_id?: number;
    has_voucher?: 0 | 1;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.movement_type) httpParams = httpParams.set('movement_type', params.movement_type);
    if (params?.source) httpParams = httpParams.set('source', params.source);
    if (params?.method) httpParams = httpParams.set('method', params.method);
    if (params?.advisor_id) httpParams = httpParams.set('advisor_id', String(params.advisor_id));
    if (params?.has_voucher !== undefined) httpParams = httpParams.set('has_voucher', String(params.has_voucher));
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);
    return this.http.get<any>(`${this.base}/ledger`, { params: httpParams });
  }

  summary(params?: {
    start_date?: string;
    end_date?: string;
    movement_type?: string;
    source?: string;
    method?: string;
    advisor_id?: number;
    has_voucher?: 0 | 1;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params?.movement_type) httpParams = httpParams.set('movement_type', params.movement_type);
    if (params?.source) httpParams = httpParams.set('source', params.source);
    if (params?.method) httpParams = httpParams.set('method', params.method);
    if (params?.advisor_id) httpParams = httpParams.set('advisor_id', String(params.advisor_id));
    if (params?.has_voucher !== undefined) httpParams = httpParams.set('has_voucher', String(params.has_voucher));
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
