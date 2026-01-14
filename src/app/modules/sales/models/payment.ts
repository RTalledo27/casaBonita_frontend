export interface Payment {
  payment_id: number;
  schedule_id: number;
  journal_entry_id?: number | null;
  amount: number;
  payment_date: string;
  method: 'transferencia' | 'efectivo' | 'tarjeta';
  reference?: string | null;
}
