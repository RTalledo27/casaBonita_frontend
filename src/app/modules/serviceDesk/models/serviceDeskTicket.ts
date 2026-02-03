import { Contract } from "../../sales/models/contract";
import { User } from "../../Secutiry/users/models/user";
import { ServiceDeskAction } from "./serviceDeskAction";

export interface ServiceDeskTicket {
  ticket_id: number;
  contract_id?: number | null;

  contract?: Contract | null; // <-- Mejor para mostrar
  opened_by: User; // <-- Usuario que creó
  opened_at: string;
  ticket_type: 'garantia' | 'mantenimiento' | 'otro';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierto' | 'en_proceso' | 'cerrado';
  description?: string | null;
  sla_due_at?: string | null;
  escalated_at?: string | null;
  closed_at?: string | null;  // When the ticket was closed
  assigned_to?: User | null; // <-- Técnico asignado
  actions?: ServiceDeskAction[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
