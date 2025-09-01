import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Commission, CreateCommissionRequest, UpdateCommissionRequest, CreateSplitPaymentRequest, SplitPaymentSummary } from '../models/commission';
import { Employee } from '../models/employee';

export interface SaleDetail {
  contract_number: string;
  client_name: string;
  financing_amount: number;
  term_months: number;
  commission_percentage: number;
  commission_amount: number;
  first_payment: number;
  second_payment: number;
  payment_split_type: string;
}

export interface SalesDetailSummary {
  total_sales: number;
  total_commission: number;
  average_percentage: number;
  first_month_total: number;
  second_month_total: number;
  split_type: string;
}

export interface SalesDetailResponse {
  success: boolean;
  data: {
    summary: SalesDetailSummary;
    sales: SaleDetail[];
    employee: Employee;
    period: {
      month: number;
      year: number;
    };
  };
  message: string;
}

export interface CommissionFilters {
  employee_id?: number;
  period_year?: number;
  period_month?: number;
  commission_period?: string;
  payment_period?: string;
  payment_status?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  include_split_payments?: boolean;
  only_split_payments?: boolean;
}

export interface CommissionResponse {
  success: boolean;
  data: Commission[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SingleCommissionResponse {
  success: boolean;
  data: Commission;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommissionService {

  constructor(private http: HttpClient) { }

  getCommissions(filters: CommissionFilters = {}): Observable<CommissionResponse> {
    let params = new HttpParams();
    
    // Include employee relationship
    params = params.set('include', 'employee');
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof CommissionFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<CommissionResponse>(API_ROUTES.HR.COMMISSIONS, { params });
  }

  getCommission(id: number): Observable<SingleCommissionResponse> {
    return this.http.get<SingleCommissionResponse>(`${API_ROUTES.HR.COMMISSIONS}/${id}`);
  }

  createCommission(commission: CreateCommissionRequest): Observable<SingleCommissionResponse> {
    return this.http.post<SingleCommissionResponse>(API_ROUTES.HR.COMMISSIONS, commission);
  }

  updateCommission(id: number, commission: UpdateCommissionRequest): Observable<SingleCommissionResponse> {
    return this.http.put<SingleCommissionResponse>(`${API_ROUTES.HR.COMMISSIONS}/${id}`, commission);
  }

  deleteCommission(id: number): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(`${API_ROUTES.HR.COMMISSIONS}/${id}`);
  }

  processCommissionsForPeriod(period: string): Observable<any>;
  processCommissionsForPeriod(year: number, month: number): Observable<any>;
  processCommissionsForPeriod(periodOrYear: string | number, month?: number): Observable<any> {
    if (typeof periodOrYear === 'string') {
      // Nuevo formato: período como string YYYY-MM
      const [year, monthStr] = periodOrYear.split('-');
      return this.http.post(API_ROUTES.HR.COMMISSIONS_PROCESS_PERIOD, {
        year: parseInt(year),
        month: parseInt(monthStr)
      });
    } else {
      // Formato anterior: año y mes separados
      return this.http.post(API_ROUTES.HR.COMMISSIONS_PROCESS_PERIOD, {
        year: periodOrYear,
        month: month
      });
    }
  }

  payCommissions(commissionIds: number[]): Observable<any> {
    return this.http.post(API_ROUTES.HR.COMMISSIONS_PAY, {
      commission_ids: commissionIds
    });
  }

  // Nuevos métodos para pagos divididos
  createSplitPayment(commissionId: number, splitData: CreateSplitPaymentRequest): Observable<any> {
    return this.http.post(`${API_ROUTES.HR.COMMISSIONS}/${commissionId}/split-payment`, splitData);
  }

  getSplitPaymentSummary(commissionId: number): Observable<{success: boolean; summary: SplitPaymentSummary}> {
    return this.http.get<{success: boolean; summary: SplitPaymentSummary}>(`${API_ROUTES.HR.COMMISSIONS}/${commissionId}/split-summary`);
  }

  getCommissionsByPeriod(period: string): Observable<CommissionResponse> {
    let params = new HttpParams().set('period', period);
    return this.http.get<CommissionResponse>(`${API_ROUTES.HR.COMMISSIONS}/by-commission-period`, { params });
  }

  getPendingCommissions(period: string): Observable<CommissionResponse> {
    let params = new HttpParams().set('period', period);
    return this.http.get<CommissionResponse>(`${API_ROUTES.HR.COMMISSIONS}/pending`, { params });
  }

  processCommissionsForPayroll(commissionPeriod: string, paymentPeriod: string, commissionIds?: number[]): Observable<any> {
    const body: any = {
      commission_period: commissionPeriod,
      payment_period: paymentPeriod
    };
    
    if (commissionIds && commissionIds.length > 0) {
      body.commission_ids = commissionIds;
    }
    
    return this.http.post(`${API_ROUTES.HR.COMMISSIONS}/process-for-payroll`, body);
  }

  markMultipleAsPaid(commissionIds: number[]): Observable<any> {
    return this.http.post(`${API_ROUTES.HR.COMMISSIONS}/mark-multiple-paid`, {
      commission_ids: commissionIds
    });
  }

  getSalesDetail(employeeId: number, month: number, year: number): Observable<SalesDetailResponse> {
    let params = new HttpParams()
      .set('employee_id', employeeId.toString())
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<SalesDetailResponse>(API_ROUTES.HR.COMMISSIONS_SALES_DETAIL, { params });
  }
}