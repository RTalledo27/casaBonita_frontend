import { User } from "../../Secutiry/users/models/user";

export interface CrmInteraction {
  interaction_id: number;
  client_id: number;
  user_id: number;
  date: string; // ISO date
  channel: 'call' | 'email' | 'whatsapp' | 'visit' | 'other';
  notes: string;
  user?: User;
}
