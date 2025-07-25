export interface CustomerPayment {
  payment_id: number;
  account_receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'check' | 'card';
  reference?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}
