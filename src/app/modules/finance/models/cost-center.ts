export interface CostCenter {
  cost_center_id: number;
  code: string;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
