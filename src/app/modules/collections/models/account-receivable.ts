import { Client } from "../../CRM/models/client";
import { Contract } from "../../sales/models/contract";
import { CustomerPayment } from "./customer-payment";
import { Collector, CollectorAssignment } from "./collector";

export interface AccountReceivable {
  id: string;
  account_receivable_id: number;
  client_id: number;
  client_name: string;
  contract_id?: number;
  invoice_number: string;
  amount: number;
  currency: 'PEN' | 'USD';
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  collector_id?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  last_action_date?: string;
  next_action_date?: string;
  days_overdue?: number;
  collection_attempts?: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  client?: Client;
  contract?: Contract;
  collector?: Collector;
  payments?: CustomerPayment[];
  assignments?: CollectorAssignment[];
  // Campos calculados
  balance?: number;
  paid_amount?: number;
  remaining_amount?: number;
}

export interface AccountReceivableFilters {
  status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  client_id?: number;
  collector_id?: number;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  currency?: 'PEN' | 'USD';
  amount_from?: number;
  amount_to?: number;
  days_overdue_from?: number;
  days_overdue_to?: number;
}

export interface CreateAccountReceivableRequest {
  client_id: number;
  contract_id?: number;
  invoice_number: string;
  amount: number;
  currency: 'PEN' | 'USD';
  due_date: string;
  description?: string;
  collector_id?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface UpdateAccountReceivableRequest {
  invoice_number?: string;
  amount?: number;
  due_date?: string;
  description?: string;
  collector_id?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
}

export interface AccountReceivableMetrics {
  total_accounts: number;
  total_amount: number;
  pending_amount: number;
  overdue_amount: number;
  paid_amount: number;
  collection_rate: number;
  average_days_to_collect: number;
  currency: 'PEN' | 'USD';
}
