import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Contract } from '../../sales/models/contract';
import {
  PaymentSchedule,
  PaymentScheduleFilters,
  PaymentScheduleMetrics,
  PaymentScheduleReport,
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  MarkPaymentPaidRequest,
  ContractSummary
} from '../models/payment-schedule';
import { RecentContract } from '../models/recent-contract';

// Re-export interfaces for convenience
export type { PaymentScheduleReport } from '../models/payment-schedule';

export interface CollectionsSimplifiedDashboard {
  total_contracts: number;
  active_contracts: number;
  active_schedules: number;
  pending_amount: number;
  overdue_amount: number;
  paid_this_month: number;
  overdue_count: number;
  payment_rate: number;
  average_payment_time: number;
  monthly_growth: number;
  recent_created_schedules: RecentContract[];
  recent_schedules: PaymentSchedule[];
  overdue_schedules: PaymentSchedule[];
  currency: 'PEN';
}

export interface ContractWithSchedules extends Contract {
  id?: number; // Alias for contract_id for compatibility
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
    return this.http.get<{ success: boolean, data: any }>(`${this.baseUrl}/collections/dashboard`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const data = response.data;
            const metrics = data.metrics || {};
            const scheduleMetrics = metrics.schedules || {};
            const contractMetrics = metrics.contracts || {};

            return {
              total_contracts: contractMetrics.contracts_with_schedules || 0,
              active_contracts: contractMetrics.active_contracts || 0,
              active_schedules: scheduleMetrics.total_schedules || 0,
              pending_amount: scheduleMetrics.pending_amount || 0,
              overdue_amount: scheduleMetrics.overdue_amount || 0,
              paid_this_month: scheduleMetrics.paid_amount || 0,
              overdue_count: scheduleMetrics.overdue_schedules || 0,
              payment_rate: scheduleMetrics.collection_rate || 0,
              average_payment_time: scheduleMetrics.average_payment_time || 0,
              monthly_growth: scheduleMetrics.monthly_growth || 0,
              recent_created_schedules: data.recent_created_schedules || [],
              recent_schedules: data.upcoming_schedules || [],
              overdue_schedules: data.overdue_schedules || [],
              currency: 'PEN' as const
            };
          }
          throw new Error('Invalid response format');
        })
      );
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
      `${this.baseUrl}/sales/schedules`,
      { params }
    );
  }

  getPaymentSchedule(scheduleId: number): Observable<PaymentSchedule> {
    return this.http.get<PaymentSchedule>(`${this.baseUrl}/sales/schedules/${scheduleId}`);
  }

  // Mark payment as paid
  markPaymentPaid(scheduleId: number, request: MarkPaymentPaidRequest): Observable<{
    success: boolean;
    data: PaymentSchedule;
    allocation?: any;
    status?: string;
  }> {
    return this.http.patch<{
      success: boolean;
      data: PaymentSchedule;
      allocation?: any;
      status?: string;
    }>(`${this.baseUrl}/sales/schedules/${scheduleId}/mark-paid`, request);
  }

  uploadPaymentVoucher(paymentId: number, voucher: File): Observable<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const form = new FormData();
    form.append('voucher', voucher);
    return this.http.post<{
      success: boolean;
      message: string;
      data?: any;
    }>(`${this.baseUrl}/sales/payments/${paymentId}/voucher`, form);
  }

  uploadTransactionVoucher(transactionId: number, voucher: File): Observable<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const form = new FormData();
    form.append('voucher', voucher);
    return this.http.post<{
      success: boolean;
      message: string;
      data?: any;
    }>(`${this.baseUrl}/sales/payment-transactions/${transactionId}/voucher`, form);
  }

  // Get payment schedule metrics
  getPaymentScheduleMetrics(contractId?: number): Observable<PaymentScheduleMetrics> {
    let params = new HttpParams();
    if (contractId) params = params.set('contract_id', contractId.toString());

    return this.http.get<PaymentScheduleMetrics>(
      `${this.baseUrl}/sales/schedules/metrics`,
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

    return this.http.get(`${this.baseUrl}/sales/schedules/report`, { params });
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

    return this.http.get<PaymentScheduleReport>(`${this.baseUrl}/sales/schedules/generate-report`, { params });
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
      `${this.baseUrl}/sales/schedules`,
      { params }
    );
  }

  // Get schedules by contract
  getSchedulesByContract(contractId: number): Observable<PaymentSchedule[]> {
    return this.http.get<PaymentSchedule[]>(
      `${this.baseUrl}/sales/contracts/${contractId}/payment-schedules`
    );
  }

  // ===== NEW COLLECTIONS API METHODS =====

  // Individual schedule generation
  generateContractSchedule(contractId: number, request: {
    start_date: string;
    frequency: 'monthly' | 'biweekly' | 'weekly';
    notes?: string;
  }): Observable<{
    success: boolean;
    message: string;
    data: {
      contract: any;
      schedules: PaymentSchedule[];
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        contract: any;
        schedules: PaymentSchedule[];
      };
    }>(`${this.baseUrl}/collections/contracts/${contractId}/generate-schedule`, request);
  }

  // Bulk schedule generation
  generateBulkSchedules(request: {
    contract_ids: string[];
    start_date: string;
    frequency?: 'monthly' | 'biweekly' | 'weekly';
    notes?: string;
  }): Observable<{
    success: boolean;
    message: string;
    data: {
      total_contracts: number;
      successful: number;
      failed: number;
      results: Array<{
        contract_id: string;
        contract_number?: string;
        client_name?: string;
        success: boolean;
        message?: string;
        schedules?: PaymentSchedule[];
      }>;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        total_contracts: number;
        successful: number;
        failed: number;
        results: Array<{
          contract_id: string;
          contract_number?: string;
          client_name?: string;
          success: boolean;
          message?: string;
          schedules?: PaymentSchedule[];
        }>;
      };
    }>(`${this.baseUrl}/collections/contracts/generate-bulk-schedules`, request);
  }

  // Installment Management
  getContractsWithSchedulesSummary(filters?: {
    status?: string;
    client_name?: string;
    contract_number?: string;
    page?: number;
    per_page?: number;
  }): Observable<{
    success: boolean;
    data: ContractSummary[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.client_name) params = params.set('client_name', filters.client_name);
    if (filters?.contract_number) params = params.set('contract_number', filters.contract_number);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<{
      success: boolean;
      data: ContractSummary[];
      pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
      };
    }>(`${this.baseUrl}/collections/contracts-with-schedules-summary`, { params });
  }

  getContractSchedules(contractId: number, filters?: {
    status?: string;
    due_date_from?: string;
    due_date_to?: string;
  }): Observable<{
    success: boolean;
    data: PaymentSchedule[];
  }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.due_date_from) params = params.set('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params = params.set('due_date_to', filters.due_date_to);

    return this.http.get<{
      success: boolean;
      data: PaymentSchedule[];
    }>(`${this.baseUrl}/sales/contracts/${contractId}/schedules`, { params });
  }

  updateSchedule(scheduleId: number, data: {
    amount?: number;
    due_date?: string;
    notes?: string;
  }): Observable<{
    success: boolean;
    message: string;
    data: PaymentSchedule;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: PaymentSchedule;
    }>(`${this.baseUrl}/collections/schedules/${scheduleId}`, data);
  }

  deleteSchedule(scheduleId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/collections/schedules/${scheduleId}`);
  }

  markScheduleAsPaid(scheduleId: number, data: {
    paid_amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }): Observable<{
    success: boolean;
    message: string;
    data: PaymentSchedule;
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: PaymentSchedule;
    }>(`${this.baseUrl}/collections/schedules/${scheduleId}/mark-paid`, data);
  }

  markScheduleAsOverdue(scheduleId: number): Observable<{
    success: boolean;
    message: string;
    data: PaymentSchedule;
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: PaymentSchedule;
    }>(`${this.baseUrl}/collections/schedules/${scheduleId}/mark-overdue`, {});
  }

  sendInstallmentReminder(scheduleId: number, email?: string): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/notifications/schedules/${scheduleId}/send-reminder`, email ? { email } : {});
  }

  sendUpcomingReminders(daysAhead = 7): Observable<{
    success: boolean;
    message: string;
    data: { total: number; sent: number; failed: number; days_ahead: number };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: { total: number; sent: number; failed: number; days_ahead: number };
    }>(`${this.baseUrl}/collections/notifications/send-upcoming`, { days_ahead: daysAhead });
  }

  sendCustomEmail(email: string, subject: string, html: string): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/notifications/send-custom`, { email, subject, html });
  }

  sendCustomEmailForSchedule(scheduleId: number, subject: string, html: string): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/notifications/schedules/${scheduleId}/send-custom`, { subject, html });
  }

  // Reports
  getPaymentSummaryReport(filters?: {
    start_date?: string;
    end_date?: string;
    contract_id?: number;
  }): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    let params = new HttpParams();
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());

    return this.http.get<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/reports/payment-summary`, { params });
  }

  getOverdueAnalysisReport(filters?: {
    start_date?: string;
    end_date?: string;
    contract_id?: number;
  }): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    let params = new HttpParams();
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());

    return this.http.get<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/reports/overdue-analysis`, { params });
  }

  getCollectionEfficiencyReport(filters?: {
    start_date?: string;
    end_date?: string;
  }): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    let params = new HttpParams();
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/reports/collection-efficiency`, { params });
  }

  getAgingReport(filters?: {
    start_date?: string;
    end_date?: string;
    contract_id?: number;
  }): Observable<{
    success: boolean;
    message: string;
    data: any;
  }> {
    let params = new HttpParams();
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);
    if (filters?.contract_id) params = params.set('contract_id', filters.contract_id.toString());

    return this.http.get<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/collections/reports/aging`, { params });
  }
}
