import { BudgetLine } from "./budget-line";
import { CostCenter } from "./cost-center";

export interface Budget {
  budget_id: number;
  name: string;
  description?: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  currency: 'PEN' | 'USD';
  status: 'draft' | 'approved' | 'active' | 'closed';
  cost_center_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  budget_lines?: BudgetLine[];
  cost_center?: CostCenter;
}
