export interface SalesCut {
  cut_id: number;
  cut_date: string;
  cut_type: 'daily' | 'weekly' | 'monthly';
  status: 'open' | 'closed' | 'reviewed' | 'exported';
  total_sales_count: number;
  total_revenue: number;
  total_down_payments: number;
  total_payments_count: number;
  total_payments_received: number;
  paid_installments_count: number;
  total_commissions: number;
  cash_balance: number;
  bank_balance: number;
  notes?: string;
  summary_data?: SalesCutSummary;
  closed_by?: number;
  closed_at?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  closed_by_user?: {
    user_id: number;
    first_name: string;
    last_name: string;
  };
  reviewed_by_user?: {
    user_id: number;
    first_name: string;
    last_name: string;
  };
  items?: SalesCutItem[];
}

export interface SalesCutItem {
  item_id: number;
  cut_id: number;
  item_type: 'sale' | 'payment' | 'commission';
  contract_id?: number;
  payment_schedule_id?: number;
  employee_id?: number;
  amount: number;
  commission?: number;
  payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'check';
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  
  // Relations
  contract?: {
    contract_id: number;
    contract_number: string;
    client?: {
      client_id: number;
      first_name: string;
      last_name: string;
    };
    lot?: {
      lot_id: number;
      num_lot: number;
    };
  };
  employee?: {
    employee_id: number;
    user?: {
      user_id: number;
      first_name: string;
      last_name: string;
    };
  };
  payment_schedule?: {
    schedule_id: number;
    installment_number: number;
    type: string;
  };
}

export interface SalesCutSummary {
  sales_by_advisor: AdvisorSalesSummary[];
  payments_by_method: PaymentMethodSummary[];
  top_sales: TopSale[];
}

export interface AdvisorSalesSummary {
  advisor_name: string;
  sales_count: number;
  total_amount: number;
  total_commission: number;
}

export interface PaymentMethodSummary {
  method: string;
  count: number;
  total: number;
}

export interface TopSale {
  contract_number: string;
  client_name: string;
  amount: number;
  advisor_name: string;
}

export interface SalesCutFilters {
  per_page?: number;
  status?: 'open' | 'closed' | 'reviewed' | 'exported';
  type?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
}

export interface MonthlyStats {
  total_sales: number;
  total_revenue: number;
  total_payments: number;
  total_commissions: number;
  total_reservations?: number;
  total_separation?: number;
  daily_average: {
    sales: number;
    revenue: number;
    payments: number;
  };
  cuts_count: number;
  closed_cuts: number;
}

export interface CreateCutRequest {
  date?: string;
}

export interface UpdateNotesRequest {
  notes: string;
}
