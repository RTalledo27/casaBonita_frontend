export interface Contract {
  contract_id: number;
  reservation_id: number;
  contract_number: string;
  client_name: string;
  lot_name: string;
  sign_date: string;
  total_price: number;
  status: 'active' | 'cancelled';
  
  // Campos financieros migrados desde Lot
  funding?: number;
  bpp?: number;
  bfh?: number;
  initial_quota?: number;
  
  // Campos financieros existentes
  down_payment?: number;
  financing_amount?: number;
  interest_rate?: number;
  term_months?: number;
  monthly_payment?: number;
  balloon_payment?: number;
  currency?: string;
}
