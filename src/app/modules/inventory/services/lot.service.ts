import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Lot } from '../models/lot';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root',
})
export class LotService {
  private base = API_ROUTES.INVENTORY.LOTS;

  constructor(private http: HttpClient) {}

  list(): Observable<Lot[]> {
    return this.http
      .get<{ data: Lot[] }>(this.base)
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<Lot> {
    return this.http
      .get<{ data: Lot }>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: FormData): Observable<Lot> {
    return this.http.post<Lot>(this.base, data);
  }

  update(id: number, data: FormData): Observable<Lot> {
    return this.http.post<Lot>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
