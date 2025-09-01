import { Address } from "./address";
import { CrmInteraction } from "./crm-interaction";
import { FamilyMember } from "./family-member";

export interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  doc_type: 'DNI' | 'CE' | 'RUC' | 'PAS'; // según tu enum
  doc_number: string;
  email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo' | null;
  type: 'lead' | 'client' | 'provider';
  date: string | null; // ISO string (ej. '2025-06-03')
  occupation: string | null;
  salary: number | null;
  family_members?: FamilyMember[];
  created_at?: string;
  updated_at?: string;

  // Relaciones
  spouses?: Client[]; // many-to-many self-reference
  addresses?: Address[];
  interactions?: CrmInteraction[];
  //reservations?: Reservation[];
}
