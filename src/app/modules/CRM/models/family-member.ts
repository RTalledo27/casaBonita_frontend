export interface FamilyMember {
  member_id: number;
  client_id: number;
  first_name: string;
  last_name: string;
  doc_number: string;
  dni: string;
  relation: string; // 'padre', 'madre', 'hermano', etc.
  relationship: string;
}
