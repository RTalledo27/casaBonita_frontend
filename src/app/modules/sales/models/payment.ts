export interface Payment {
  payment_id: number;
  contract_id: number;
  amount: number;
  payment_date: string;
  status: 'pending' | 'paid';
}
