import { Employee } from "./employee";

// Interfaz para verificaciones de pago de comisiones
export interface CommissionPaymentVerification {
  id: number;
  commission_id: number;
  customer_payment_id: number;
  payment_installment: 'first' | 'second';
  verification_status: 'pending' | 'verified' | 'failed' | 'reversed';
  verified_at?: string;
  verified_by?: number;
  payment_amount: number;
  payment_date: string;
  verification_notes?: string;
  verification_metadata?: any;
  created_at: string;
  updated_at: string;
}

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

  // Campos para verificación de pagos del cliente
  requires_client_payment_verification?: boolean;
  payment_verification_status?: 'pending_verification' | 'first_payment_verified' | 'second_payment_verified' | 'fully_verified' | 'verification_failed';
  first_payment_verified_at?: string;
  second_payment_verified_at?: string;
  is_eligible_for_payment?: boolean;
  verification_notes?: string;

  // === NUEVOS CAMPOS PARA COMISIONES CONDICIONADAS ===
  // Configuración de dependencia de pagos
  payment_dependency_type?: 'none' | 'first_payment_only' | 'second_payment_only' | 'both_payments' | 'any_payment';
  required_client_payments?: number; // Número mínimo de pagos requeridos
  
  // Estado de verificación de pagos
  payment_verification_status_new?: 'pending' | 'verified' | 'partially_verified' | 'failed';
  client_payments_verified?: number; // Número de pagos verificados
  
  // Configuración de verificación automática
  auto_verification_enabled?: boolean;
  next_verification_date?: string;
  
  // Notas y metadatos de verificación
  verification_notes_new?: string;
  verification_metadata?: any;
  
  // Fechas de verificación
  first_payment_verification_date?: string;
  second_payment_verification_date?: string;
  last_verification_attempt?: string;
  
  // Contadores y estadísticas
  verification_attempts?: number;
  failed_verification_count?: number;

  // Relaciones
  employee: Employee;
  contract?: any;
  parent_commission?: Commission;
  child_commissions?: Commission[];
  payment_verifications?: CommissionPaymentVerification[];
  paymentVerifications?: CommissionPaymentVerification[]; // Alias para compatibilidad
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

// === INTERFACES PARA VERIFICACIÓN DE COMISIONES ===

export interface CommissionVerificationFilters {
  verification_status?: 'pending_verification' | 'first_payment_verified' | 'second_payment_verified' | 'fully_verified' | 'verification_failed';
  payment_dependency_type?: 'none' | 'first_payment_only' | 'second_payment_only' | 'both_payments' | 'any_payment';
  employee_id?: number;
  contract_id?: number;
  date_from?: string;
  date_to?: string;
  auto_verification_enabled?: boolean;
  requires_manual_review?: boolean;
  page?: number;
  per_page?: number;
}

export interface VerificationStats {
  total_commissions: number;
  pending_verification: number;
  first_payment_verified: number;
  second_payment_verified: number;
  fully_verified: number;
  verification_failed: number;
  auto_verification_enabled: number;
  manual_verification_required: number;
  by_dependency_type: {
    none: number;
    first_payment_only: number;
    second_payment_only: number;
    both_payments: number;
    any_payment: number;
  };
  verification_trends: {
    date: string;
    verified: number;
    pending: number;
  }[];
}

export interface CommissionVerificationStatus {
  commission_id: number;
  payment_dependency_type: string;
  verification_status: string;
  client_payments_verified: number;
  required_client_payments: number;
  auto_verification_enabled: boolean;
  next_verification_date: string | null;
  verification_notes: string | null;
  payment_verifications: PaymentVerification[];
}

export interface PaymentVerification {
  verification_id: number;
  commission_id: number;
  customer_payment_id: number;
  installment_type: 'first' | 'second' | 'regular';
  verification_date: string;
  verification_amount: number;
  verification_notes: string | null;
  verified_by: number;
  customer_payment?: {
    payment_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string | null;
  };
}

export interface VerificationSettings {
  payment_dependency_type: 'none' | 'first_payment_only' | 'second_payment_only' | 'both_payments' | 'any_payment';
  required_client_payments: number;
  auto_verification_enabled: boolean;
}

export interface AutoVerificationResult {
  processed_count: number;
  verified_count: number;
  errors_count: number;
  details: {
    commission_id: number;
    result?: {
      first_payment: boolean;
      second_payment: boolean;
      verification_status: string;
      notes: string;
    };
    error?: string;
  }[];
}
