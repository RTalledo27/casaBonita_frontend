import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';
import { Budget } from '../models/budget';
import { BudgetLine } from '../models/budget-line';
import { CostCenter } from '../models/cost-center';
import { CashFlow } from '../models/cash-flow';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  constructor(private http: HttpClient) {}

  list(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${API_ROUTES.FINANCE.BUDGETS}`);
  }

  get(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${API_ROUTES.FINANCE.BUDGETS}/${id}`);
  }

  create(budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(`${API_ROUTES.FINANCE.BUDGETS}`, budget);
  }

  update(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${API_ROUTES.FINANCE.BUDGETS}/${id}`, budget);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ROUTES.FINANCE.BUDGETS}/${id}`);
  }

  getBudgetLines(budgetId: number): Observable<BudgetLine[]> {
    return this.http.get<BudgetLine[]>(
      `${API_ROUTES.FINANCE.BUDGETS}/${budgetId}/lines`
    );
  }

  createBudgetLine(
    budgetId: number,
    line: Partial<BudgetLine>
  ): Observable<BudgetLine> {
    return this.http.post<BudgetLine>(
      `${API_ROUTES.FINANCE.BUDGETS}/${budgetId}/lines`,
      line
    );
  }

  getCostCenters(): Observable<CostCenter[]> {
    return this.http.get<CostCenter[]>(`${API_ROUTES.FINANCE.COST_CENTERS}`);
  }

  getCashFlows(): Observable<CashFlow[]> {
    return this.http.get<CashFlow[]>(`${API_ROUTES.FINANCE.CASH_FLOWS}`);
  }
}
