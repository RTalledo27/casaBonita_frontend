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

export interface Contract {
  contract_id: number;
  reservation_id?: number;
  advisor_id: number;
  contract_number: string;
  client_name: string;
  lot_name: string;
  sign_date: string;
  total_price: string;
  status: string;
  
  // Información del asesor
  advisor?: Advisor;
  
  // Campos financieros
  down_payment?: string;
  financing_amount?: string;
  interest_rate?: string;
  term_months?: number;
  monthly_payment?: string;
  currency?: string;
  pdf_path?: string;
  previous_contract_id?: number;
  transferred_amount_from_previous_contract?: string;
  financing_type?: string;
  with_financing?: boolean;
  
  // Campos financieros migrados desde Lot
  funding?: string;
  bpp?: string;
  bfh?: string;
  initial_quota?: string;
  
  // Relaciones
  reservation?: any;
  schedules?: any[];
  approvals?: any[];
  financial_summary?: {
    down_payment_percentage: number;
    financing_percentage: number;
    total_interest: number;
    total_to_pay: number;
  };
}
