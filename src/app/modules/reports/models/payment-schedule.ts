export interface PaymentSchedule {
  id?: number;
  scheduleId?: number;
  contractId?: number;
  saleId?: number;
  installmentNumber?: number;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'pagado' | 'pendiente' | 'vencido' | string;
  paidDate?: string;
  paidAmount?: number;
  reference?: string;
  overdueDays?: number;
  daysOverdue?: number;
  paymentType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  lotNumber?: string;
  saleAmount?: number;
  notes?: string;
  daysUntilDue?: number;
  totalInstallments?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentScheduleFilter {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  overdueDays?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentScheduleSummary {
  totalScheduled: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentsByStatus: {
    pending: number;
    paid: number;
    overdue: number;
    partial: number;
  };
  upcomingPayments: PaymentSchedule[];
  overduePayments: PaymentSchedule[];
  collectionEfficiency: number;
}

export interface PaymentCalendar {
  date: string;
  payments: PaymentSchedule[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}