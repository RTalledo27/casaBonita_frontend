export interface SalesReport {
  id: number;
  saleNumber: string;
  date: string;
  saleDate?: string; // Agregada propiedad saleDate
  advisor: {
    id: number;
    name: string;
    office: string;
  };
  advisorName?: string; // Agregada propiedad advisorName
  officeName?: string; // Agregada propiedad officeName
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  clientName?: string; // Agregada propiedad clientName
  clientEmail?: string; // Agregada propiedad clientEmail
  projectName?: string; // Agregada propiedad projectName
  lotNumber?: string; // Agregada propiedad lotNumber
  saleAmount?: number; // Agregada propiedad saleAmount
  financingAmount?: number; // Agregada propiedad financingAmount
  paymentMethod?: string; // Agregada propiedad paymentMethod
  contractNumber?: string; // Agregada propiedad contractNumber
  lot: {
    id: number;
    number: string;
    manzana: string;
    area: number;
    price: number;
  };
  totalAmount: number;
  amount?: number; // Agregada propiedad amount
  downPayment: number;
  financedAmount: number;
  installments: number;
  monthlyPayment: number;
  paymentType?: string; // Agregada propiedad paymentType
  commission?: number; // Agregada propiedad commission
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SalesReportFilter {
  startDate?: string;
  endDate?: string;
  advisorId?: number;
  projectId?: number;
  office?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalesReportSummary {
  totalSales: number;
  totalRevenue: number;
  totalAmount: number;
  averageAmount: number;
  averageSale: number;
  salesGrowth: number;
  uniqueClients: number;
  activeEmployees: number;
  salesByStatus: {
    active: number;
    cancelled: number;
    completed: number;
  };
  salesByOffice: Array<{
    office: string;
    count: number;
    amount: number;
  }>;
  topAdvisors: Array<{
    id: number;
    name: string;
    salesCount: number;
    totalAmount: number;
  }>;
}