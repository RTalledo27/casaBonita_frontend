import { AccountReceivable } from './account-receivable';

export interface Collector {
  id: string;
  collector_id: number;
  employee_id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_leave';
  department: string;
  active: boolean;
  collection_target: number;
  currency: 'PEN' | 'USD';
  last_activity_date: string;
  created_at: string;
  updated_at: string;
  // Métricas calculadas
  assigned_accounts_count: number;
  total_assigned_amount?: number;
  collection_rate: number;
  avg_collection_days?: number;
  collected_this_month?: number;
  target_achievement?: number;
}

export interface CollectorAssignment {
  assignment_id: number;
  collector_id: number;
  account_receivable_id: number;
  assigned_date: string;
  status: 'active' | 'completed' | 'reassigned' | 'cancelled';
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  expected_collection_date?: string;
  last_action_date?: string;
  next_action_date?: string;
  // Relaciones
  collector?: Collector;
  account_receivable?: AccountReceivable;
}

export interface CollectorMetrics {
  collector_id: number;
  period: string;
  assigned_accounts: number;
  collected_accounts: number;
  total_assigned_amount: number;
  total_collected_amount: number;
  collection_rate: number;
  avg_collection_days: number;
  overdue_accounts: number;
  target_amount: number;
  target_achievement: number;
  efficiency_score: number;
}

export interface CollectorWorkload {
  collector_id: number;
  collector_name: string;
  current_assignments: number;
  total_assigned_amount: number;
  overdue_assignments: number;
  capacity_percentage: number;
  max_capacity: number;
  available_capacity: number;
}

export interface AssignmentRequest {
  account_receivable_ids: string[];
  collector_id: string;
  assigned_by: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  notes?: string;
  expected_collection_date?: string;
  auto_assign?: boolean;
}

export interface ReassignmentRequest {
  assignment_id: string;
  new_collector_id: string | null;
  reason: string;
  reassigned_by: string;
  notes?: string;
}

export interface CollectorAction {
  action_id: number;
  assignment_id: number;
  action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal' | 'payment_plan' | 'other';
  action_date: string;
  description: string;
  result: 'successful' | 'unsuccessful' | 'partial' | 'pending';
  next_action_date?: string;
  amount_collected?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}