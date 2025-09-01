export interface PaymentSchedule {
  schedule_id: number;
  contract_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pendiente' | 'pagado' | 'vencido';
  payment_date?: string;
  payment_method?: 'cash' | 'transfer' | 'check' | 'card';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentScheduleFilters {
  contract_id?: number;
  status?: 'pendiente' | 'pagado' | 'vencido';
  due_date_from?: string;
  due_date_to?: string;
  amount_from?: number;
  amount_to?: number;
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
  currency: 'PEN' | 'USD';
}

export interface PaymentScheduleReport {
  summary: {
    total_schedules: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
    payment_rate: number;
  };
  status_distribution: {
    status: string;
    count: number;
    amount: number;
  }[];
  monthly_trends: {
    month: string;
    scheduled_amount: number;
    paid_amount: number;
    overdue_amount: number;
  }[];
  schedules: PaymentSchedule[];
  // Propiedades adicionales para compatibilidad con el componente
  total_schedules: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  paid_count?: number;
  pending_count?: number;
  overdue_count: number;
  monthly_trend?: {
    month: string;
    schedules_count: number;
    total_amount: number;
    paid_amount: number;
  }[];
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