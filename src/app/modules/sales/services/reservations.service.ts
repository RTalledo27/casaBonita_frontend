import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Reservation } from '../models/reservation';

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  private base = API_ROUTES.SALES.RESERVATIONS;

  constructor(private http: HttpClient) {}

  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    advisor_id?: number;
  }): Observable<{ data: Reservation[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.advisor_id) httpParams = httpParams.set('advisor_id', params.advisor_id.toString());

    return this.http.get<{ data: Reservation[]; meta: any }>(this.base, { params: httpParams });
  }

  get(id: number): Observable<Reservation> {
    return this.http
      .get<{ data: Reservation }>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: any): Observable<Reservation> {
    return this.http.post<Reservation>(this.base, data);
  }

  update(id: number, data: any): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  confirmPayment(id: number, data: { deposit_method: string; deposit_reference?: string }): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/${id}/confirm-payment`, data);
  }

  convert(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/convert`, data);
  }
}
