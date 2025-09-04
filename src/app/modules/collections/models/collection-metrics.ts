export interface CollectionMetrics {
  total_receivable: number;
  receivable_change_percentage: number;
  overdue_amount: number;
  overdue_change_percentage: number;
  collection_rate: number;
  collection_rate_change: number;
  collected_this_month: number;
  pending_amount: number;
  active_collectors: number;
  currency: 'PEN';
  last_updated: string;
}

export interface CollectionTrends {
  monthly_data: MonthlyCollectionData[];
  status_distribution: StatusDistribution[];
  collector_performance: CollectorPerformance[];
}

export interface MonthlyCollectionData {
  month: string;
  year: number;
  collected: number;
  pending: number;
  overdue: number;
  target?: number;
  collection_rate: number;
}

export interface StatusDistribution {
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

export interface CollectorPerformance {
  collector_id: number;
  collector_name: string;
  assigned_accounts: number;
  collected_accounts: number;
  collected_amount: number;
  collection_rate: number;
  total_collected: number;
  amount_collected: number;
  avg_collection_days: number;
  efficiency_score: number;
  target_achievement: number;
}

export interface DelinquentClient {
  client_id: number;
  client_name: string;
  client_code?: string;
  total_overdue: number;
  days_overdue: number;
  account_count: number;
  overdue_accounts: number;
  last_payment_date?: string;
  contact_phone?: string;
  contact_email?: string;
  assigned_collector?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface CollectionTarget {
  target_id: number;
  period: string;
  target_amount: number;
  achieved_amount: number;
  achievement_percentage: number;
  currency: 'PEN';
}

export interface DashboardKPI {
  label: string;
  value: number;
  formatted_value: string;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'red' | 'yellow' | 'blue';
  icon: string;
}