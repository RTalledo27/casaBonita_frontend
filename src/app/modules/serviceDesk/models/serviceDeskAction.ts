import { User } from "../../Secutiry/users/models/user";

export interface ServiceDeskAction {
  action_id: number;
  ticket_id: number;
  user: User;
  action_type: 'comentario' | 'cambio_estado' | 'escalado' | 'asignacion' | 'comment' | 'status_change' | 'escalation' | 'assignment';
  performed_at: string;
  notes?: string | null;
  next_action_date?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}