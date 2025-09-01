import { ChartOfAccount } from "./chart-of-account"

export interface BudgetLine {
     budget_line_id: number
  budget_id: number
  account_id: number
  description: string
  budgeted_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
  created_at: string
  updated_at: string
  account?: ChartOfAccount
}
