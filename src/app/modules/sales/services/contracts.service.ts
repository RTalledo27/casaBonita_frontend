import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Contract } from '../models/contract';

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  private base = API_ROUTES.SALES.CONTRACTS;

  constructor(private http: HttpClient) {}

  list(): Observable<Contract[]> {
    return this.http.get<{data: Contract[]}>(this.base)
      .pipe(map(res => res.data));
  }

  get(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.base}/${id}`);
  }

  create(data: any): Observable<Contract> {
    return this.http.post<Contract>(this.base, data);
  }

  update(id: number, data: any): Observable<Contract> {
    return this.http.put<Contract>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
