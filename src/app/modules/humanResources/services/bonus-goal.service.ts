import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BonusGoal } from '../models/bonus-goal';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface BonusGoalFilters {
  search?: string;
  status?: string;
  bonus_type_id?: number;
  team_id?: number;
}

export interface BonusGoalResponse {
  data: BonusGoal[];
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
export class BonusGoalService {
  private http = inject(HttpClient);

  getBonusGoals(filters: BonusGoalFilters = {}): Observable<BonusGoalResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof BonusGoalFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<BonusGoalResponse>(API_ROUTES.HR.BONUS_GOALS, { params });
  }

  getBonusGoal(id: number): Observable<BonusGoal> {
    return this.http.get<ApiResponse<BonusGoal>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`)
      .pipe(map(response => response.data));
  }

  createBonusGoal(bonusGoal: Partial<BonusGoal>): Observable<BonusGoal> {
    return this.http.post<ApiResponse<BonusGoal>>(API_ROUTES.HR.BONUS_GOALS, bonusGoal)
      .pipe(map(response => response.data));
  }

  updateBonusGoal(id: number, bonusGoal: Partial<BonusGoal>): Observable<BonusGoal> {
    return this.http.put<ApiResponse<BonusGoal>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`, bonusGoal)
      .pipe(map(response => response.data));
  }

  deleteBonusGoal(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`)
      .pipe(map(() => void 0));
  }

  toggleStatus(id: number): Observable<BonusGoal> {
    return this.http.patch<ApiResponse<BonusGoal>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}/toggle-status`, {})
      .pipe(map(response => response.data));
  }
}