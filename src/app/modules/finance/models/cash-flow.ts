export interface CashFlow {
  cash_flow_id: number;
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  account_id?: number;
  budget_id?: number;
  created_at: string;
  updated_at: string;
}
