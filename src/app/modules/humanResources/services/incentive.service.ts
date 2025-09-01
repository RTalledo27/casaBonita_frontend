import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Incentive } from '../models/incentive';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface IncentiveFilters {
  search?: string;
  status?: string;
  employee_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface IncentiveResponse {
  data: Incentive[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IncentiveService {
  private http = inject(HttpClient);
  private apiUrl = `${API_ROUTES.HR.EMPLOYEES.replace('/employees', '/incentives')}`;

  getIncentives(filters: IncentiveFilters = {}): Observable<IncentiveResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof IncentiveFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<IncentiveResponse>(this.apiUrl, { params });
  }

  getAll(): Observable<Incentive[]> {
    return this.http.get<ApiResponse<Incentive[]>>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  getIncentive(id: number): Observable<Incentive> {
    return this.http.get<ApiResponse<Incentive>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  getById(id: number): Observable<Incentive> {
    return this.getIncentive(id);
  }

  getIncentivesByEmployee(employeeId: number): Observable<Incentive[]> {
    return this.http.get<ApiResponse<Incentive[]>>(`${this.apiUrl}/employee/${employeeId}`)
      .pipe(map(response => response.data));
  }

  create(incentive: Partial<Incentive>): Observable<Incentive> {
    return this.http.post<ApiResponse<Incentive>>(this.apiUrl, incentive)
      .pipe(map(response => response.data));
  }

  update(id: number, incentive: Partial<Incentive>): Observable<Incentive> {
    return this.http.put<ApiResponse<Incentive>>(`${this.apiUrl}/${id}`, incentive)
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  markAsCompleted(id: number): Observable<Incentive> {
    return this.http.patch<ApiResponse<Incentive>>(`${this.apiUrl}/${id}/complete`, {})
      .pipe(map(response => response.data));
  }

  markAsPaid(id: number): Observable<Incentive> {
    return this.http.patch<ApiResponse<Incentive>>(`${this.apiUrl}/${id}/pay`, {})
      .pipe(map(response => response.data));
  }
}