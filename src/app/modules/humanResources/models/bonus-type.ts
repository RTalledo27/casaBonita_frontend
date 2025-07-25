export interface BonusType {
  bonus_type_id: number;
  type_code: string;
  type_name: string;
  description?: string;
  calculation_method: 'percentage_of_goal' | 'fixed_amount' | 'sales_count' | 'collection_amount' | 'attendance_rate' | 'custom';
  is_automatic: boolean;
  requires_approval: boolean;
  applicable_employee_types: string[];
  frequency: 'monthly' | 'quarterly' | 'biweekly' | 'annual' | 'one_time';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Computed attributes
  calculation_method_label?: string;
  frequency_label?: string;
}