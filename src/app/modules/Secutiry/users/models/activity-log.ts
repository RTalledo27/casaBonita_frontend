export interface ActivityLogUser {
  user_id: number;
  username: string;
  email?: string;
  name?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  action_label?: string | null;
  details?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: any;
  created_at: string;
  user?: ActivityLogUser | null;
}

