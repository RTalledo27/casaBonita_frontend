import { Employee } from "./employee";

export interface Commission {
  commission_id: number;
  employee_id: number;
  contract_id: number;
  commission_type?: string;
  sale_amount?: number;
  installment_plan?: number;
  commission_percentage?: number;
  commission_amount: number;
  payment_status: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  period_month: number;
  period_year: number;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relaciones
  employee?: Employee;
  contract?: any;
}

export interface CreateCommissionRequest {
  employee_id: number;
  contract_id?: number;
  commission_type?: string;
  sale_amount?: number;
  installment_plan?: number;
  commission_percentage?: number;
  commission_amount: number;
  payment_status?: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  period_month: number;
  period_year: number;
  notes?: string;
}

export interface UpdateCommissionRequest extends Partial<CreateCommissionRequest> {
  commission_id: number;
}
