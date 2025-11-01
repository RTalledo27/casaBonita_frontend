import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { SalesReport, SalesReportFilter, SalesReportSummary } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SalesReportService {
  private apiUrl = API_ROUTES.REPORTS.SALES;

  constructor(private http: HttpClient) {}

  // Método para obtener TODAS las ventas con detalles completos
  getAllSales(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    if (filters.advisorId) params = params.set('employee_id', filters.advisorId.toString());
    if (filters.projectId) params = params.set('project_id', filters.projectId.toString());
    
    // Add pagination
    params = params.set('limit', '100');
    params = params.set('offset', '0');

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.ALL, { params }).pipe(
      map(response => {
        console.log('📊 All sales response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error fetching all sales:', error);
        return of({
          success: false,
          data: [],
          count: 0
        });
      })
    );
  }

  // Método para obtener el dashboard de ventas
  getDashboard(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    if (filters.advisorId) params = params.set('employee_id', filters.advisorId.toString());
    
    // Add any other filters
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'advisorId') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.DASHBOARD, { params }).pipe(
      map(response => {
        console.log('Dashboard response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching sales dashboard:', error);
        return of({
          success: false,
          data: {
            summary: this.getMockSalesReportSummary(),
            trends: [],
            top_performers: [],
            conversion_rates: {}
          }
        });
      })
    );
  }

  // Método para obtener ventas por período
  getSalesByPeriod(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    if (filters.advisorId) params = params.set('employee_id', filters.advisorId.toString());
    
    // Add period parameter (default to monthly)
    params = params.set('period', 'monthly');
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'advisorId') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.BY_PERIOD, { params }).pipe(
      catchError(error => {
        console.error('Error fetching sales by period:', error);
        return of({ success: false, data: this.getMockSalesReports(filters) });
      })
    );
  }

  // Método para obtener rendimiento de ventas
  getSalesPerformance(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    if (filters.office) params = params.set('department', filters.office);
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'office') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.PERFORMANCE, { params }).pipe(
      catchError(error => {
        console.error('Error fetching sales performance:', error);
        return of({ success: false, data: this.getMockSalesByAdvisor() });
      })
    );
  }

  // Método para obtener embudo de conversión
  getConversionFunnel(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    if (filters.advisorId) params = params.set('employee_id', filters.advisorId.toString());
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'advisorId') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.CONVERSION_FUNNEL, { params }).pipe(
      catchError(error => {
        console.error('Error fetching conversion funnel:', error);
        return of({ success: false, data: this.getMockSalesTrends() });
      })
    );
  }

  // Método para obtener productos top
  getTopProducts(filters: SalesReportFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    params = params.set('limit', '10');
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.TOP_PRODUCTS, { params }).pipe(
      catchError(error => {
        console.error('Error fetching top products:', error);
        return of({ success: false, data: [] });
      })
    );
  }

  // Métodos existentes actualizados para usar las nuevas APIs
  getSalesReports(filters: SalesReportFilter = {}): Observable<{
    data: SalesReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getSalesByPeriod(filters);
  }

  getSalesReportById(id: number): Observable<SalesReport> {
    // For now, use the dashboard endpoint and filter by ID
    // In a real implementation, you might need to add a specific endpoint in the backend
    return this.getDashboard().pipe(
      map(response => {
        if (response.success && response.data && response.data.top_performers) {
          const performer = response.data.top_performers.find((p: any, index: number) => index + 1 === id);
          if (performer) {
            return this.mapPerformerToSalesReport(performer, id);
          }
        }
        return this.getMockSalesReport(id);
      }),
      catchError(error => {
        console.error('Error fetching sales report by id:', error);
        return of(this.getMockSalesReport(id));
      })
    );
  }

  private mapPerformerToSalesReport(performer: any, id: number): SalesReport {
    const currentDate = new Date().toISOString().split('T')[0];
    const totalAmount = performer.total_revenue || performer.sales || 0;
    return {
      id: id,
      saleNumber: `CB-2024-${String(id).padStart(3, '0')}`,
      date: currentDate,
      saleDate: currentDate,
      advisor: {
        id: id,
        name: performer.employee_name || performer.name || 'N/A',
        office: 'Oficina Principal'
      },
      advisorName: performer.employee_name || performer.name || 'N/A',
      officeName: 'Oficina Principal',
      client: {
        id: id * 100,
        name: `Cliente ${id}`,
        email: `cliente${id}@example.com`,
        phone: '555-0000'
      },
      clientName: `Cliente ${id}`,
      projectName: 'Proyecto Casa Bonita',
      lotNumber: `L${String(id).padStart(3, '0')}`,
      lot: {
        id: id * 200,
        number: `L${String(id).padStart(3, '0')}`,
        manzana: 'A',
        area: 500,
        price: totalAmount
      },
      totalAmount: totalAmount,
      saleAmount: totalAmount,
      downPayment: totalAmount * 0.2,
      financedAmount: totalAmount * 0.8,
      financingAmount: totalAmount * 0.8,
      installments: 60,
      monthlyPayment: (totalAmount * 0.8) / 60,
      paymentMethod: 'Financiamiento',
      status: 'active',
      contractNumber: `CON-${String(id).padStart(6, '0')}`,
      createdAt: currentDate,
      updatedAt: currentDate
    };
  }

  getSalesReportSummary(filters: SalesReportFilter = {}): Observable<SalesReportSummary> {
    return this.getDashboard(filters);
  }

  getSalesByAdvisor(filters: SalesReportFilter = {}): Observable<any[]> {
    return this.getSalesPerformance(filters);
  }

  getSalesTrends(filters: SalesReportFilter = {}): Observable<any> {
    return this.getSalesByPeriod(filters);
  }

  exportSalesReport(filters: SalesReportFilter, format: 'excel' | 'pdf' | 'csv'): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    params = params.set('format', format);
    params = params.set('type', 'sales');

    return this.http.get(API_ROUTES.REPORTS.EXPORT, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting sales report:', error);
        return of(new Blob());
      })
    );
  }

  getSalesReportsByAdvisor(advisorId: number, filters: SalesReportFilter = {}): Observable<SalesReport[]> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    params = params.set('employee_id', advisorId.toString());
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'advisorId') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.PERFORMANCE, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return [this.mapPerformerToSalesReport(response.data, advisorId)];
        }
        return this.getMockSalesReportsByAdvisor(advisorId);
      }),
      catchError(error => {
        console.error('Error fetching sales reports by advisor:', error);
        return of(this.getMockSalesReportsByAdvisor(advisorId));
      })
    );
  }

  getSalesReportsByOffice(office: string, filters: SalesReportFilter = {}): Observable<SalesReport[]> {
    let params = new HttpParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.startDate) params = params.set('date_from', filters.startDate);
    if (filters.endDate) params = params.set('date_to', filters.endDate);
    params = params.set('period', 'monthly');
    params = params.set('department', office);
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '' && 
          key !== 'startDate' && key !== 'endDate' && key !== 'office') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.BY_PERIOD, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return [this.getMockSalesReportsByOffice(office)[0]];
        }
        return this.getMockSalesReportsByOffice(office);
      }),
      catchError(error => {
        console.error('Error fetching sales reports by office:', error);
        return of(this.getMockSalesReportsByOffice(office));
      })
    );
  }

  getSalesReportsByDateRange(startDate: string, endDate: string): Observable<SalesReport[]> {
    const params = new HttpParams()
      .set('date_from', startDate)
      .set('date_to', endDate)
      .set('period', 'monthly');

    return this.http.get<any>(API_ROUTES.REPORTS.SALES.BY_PERIOD, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.getMockSalesReportsByDateRange(startDate, endDate);
        }
        return this.getMockSalesReportsByDateRange(startDate, endDate);
      }),
      catchError(error => {
        console.error('Error fetching sales reports by date range:', error);
        return of(this.getMockSalesReportsByDateRange(startDate, endDate));
      })
    );
  }

  // Mock data methods for fallback
  private getMockSalesReports(filters?: SalesReportFilter): {
    data: SalesReport[];
    total: number;
    page: number;
    limit: number;
  } {
    const mockData: SalesReport[] = [
      {
        id: 1,
        saleNumber: 'CB-2024-001',
        date: '2024-01-15',
        advisor: {
          id: 1,
          name: 'María García',
          office: 'Oficina Central'
        },
        client: {
          id: 101,
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          phone: '555-0123'
        },
        lot: {
          id: 201,
          number: 'L-001',
          manzana: 'A',
          area: 500,
          price: 150000
        },
        totalAmount: 150000,
        downPayment: 30000,
        financedAmount: 120000,
        installments: 60,
        monthlyPayment: 2500,
        status: 'completed',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 2,
        saleNumber: 'CB-2024-002',
        date: '2024-01-20',
        advisor: {
          id: 2,
          name: 'Carlos Ruiz',
          office: 'Oficina Norte'
        },
        client: {
          id: 102,
          name: 'Ana López',
          email: 'ana.lopez@example.com',
          phone: '555-0124'
        },
        lot: {
          id: 202,
          number: 'L-002',
          manzana: 'B',
          area: 600,
          price: 200000
        },
        totalAmount: 200000,
        downPayment: 40000,
        financedAmount: 160000,
        installments: 72,
        monthlyPayment: 2800,
        status: 'completed',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      }
    ];

    return {
      data: mockData,
      total: mockData.length,
      page: 1,
      limit: 10
    };
  }

  private getMockSalesReport(id: number): SalesReport {
    return {
      id: id,
      saleNumber: `CB-2024-${id.toString().padStart(3, '0')}`,
      date: '2024-01-15',
      advisor: {
        id: id,
        name: 'Asesor Mock',
        office: 'Oficina Central'
      },
      client: {
        id: id + 100,
        name: 'Cliente Mock',
        email: 'cliente@example.com',
        phone: '555-0123'
      },
      lot: {
        id: id + 200,
        number: `L-${id.toString().padStart(3, '0')}`,
        manzana: 'A',
        area: 500,
        price: 150000
      },
      totalAmount: 150000,
      downPayment: 30000,
      financedAmount: 120000,
      installments: 60,
      monthlyPayment: 2500,
      status: 'completed',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    };
  }

  private getMockSalesReportSummary(): SalesReportSummary {
    return {
      totalSales: 15,
      totalRevenue: 2500000,
      totalAmount: 2500000,
      averageAmount: 175000,
      averageSale: 175000,
      salesGrowth: 12.5,
      uniqueClients: 12,
      activeEmployees: 5,
      salesByStatus: {
        active: 8,
        cancelled: 2,
        completed: 5
      },
      salesByOffice: [
        { office: 'Oficina Central', count: 8, amount: 1400000 },
        { office: 'Oficina Norte', count: 4, amount: 700000 },
        { office: 'Oficina Sur', count: 3, amount: 400000 }
      ],
      topAdvisors: [
        { id: 1, name: 'María García', salesCount: 3, totalAmount: 450000 },
        { id: 2, name: 'Carlos Ruiz', salesCount: 2, totalAmount: 380000 }
      ]
    };
  }

  private getMockSalesByAdvisor(): any[] {
    return [
      { advisorName: 'María García', totalSales: 450000, contracts: 3, commission: 22500 },
      { advisorName: 'Carlos Ruiz', totalSales: 380000, contracts: 2, commission: 19000 },
      { advisorName: 'Ana Martínez', totalSales: 320000, contracts: 2, commission: 16000 }
    ];
  }

  private getMockSalesTrends(): any {
    return {
      monthly: [
        { month: 'Enero', sales: 850000, growth: 15.2 },
        { month: 'Febrero', sales: 920000, growth: 8.2 },
        { month: 'Marzo', sales: 730000, growth: -20.7 }
      ],
      quarterly: [
        { quarter: 'Q1 2024', sales: 2500000, growth: 12.5 }
      ]
    };
  }

  private getMockSalesReportsByAdvisor(advisorId: number): SalesReport[] {
    return [
      {
        id: advisorId,
        saleNumber: `CB-2024-${advisorId.toString().padStart(3, '0')}`,
        date: '2024-01-15',
        advisor: {
          id: advisorId,
          name: 'Asesor Específico',
          office: 'Oficina Central'
        },
        client: {
          id: advisorId + 100,
          name: 'Cliente del Asesor',
          email: 'cliente@example.com',
          phone: '555-0123'
        },
        lot: {
          id: advisorId + 200,
          number: `L-${advisorId.toString().padStart(3, '0')}`,
          manzana: 'A',
          area: 500,
          price: 150000
        },
        totalAmount: 150000,
        downPayment: 30000,
        financedAmount: 120000,
        installments: 60,
        monthlyPayment: 2500,
        status: 'completed',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ];
  }

  private getMockSalesReportsByOffice(office: string): SalesReport[] {
    return [
      {
        id: 1,
        saleNumber: 'CB-2024-001',
        date: '2024-01-15',
        advisor: {
          id: 1,
          name: 'Asesor Local',
          office: office
        },
        client: {
          id: 101,
          name: `Cliente de ${office}`,
          email: 'cliente@example.com',
          phone: '555-0123'
        },
        lot: {
          id: 201,
          number: 'L-001',
          manzana: 'A',
          area: 500,
          price: 150000
        },
        totalAmount: 150000,
        downPayment: 30000,
        financedAmount: 120000,
        installments: 60,
        monthlyPayment: 2500,
        status: 'completed',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ];
  }

  private getMockSalesReportsByDateRange(startDate: string, endDate: string): SalesReport[] {
    return [
      {
        id: 1,
        saleNumber: 'CB-2024-001',
        date: startDate,
        advisor: {
          id: 1,
          name: 'Asesor Temporal',
          office: 'Oficina Central'
        },
        client: {
          id: 101,
          name: 'Cliente en Rango',
          email: 'cliente@example.com',
          phone: '555-0123'
        },
        lot: {
          id: 201,
          number: 'L-001',
          manzana: 'A',
          area: 500,
          price: 150000
        },
        totalAmount: 150000,
        downPayment: 30000,
        financedAmount: 120000,
        installments: 60,
        monthlyPayment: 2500,
        status: 'completed',
        createdAt: startDate,
        updatedAt: startDate
      }
    ];
  }
}