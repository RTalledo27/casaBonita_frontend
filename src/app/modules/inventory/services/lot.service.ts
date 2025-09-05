import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Lot } from '../models/lot';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface LotFilters {
  page?: number;
  per_page?: number;
  status?: string;
  manzana_id?: number;
  street_type_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
}

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

  paginate(filters: LotFilters = {}): Observable<PaginatedResponse<Lot>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.manzana_id) params = params.set('manzana_id', filters.manzana_id.toString());
    if (filters.street_type_id) params = params.set('street_type_id', filters.street_type_id.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.min_price) params = params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params = params.set('max_price', filters.max_price.toString());
    if (filters.min_area) params = params.set('min_area', filters.min_area.toString());
    if (filters.max_area) params = params.set('max_area', filters.max_area.toString());

    return this.http.get<PaginatedResponse<Lot>>(this.base, { params });
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
