export interface Advisor {
  employee_id: number;
  employee_code?: string;
  employee_type?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  base_salary?: string;
  variable_salary?: string;
  commission_percentage?: string;
  individual_goal?: string;
  is_commission_eligible?: boolean;
  is_bonus_eligible?: boolean;
  bank_account?: string;
  bank_name?: string;
  bank_cci?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  hire_date?: string;
  termination_date?: string;
  employment_status?: string;
  contract_type?: string;
  work_schedule?: string;
  social_security_number?: string;
  afp_code?: string;
  cuspp?: string;
  health_insurance?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_advisor?: boolean;
  user?: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    status?: string;
  };
}

export interface PaymentSchedule {
  schedule_id: number;
  contract_id: number;
  installment_number: number;
  due_date: string;
  amount: string;
  amount_paid?: string | null;
  status: string;
  payment_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Contract {
  contract_id: number;
  reservation_id?: number | null;
  advisor_id: number;
  contract_number: string;
  sign_date: string;
  total_price: string;
  down_payment: string;
  financing_amount: string;
  interest_rate: string;
  term_months: number;
  monthly_payment: string;
  currency: string;
  status: string;
  pdf_path?: string | null;
  previous_contract_id?: number | null;
  transferred_amount_from_previous_contract?: string | null;
  financing_type?: string | null;
  with_financing: boolean;
  funding: string;
  bpp: string;
  bfh: string;
  initial_quota: string;
  
  // Campos directos de la API
  client_name: string;
  lot_name: string;
  
  // Información del asesor
  advisor?: Advisor;
  
  // Relaciones
  reservation?: any | null;
  schedules?: PaymentSchedule[];
}
