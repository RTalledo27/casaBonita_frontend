import { Client } from "../../CRM/models/client";
import { Contract } from "../../sales/models/contract";
import { CustomerPayment } from "./customer-payment";

export interface AccountReceivable {
  account_receivable_id: number;
  client_id: number;
  contract_id?: number;
  invoice_number: string;
  amount: number;
  currency: 'PEN' | 'USD';
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  contract?: Contract;
  payments?: CustomerPayment[];
  balance?: number;
}
