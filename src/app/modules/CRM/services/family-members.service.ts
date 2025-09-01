import { Injectable } from '@angular/core';
import { FamilyMember } from '../models/family-member';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';


interface ApiResponse<T> {
  data: T;
}


@Injectable({
  providedIn: 'root',
})
export class FamilyMembersService {
  private base = API_ROUTES.CRM.FAMILY_MEMBERS;

  constructor(private http: HttpClient) {}

  list(clientId: number): Observable<FamilyMember[]> {
    return this.http
      .get<{ data: FamilyMember[] }>(`${this.base}?client_id=${clientId}`)
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<FamilyMember> {
    return this.http
      .get<ApiResponse<FamilyMember>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(
    clientId: number,
    payload: Record<string, any>
  ): Observable<FamilyMember> {
    const fd = new FormData();
    fd.append('client_id', String(clientId));
    Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
    return this.http.post<FamilyMember>(this.base, fd);
  }

  update(id: number, payload: Record<string, any>): Observable<FamilyMember> {
    const fd = new FormData();
    fd.append('_method', 'PATCH');
    Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
    return this.http.post<FamilyMember>(`${this.base}/${id}`, fd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
