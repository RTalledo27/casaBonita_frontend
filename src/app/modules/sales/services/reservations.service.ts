import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Reservation } from '../models/reservation';

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  private base = API_ROUTES.SALES.RESERVATIONS;

  constructor(private http: HttpClient) {}

  list(): Observable<Reservation[]> {
    return this.http
      .get<{ data: Reservation[] }>(this.base)
      .pipe(map((res) => res.data));
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
    // Laravel allows POST to the resource URL for updates if using FormData/spoofing _method
    return this.http.post<Reservation>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
