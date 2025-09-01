import { Employee } from "./employee";
import { BonusType } from "./bonus-type";
import { BonusGoal } from "./bonus-goal";

export interface Bonus {
  bonus_id: number;
  employee_id: number;
  bonus_type_id: number;
  bonus_goal_id?: number;
  bonus_name: string;
  bonus_amount: number;
  target_amount?: number;
  achieved_amount?: number;
  achievement_percentage?: number;
  payment_status: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  period_month?: number;
  period_year?: number;
  period_quarter?: number;
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relaciones
  employee?: Employee;
  bonus_type?: BonusType;
  bonus_goal?: BonusGoal;
  creator?: Employee;
  approver?: Employee;

  // Computed attributes
  payment_status_label?: string;
  period_label?: string;
  status_badge_class?: string;
}
