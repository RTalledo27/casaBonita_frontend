import { Injectable } from '@angular/core';
import { PaymentSchedule } from '../models/payment-schedule';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts?: boolean;
  includeMetrics?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface ReportSummary {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  total_schedules: number;
  paid_schedules: number;
  pending_schedules: number;
  overdue_schedules: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to CSV format
   */
  exportToCSV(data: PaymentSchedule[], filename: string = 'export'): void {
    const csvContent = this.generateCSVContent(data);
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  /**
   * Export data to Excel format using xlsx library
   */
  exportToExcel(data: PaymentSchedule[], filename: string = 'reporte-cobranzas', summary?: ReportSummary): void {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // If summary is provided, add summary sheet
    if (summary) {
      const summaryRows = [
        { Métrica: 'RESUMEN DE COBRANZAS', Valor: '' },
        { Métrica: '', Valor: '' },
        { Métrica: 'Total de Cronogramas', Valor: summary.total_schedules },
        { Métrica: 'Monto Total', Valor: this.formatCurrency(summary.total_amount) },
        { Métrica: 'Monto Cobrado', Valor: this.formatCurrency(summary.paid_amount) },
        { Métrica: 'Monto Pendiente', Valor: this.formatCurrency(summary.pending_amount) },
        { Métrica: 'Monto Vencido', Valor: this.formatCurrency(summary.overdue_amount) },
        { Métrica: '', Valor: '' },
        { Métrica: 'Cronogramas Pagados', Valor: summary.paid_schedules },
        { Métrica: 'Cronogramas Pendientes', Valor: summary.pending_schedules },
        { Métrica: 'Cronogramas Vencidos', Valor: summary.overdue_schedules },
        { Métrica: '', Valor: '' },
        { Métrica: 'Eficiencia de Cobranza', Valor: `${summary.total_amount > 0 ? ((summary.paid_amount / summary.total_amount) * 100).toFixed(2) : 0}%` }
      ];

      const ws_summary = XLSX.utils.json_to_sheet(summaryRows);

      // Set column widths
      ws_summary['!cols'] = [
        { wch: 30 },
        { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws_summary, 'Resumen');
    }

    // Prepare detailed data as objects for json_to_sheet
    const detailedRows = data.map(schedule => {
      const daysOverdue = this.calculateDaysOverdue(schedule);
      return {
        'Contrato': schedule.contract_number || schedule.contract_id?.toString() || 'N/A',
        'Cliente': schedule.client_name || 'N/A',
        'Lote': schedule.lot_number || 'N/A',
        'Cuota': schedule.installment_number?.toString() || '',
        'Fecha Vencimiento': this.formatDate(schedule.due_date),
        'Monto': schedule.amount || 0,
        'Estado': this.getStatusLabel(schedule.status),
        'Fecha Pago': schedule.payment_date ? this.formatDate(schedule.payment_date) : '',
        'Días Vencido': daysOverdue
      };
    });

    const ws_detail = XLSX.utils.json_to_sheet(detailedRows);

    // Set column widths for detailed sheet
    ws_detail['!cols'] = [
      { wch: 15 }, // Contrato
      { wch: 25 }, // Cliente
      { wch: 12 }, // Lote
      { wch: 8 },  // Cuota
      { wch: 18 }, // Fecha Vencimiento
      { wch: 12 }, // Monto
      { wch: 12 }, // Estado
      { wch: 15 }, // Fecha Pago
      { wch: 12 }  // Días Vencido
    ];

    XLSX.utils.book_append_sheet(wb, ws_detail, 'Cronogramas');

    // Generate file and download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export charts as images
   */
  exportChartsAsImages(charts: any, filename: string = 'graficos'): void {
    const chartNames = ['distribucion-estados', 'tendencia-mensual', 'comparacion-montos'];

    Object.values(charts).forEach((chart: any, index) => {
      if (chart && chart.canvas) {
        const url = chart.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${filename}-${chartNames[index] || `chart-${index}`}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
      }
    });
  }

  /**
   * Export to PDF
   * NOTE: This is a placeholder. For actual PDF generation, 
   * consider using a backend endpoint or a library like jsPDF with autoTable
   */
  exportToPDF(data: PaymentSchedule[], options?: ExportOptions): void {
    // For now, alert the user that PDF export is not yet implemented
    alert('La exportación a PDF estará disponible próximamente. Por favor, use la exportación a Excel.');

    // Alternative: Export as Excel for now
    // this.exportToExcel(data, 'reporte-cobranzas-pdf');
  }

  /**
   * Generate CSV content from payment schedules
   */
  private generateCSVContent(data: PaymentSchedule[]): string {
    const headers = [
      'Contrato',
      'Cliente',
      'Lote',
      'Cuota',
      'Fecha Vencimiento',
      'Monto',
      'Estado',
      'Fecha Pago',
      'Días Vencido'
    ];

    let csv = headers.join(',') + '\n';

    data.forEach(schedule => {
      const daysOverdue = this.calculateDaysOverdue(schedule);
      const row = [
        schedule.contract_number || schedule.contract_id?.toString() || 'N/A',
        this.escapeCsvValue(schedule.client_name || 'N/A'),
        schedule.lot_number || 'N/A',
        schedule.installment_number?.toString() || '',
        this.formatDate(schedule.due_date),
        schedule.amount?.toString() || '0',
        this.getStatusLabel(schedule.status),
        schedule.payment_date ? this.formatDate(schedule.payment_date) : '',
        daysOverdue.toString()
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Escape CSV values that contain commas or quotes
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Format currency for display
   */
  private formatCurrency(value: number): string {
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format date for export
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get status label in Spanish
   */
  private getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      case 'anulado':
        return 'Anulado';
      default:
        return status;
    }
  }

  /**
   * Calculate days overdue dynamically
   */
  private calculateDaysOverdue(schedule: PaymentSchedule): number {
    // If already paid, no days overdue
    if (schedule.status === 'pagado') {
      return 0;
    }

    if (!schedule.due_date) return 0;

    try {
      const dueDate = new Date(schedule.due_date);
      const today = new Date();

      // Reset hours for accurate day calculation
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }
}