import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';
import { PaymentSchedule, PaymentScheduleMetrics } from '../models/payment-schedule';

export interface AdvancedMetrics {
  // Performance Metrics
  collectionRate: number;
  averagePaymentTime: number;
  efficiencyScore: number;
  
  // Volume Metrics
  totalSchedules: number;
  paidSchedules: number;
  overdueSchedules: number;
  
  // Financial Metrics
  totalAmount: number;
  collectedAmount: number;
  overdueAmount: number;
  
  // Risk Metrics
  riskScore: number;
  overdueRate: number;
  averageDaysOverdue: number;
  
  // Trend Indicators
  monthlyGrowth: number;
  paymentTrend: 'improving' | 'stable' | 'declining';
  
  // Alerts
  criticalAlerts: number;
  warningAlerts: number;
}

export interface CollectorEfficiency {
  efficiency: number;
  totalCollected: number;
  averageTime: number;
  topPerformers: Array<{
    name: string;
    efficiency: number;
    collected: number;
  }>;
}

export interface TrendData {
  month: string;
  predicted: number;
  confidence: number;
}

export interface MonthlyTrend {
  month: string;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  scheduleCount: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  amount: number;
}

export interface AmountComparison {
  category: string;
  currentMonth: number;
  previousMonth: number;
  variance: number;
  variancePercentage: number;
}

export interface PaymentPerformance {
  period: string;
  onTimePayments: number;
  latePayments: number;
  totalPayments: number;
  onTimeRate: number;
}

export interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: any;
  createdAt: Date;
  isDefault?: boolean;
}

export interface SmartSuggestion {
  type: 'client' | 'contract' | 'amount' | 'status';
  value: string;
  label: string;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/collections';
  
  // State management
  private metricsSubject = new BehaviorSubject<AdvancedMetrics | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public metrics$ = this.metricsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  /**
   * Get comprehensive advanced metrics
   */
  getAdvancedMetrics(filters?: any): Observable<AdvancedMetrics> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.post<AdvancedMetrics>(`${this.baseUrl}/metrics`, { filters })
      .pipe(
        map(metrics => {
          this.metricsSubject.next(metrics);
          this.loadingSubject.next(false);
          return metrics;
        }),
        catchError(error => {
          this.errorSubject.next('Error al cargar métricas avanzadas');
          this.loadingSubject.next(false);
          
          // Return mock data for development
          const mockMetrics = this.generateMockMetrics();
          this.metricsSubject.next(mockMetrics);
          return of(mockMetrics);
        })
      );
  }

  /**
   * Get monthly trends data
   */
  getMonthlyTrends(months: number = 12): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`${this.baseUrl}/trends`, {
      params: { months: months.toString() }
    }).pipe(
      catchError(() => of(this.generateMockMonthlyTrends(months)))
    );
  }

  /**
   * Get status distribution
   */
  getStatusDistribution(filters?: any): Observable<StatusDistribution[]> {
    return this.http.post<StatusDistribution[]>(`${this.baseUrl}/status-distribution`, { filters })
      .pipe(
        catchError(() => of(this.generateMockStatusDistribution()))
      );
  }

  /**
   * Get payment performance analysis
   */
  getPaymentPerformance(period: 'week' | 'month' | 'quarter' = 'month'): Observable<PaymentPerformance[]> {
    return this.http.get<PaymentPerformance[]>(`${this.baseUrl}/payment-performance`, {
      params: { period }
    }).pipe(
      catchError(() => of(this.generateMockPaymentPerformance()))
    );
  }

  /**
   * Get aging analysis
   */
  getAgingAnalysis(filters?: any): Observable<AgingBucket[]> {
    return this.http.post<AgingBucket[]>(`${this.baseUrl}/aging-analysis`, { filters })
      .pipe(
        catchError(() => of(this.generateMockAgingAnalysis()))
      );
  }

  /**
   * Get amount comparison data
   */
  getAmountComparison(compareWith: 'previous-month' | 'previous-year' = 'previous-month'): Observable<AmountComparison[]> {
    return this.http.get<AmountComparison[]>(`${this.baseUrl}/amount-comparison`, {
      params: { compareWith }
    }).pipe(
      catchError(() => of(this.generateMockAmountComparison()))
    );
  }

  /**
   * Get smart suggestions for filters
   */
  getSmartSuggestions(query: string, type?: string): Observable<SmartSuggestion[]> {
    return this.http.get<SmartSuggestion[]>(`${this.baseUrl}/suggestions`, {
      params: { 
        query,
        ...(type && { type })
      }
    }).pipe(
      catchError(() => of(this.generateMockSuggestions(query, type)))
    );
  }

  /**
   * Save filter preset
   */
  saveFilterPreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): Observable<FilterPreset> {
    const newPreset: FilterPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    return this.http.post<FilterPreset>(`${this.baseUrl}/filter-presets`, newPreset)
      .pipe(
        catchError(() => {
          // Save to localStorage as fallback
          this.savePresetToLocalStorage(newPreset);
          return of(newPreset);
        })
      );
  }

  /**
   * Get saved filter presets
   */
  getFilterPresets(): Observable<FilterPreset[]> {
    return this.http.get<FilterPreset[]>(`${this.baseUrl}/filter-presets`)
      .pipe(
        catchError(() => of(this.getPresetsFromLocalStorage()))
      );
  }

  /**
   * Delete filter preset
   */
  deleteFilterPreset(presetId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/filter-presets/${presetId}`)
      .pipe(
        catchError(() => {
          this.deletePresetFromLocalStorage(presetId);
          return of(true);
        })
      );
  }

  getTrendAnalysis(period: 'monthly' | 'weekly' | 'daily', filters?: any): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`${this.baseUrl}/dashboard/trends`, {
      params: { period, ...filters }
    }).pipe(
      catchError(error => {
        console.error('Error fetching trend analysis:', error);
        return of(this.generateMockMonthlyTrends(12));
      })
    );
  }

  getCollectorEfficiency(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/collection-efficiency`, {
      params: filters || {}
    }).pipe(
      catchError(error => {
        console.error('Error fetching collector efficiency:', error);
        return of({
          efficiency: 85.5,
          totalCollected: 125000,
          averageTime: 12.5,
          topPerformers: [
            { name: 'Juan Pérez', efficiency: 92.3, collected: 45000 },
            { name: 'María García', efficiency: 88.7, collected: 38000 }
          ]
        });
      })
    );
  }

  getCollectionPredictions(months: number, filters?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/predictions`, {
      params: { months, ...filters }
    }).pipe(
      catchError(error => {
        console.error('Error fetching collection predictions:', error);
        return of({
          predictions: [
            { month: 'Enero', predicted: 85000, confidence: 0.85 },
            { month: 'Febrero', predicted: 92000, confidence: 0.82 },
            { month: 'Marzo', predicted: 88000, confidence: 0.79 }
          ],
          accuracy: 87.5,
          trend: 'upward'
        });
      })
    );
  }

  /**
   * Calculate KPIs from payment schedules
   */
  calculateKPIs(schedules: PaymentSchedule[]): any {
    const totalSchedules = schedules.length;
    const paidSchedules = schedules.filter(s => s.status === 'pagado');
    const overdueSchedules = schedules.filter(s => s.status === 'vencido');
    const pendingSchedules = schedules.filter(s => s.status === 'pendiente');
    
    const totalAmount = schedules.reduce((sum, s) => sum + (s.amount || 0), 0);
    const paidAmount = paidSchedules.reduce((sum, s) => sum + s.amount, 0);
    const overdueAmount = overdueSchedules.reduce((sum, s) => sum + (s.amount || 0), 0);
    const pendingAmount = pendingSchedules.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    const overdueRate = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;
    
    // Calculate average payment time
    const paidWithDates = paidSchedules.filter(s => s.payment_date && s.due_date);
    const averagePaymentTime = paidWithDates.length > 0 
      ? paidWithDates.reduce((sum, s) => {
          const dueDate = new Date(s.due_date);
          const paidDate = new Date(s.payment_date!);
          const daysDiff = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, daysDiff);
        }, 0) / paidWithDates.length
      : 0;
    
    // Calculate efficiency score (combination of collection rate and payment time)
    const efficiencyScore = Math.max(0, Math.min(100, 
      (collectionRate * 0.7) + ((30 - Math.min(30, averagePaymentTime)) / 30 * 30)
    ));
    
    return {
      totalSchedules,
      paidCount: paidSchedules.length,
      overdueCount: overdueSchedules.length,
      pendingCount: pendingSchedules.length,
      totalAmount,
      paidAmount,
      overdueAmount,
      pendingAmount,
      collectionRate: Math.round(collectionRate * 100) / 100,
      overdueRate: Math.round(overdueRate * 100) / 100,
      averagePaymentTime: Math.round(averagePaymentTime * 100) / 100,
      efficiencyScore: Math.round(efficiencyScore * 100) / 100
    };
  }

  /**
   * Generate chart data for different visualizations
   */
  generateChartData(schedules: PaymentSchedule[], chartType: string): any {
    switch (chartType) {
      case 'status-distribution':
        return this.generateStatusChartData(schedules);
      case 'monthly-trends':
        return this.generateMonthlyTrendsChartData(schedules);
      case 'amount-comparison':
        return this.generateAmountComparisonChartData(schedules);
      case 'payment-performance':
        return this.generatePaymentPerformanceChartData(schedules);
      case 'aging-analysis':
        return this.generateAgingAnalysisChartData(schedules);
      default:
        return null;
    }
  }

  // Private methods for mock data generation
  private generateMockMetrics(): AdvancedMetrics {
    return {
      collectionRate: 87.5,
      averagePaymentTime: 12.3,
      efficiencyScore: 92.1,
      monthlyGrowth: 8.7,
      riskScore: 23,
      overdueRate: 12.5,
      averageDaysOverdue: 15.2,
      totalSchedules: 1247,
      paidSchedules: 892,
      overdueSchedules: 156,
      totalAmount: 2500000,
      collectedAmount: 1867500,
      paymentTrend: 'improving' as const,
      criticalAlerts: 3,
      warningAlerts: 8,
      overdueAmount: 23450.75,




    };
  }

  private generateMockMonthlyTrends(months: number): MonthlyTrend[] {
    const trends: MonthlyTrend[] = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
      
      const baseAmount = 120000 + (Math.random() * 40000);
      const paidAmount = baseAmount * (0.8 + Math.random() * 0.15);
      const overdueAmount = baseAmount * (0.05 + Math.random() * 0.1);
      
      trends.push({
        month: monthName,
        totalAmount: Math.round(baseAmount),
        paidAmount: Math.round(paidAmount),
        overdueAmount: Math.round(overdueAmount),
        scheduleCount: Math.round(80 + Math.random() * 40)
      });
    }
    
    return trends;
  }

  private generateMockStatusDistribution(): StatusDistribution[] {
    const total = 1247;
    const paid = Math.round(total * 0.72);
    const pending = Math.round(total * 0.16);
    const overdue = Math.round(total * 0.12);
    
    return [
      {
        status: 'paid',
        count: paid,
        percentage: Math.round((paid / total) * 100),
        amount: 156780.50
      },
      {
        status: 'pending',
        count: pending,
        percentage: Math.round((pending / total) * 100),
        amount: 45230.25
      },
      {
        status: 'overdue',
        count: overdue,
        percentage: Math.round((overdue / total) * 100),
        amount: 23450.75
      }
    ];
  }

  private generateMockAmountComparison(): AmountComparison[] {
    return [
      {
        category: 'Cobrado',
        currentMonth: 156780.50,
        previousMonth: 142350.25,
        variance: 14430.25,
        variancePercentage: 10.1
      },
      {
        category: 'Pendiente',
        currentMonth: 45230.25,
        previousMonth: 52180.75,
        variance: -6950.50,
        variancePercentage: -13.3
      },
      {
        category: 'Vencido',
        currentMonth: 23450.75,
        previousMonth: 28920.50,
        variance: -5469.75,
        variancePercentage: -18.9
      }
    ];
  }

  private generateMockPaymentPerformance(): PaymentPerformance[] {
    const performance: PaymentPerformance[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toLocaleDateString('es-PE', { month: 'short' });
      
      const totalPayments = Math.round(80 + Math.random() * 40);
      const onTimePayments = Math.round(totalPayments * (0.75 + Math.random() * 0.2));
      const latePayments = totalPayments - onTimePayments;
      
      performance.push({
        period,
        onTimePayments,
        latePayments,
        totalPayments,
        onTimeRate: Math.round((onTimePayments / totalPayments) * 100)
      });
    }
    
    return performance;
  }

  private generateMockAgingAnalysis(): AgingBucket[] {
    return [
      {
        range: '0-30 días',
        count: 45,
        amount: 12350.75,
        percentage: 52.7
      },
      {
        range: '31-60 días',
        count: 28,
        amount: 8920.50,
        percentage: 38.0
      },
      {
        range: '61-90 días',
        count: 12,
        amount: 1850.25,
        percentage: 7.9
      },
      {
        range: '90+ días',
        count: 3,
        amount: 329.25,
        percentage: 1.4
      }
    ];
  }

  private generateMockSuggestions(query: string, type?: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (!type || type === 'client') {
      suggestions.push(
        { type: 'client', value: 'juan-perez', label: 'Juan Pérez', count: 5 },
        { type: 'client', value: 'maria-garcia', label: 'María García', count: 3 },
        { type: 'client', value: 'carlos-rodriguez', label: 'Carlos Rodríguez', count: 7 }
      );
    }
    
    if (!type || type === 'contract') {
      suggestions.push(
        { type: 'contract', value: 'CT-2024-001', label: 'CT-2024-001', count: 1 },
        { type: 'contract', value: 'CT-2024-002', label: 'CT-2024-002', count: 1 },
        { type: 'contract', value: 'CT-2024-003', label: 'CT-2024-003', count: 1 }
      );
    }
    
    return suggestions.filter(s => 
      s.label.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }

  // Chart data generation methods
  private generateStatusChartData(schedules: PaymentSchedule[]): any {
    const statusCounts = schedules.reduce((acc, schedule) => {
      acc[schedule.status] = (acc[schedule.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      labels: Object.keys(statusCounts).map(status => this.getStatusLabel(status)),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  private generateMonthlyTrendsChartData(schedules: PaymentSchedule[]): any {
    // Group schedules by month
    const monthlyData = schedules.reduce((acc, schedule) => {
      const month = new Date(schedule.due_date).toLocaleDateString('es-PE', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { total: 0, paid: 0, overdue: 0 };
      }
      
      acc[month].total += schedule.amount || 0;
      if (schedule.status === 'pagado') {
          acc[month].paid += schedule.amount;
      } else if (schedule.status === 'vencido') {
        acc[month].overdue += schedule.amount || 0;
      }
      
      return acc;
    }, {} as { [key: string]: any });
    
    const labels = Object.keys(monthlyData);
    
    return {
      labels,
      datasets: [
        {
          label: 'Total',
          data: labels.map(month => monthlyData[month].total),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Pagado',
          data: labels.map(month => monthlyData[month].paid),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Vencido',
          data: labels.map(month => monthlyData[month].overdue),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    };
  }

  private generateAmountComparisonChartData(schedules: PaymentSchedule[]): any {
    const currentMonth = new Date().getMonth();
    const previousMonth = currentMonth - 1;
    
    const currentData = schedules.filter(s => 
      new Date(s.due_date).getMonth() === currentMonth
    );
    const previousData = schedules.filter(s => 
      new Date(s.due_date).getMonth() === previousMonth
    );
    
    const categories = ['Pagado', 'Pendiente', 'Vencido'];
    const currentAmounts = [
      currentData.filter(s => s.status === 'pagado').reduce((sum, s) => sum + s.amount, 0),
        currentData.filter(s => s.status === 'pendiente').reduce((sum, s) => sum + (s.amount || 0), 0),
        currentData.filter(s => s.status === 'vencido').reduce((sum, s) => sum + (s.amount || 0), 0)
    ];
    const previousAmounts = [
        previousData.filter(s => s.status === 'pagado').reduce((sum, s) => sum + s.amount, 0),
        previousData.filter(s => s.status === 'pendiente').reduce((sum, s) => sum + (s.amount || 0), 0),
        previousData.filter(s => s.status === 'vencido').reduce((sum, s) => sum + (s.amount || 0), 0)
    ];
    
    return {
      labels: categories,
      datasets: [
        {
          label: 'Mes Actual',
          data: currentAmounts,
          backgroundColor: '#3B82F6',
          borderRadius: 4
        },
        {
          label: 'Mes Anterior',
          data: previousAmounts,
          backgroundColor: '#94A3B8',
          borderRadius: 4
        }
      ]
    };
  }

  private generatePaymentPerformanceChartData(schedules: PaymentSchedule[]): any {
    // Calculate on-time vs late payments by month
    const monthlyPerformance = schedules.reduce((acc, schedule) => {
      if (schedule.status === 'pagado' && schedule.payment_date) {
        const month = new Date(schedule.payment_date).toLocaleDateString('es-PE', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { onTime: 0, late: 0 };
        }
        
        const dueDate = new Date(schedule.due_date);
        const paidDate = new Date(schedule.payment_date);
        
        if (paidDate <= dueDate) {
          acc[month].onTime++;
        } else {
          acc[month].late++;
        }
      }
      
      return acc;
    }, {} as { [key: string]: any });
    
    const labels = Object.keys(monthlyPerformance);
    
    return {
      labels,
      datasets: [
        {
          label: 'A Tiempo',
          data: labels.map(month => monthlyPerformance[month].onTime),
          backgroundColor: '#10B981',
          borderRadius: 4
        },
        {
          label: 'Tardío',
          data: labels.map(month => monthlyPerformance[month].late),
          backgroundColor: '#F59E0B',
          borderRadius: 4
        }
      ]
    };
  }

  private generateAgingAnalysisChartData(schedules: PaymentSchedule[]): any {
    const overdueSchedules = schedules.filter(s => s.status === 'vencido');
    const agingBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };
    
    overdueSchedules.forEach(schedule => {
      const daysOverdue = schedule.days_overdue || 0;
      
      if (daysOverdue <= 30) {
        agingBuckets['0-30']++;
      } else if (daysOverdue <= 60) {
        agingBuckets['31-60']++;
      } else if (daysOverdue <= 90) {
        agingBuckets['61-90']++;
      } else {
        agingBuckets['90+']++;
      }
    });
    
    return {
      labels: ['0-30 días', '31-60 días', '61-90 días', '90+ días'],
      datasets: [{
        data: Object.values(agingBuckets),
        backgroundColor: ['#FEF3C7', '#FED7AA', '#FECACA', '#FCA5A5'],
        borderColor: ['#F59E0B', '#EA580C', '#DC2626', '#B91C1C'],
        borderWidth: 2
      }]
    };
  }

  // Utility methods
  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'overdue': 'Vencido',
      'partial': 'Pago Parcial'
    };
    
    return statusLabels[status] || status;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // LocalStorage methods for filter presets
  private savePresetToLocalStorage(preset: FilterPreset): void {
    const presets = this.getPresetsFromLocalStorage();
    presets.push(preset);
    localStorage.setItem('collections-filter-presets', JSON.stringify(presets));
  }

  private getPresetsFromLocalStorage(): FilterPreset[] {
    const stored = localStorage.getItem('collections-filter-presets');
    return stored ? JSON.parse(stored) : [];
  }

  private deletePresetFromLocalStorage(presetId: string): void {
    const presets = this.getPresetsFromLocalStorage();
    const filtered = presets.filter(p => p.id !== presetId);
    localStorage.setItem('collections-filter-presets', JSON.stringify(filtered));
  }

  /**
   * Get advanced report with combined filters
   */
  getAdvancedReport(filters: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/advanced-report`, { filters })
      .pipe(
        catchError(error => {
          console.error('Error fetching advanced report:', error);
          return of(this.generateMockAdvancedReport());
        })
      );
  }

  /**
   * Get predictive analysis
   */
  getPredictiveAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/predictive-analysis`, { filters })
      .pipe(
        catchError(error => {
          console.error('Error fetching predictive analysis:', error);
          return of({
            predictions: [
              { month: 'Enero', predicted: 85000, confidence: 0.85 },
              { month: 'Febrero', predicted: 92000, confidence: 0.82 },
              { month: 'Marzo', predicted: 88000, confidence: 0.79 }
            ],
            accuracy: 87.5,
            trend: 'upward',
            recommendations: [
              'Incrementar seguimiento en contratos de alto valor',
              'Implementar recordatorios automáticos 7 días antes del vencimiento'
            ]
          });
        })
      );
  }

  /**
   * Generate mock advanced report
   */
  private generateMockAdvancedReport(): any {
    return {
      total_amount: 250000,
      paid_amount: 180000,
      pending_amount: 45000,
      overdue_amount: 25000,
      total_schedules: 150,
      schedules: this.generateMockSchedules(20)
    };
  }

  /**
   * Generate mock schedules for testing
   */
  private generateMockSchedules(count: number): any[] {
    const schedules = [];
    const statuses = ['pagado', 'pendiente', 'vencido'];
    
    for (let i = 0; i < count; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 90));
      
      schedules.push({
        schedule_id: i + 1,
        contract_id: `CON-${String(i + 1).padStart(4, '0')}`,
        due_date: dueDate.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 1000,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        payment_date: Math.random() > 0.5 ? dueDate.toISOString().split('T')[0] : null
      });
    }
    
    return schedules;
  }
}