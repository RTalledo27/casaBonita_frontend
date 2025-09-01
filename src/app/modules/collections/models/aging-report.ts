export interface AgingReportData {
  periods: AgingPeriodSummary[];
  total_amount: number;
  currency: 'PEN' | 'USD';
  clients: AgingClientData[];
  generated_at: string;
}

export interface AgingClientData {
  client_id: number;
  client_name: string;
  client_code?: string;
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  over_90: number;
  total: number;
  currency: 'PEN' | 'USD';
  last_payment_date?: string;
  aging_periods: AgingPeriodSummary[];
  contact_info?: {
    email?: string;
    phone?: string;
  };
}

export interface AgingReportFilters {
  client_id?: number;
  currency?: 'PEN' | 'USD';
  date_from?: string;
  date_to?: string;
  include_paid?: boolean;
  collector_id?: number;
  minimum_amount?: number;
}

export interface AgingPeriodSummary {
  period_name: string;
  period_days: string;
  amount: number;
  percentage: number;
  account_count: number;
  color: string;
}

export interface AgingExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  include_details: boolean;
  group_by_currency: boolean;
  filters: AgingReportFilters;
}