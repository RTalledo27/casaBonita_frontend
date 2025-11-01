export interface ProjectedReport {
  id: number;
  reportType: 'financial' | 'sales' | 'collections' | 'inventory';
  title: string;
  description: string;
  period: {
    startDate: string;
    endDate: string;
    type: 'monthly' | 'quarterly' | 'yearly';
  };
  metrics: ProjectedMetric[];
  charts: ChartData[];
  createdAt: string;
  updatedAt: string;
  // Propiedades adicionales usadas en el servicio
  name?: string;
  type?: string;
  year?: number;
  scenario?: string;
  projectedValue?: number;
  actualValue?: number | null;
  variation?: number;
  confidence?: number;
  createdBy?: string;
  status?: string;
  metadata?: {
    baseValue?: number;
    growthRate?: number;
    seasonalFactor?: number;
    marketFactor?: number;
  };
}

export interface ProjectedMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  category: string;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface FinancialProjection {
  revenue: {
    current: number;
    projected: number;
    growth: number;
  };
  expenses: {
    current: number;
    projected: number;
    growth: number;
  };
  profit: {
    current: number;
    projected: number;
    margin: number;
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    net: number;
  };
}

export interface SalesProjection {
  id?: number;
  name?: string;
  totalSales: {
    current: number;
    projected: number;
    target: number;
  };
  averageTicket: {
    current: number;
    projected: number;
    growth: number;
  };
  conversionRate: {
    current: number;
    projected: number;
    improvement: number;
  };
  salesByPeriod?: Array<{
    period: string;
    actual: number;
    projected: number;
  }>;
  period?: string;
  scenario?: string;
  confidence?: number;
}

export interface ProjectedReportFilter {
  reportType?: string;
  projectionType?: string; // Agregada propiedad projectionType
  startDate?: string;
  endDate?: string;
  period?: string;
  category?: string;
  year?: number; // Agregada propiedad year
  scenario?: string; // Agregada propiedad scenario
  page?: number;
  limit?: number;
}


export interface RevenueProjection {
  id: number;
  name: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  growthRate: number;
  period: string;
  scenario: string;
  confidence: number;
}

export interface CashFlowProjection {
  id: number;
  name: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  period: string;
  scenario: string;
  confidence: number;
}

export interface ProjectionScenario {
  id: number;
  name: string;
  key: string;
  description: string;
  growthFactor: number;
  riskFactor: number;
}

export interface ProjectionMetrics {
  totalProjections: number;
  activeProjections: number;
  averageConfidence: number;
  totalProjectedValue: number;
  averageVariation: number;
  byType: {
    financial: number;
    sales: number;
    revenue: number;
    cashflow: number;
    collection: number;
  };
  byScenario: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  byPeriod: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}