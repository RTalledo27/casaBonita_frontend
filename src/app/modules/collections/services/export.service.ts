import { Injectable } from '@angular/core';
import { PaymentSchedule } from '../models/payment-schedule';
import { Workbook } from 'exceljs';

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
   * Export data to professional Excel format using exceljs
   */
  async exportToExcel(data: PaymentSchedule[], filename: string = 'reporte-cobranzas', summary?: ReportSummary): Promise<void> {
    const workbook = new Workbook();
    workbook.creator = 'Casa Bonita - Sistema de Cobranzas';
    workbook.created = new Date();

    // Add Summary Sheet if summary provided
    if (summary) {
      const summarySheet = workbook.addWorksheet('Resumen', {
        properties: { tabColor: { argb: 'FF2563EB' } }
      });

      // Title
      summarySheet.mergeCells('A1:D1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'REPORTE DE COBRANZAS';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(1).height = 30;

      // Date range info
      summarySheet.mergeCells('A2:D2');
      const dateCell = summarySheet.getCell('A2');
      dateCell.value = `Generado: ${new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      dateCell.font = { size: 10, italic: true };
      dateCell.alignment = { horizontal: 'center' };
      summarySheet.getRow(2).height = 20;

      // Empty row
      summarySheet.addRow([]);

      // Header for metrics section
      summarySheet.mergeCells('A4:B4');
      const metricsHeader = summarySheet.getCell('A4');
      metricsHeader.value = 'MÉTRICAS GENERALES';
      metricsHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      metricsHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      metricsHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(4).height = 25;

      // Metrics data
      const metrics = [
        ['Total de Cronogramas', summary.total_schedules],
        ['Monto Total', summary.total_amount],
        ['Monto Cobrado', summary.paid_amount],
        ['Monto Pendiente', summary.pending_amount],
        ['Monto Vencido', summary.overdue_amount]
      ];

      let currentRow = 5;
      metrics.forEach(([label, value]) => {
        const row = summarySheet.getRow(currentRow);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };

        const valueCell = row.getCell(2);
        if (typeof value === 'number' && typeof label === 'string' && label.toLowerCase().includes('monto')) {
          valueCell.value = value;
          valueCell.numFmt = '"S/ "#,##0.00';
        } else {
          valueCell.value = value;
        }
        valueCell.alignment = { horizontal: 'right' };

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        row.height = 20;
        currentRow++;
      });

      // Empty row
      summarySheet.addRow([]);
      currentRow++;

      // Header for counts section
      summarySheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const countsHeader = summarySheet.getCell(`A${currentRow}`);
      countsHeader.value = 'DISTRIBUCIÓN POR ESTADO';
      countsHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      countsHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }
      };
      countsHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(currentRow).height = 25;
      currentRow++;

      // Counts data
      const counts = [
        ['Cronogramas Pagados', summary.paid_schedules],
        ['Cronogramas Pendientes', summary.pending_schedules],
        ['Cronogramas Vencidos', summary.overdue_schedules]
      ];

      counts.forEach(([label, value]) => {
        const row = summarySheet.getRow(currentRow);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };

        row.getCell(2).value = value;
        row.getCell(2).alignment = { horizontal: 'right' };

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        row.height = 20;
        currentRow++;
      });

      // Empty row
      summarySheet.addRow([]);
      currentRow++;

      // Efficiency
      summarySheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const efficiencyHeader = summarySheet.getCell(`A${currentRow}`);
      efficiencyHeader.value = 'EFICIENCIA DE COBRANZA';
      efficiencyHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      efficiencyHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' }
      };
      efficiencyHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(currentRow).height = 25;
      currentRow++;

      const efficiencyRow = summarySheet.getRow(currentRow);
      efficiencyRow.getCell(1).value = 'Porcentaje de Cobranza';
      efficiencyRow.getCell(1).font = { bold: true };
      efficiencyRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };

      const efficiencyValue = summary.total_amount > 0
        ? ((summary.paid_amount / summary.total_amount) * 100).toFixed(2)
        : '0.00';
      efficiencyRow.getCell(2).value = `${efficiencyValue}%`;
      efficiencyRow.getCell(2).alignment = { horizontal: 'right' };
      efficiencyRow.getCell(2).font = { bold: true, size: 12 };

      efficiencyRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      efficiencyRow.height = 20;

      // Set column widths
      summarySheet.getColumn(1).width = 30;
      summarySheet.getColumn(2).width = 20;
    }

    // Add Detailed Sheet
    const detailSheet = workbook.addWorksheet('Cronogramas', {
      properties: { tabColor: { argb: 'FF059669' } }
    });

    // Headers
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

    const headerRow = detailSheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Data rows
    data.forEach((schedule, index) => {
      const daysOverdue = this.calculateDaysOverdue(schedule);
      const row = detailSheet.addRow([
        schedule.contract_number || schedule.contract_id?.toString() || 'N/A',
        schedule.client_name || 'N/A',
        schedule.lot_number || 'N/A',
        schedule.installment_number?.toString() || '',
        this.formatDate(schedule.due_date),
        schedule.amount || 0,
        this.getStatusLabel(schedule.status),
        schedule.payment_date ? this.formatDate(schedule.payment_date) : '',
        daysOverdue
      ]);

      // Set number format for amount column
      row.getCell(6).numFmt = '"S/ "#,##0.00';

      // Zebra striping
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        });
      }

      // Color code status
      const statusCell = row.getCell(7);
      const status = schedule.status;
      if (status === 'pagado') {
        statusCell.font = { bold: true, color: { argb: 'FF059669' } };
      } else if (status === 'vencido' || (status === 'pendiente' && daysOverdue > 0)) {
        statusCell.font = { bold: true, color: { argb: 'FFDC2626' } };
      } else {
        statusCell.font = { bold: true, color: { argb: 'FFD97706' } };
      }

      // Add borders to all cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });

      row.height = 18;
    });

    // Set column widths
    detailSheet.getColumn(1).width = 18;  // Contrato
    detailSheet.getColumn(2).width = 30;  // Cliente
    detailSheet.getColumn(3).width = 12;  // Lote
    detailSheet.getColumn(4).width = 8;   // Cuota
    detailSheet.getColumn(5).width = 18;  // Fecha Vencimiento
    detailSheet.getColumn(6).width = 15;  // Monto
    detailSheet.getColumn(7).width = 12;  // Estado
    detailSheet.getColumn(8).width = 18;  // Fecha Pago
    detailSheet.getColumn(9).width = 12;  // Días Vencido

    // Freeze header row
    detailSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];


    // Generate and download file using browser native download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: PaymentSchedule[], filename: string = 'export'): void {
    const csvContent = this.generateCSVContent(data);
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
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
   * Export to PDF (placeholder)
   */
  exportToPDF(data: PaymentSchedule[], options?: ExportOptions): void {
    alert('La exportación a PDF estará disponible próximamente.\nPor favor, use la exportación a Excel.');
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
   * Escape CSV values
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
   * Format currency
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
    if (schedule.status === 'pagado') {
      return 0;
    }

    if (!schedule.due_date) return 0;

    try {
      const dueDate = new Date(schedule.due_date);
      const today = new Date();

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