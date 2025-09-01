import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Bonus } from '../models/bonus';

export interface BonusFilters {
  employee_id?: number;
  bonus_type_id?: number;
  period_year?: number;
  period_month?: number;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface BonusResponse {
  success: boolean;
  data: Bonus[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BonusType {
  id: number;
  name: string;
  description?: string;
  calculation_type: 'fixed' | 'percentage' | 'goal_based';
  amount?: number;
  percentage?: number;
  is_automatic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BonusGoal {
  id: number;
  employee_id: number;
  bonus_type_id: number;
  target_amount: number;
  target_quantity?: number;
  period_year: number;
  period_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BonusService {

  constructor(private http: HttpClient) { }

  getBonuses(filters: BonusFilters = {}): Observable<BonusResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof BonusFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<BonusResponse>(API_ROUTES.HR.BONUSES, { params });
  }

  getBonus(id: number): Observable<Bonus> {
    return this.http
      .get<ApiResponse<Bonus>>(`${API_ROUTES.HR.BONUSES}/${id}`)
      .pipe(map((response) => response.data));
  }

  createBonus(bonus: Partial<Bonus>): Observable<Bonus> {
    return this.http
      .post<ApiResponse<Bonus>>(API_ROUTES.HR.BONUSES, bonus)
      .pipe(map((response) => response.data));
  }

  updateBonus(id: number, bonus: Partial<Bonus>): Observable<Bonus> {
    return this.http
      .put<ApiResponse<Bonus>>(`${API_ROUTES.HR.BONUSES}/${id}`, bonus)
      .pipe(map((response) => response.data));
  }

  deleteBonus(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_ROUTES.HR.BONUSES}/${id}`)
      .pipe(map(() => void 0));
  }

  getBonusDashboard(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(API_ROUTES.HR.BONUSES_DASHBOARD)
      .pipe(map((response) => response.data));
  }

  processAutomaticBonuses(year: number, month: number): Observable<any> {
    const data = { year, month };
    return this.http
      .post<ApiResponse<any>>(API_ROUTES.HR.BONUSES_PROCESS_AUTOMATIC, data)
      .pipe(map((response) => response.data));
  }

  // Bonus Types
  getBonusTypes(): Observable<BonusType[]> {
    return this.http
      .get<ApiResponse<BonusType[]>>(API_ROUTES.HR.BONUS_TYPES)
      .pipe(map((response) => response.data));
  }

  getBonusType(id: number): Observable<BonusType> {
    return this.http
      .get<ApiResponse<BonusType>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`)
      .pipe(map((response) => response.data));
  }

  createBonusType(bonusType: Partial<BonusType>): Observable<BonusType> {
    return this.http
      .post<ApiResponse<BonusType>>(API_ROUTES.HR.BONUS_TYPES, bonusType)
      .pipe(map((response) => response.data));
  }

  updateBonusType(id: number, bonusType: Partial<BonusType>): Observable<BonusType> {
    return this.http
      .put<ApiResponse<BonusType>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`, bonusType)
      .pipe(map((response) => response.data));
  }

  deleteBonusType(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_ROUTES.HR.BONUS_TYPES}/${id}`)
      .pipe(map(() => void 0));
  }

  // Bonus Goals
  getBonusGoals(): Observable<BonusGoal[]> {
    return this.http
      .get<ApiResponse<BonusGoal[]>>(API_ROUTES.HR.BONUS_GOALS)
      .pipe(map((response) => response.data));
  }

  getBonusGoal(id: number): Observable<BonusGoal> {
    return this.http
      .get<ApiResponse<BonusGoal>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`)
      .pipe(map((response) => response.data));
  }

  createBonusGoal(bonusGoal: Partial<BonusGoal>): Observable<BonusGoal> {
    return this.http
      .post<ApiResponse<BonusGoal>>(API_ROUTES.HR.BONUS_GOALS, bonusGoal)
      .pipe(map((response) => response.data));
  }

  updateBonusGoal(id: number, bonusGoal: Partial<BonusGoal>): Observable<BonusGoal> {
    return this.http
      .put<ApiResponse<BonusGoal>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`, bonusGoal)
      .pipe(map((response) => response.data));
  }

  deleteBonusGoal(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_ROUTES.HR.BONUS_GOALS}/${id}`)
      .pipe(map(() => void 0));
  }
}