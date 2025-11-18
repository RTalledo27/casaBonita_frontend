import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Payroll } from '../models/payroll';

export interface PayrollFilters {
  employee_id?: number;
  period?: string;
  status?: string;
  page?: number;
  per_page?: number;
  paginate?: boolean;
}

export interface PayrollGenerateRequest {
  employee_id?: number; // Para backward compatibility
  employee_ids?: number[]; // Para generación en batch
  month: number;
  year: number;
  pay_date: string;
  include_commissions?: boolean;
  include_bonuses?: boolean;
  include_overtime?: boolean;
  notes?: string;
}

export interface PayrollBatchResponse {
  success: boolean;
  data: {
    payrolls: Payroll[];
    successful: number;
    failed: number;
    errors: Array<{ employee_id: number; employee_name?: string; error: string }>;
  };
  message: string;
}

export interface PayrollResponse {
  success: boolean;
  data: Payroll[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  totals?: {
    total_gross: number;
    total_net: number;
    total_deductions: number;
    total_records: number;
  };
  count?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {

  constructor(private http: HttpClient) { }

  getPayrolls(filters: PayrollFilters = {}): Observable<PayrollResponse> {
    let params = new HttpParams();
    
    // Configurar paginación por defecto
    if (filters.paginate !== false) {
      params = params.set('paginate', 'true');
    }
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof PayrollFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PayrollResponse>(API_ROUTES.HR.PAYROLL, { params });
  }

  getPayroll(id: number): Observable<Payroll> {
    return this.http
      .get<ApiResponse<Payroll>>(`${API_ROUTES.HR.PAYROLL}/${id}`)
      .pipe(map((response) => response.data));
  }

  generatePayroll(request: PayrollGenerateRequest): Observable<Payroll | Payroll[]> {
    return this.http
      .post<ApiResponse<Payroll | Payroll[]>>(API_ROUTES.HR.PAYROLL_GENERATE, request)
      .pipe(map((response) => response.data));
  }

  // Nuevo método específico para generación en batch (más claro)
  generatePayrollBatch(request: PayrollGenerateRequest): Observable<PayrollBatchResponse> {
    return this.http.post<PayrollBatchResponse>(API_ROUTES.HR.PAYROLL_GENERATE, request);
  }

  processPayroll(id: number): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(API_ROUTES.HR.PAYROLL_PROCESS(id), {})
      .pipe(map((response) => response.success));
  }

  approvePayroll(id: number): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(API_ROUTES.HR.PAYROLL_APPROVE(id), {})
      .pipe(map((response) => response.success));
  }

  processBulkPayrolls(period: string, status?: string): Observable<{ processed_count: number; processed_payrolls: Payroll[] }> {
    const body = { period, status: status || 'borrador' };
    return this.http
      .post<ApiResponse<{ processed_count: number; processed_payrolls: Payroll[] }>>(API_ROUTES.HR.PAYROLL_PROCESS_BULK, body)
      .pipe(map((response) => response.data));
  }

  // Métodos adicionales para el frontend
  getPayrollsByEmployee(employeeId: number, filters: Omit<PayrollFilters, 'employee_id'> = {}): Observable<PayrollResponse> {
    return this.getPayrolls({ ...filters, employee_id: employeeId });
  }

  getPayrollsByPeriod(period: string, filters: Omit<PayrollFilters, 'period'> = {}): Observable<PayrollResponse> {
    return this.getPayrolls({ ...filters, period });
  }

  getPayrollsByStatus(status: string, filters: Omit<PayrollFilters, 'status'> = {}): Observable<PayrollResponse> {
    return this.getPayrolls({ ...filters, status });
  }
}