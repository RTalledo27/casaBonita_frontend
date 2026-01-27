import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract } from '../models/contract';

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  private base = API_ROUTES.SALES.CONTRACTS;

  constructor(private http: HttpClient) {}

  list(params?: { page?: number; per_page?: number; search?: string; status?: string }): Observable<{data: Contract[], meta: any}> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    
    return this.http.get<{data: Contract[], meta: any}>(this.base, { params: httpParams });
  }

  get(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.base}/${id}`);
  }

  getdetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/details`);
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

  getSchedules(contractId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${contractId}/schedules`);
  }

  generateSchedule(contractId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${contractId}/generate-schedule`, payload);
  }
}
