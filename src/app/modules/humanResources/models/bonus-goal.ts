import { BonusType } from "./bonus-type";
import { Team } from "./team";

export interface BonusGoal {
  bonus_goal_id: number;
  bonus_type_id: number;
  goal_name: string;
  description?: string;
  target_value?: number;
  min_achievement: number;
  max_achievement?: number;
  bonus_amount?: number;
  bonus_percentage?: number;
  employee_type?: string;
  team_id?: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relaciones
  bonus_type?: BonusType;
  team?: Team;
}