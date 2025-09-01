import { Employee } from "./employee";

export interface Incentive {
  incentive_id: number;
  employee_id: number;
  incentive_name: string;
  description?: string;
  amount: number;
  target_description?: string;
  deadline?: string;
  status: 'activo' | 'completado' | 'pagado' | 'cancelado';
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  completed_at?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relaciones
  employee?: Employee;
  creator?: Employee;
  approver?: Employee;
}