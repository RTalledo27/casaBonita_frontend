export interface PaymentSchedule {
  id: number;
  saleId: number;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
  reference?: string; // Agregada propiedad reference
  overdueDays?: number; // Agregada propiedad overdueDays
  paymentType?: string; // Agregada propiedad paymentType
  clientName?: string; // Agregada propiedad clientName
  notes?: string; // Agregada propiedad notes
  daysUntilDue: number; // Agregada propiedad daysUntilDue
  clientEmail: string; // Agregada propiedad clientEmail
  totalInstallments: number; // Agregada propiedad totalInstallments
  createdAt: string;
  updatedAt: string;
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