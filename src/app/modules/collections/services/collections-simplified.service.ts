import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Contract } from '../../sales/models/contract';
import { 
  PaymentSchedule, 
  PaymentScheduleFilters, 
  PaymentScheduleMetrics,
  PaymentScheduleReport,
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  MarkPaymentPaidRequest
} from '../models/payment-schedule';

// Re-export interfaces for convenience
export type { PaymentScheduleReport } from '../models/payment-schedule';

export interface CollectionsSimplifiedDashboard {
  total_contracts: number;
  active_schedules: number;
  pending_amount: number;
  overdue_amount: number;
  paid_this_month: number;
  overdue_count: number;
  payment_rate: number;
  recent_schedules: PaymentSchedule[];
  overdue_schedules: PaymentSchedule[];
  currency: 'PEN' | 'USD';
}

export interface ContractWithSchedules extends Contract {
  payment_schedules?: PaymentSchedule[];
  schedule_count?: number;
  paid_count?: number;
  pending_amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsSimplifiedService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1`;

  // Dashboard
  getDashboardData(): Observable<CollectionsSimplifiedDashboard> {
    return this.http.get<CollectionsSimplifiedDashboard>(`${this.baseUrl}/collections/dashboard`);
  }

  // Contracts with financing
  getContractsWithFinancing(filters?: { page?: number; per_page?: number; search?: string }): Observable<{
    data: ContractWithSchedules[];
    meta: any;
  }> {
    let params = new HttpParams();
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters?.search) params = params.set('search', filters.search);
    
    return this.http.get<{ data: ContractWithSchedules[]; meta: any }>(
      `${this.baseUrl}/sales/contracts/with-financing`,
      { params }
    );
  }

  // Generate payment schedule from contract
  generateSchedule(request: GenerateScheduleRequest): Observable<GenerateScheduleResponse> {
    return this.http.post<GenerateScheduleResponse>(
      `${this.baseUrl}/sales/contracts/${request.contract_id}/generate-schedule`,
      request
    );
  }

  // Payment schedules
  getPaymentSchedules(filters?: PaymentScheduleFilters): Observable<{
    data: PaymentSchedule[];
    meta: any;
  }> {
    let params = new HttpParams();
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.due_date_from) params = params.set('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params = params.set('due_date_to', filters.due_date_to);
    if (filters?.amount_from) params = params.set('amount_from', filters.amount_from.toString());
    if (filters?.amount_to) params = params.set('amount_to', filters.amount_to.toString());
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<{ data: PaymentSchedule[]; meta: any }>(
      `${this.baseUrl}/sales/payment-schedules`,
      { params }
    );
  }

  getPaymentSchedule(scheduleId: number): Observable<PaymentSchedule> {
    return this.http.get<PaymentSchedule>(`${this.baseUrl}/sales/payment-schedules/${scheduleId}`);
  }

  // Mark payment as paid
  markPaymentPaid(scheduleId: number, request: MarkPaymentPaidRequest): Observable<{
    success: boolean;
    data: PaymentSchedule;
    status: string;
  }> {
    return this.http.patch<{
      success: boolean;
      data: PaymentSchedule;
      status: string;
    }>(`${this.baseUrl}/sales/payment-schedules/${scheduleId}/mark-paid`, request);
  }

  // Get payment schedule metrics
  getPaymentScheduleMetrics(contractId?: number): Observable<PaymentScheduleMetrics> {
    let params = new HttpParams();
    if (contractId) params = params.set('contract_id', contractId.toString());
    
    return this.http.get<PaymentScheduleMetrics>(
      `${this.baseUrl}/sales/payment-schedules/metrics`,
      { params }
    );
  }

  // Reports
  getPaymentScheduleReport(filters?: {
    contract_id?: number;
    client_name?: string;
    status?: string;
    due_date_from?: string;
    due_date_to?: string;
    format?: 'json' | 'excel' | 'pdf';
  }): Observable<any> {
    let params = new HttpParams();
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());
    if (filters?.client_name) params = params.set('client_name', filters.client_name);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.due_date_from) params = params.set('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params = params.set('due_date_to', filters.due_date_to);
    if (filters?.format) params = params.set('format', filters.format);

    return this.http.get(`${this.baseUrl}/sales/payment-schedules/report`, { params });
  }

  // Generate report
  generateReport(filters?: {
    contract_id?: number;
    client_name?: string;
    status?: string;
    due_date_from?: string;
    due_date_to?: string;
  }): Observable<PaymentScheduleReport> {
    let params = new HttpParams();
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());
    if (filters?.client_name) params = params.set('client_name', filters.client_name);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.due_date_from) params = params.set('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params = params.set('due_date_to', filters.due_date_to);

    return this.http.get<PaymentScheduleReport>(`${this.baseUrl}/sales/payment-schedules/generate-report`, { params });
  }

  // Get overdue schedules
  getOverdueSchedules(page = 1, perPage = 10): Observable<{
    data: PaymentSchedule[];
    meta: any;
  }> {
    const params = new HttpParams()
      .set('status', 'vencido')
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<{ data: PaymentSchedule[]; meta: any }>(
      `${this.baseUrl}/sales/payment-schedules`,
      { params }
    );
  }

  // Get schedules by contract
  getSchedulesByContract(contractId: number): Observable<PaymentSchedule[]> {
    return this.http.get<PaymentSchedule[]>(
      `${this.baseUrl}/sales/contracts/${contractId}/payment-schedules`
    );
  }
}