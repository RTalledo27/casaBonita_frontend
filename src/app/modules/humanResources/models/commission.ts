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

  // Campos para pagos divididos
  commission_period?: string; // YYYY-MM (período de generación)
  payment_period?: string; // YYYY-MM-P1, YYYY-MM-P2, etc. (período de pago)
  payment_percentage?: number; // 0-100 (porcentaje del pago)
  status?: 'generated' | 'partially_paid' | 'fully_paid' | 'cancelled';
  parent_commission_id?: number;
  payment_part?: number; // 1, 2, 3, etc.
  
  // Campos adicionales del sistema
  payment_type?: 'first_payment' | 'second_payment' | 'full_payment';
  total_commission_amount?: number; // Monto total de la comisión original
  sales_count?: number; // Cantidad de ventas del asesor

  // Relaciones
  employee: Employee;
  contract?: any;
  parent_commission?: Commission;
  child_commissions?: Commission[];
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
  
  // Nuevos campos para pagos divididos
  commission_period?: string;
  payment_period?: string;
  payment_percentage?: number;
  status?: 'generated' | 'partially_paid' | 'fully_paid' | 'cancelled';
  parent_commission_id?: number;
  payment_part?: number;
}

// Nueva interfaz para crear pagos divididos
export interface CreateSplitPaymentRequest {
  percentage: number;
  payment_period: string;
}

// Interfaz para el resumen de pagos divididos
export interface SplitPaymentSummary {
  original_amount: number;
  total_paid_percentage: number;
  total_paid_amount: number;
  remaining_percentage: number;
  remaining_amount: number;
  payments_count: number;
  payments: SplitPaymentDetail[];
}

export interface SplitPaymentDetail {
  payment_id: number;
  payment_part: number;
  percentage: number;
  amount: number;
  payment_period: string;
  payment_date?: string;
  status: string;
}

export interface UpdateCommissionRequest extends Partial<CreateCommissionRequest> {
  commission_id: number;
}
