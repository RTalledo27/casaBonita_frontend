export interface ClientFollowupRecord {
  followup_id?: number;
  client_id?: number; // Referencia al cliente CRM
  contract_id?: number; // Contrato asociado
  sale_code: string;
  client_name: string;
  lot: string;
  lot_id?: number;
  lot_area_m2?: number;
  lot_status?: string;
  contract_status?: string;
  advisor_id?: number;
  advisor_name?: string;
  dni: string;
  phone1: string;
  phone2?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  department?: string;
  due_date?: string;
  sale_price?: number;
  amount_paid?: number;
  amount_due?: number;
  monthly_quota?: number;
  paid_installments?: number;
  pending_installments?: number;
  total_installments?: number;
  overdue_installments?: number;
  pending_amount?: number;
  contact_date?: string;
  action_taken?: string;
  management_result?: string;
  management_notes?: string;
  home_visit_date?: string;
  home_visit_reason?: string;
  home_visit_result?: string;
  home_visit_notes?: string;
  management_status?: 'pending' | 'in_progress' | 'resolved' | 'unreachable' | 'escalated';
  last_contact?: string;
  next_action?: string;
  owner?: string; // Nombre del responsable
  assigned_employee_id?: number; // ID del empleado responsable
  general_notes?: string;
  general_reason?: string;
  // Campos de compromiso de pago
  commitment_date?: string; // Fecha comprometida para el pago
  commitment_amount?: number; // Monto comprometido
  commitment_status?: 'pending' | 'fulfilled' | 'broken' | null; // Estado del compromiso
  commitment_notes?: string; // Notas sobre el compromiso
  commitment_fulfilled_date?: string; // Fecha en que se cumplió el compromiso
}
