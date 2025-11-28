import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { PaymentScheduleService, ExportService } from '../../services';
import { PaymentSchedule, PaymentScheduleFilter } from '../../models';

// Define missing types
export type ExportFormat = 'excel' | 'pdf' | 'csv';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

Chart.register(...registerables);

@Component({
  selector: 'app-payment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BaseChartDirective],
  template: `
   MODULO EN DESARROLLO
  `
})
export class PaymentScheduleComponent implements OnInit {
  filtersForm: FormGroup;
  paymentSchedules: PaymentSchedule[] = [];
  filteredPayments: PaymentSchedule[] = [];
  paginatedPayments: PaymentSchedule[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 0;

  // Search and sorting
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Summary data
  overdueSummary = { count: 0, amount: 0 };
  upcomingSummary = { count: 0, amount: 0 };
  currentSummary = { count: 0, amount: 0 };

  // Filter options
  clients: any[] = [];

  // Chart configurations
  statusChartType: ChartType = 'doughnut';
  statusChartData: ChartConfiguration['data'] = {
    labels: ['Pagado', 'Pendiente', 'Vencido', 'Parcial'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  };

  statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  timelineChartType: ChartType = 'bar';
  timelineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Pagos Programados',
      data: [],
      backgroundColor: '#3B82F6'
    }]
  };

  timelineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '$' + (Number(value) / 1000) + 'K';
          }
        }
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private paymentScheduleService: PaymentScheduleService,
    private exportService: ExportService
  ) {
    this.filtersForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      clientId: [''],
      status: [''],
      alertType: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPaymentSchedules();
  }

  private loadInitialData(): void {
    // Load clients for filters
    this.clients = [
      { id: 1, name: 'Juan Pérez', email: 'juan@email.com' },
      { id: 2, name: 'María García', email: 'maria@email.com' },
      { id: 3, name: 'Carlos López', email: 'carlos@email.com' }
    ];
  }

  private loadPaymentSchedules(): void {
    const filters = this.filtersForm.value as PaymentScheduleFilter;

    this.paymentScheduleService.getPaymentSchedules(filters).subscribe({
      next: (response) => {
        this.paymentSchedules = response.data;
        this.applySearchAndSort();
        this.updateSummaryData();
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading payment schedules:', error);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPaymentSchedules();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.currentPage = 1;
    this.loadPaymentSchedules();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applySearchAndSort();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applySearchAndSort();
  }

  private applySearchAndSort(): void {
    let filtered = [...this.paymentSchedules];

    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        (payment.clientName || '').toLowerCase().includes(term) ||
        (payment.clientEmail || '').toLowerCase().includes(term) ||
        payment.installmentNumber.toString().includes(term)
      );
    }

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[this.sortField];
        const bValue = (b as any)[this.sortField];

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredPayments = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPayments = this.filteredPayments.slice(startIndex, endIndex);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  private updateSummaryData(): void {
    const today = new Date();

    this.overdueSummary = this.paymentSchedules
      .filter(p => p.daysUntilDue < 0)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });

    this.upcomingSummary = this.paymentSchedules
      .filter(p => p.daysUntilDue >= 0 && p.daysUntilDue <= 7)
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });

    this.currentSummary = this.paymentSchedules
      .filter(p => p.status === 'paid')
      .reduce((acc, p) => ({
        count: acc.count + 1,
        amount: acc.amount + p.amount
      }), { count: 0, amount: 0 });
  }

  private updateCharts(): void {
    // Update status chart
    const statusCounts = this.paymentSchedules.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.statusChartData = {
      labels: ['Pagado', 'Pendiente', 'Vencido', 'Parcial'],
      datasets: [{
        data: [
          statusCounts['paid'] || 0,
          statusCounts['pending'] || 0,
          statusCounts['overdue'] || 0,
          statusCounts['partial'] || 0
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }]
    };

    // Update timeline chart (mock data for now)
    this.timelineChartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Pagos Programados',
        data: [120000, 150000, 180000, 140000, 160000, 190000],
        backgroundColor: '#3B82F6'
      }]
    };
  }

  getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      case 'partial':
        return 'Parcial';
      default:
        return 'Desconocido';
    }
  }

  getDaysClass(daysUntilDue: number): string {
    if (daysUntilDue < 0) {
      return 'text-red-600';
    } else if (daysUntilDue <= 7) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  }

  getRowClass(status: PaymentStatus, daysUntilDue: number): string {
    if (status === 'overdue' || daysUntilDue < 0) {
      return 'bg-red-50';
    } else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      return 'bg-yellow-50';
    }
    return '';
  }

  markAsPaid(paymentId: number): void {
    this.paymentScheduleService.updatePaymentStatus(paymentId, 'paid').subscribe({
      next: () => {
        this.loadPaymentSchedules();
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
      }
    });
  }

  viewPaymentDetail(paymentId: number): void {
    // Navigate to payment detail or open modal
    console.log('View payment detail:', paymentId);
  }

  sendReminder(paymentId: number): void {
    // Send payment reminder
    console.log('Send reminder for payment:', paymentId);
  }

  exportReport(format: ExportFormat): void {
    const filters = this.filtersForm.value as PaymentScheduleFilter;

    this.exportService.exportPaymentSchedule(
      this.filteredPayments,
      format
    ).subscribe({
      next: (blob) => {
        console.log('Export received, downloading file...');
        this.exportService.downloadFile(blob, 'cronograma-pagos', format);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  // Utility property for template
  get Math() {
    return Math;
  }
}