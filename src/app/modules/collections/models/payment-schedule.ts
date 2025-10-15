export interface PaymentSchedule {
  schedule_id: number;
  contract_id: number;
  contract_number?: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pendiente' | 'pagado' | 'vencido';
  payment_date?: string;
  payment_method?: 'cash' | 'transfer' | 'check' | 'card';
  notes?: string;
  created_at: string;
  updated_at: string;
  days_since_created?: number | string;
  days_overdue?: number;
  client_name?: string;
}

export interface PaymentScheduleFilters {
  contract_id?: number;
  status?: 'pendiente' | 'pagado' | 'vencido';
  due_date_from?: string;
  due_date_to?: string;
  date_from?: string;
  date_to?: string;
  amount_from?: number;
  amount_to?: number;
  amount_min?: number;
  amount_max?: number;
  client_id?: string;
  contract_type?: string;
  search?: string;
  overdue_days?: string;
  page?: number;
  per_page?: number;
}

export interface CreatePaymentScheduleRequest {
  contract_id: number;
  due_date: string;
  amount: number;
  notes?: string;
}

export interface UpdatePaymentScheduleRequest {
  due_date?: string;
  amount?: number;
  status?: 'pendiente' | 'pagado' | 'vencido';
  payment_date?: string;
  payment_method?: 'cash' | 'transfer' | 'check' | 'card';
  notes?: string;
}

export interface MarkPaymentPaidRequest {
  payment_date: string;
  amount_paid: number;
  payment_method?: 'cash' | 'transfer' | 'check' | 'card';
  notes?: string;
}

export interface PaymentScheduleMetrics {
  total_schedules: number;
  pending_amount: number;
  paid_amount: number;
  overdue_amount: number;
  overdue_count: number;
  payment_rate: number;
  currency: 'PEN';
}

export interface PaymentScheduleReport {
  contract_id: number;
  contract_number: string;
  client_name: string;
  lot_name: string;
  total_schedules: number;
  paid_schedules: number;
  pending_schedules: number;
  overdue_schedules: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  payment_rate: number;
  schedules: PaymentSchedule[];
}

export interface ContractSummary {
  contract_id: number;
  contract_number: string;
  client_name: string;
  client_id: number;
  advisor_name: string;
  advisor_id: number;
  lot_name: string;
  total_schedules: number;
  paid_schedules: number;
  pending_schedules: number;
  overdue_schedules: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  payment_rate: number;
  next_due_date: string | null;
  schedules: PaymentSchedule[];
  expanded?: boolean;
}

export interface ContractSchedulesResponse {
  success: boolean;
  message: string;
  data: ContractSummary[];
  meta?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface GenerateScheduleRequest {
  contract_id: number;
  start_date?: string;
}

export interface GenerateScheduleResponse {
  success: boolean;
  data: PaymentSchedule[];
  contract: {
    contract_id: number;
    financing_amount: number;
    term_months: number;
    monthly_payment: number;
  };
  message?: string;
}