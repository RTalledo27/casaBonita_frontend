import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private base = API_ROUTES.ACCOUNTING.PAYMENTS;

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
}
