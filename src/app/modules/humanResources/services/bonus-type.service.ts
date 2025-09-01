import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BonusType } from '../models/bonus-type';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface BonusTypeFilters {
  search?: string;
  status?: string;
  calculation_method?: string;
}

export interface BonusTypeResponse {
  data: BonusType[];
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
export class BonusTypeService {
  private http = inject(HttpClient);

  getBonusTypes(filters: BonusTypeFilters = {}): Observable<BonusTypeResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof BonusTypeFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<BonusTypeResponse>(API_ROUTES.HR.BONUS_TYPES, { params });
  }

  getActiveBonusTypes(): Observable<BonusType[]> {
    return this.http.get<ApiResponse<BonusType[]>>(`${API_ROUTES.HR.BONUS_TYPES}/active`)
      .pipe(map(response => response.data));
  }

  getBonusType(id: number): Observable<BonusType> {
    return this.http.get<ApiResponse<BonusType>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`)
      .pipe(map(response => response.data));
  }

  createBonusType(bonusType: Partial<BonusType>): Observable<BonusType> {
    return this.http.post<ApiResponse<BonusType>>(API_ROUTES.HR.BONUS_TYPES, bonusType)
      .pipe(map(response => response.data));
  }

  updateBonusType(id: number, bonusType: Partial<BonusType>): Observable<BonusType> {
    return this.http.put<ApiResponse<BonusType>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`, bonusType)
      .pipe(map(response => response.data));
  }

  deleteBonusType(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`)
      .pipe(map(() => void 0));
  }

  toggleStatus(id: number): Observable<BonusType> {
    return this.http.patch<ApiResponse<BonusType>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}/toggle-status`, {})
      .pipe(map(response => response.data));
  }
}