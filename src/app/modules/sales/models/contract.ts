export interface Contract {
  contract_id: number;
  reservation_id: number;
  client_name: string;
  lot_name: string;
  sign_date: string;
  total_price: number;
  status: 'active' | 'cancelled';
}
