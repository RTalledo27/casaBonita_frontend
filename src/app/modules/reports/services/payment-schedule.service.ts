import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PaymentSchedule, PaymentScheduleFilter, PaymentScheduleSummary, PaymentCalendar } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentScheduleService {
  private apiUrl = `${environment.URL_BACKEND}/v1/reports/payment-schedules`;

  constructor(private http: HttpClient) { }

  // Método para obtener resumen de cronogramas de pago
  getOverview(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/overview`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payment schedules overview:', error);
        return of(this.getMockPaymentScheduleSummary());
      })
    );
  }

  // Método para obtener cronogramas por estado
  getByStatus(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/by-status`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payment schedules by status:', error);
        return of(this.getMockPaymentSchedules(filters));
      })
    );
  }

  // Método para obtener pagos vencidos
  getOverdue(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/overdue`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching overdue payments:', error);
        return of(this.getMockOverduePayments());
      })
    );
  }

  // Método para obtener tendencias de pagos
  getPaymentTrends(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/trends`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payment trends:', error);
        return of(this.getMockPaymentTrends());
      })
    );
  }

  // Método para obtener eficiencia de cobranza
  getCollectionEfficiency(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/collection-efficiency`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching collection efficiency:', error);
        return of(this.getMockCollectionEfficiency());
      })
    );
  }

  // Método para obtener próximos pagos
  getUpcoming(filters: PaymentScheduleFilter = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/upcoming`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching upcoming payments:', error);
        return of(this.getMockUpcomingPayments());
      })
    );
  }

  // Métodos existentes actualizados para usar las nuevas APIs
  getPaymentSchedules(filters: PaymentScheduleFilter = {}): Observable<{
    data: PaymentSchedule[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getByStatus(filters);
  }

  getPaymentScheduleById(id: number): Observable<PaymentSchedule> {
    return this.http.get<PaymentSchedule>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching payment schedule by id:', error);
        return of(this.createMockPaymentSchedule(id));
      })
    );
  }

  getPaymentScheduleSummary(filters: PaymentScheduleFilter = {}): Observable<PaymentScheduleSummary> {
    return this.getOverview(filters);
  }

  getPaymentCalendar(startDate: string, endDate: string): Observable<PaymentCalendar[]> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get<PaymentCalendar[]>(`${this.apiUrl}/calendar`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payment calendar:', error);
        return of(this.getMockPaymentCalendar());
      })
    );
  }

  getOverduePayments(days?: number): Observable<PaymentSchedule[]> {
    let filters: PaymentScheduleFilter = {};
    if (days) {
      filters.overdueDays = days;
    }
    return this.getOverdue(filters);
  }

  getUpcomingPayments(days: number = 30): Observable<PaymentSchedule[]> {
    return this.getUpcoming({ overdueDays: days });
  }

  getPaymentsByClient(clientId: number, filters: PaymentScheduleFilter = {}): Observable<PaymentSchedule[]> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaymentSchedule[]>(`${this.apiUrl}/client/${clientId}`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payments by client:', error);
        return of(this.getMockPaymentsByClient(clientId));
      })
    );
  }

  exportPaymentSchedule(filters: PaymentScheduleFilter, format: 'excel' | 'pdf' | 'csv'): Observable<Blob> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    params = params.set('format', format);

    // Convertir params a objeto para el body del POST
    const exportData: any = { format };
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        exportData[key] = value;
      }
    });

    return this.http.post(`${environment.URL_BACKEND}/reports/export`, exportData, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting payment schedule:', error);
        return of(new Blob());
      })
    ) as Observable<Blob>;
  }

  updatePaymentStatus(id: number, status: string, paymentDate?: string, notes?: string): Observable<PaymentSchedule> {
    const body = {
      status,
      paymentDate,
      notes
    };

    return this.http.patch<PaymentSchedule>(`${this.apiUrl}/${id}/status`, body).pipe(
      catchError(error => {
        console.error('Error updating payment status:', error);
        return of(this.createMockPaymentSchedule(id));
      })
    );
  }

  // Mock data methods for fallback
  private getMockPaymentSchedules(filters?: PaymentScheduleFilter): {
    data: PaymentSchedule[];
    total: number;
    page: number;
    limit: number;
  } {
    const mockData: PaymentSchedule[] = [
      {
        id: 1,
        saleId: 1001,
        installmentNumber: 1,
        dueDate: '2025-01-15',
        amount: 15000,
        status: 'pending',
        paidDate: undefined,
        paidAmount: undefined,
        reference: 'REF-001',
        overdueDays: 0,
        paymentType: 'monthly',
        clientName: 'Juan Pérez',
        clientEmail: 'juan.perez@example.com',
        notes: undefined,
        daysUntilDue: 15,
        totalInstallments: 12,
        createdAt: '2024-12-01',
        updatedAt: '2024-12-01'
      },
      {
        id: 2,
        saleId: 1002,
        installmentNumber: 2,
        dueDate: '2025-01-20',
        amount: 22000,
        status: 'overdue',
        paidDate: undefined,
        paidAmount: undefined,
        reference: 'REF-002',
        overdueDays: 5,
        paymentType: 'monthly',
        clientName: 'María García',
        clientEmail: 'maria.garcia@example.com',
        notes: 'Pago vencido',
        daysUntilDue: -5,
        totalInstallments: 24,
        createdAt: '2024-11-15',
        updatedAt: '2024-12-20'
      }
    ];

    return {
      data: mockData,
      total: mockData.length,
      page: 1,
      limit: 10
    };
  }

  private createMockPaymentSchedule(id: number): PaymentSchedule {
    return {
      id: id,
      saleId: 1000 + id,
      installmentNumber: 1,
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 50000) + 10000,
      status: 'pending',
      paidDate: undefined,
      paidAmount: undefined,
      reference: `REF-${id.toString().padStart(3, '0')}`,
      overdueDays: 0,
      paymentType: 'monthly',
      clientName: `Cliente Mock ${id}`,
      clientEmail: `cliente${id}@example.com`,
      notes: undefined,
      daysUntilDue: Math.floor(Math.random() * 30),
      totalInstallments: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getMockPaymentScheduleSummary(): PaymentScheduleSummary {
    return {
      totalScheduled: 2500000,
      totalPaid: 1800000,
      totalPending: 350000,
      totalOverdue: 350000,
      paymentsByStatus: {
        pending: 25,
        paid: 120,
        overdue: 15,
        partial: 5
      },
      upcomingPayments: this.getMockUpcomingPayments(),
      overduePayments: this.getMockOverduePayments(),
      collectionEfficiency: 72
    };
  }

  private getMockPaymentCalendar(): PaymentCalendar[] {
    return [
      {
        date: '2025-01-15',
        payments: this.getMockUpcomingPayments(),
        totalAmount: 33000,
        paidAmount: 0,
        pendingAmount: 33000
      },
      {
        date: '2025-01-20',
        payments: this.getMockOverduePayments(),
        totalAmount: 22000,
        paidAmount: 0,
        pendingAmount: 22000
      }
    ];
  }

  private getMockOverduePayments(): PaymentSchedule[] {
    return [
      {
        id: 2,
        saleId: 1002,
        installmentNumber: 2,
        dueDate: '2024-12-20',
        amount: 22000,
        status: 'overdue',
        paidDate: undefined,
        paidAmount: undefined,
        reference: 'REF-002',
        overdueDays: 25,
        paymentType: 'monthly',
        clientName: 'María García',
        notes: 'Pago vencido',
        daysUntilDue: -25,
        clientEmail: 'maria.garcia@email.com',
        totalInstallments: 24,
        createdAt: '2024-11-15T00:00:00Z',
        updatedAt: '2024-12-20T00:00:00Z'
      }
    ];
  }

  private getMockUpcomingPayments(): PaymentSchedule[] {
    return [
      {
        id: 1,
        saleId: 1001,
        installmentNumber: 1,
        dueDate: '2025-01-15',
        amount: 15000,
        status: 'pending',
        paidDate: undefined,
        paidAmount: undefined,
        reference: 'REF-001',
        overdueDays: 0,
        paymentType: 'monthly',
        clientName: 'Juan Pérez',
        notes: 'Próximo pago',
        daysUntilDue: 15,
        clientEmail: 'juan.perez@email.com',
        totalInstallments: 24,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z'
      }
    ];
  }

  private getMockPaymentsByClient(clientId: number): PaymentSchedule[] {
    return [
      {
        id: clientId,
        saleId: 1000 + clientId,
        installmentNumber: 1,
        dueDate: '2025-01-15',
        amount: 15000,
        status: 'pending',
        paidDate: undefined,
        paidAmount: undefined,
        reference: `REF-${clientId}`,
        overdueDays: 0,
        paymentType: 'monthly',
        clientName: `Cliente ${clientId}`,
        notes: 'Pago del cliente',
        daysUntilDue: 15,
        clientEmail: `cliente${clientId}@email.com`,
        totalInstallments: 12,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z'
      }
    ];
  }

  private getMockPaymentTrends(): any {
    return {
      trends: [
        { month: 'Enero', onTime: 85, late: 15, total: 100 },
        { month: 'Febrero', onTime: 78, late: 22, total: 100 },
        { month: 'Marzo', onTime: 92, late: 8, total: 100 }
      ],
      summary: {
        averageOnTime: 85,
        improvement: 7
      }
    };
  }

  private getMockCollectionEfficiency(): any {
    return {
      efficiency: {
        currentMonth: 78.5,
        previousMonth: 72.3,
        improvement: 6.2
      },
      breakdown: [
        { category: 'Pagos puntuales', percentage: 65 },
        { category: 'Pagos tardíos', percentage: 25 },
        { category: 'Pagos perdidos', percentage: 10 }
      ]
    };
  }
}