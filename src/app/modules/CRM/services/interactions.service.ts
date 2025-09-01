import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CrmInteraction } from '../models/crm-interaction';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES } from '../../../core/constants/api.routes';



interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class InteractionsService {
  private base = API_ROUTES.CRM.INTERACTIONS;

  constructor(private http: HttpClient) {}

  list(clientId: number): Observable<CrmInteraction[]> {
    return this.http.get<CrmInteraction[]>(
      `${this.base}?client_id=${clientId}`
    );
  }

  get(id: number): Observable<CrmInteraction> {
    return this.http
      .get<ApiResponse<CrmInteraction>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(
    clientId: number,
    payload: Record<string, any>
  ): Observable<CrmInteraction> {
    const fd = new FormData();
    fd.append('client_id', String(clientId));
    Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
    return this.http.post<CrmInteraction>(this.base, fd);
  }

  update(id: number, payload: Record<string, any>): Observable<CrmInteraction> {
    const fd = new FormData();
    fd.append('_method', 'PATCH');
    Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
    return this.http.post<CrmInteraction>(`${this.base}/${id}`, fd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
