export interface Team {
  team_id: number;
  team_name: string;
  team_code?: string;
  description?: string;
  team_leader_id?: number;
  monthly_goal?: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  leader?: any;
  employees?: any[];
  employees_count?: number;
}

