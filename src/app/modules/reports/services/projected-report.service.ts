import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  ProjectedReport, 
  ProjectedReportFilter, 
  FinancialProjection,
  SalesProjection,
  RevenueProjection,
  CashFlowProjection,
  ProjectionScenario,
  ProjectionMetrics 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectedReportService {
  private apiUrl = `${environment.URL_BACKEND}/v1/reports/projected`; // Updated endpoint
  private projectedReportsSubject = new BehaviorSubject<ProjectedReport[]>([]);
  public projectedReports$ = this.projectedReportsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Método para obtener proyecciones de ventas
  getSalesProjections(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/sales`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching sales projections:', error);
        return of(this.getMockSalesProjections());
      })
    );
  }

  // Método para obtener proyecciones de flujo de caja
  getCashFlowProjections(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    
    // Ensure period parameter is always provided (required by Laravel API)
    params = params.set('period', 'monthly'); // Default to monthly
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/charts/cashflow`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching cash flow projections:', error);
        return of(this.getMockCashFlowProjections());
      })
    );
  }

  // Método para obtener proyecciones de inventario
  getInventoryProjections(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/inventory`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching inventory projections:', error);
        return of(this.getMockInventoryProjections());
      })
    );
  }

  // Método para obtener análisis de mercado
  getMarketAnalysis(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/market-analysis`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching market analysis:', error);
        return of(this.getMockMarketAnalysis());
      })
    );
  }

  // Método para obtener proyecciones de ROI
  getROIProjections(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/roi`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching ROI projections:', error);
        return of(this.getMockROIProjections());
      })
    );
  }

  // Método para obtener análisis de escenarios
  getScenarioAnalysis(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/scenario-analysis`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching scenario analysis:', error);
        return of(this.getMockScenarioAnalysis());
      })
    );
  }

  // Método para obtener proyecciones financieras (agregado para compatibilidad)
  getFinancialProjections(filters?: ProjectedReportFilter): Observable<FinancialProjection[]> {
    let params = new HttpParams();
    
    // Ensure period parameter is always provided (required by Laravel API)
    params = params.set('period', 'monthly'); // Default to monthly
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    // Usar la ruta de cash-flow como proyección financiera principal
    return this.http.get<any>(`${this.apiUrl}/cash-flow`, { params }).pipe(
      map(response => {
        // Convertir la respuesta a formato FinancialProjection[]
        if (response && response.projections) {
          return response.projections.map((proj: any) => ({
            revenue: {
              current: proj.revenue || 0,
              projected: proj.revenue * 1.1 || 0,
              growth: 10
            },
            expenses: {
              current: proj.expenses || 0,
              projected: proj.expenses * 1.05 || 0,
              growth: 5
            },
            profit: {
              current: (proj.revenue - proj.expenses) || 0,
              projected: ((proj.revenue * 1.1) - (proj.expenses * 1.05)) || 0,
              margin: 15
            },
            cashFlow: {
              inflow: proj.revenue || 0,
              outflow: proj.expenses || 0,
              net: (proj.revenue - proj.expenses) || 0
            }
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching financial projections:', error);
        return of(this.getMockFinancialProjections());
      })
    );
  }

  // NEW: Get key metrics from new backend endpoint
  getProjectionMetrics(year?: number, scenario?: string): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (scenario) params = params.set('scenario', scenario);

    return this.http.get<any>(`${this.apiUrl}/metrics`, { params }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error fetching projection metrics:', error);
        return of(this.getMockKPIs());
      })
    );
  }

  // NEW: Get revenue projection chart data
  getRevenueProjectionChartData(year?: number, monthsAhead?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (monthsAhead) params = params.set('months_ahead', monthsAhead.toString());

    return this.http.get<any>(`${this.apiUrl}/charts/revenue`, { params }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error fetching revenue chart data:', error);
        return of({ labels: [], datasets: [] });
      })
    );
  }

  // NEW: Get sales projection chart data
  getSalesProjectionChartData(year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());

    return this.http.get<any>(`${this.apiUrl}/charts/sales`, { params }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error fetching sales chart data:', error);
        return of({ labels: [], datasets: [] });
      })
    );
  }

  // NEW: Get cash flow chart data
  getCashFlowChartData(year?: number, monthsAhead?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (monthsAhead) params = params.set('months_ahead', monthsAhead.toString());

    return this.http.get<any>(`${this.apiUrl}/charts/cashflow`, { params }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error fetching cashflow chart data:', error);
        return of({ labels: [], datasets: [] });
      })
    );
  }

  // Métodos existentes actualizados
  getProjectedReports(filters?: ProjectedReportFilter): Observable<ProjectedReport[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.projectionType) params = params.set('projection_type', filters.projectionType);
      if (filters.period) params = params.set('period', filters.period);
      if (filters.year) params = params.set('year', filters.year.toString());
      if (filters.scenario) params = params.set('scenario', filters.scenario);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        const reports = response.data || response;
        this.projectedReportsSubject.next(reports);
        return reports;
      }),
      catchError(error => {
        console.error('Error fetching projected reports:', error);
        const mockReports = this.getMockProjectedReports(filters);
        this.projectedReportsSubject.next(mockReports);
        return of(mockReports);
      })
    );
  }

  getProjectedReportById(id: number): Observable<ProjectedReport> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error fetching projected report by id:', error);
        const mockReport = this.getMockProjectedReports().find(r => r.id === id);
        return of(mockReport || this.createMockProjectedReport(id));
      })
    );
  }

  // Método de compatibilidad para revenue projections
  getRevenueProjections(filters?: ProjectedReportFilter): Observable<any> {
    return this.getSalesProjections(filters);
  }

  // Get collections projections
  getCollectionsProjections(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/collections`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching collections projections:', error);
        return of(this.getMockCollectionsProjections());
      })
    );
  }

  // Get KPIs dashboard
  getKPIs(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/kpis`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching KPIs:', error);
        return of(this.getMockKPIs());
      })
    );
  }

  // Get trend analysis
  getTrendAnalysis(filters?: ProjectedReportFilter): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }

    return this.http.get<any>(`${this.apiUrl}/trends`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching trend analysis:', error);
        return of(this.getMockTrendAnalysis());
      })
    );
  }

  // Create new projected report
  createProjectedReport(report: Partial<ProjectedReport>): Observable<ProjectedReport> {
    return this.http.post<ProjectedReport>(this.apiUrl, report).pipe(
      catchError(error => {
        console.error('Error creating projected report:', error);
        return of(this.createMockProjectedReport(Date.now()));
      })
    );
  }

  // Update projected report
  updateProjectedReport(id: number, report: Partial<ProjectedReport>): Observable<ProjectedReport> {
    return this.http.put<ProjectedReport>(`${this.apiUrl}/${id}`, report).pipe(
      catchError(error => {
        console.error('Error updating projected report:', error);
        return of(this.createMockProjectedReport(id));
      })
    );
  }

  // Delete projected report
  deleteProjectedReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting projected report:', error);
        return of(void 0);
      })
    );
  }

  // Export projections to Excel
  exportProjections(filters: any, format: 'excel' | 'pdf' | 'csv'): Observable<Blob> {
    const params: any = {
      year: filters.year || new Date().getFullYear(),
      scenario: filters.scenario || 'realistic',
      months_ahead: filters.months_ahead || 12
    };

    // All formats now return blob
    return this.http.post(`${this.apiUrl}/export`, params, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting:', error);
        return of(new Blob());
      })
    );
  }

  // Mock data methods for fallback
  private getMockProjectedReports(filters?: ProjectedReportFilter): ProjectedReport[] {
    const mockReports: ProjectedReport[] = [
      {
        id: 1,
        reportType: 'financial',
        title: 'Proyección Ingresos Q1 2025',
        description: 'Proyección de ingresos para el primer trimestre de 2025',
        period: {
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          type: 'quarterly'
        },
        metrics: [],
        charts: [],
        createdAt: '2024-12-01',
        updatedAt: '2024-12-15',
        name: 'Proyección Ingresos Q1 2025',
        type: 'revenue',
        year: 2025,
        scenario: 'realistic',
        projectedValue: 2500000,
        actualValue: null,
        variation: 15.2,
        confidence: 85,
        status: 'active'
      },
      {
        id: 2,
        reportType: 'sales',
        title: 'Proyección Ventas 2025',
        description: 'Proyección de ventas para el año 2025',
        period: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          type: 'yearly'
        },
        metrics: [],
        charts: [],
        createdAt: '2024-12-01',
        updatedAt: '2024-12-15',
        name: 'Proyección Ventas 2025',
        type: 'sales',
        year: 2025,
        scenario: 'optimistic',
        projectedValue: 15000000,
        actualValue: null,
        variation: 22.8,
        confidence: 78,
        status: 'active'
      }
    ];

    if (filters) {
      return mockReports.filter(report => {
        if (filters.projectionType && report.type !== filters.projectionType) return false;
        if (filters.period && report.period.type !== filters.period) return false;
        if (filters.year && report.year !== filters.year) return false;
        if (filters.scenario && report.scenario !== filters.scenario) return false;
        return true;
      });
    }

    return mockReports;
  }

  private createMockProjectedReport(id: number): ProjectedReport {
    return {
      id: id,
      reportType: 'financial',
      title: `Proyección Mock ${id}`,
      description: `Descripción de proyección mock ${id}`,
      period: {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        type: 'quarterly'
      },
      metrics: [],
      charts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: `Proyección Mock ${id}`,
      type: 'revenue',
      year: 2025,
      scenario: 'realistic',
      projectedValue: 1000000,
      actualValue: null,
      variation: 10.0,
      confidence: 80,
      status: 'active'
    };
  }

  private getMockRevenueProjections(): any {
    return {
      projections: [
        { month: 'Enero', projected: 850000, actual: null, variance: 0 },
        { month: 'Febrero', projected: 920000, actual: null, variance: 0 },
        { month: 'Marzo', projected: 730000, actual: null, variance: 0 },
        { month: 'Abril', projected: 1100000, actual: null, variance: 0 }
      ],
      summary: {
        totalProjected: 3600000,
        averageMonthly: 900000,
        growthRate: 15.2,
        confidence: 85
      }
    };
  }

  private getMockSalesProjections(): any {
    return {
      projections: [
        { month: 'Enero', units: 12, revenue: 1800000 },
        { month: 'Febrero', units: 15, revenue: 2250000 },
        { month: 'Marzo', units: 10, revenue: 1500000 },
        { month: 'Abril', units: 18, revenue: 2700000 }
      ],
      summary: {
        totalUnits: 55,
        totalRevenue: 8250000,
        averagePrice: 150000,
        conversionRate: 25
      }
    };
  }

  private getMockCollectionsProjections(): any {
    return {
      projections: [
        { month: 'Enero', scheduled: 750000, projected: 675000, efficiency: 90 },
        { month: 'Febrero', scheduled: 820000, projected: 738000, efficiency: 90 },
        { month: 'Marzo', scheduled: 650000, projected: 585000, efficiency: 90 },
        { month: 'Abril', scheduled: 950000, projected: 855000, efficiency: 90 }
      ],
      summary: {
        totalScheduled: 3170000,
        totalProjected: 2853000,
        averageEfficiency: 90,
        riskFactor: 10
      }
    };
  }

  private getMockKPIs(): any {
    return {
      revenue: {
        current: 2500000,
        projected: 2875000,
        growth: 15.0,
        trend: 'up'
      },
      sales: {
        current: 15,
        projected: 18,
        growth: 20.0,
        trend: 'up'
      },
      collections: {
        current: 85,
        projected: 90,
        growth: 5.9,
        trend: 'up'
      },
      profitability: {
        current: 25.5,
        projected: 28.2,
        growth: 10.6,
        trend: 'up'
      }
    };
  }

  private getMockTrendAnalysis(): any {
    return {
      revenue: {
        trend: 'upward',
        seasonality: 'moderate',
        volatility: 'low',
        forecast: [
          { period: 'Q1 2025', value: 2875000, confidence: 85 },
          { period: 'Q2 2025', value: 3200000, confidence: 80 },
          { period: 'Q3 2025', value: 3100000, confidence: 75 },
          { period: 'Q4 2025', value: 3500000, confidence: 70 }
        ]
      },
      sales: {
        trend: 'upward',
        seasonality: 'high',
        volatility: 'medium',
        forecast: [
          { period: 'Q1 2025', value: 18, confidence: 80 },
          { period: 'Q2 2025', value: 22, confidence: 75 },
          { period: 'Q3 2025', value: 20, confidence: 70 },
          { period: 'Q4 2025', value: 25, confidence: 65 }
        ]
      },
      collections: {
        trend: 'stable',
        seasonality: 'low',
        volatility: 'low',
        forecast: [
          { period: 'Q1 2025', value: 90, confidence: 90 },
          { period: 'Q2 2025', value: 91, confidence: 88 },
          { period: 'Q3 2025', value: 89, confidence: 85 },
          { period: 'Q4 2025', value: 92, confidence: 82 }
        ]
      }
    };
  }

  // Método mock para proyecciones financieras
  private getMockFinancialProjections(): FinancialProjection[] {
    return [
      {
        revenue: {
          current: 2500000,
          projected: 2750000,
          growth: 10
        },
        expenses: {
          current: 1800000,
          projected: 1890000,
          growth: 5
        },
        profit: {
          current: 700000,
          projected: 860000,
          margin: 31.3
        },
        cashFlow: {
          inflow: 2500000,
          outflow: 1800000,
          net: 700000
        }
      },
      {
        revenue: {
          current: 2750000,
          projected: 3025000,
          growth: 10
        },
        expenses: {
          current: 1950000,
          projected: 2047500,
          growth: 5
        },
        profit: {
          current: 800000,
          projected: 977500,
          margin: 32.3
        },
        cashFlow: {
          inflow: 2750000,
          outflow: 1950000,
          net: 800000
        }
      },
      {
        revenue: {
          current: 2300000,
          projected: 2530000,
          growth: 10
        },
        expenses: {
          current: 1650000,
          projected: 1732500,
          growth: 5
        },
        profit: {
          current: 650000,
          projected: 797500,
          margin: 31.5
        },
        cashFlow: {
          inflow: 2300000,
          outflow: 1650000,
          net: 650000
        }
      }
    ];
  }

  // Método mock para proyecciones de flujo de caja
  private getMockCashFlowProjections(): any {
    return {
      projections: [
        { month: 'Enero', inflow: 2500000, outflow: 1800000, netFlow: 700000 },
        { month: 'Febrero', inflow: 2750000, outflow: 1950000, netFlow: 800000 },
        { month: 'Marzo', inflow: 2300000, outflow: 1650000, netFlow: 650000 },
        { month: 'Abril', inflow: 3100000, outflow: 2200000, netFlow: 900000 }
      ],
      summary: {
        totalInflow: 10650000,
        totalOutflow: 7600000,
        totalNetFlow: 3050000,
        averageMonthly: 762500
      }
    };
  }

  // Método mock para proyecciones de inventario
  private getMockInventoryProjections(): any {
    return {
      projections: [
        { month: 'Enero', available: 120, reserved: 15, sold: 12, remaining: 93 },
        { month: 'Febrero', available: 93, reserved: 18, sold: 15, remaining: 60 },
        { month: 'Marzo', available: 60, reserved: 12, sold: 10, remaining: 38 },
        { month: 'Abril', available: 38, reserved: 20, sold: 18, remaining: 0 }
      ],
      summary: {
        totalAvailable: 120,
        totalSold: 55,
        totalReserved: 65,
        selloutProjection: 'Q2 2025'
      }
    };
  }

  // Método mock para análisis de mercado
  private getMockMarketAnalysis(): any {
    return {
      marketTrends: {
        demand: 'high',
        competition: 'moderate',
        priceGrowth: 8.5,
        marketShare: 15.2
      },
      opportunities: [
        { segment: 'Familias jóvenes', potential: 'high', growth: 25 },
        { segment: 'Inversores', potential: 'medium', growth: 15 },
        { segment: 'Jubilados', potential: 'low', growth: 5 }
      ],
      risks: [
        { factor: 'Competencia', impact: 'medium', probability: 60 },
        { factor: 'Regulaciones', impact: 'low', probability: 30 },
        { factor: 'Economía', impact: 'high', probability: 40 }
      ]
    };
  }

  // Método mock para proyecciones de ROI
  private getMockROIProjections(): any {
    return {
      projections: [
        { period: 'Q1 2025', investment: 5000000, returns: 6250000, roi: 25.0 },
        { period: 'Q2 2025', investment: 5500000, returns: 7150000, roi: 30.0 },
        { period: 'Q3 2025', investment: 5200000, returns: 6760000, roi: 30.0 },
        { period: 'Q4 2025', investment: 6000000, returns: 7800000, roi: 30.0 }
      ],
      summary: {
        totalInvestment: 21700000,
        totalReturns: 27960000,
        averageROI: 28.8,
        paybackPeriod: '18 months'
      }
    };
  }

  // Método mock para análisis de escenarios
  private getMockScenarioAnalysis(): any {
    return {
      scenarios: [
        {
          name: 'Optimista',
          probability: 30,
          revenue: 12000000,
          profit: 3600000,
          roi: 35.0
        },
        {
          name: 'Realista',
          probability: 50,
          revenue: 10000000,
          profit: 2800000,
          roi: 28.0
        },
        {
          name: 'Pesimista',
          probability: 20,
          revenue: 8000000,
          profit: 2000000,
          roi: 20.0
        }
      ],
      recommendation: 'realista',
      expectedValue: 9800000
    };
  }
}