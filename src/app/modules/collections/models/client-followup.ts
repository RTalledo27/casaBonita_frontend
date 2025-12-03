export interface ClientFollowupRecord {
  client_id?: number; // Referencia al cliente CRM
  contract_id?: number; // Contrato asociado
  sale_code: string;
  client_name: string;
  lot: string;
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
}
