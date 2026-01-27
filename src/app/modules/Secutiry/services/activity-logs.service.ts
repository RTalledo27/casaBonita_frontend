import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { ActivityLog } from '../users/models/activity-log';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ActivityLogsFilters {
  page?: number;
  per_page?: number;
  search?: string;
  user_id?: number;
  action?: string;
  ip_address?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'action' | 'user_id' | 'ip_address';
  sort_dir?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class ActivityLogsService {
  private base = API_ROUTES.SECURITY.ACTIVITY_LOGS;

  constructor(private http: HttpClient) {}

  list(filters: ActivityLogsFilters = {}): Observable<PaginatedResponse<ActivityLog>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') return;
      params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<ActivityLog>>(this.base, { params });
  }
}

