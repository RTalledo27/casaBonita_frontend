import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Manzana } from '../models/manzana';

export type FinancingType = 'cash_only' | 'installments' | 'mixed';

export interface ManzanaFinancingRule {
  id: number;
  manzana_id: number;
  financing_type: FinancingType;
  max_installments?: number | null;
  min_down_payment_percentage?: number | null;
  allows_balloon_payment: boolean;
  allows_bpp_bonus: boolean;
  manzana?: Manzana;
}

@Injectable({
  providedIn: 'root'
})
export class ManzanaFinancingRulesService {
  private base = API_ROUTES.INVENTORY.MANZANA_FINANCING_RULES;
  private templateUrl = API_ROUTES.INVENTORY.MANZANA_FINANCING_RULES_TEMPLATE;
  private importUrl = API_ROUTES.INVENTORY.MANZANA_FINANCING_RULES_IMPORT;

  constructor(private http: HttpClient) {}

  list(): Observable<ManzanaFinancingRule[]> {
    return this.http
      .get<{ data: ManzanaFinancingRule[] }>(this.base)
      .pipe(map((res) => res.data));
  }

  upsert(payload: Omit<ManzanaFinancingRule, 'id' | 'manzana'>): Observable<ManzanaFinancingRule> {
    return this.http
      .post<{ data: ManzanaFinancingRule }>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadTemplateUrl(): string {
    return this.templateUrl;
  }

  importExcel(file: File, createMissingManzanas = false): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    form.append('create_missing_manzanas', createMissingManzanas ? '1' : '0');
    return this.http.post<any>(this.importUrl, form);
  }
}
