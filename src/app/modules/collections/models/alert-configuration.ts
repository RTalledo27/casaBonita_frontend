import { AccountReceivable } from './account-receivable';
import { Collector } from './collector';

export interface AlertConfiguration {
  config_id: number;
  days_before_due: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  auto_assign_collector: boolean;
  escalation_days: number;
  escalation_levels: EscalationLevel[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EscalationLevel {
  level: number;
  days_after_due: number;
  action_type: 'email' | 'sms' | 'call' | 'legal' | 'auto_assign';
  recipient_type: 'client' | 'collector' | 'manager' | 'legal';
  template_id?: number;
  auto_execute: boolean;
}

export interface Alert {
  alert_id: number;
  account_receivable_id: number;
  alert_type: 'due_soon' | 'overdue' | 'escalation' | 'payment_received';
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved' | 'cancelled';
  scheduled_date: string;
  due_date: string;
  sent_date?: string;
  acknowledged_date?: string;
  resolved_date?: string;
  message: string;
  title: string;
  description: string;
  recipient_type: 'client' | 'collector' | 'manager';
  recipient_id?: number;
  escalation_level?: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  account_receivable?: AccountReceivable;
  assigned_collector?: Collector;
}

export interface AlertAction {
  action_id: number;
  alert_id: number;
  action_type: 'email_sent' | 'sms_sent' | 'call_made' | 'acknowledged' | 'resolved' | 'escalated';
  action_date: string;
  performed_by: number;
  result: 'successful' | 'failed' | 'partial';
  notes?: string;
  next_action_date?: string;
}

export interface AlertSummary {
  total_alerts: number;
  active_alerts: number;
  pending_alerts: number;
  overdue_alerts: number;
  resolved_today: number;
  total_month: number;
  escalated_alerts: number;
  by_priority: {
    low: number;
    normal: number;
    high: number;
    critical: number;
  };
  by_type: {
    due_soon: number;
    overdue: number;
    escalation: number;
    payment_received: number;
  };
}

export interface NotificationTemplate {
  template_id: number;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertFilters {
  status?: 'pending' | 'sent' | 'acknowledged' | 'resolved' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  alert_type?: 'due_soon' | 'overdue' | 'escalation' | 'payment_received';
  date_from?: string;
  date_to?: string;
  collector_id?: number;
  client_id?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}