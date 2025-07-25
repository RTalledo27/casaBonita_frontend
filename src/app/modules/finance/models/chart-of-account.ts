export interface ChartOfAccount {
  account_id: number;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_id?: number;
  is_active: boolean;
}
