export interface CustomerPayment {
  payment_id: number;
  account_receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'check' | 'card';
  reference?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;

  // === NUEVOS CAMPOS PARA COMISIONES CONDICIONADAS ===
  // Detección de tipo de cuota
  installment_type?: 'first' | 'second' | 'regular';
  affects_commissions?: boolean;
  detection_notes?: string;
  
  // Metadatos de detección
  detection_metadata?: {
    grace_period_days?: number;
    minimum_amount_threshold?: number;
    previous_payments_count?: number;
    commission_affecting_payments_count?: number;
  };
  
  // Fechas de procesamiento
  commission_processed_at?: string;
  last_detection_run?: string;
  
  // Relaciones con contratos y clientes
  contract_id?: number;
  client_id?: number;
  
  // Información adicional del contrato (cuando se incluye)
  contract?: {
    contract_id: number;
    contract_number: string;
    client_name: string;
    financing_amount: number;
    term_months: number;
  };
  
  // Información del cliente (cuando se incluye)
  client?: {
    client_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  
  // Información del usuario que creó el pago
  created_by_user?: {
    user_id: number;
    name: string;
    email: string;
  };
  
  // Estadísticas de comisiones afectadas
  affected_commissions_count?: number;
  total_commission_amount?: number;
}
