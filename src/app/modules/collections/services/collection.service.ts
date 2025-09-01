import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountReceivable } from '../models/account-receivable';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { CustomerPayment } from '../models/customer-payment';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  constructor(private http: HttpClient) {}

  listAccountsReceivable(): Observable<AccountReceivable[]> {
    return this.http.get<AccountReceivable[]>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}`
    );
  }

  getAccountReceivable(id: number): Observable<AccountReceivable> {
    return this.http.get<AccountReceivable>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/${id}`
    );
  }

  createAccountReceivable(
    data: Partial<AccountReceivable>
  ): Observable<AccountReceivable> {
    return this.http.post<AccountReceivable>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}`,
      data
    );
  }

  updateAccountReceivable(
    id: number,
    data: Partial<AccountReceivable>
  ): Observable<AccountReceivable> {
    return this.http.put<AccountReceivable>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/${id}`,
      data
    );
  }

  deleteAccountReceivable(id: number): Observable<void> {
    return this.http.delete<void>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/${id}`
    );
  }

  createPayment(
    accountReceivableId: number,
    payment: Partial<CustomerPayment>
  ): Observable<CustomerPayment> {
    return this.http.post<CustomerPayment>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/${accountReceivableId}/payments`,
      payment
    );
  }

  getPayments(accountReceivableId: number): Observable<CustomerPayment[]> {
    return this.http.get<CustomerPayment[]>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/${accountReceivableId}/payments`
    );
  }

  getOverdueAccounts(): Observable<AccountReceivable[]> {
    return this.http.get<AccountReceivable[]>(
      `${API_ROUTES.COLLECTIONS.ACCOUNTS_RECEIVABLE}/overdue`
    );
  }

  getCollectionReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(
      `${API_ROUTES.COLLECTIONS.REPORTS}?start_date=${startDate}&end_date=${endDate}`
    );
  }

  /**
   * Obtiene los pagos del cliente por contrato
   */
  getCustomerPaymentsByContract(contractId: number): Observable<CustomerPayment[]> {
    return this.http.get<CustomerPayment[]>(
      `${API_ROUTES.COLLECTIONS.CUSTOMER_PAYMENTS}/by-contract/${contractId}`
    );
  }

  /**
   * Obtiene todos los pagos de clientes con filtros
   */
  getCustomerPayments(filters?: {
    contract_id?: number;
    client_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<CustomerPayment[]> {
    let params = '';
    if (filters) {
      const queryParams = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
        .join('&');
      params = queryParams ? `?${queryParams}` : '';
    }
    
    return this.http.get<CustomerPayment[]>(
      `${API_ROUTES.COLLECTIONS.CUSTOMER_PAYMENTS}${params}`
    );
  }
}
