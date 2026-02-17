import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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
  constructor(private http: HttpClient) {}
  private contractsBase = `${environment.URL_BACKEND}/v1/sales/contracts`;

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
      'DNI',
      'Teléfono',
      'Teléfono 2',
      'Email',
      'Dirección',
      'Distrito',
      'Provincia',
      'Departamento',
      'Lote',
      'Precio Venta',
      'Descuento',
      'Bono Techo Propio',
      'Precio Total Real',
      'Total Pagado',
      '% Pagado (sin Bono)',
      '% Pagado (con Bono)',
      '5% Precio Total',
      'Cuota',
      'Nombre de Cuota',
      'Tipo',
      'Fecha Vencimiento',
      'Monto',
      'Estado (calculado)',
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

    // Enable filters on header row
    detailSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };

    // Prefetch contract details for enrichment
    const ids = Array.from(new Set(data.map(d => d.contract_id))).filter(Boolean) as number[];
    const contractDetails: Record<number, any> = {};
    try {
      const res: any = await this.http.get<any>(`${this.contractsBase}/batch`, { params: { ids: ids.join(',') } }).toPromise();
      const list = res?.data || [];
      (list as any[]).forEach((c: any) => { contractDetails[c.contract_id] = c; });
    } catch {}

    // Pre-calculate total paid per contract
    const totalPaidByContract: Record<number, number> = {};
    data.forEach((s: any) => {
      const cid = s.contract_id;
      if (cid) {
        const paid = s.status === 'pagado' ? (Number(s.amount_paid) || Number(s.amount) || 0) : 0;
        totalPaidByContract[cid] = (totalPaidByContract[cid] || 0) + paid;
      }
    });

    // Data rows
    data.forEach((schedule, index) => {
      const daysOverdue = this.calculateDaysOverdue(schedule);
      const statusCalculated = (schedule.status === 'pendiente' && daysOverdue > 0) ? 'Vencido' : this.getStatusLabel(schedule.status);

      const c = contractDetails[schedule.contract_id];
      const client = c?.client || c?.reservation?.client;
      const lot = c?.lot || c?.reservation?.lot;
      const manzanaName = (lot?.manzana?.name) || (lot?.manzana_name) || (lot?.manzana_id) || '';
      const lotLabel = lot ? (lot?.external_code || `MZ-${manzanaName} L-${lot?.num_lot ?? ''}`) : (schedule.lot_number || 'N/A');
      const dni = client?.doc_number || client?.document_number || '';
      const phone1 = client?.primary_phone || '';
      const phone2 = client?.secondary_phone || '';
      const email = client?.email || '';
      const address = client?.address?.line1 || '';
      const district = client?.address?.city || '';
      const province = client?.address?.state || '';
      const department = client?.address?.country || '';

      const precioVenta = Number(schedule.precio_venta) || 0;
      const descuento = Number(schedule.descuento) || 0;
      const bonoTechoPropio = Number(schedule.bono_techo_propio) || 0;
      const precioTotalReal = Number(schedule.precio_total_real) || 0;
      const fivePercent = precioTotalReal > 0 ? Math.round(precioTotalReal * 0.05 * 100) / 100 : 0;
      const totalPaid = totalPaidByContract[schedule.contract_id] || 0;
      const pctSinBono = precioTotalReal > 0 ? Math.round((totalPaid / precioTotalReal) * 10000) / 100 : 0;
      const pctConBono = precioTotalReal > 0 ? Math.round(((totalPaid + bonoTechoPropio) / precioTotalReal) * 10000) / 100 : 0;

      const row = detailSheet.addRow([
        schedule.contract_number || schedule.contract_id?.toString() || 'N/A',
        (schedule.client_name && schedule.client_name !== 'N/A') ? schedule.client_name : (client ? `${client?.first_name || ''} ${client?.last_name || ''}`.trim() : 'N/A'),
        dni,
        phone1,
        phone2,
        email,
        address,
        district,
        province,
        department,
        lotLabel,
        precioVenta,
        descuento,
        bonoTechoPropio,
        precioTotalReal,
        totalPaid,
        pctSinBono,
        pctConBono,
        fivePercent,
        schedule.installment_number?.toString() || '',
        this.escapeCsvValue(schedule.notes || ''),
        schedule.type || '',
        this.formatDate(schedule.due_date),
        schedule.amount || 0,
        statusCalculated,
        schedule.payment_date ? this.formatDate(schedule.payment_date) : '',
        daysOverdue
      ]);

      // Set number format for currency columns
      row.getCell(12).numFmt = '"S/ "#,##0.00';  // Precio Venta
      row.getCell(13).numFmt = '"S/ "#,##0.00';  // Descuento
      row.getCell(14).numFmt = '"S/ "#,##0.00';  // Bono Techo Propio
      row.getCell(15).numFmt = '"S/ "#,##0.00';  // Precio Total Real
      row.getCell(16).numFmt = '"S/ "#,##0.00';  // Total Pagado
      row.getCell(17).numFmt = '0.00"%"';         // % Pagado (sin Bono)
      row.getCell(18).numFmt = '0.00"%"';         // % Pagado (con Bono)
      row.getCell(19).numFmt = '"S/ "#,##0.00';  // 5% Precio Total
      row.getCell(24).numFmt = '"S/ "#,##0.00';  // Monto cuota

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
      const statusCell = row.getCell(25);
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
    detailSheet.getColumn(1).width = 18;   // Contrato
    detailSheet.getColumn(2).width = 28;   // Cliente
    detailSheet.getColumn(3).width = 12;   // DNI
    detailSheet.getColumn(4).width = 16;   // Teléfono
    detailSheet.getColumn(5).width = 16;   // Teléfono 2
    detailSheet.getColumn(6).width = 24;   // Email
    detailSheet.getColumn(7).width = 28;   // Dirección
    detailSheet.getColumn(8).width = 18;   // Distrito
    detailSheet.getColumn(9).width = 18;   // Provincia
    detailSheet.getColumn(10).width = 18;  // Departamento
    detailSheet.getColumn(11).width = 12;  // Lote
    detailSheet.getColumn(12).width = 18;  // Precio Venta
    detailSheet.getColumn(13).width = 16;  // Descuento
    detailSheet.getColumn(14).width = 20;  // Bono Techo Propio
    detailSheet.getColumn(15).width = 20;  // Precio Total Real
    detailSheet.getColumn(16).width = 18;  // Total Pagado
    detailSheet.getColumn(17).width = 20;  // % Pagado (sin Bono)
    detailSheet.getColumn(18).width = 20;  // % Pagado (con Bono)
    detailSheet.getColumn(19).width = 18;  // 5% Precio Total
    detailSheet.getColumn(20).width = 8;   // Cuota
    detailSheet.getColumn(21).width = 24;  // Nombre de Cuota
    detailSheet.getColumn(22).width = 14;  // Tipo
    detailSheet.getColumn(23).width = 18;  // Fecha Vencimiento
    detailSheet.getColumn(24).width = 15;  // Monto
    detailSheet.getColumn(25).width = 16;  // Estado (calculado)
    detailSheet.getColumn(26).width = 18;  // Fecha Pago
    detailSheet.getColumn(27).width = 12;  // Días Vencido

    // Freeze header row
    detailSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    // ====== HOJA LEYENDA ======
    const legendSheet = workbook.addWorksheet('Leyenda', {
      properties: { tabColor: { argb: 'FFF59E0B' } }
    });

    // Title
    legendSheet.mergeCells('A1:C1');
    const legendTitle = legendSheet.getCell('A1');
    legendTitle.value = 'LEYENDA DE COLUMNAS';
    legendTitle.font = { size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
    legendTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    legendSheet.getRow(1).height = 30;

    // Subtitle
    legendSheet.mergeCells('A2:C2');
    const legendSub = legendSheet.getCell('A2');
    legendSub.value = `Generado: ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    legendSub.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    legendSub.alignment = { horizontal: 'center' };

    // Legend headers
    const legendHeaders = legendSheet.addRow(['Columna', 'Descripción', 'Tipo / Fórmula']);
    legendHeaders.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    legendHeaders.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    legendHeaders.alignment = { vertical: 'middle', horizontal: 'center' };
    legendHeaders.height = 22;

    const legendData: string[][] = [
      ['Contrato', 'Número de contrato asignado al cliente', 'Texto'],
      ['Cliente', 'Nombre completo del cliente', 'Texto'],
      ['DNI', 'Documento Nacional de Identidad del cliente', 'Texto'],
      ['Teléfono', 'Teléfono principal de contacto', 'Texto'],
      ['Teléfono 2', 'Teléfono secundario de contacto', 'Texto'],
      ['Email', 'Correo electrónico del cliente', 'Texto'],
      ['Dirección', 'Dirección de domicilio del cliente', 'Texto'],
      ['Distrito', 'Distrito del domicilio', 'Texto'],
      ['Provincia', 'Provincia del domicilio', 'Texto'],
      ['Departamento', 'Departamento del domicilio', 'Texto'],
      ['Lote', 'Identificador del lote (Manzana - Lote)', 'Texto'],
      ['Precio Venta', 'Precio de lista del lote (sin descuento, sin bono)', 'Moneda S/'],
      ['Descuento', 'Descuento aplicado al contrato (proveniente del CRM)', 'Moneda S/'],
      ['Bono Techo Propio', 'Subsidio estatal Techo Propio (S/ 52,250 si aplica)', 'Moneda S/'],
      ['Precio Total Real', 'Precio final = Precio Venta − Descuento + Bono Techo Propio', 'Moneda S/ (fórmula)'],
      ['Total Pagado', 'Suma de todas las cuotas pagadas del contrato', 'Moneda S/'],
      ['% Pagado (sin Bono)', 'Porcentaje pagado sin considerar el bono = Total Pagado / Precio Total Real × 100', 'Porcentaje (fórmula)'],
      ['% Pagado (con Bono)', 'Porcentaje pagado incluyendo bono = (Total Pagado + Bono) / Precio Total Real × 100', 'Porcentaje (fórmula)'],
      ['5% Precio Total', 'Umbral del 5% sobre Precio Total Real para separación', 'Moneda S/ (fórmula)'],
      ['Cuota', 'Número de cuota dentro del cronograma', 'Número'],
      ['Nombre de Cuota', 'Descripción o etiqueta de la cuota', 'Texto'],
      ['Tipo', 'Tipo de cuota: inicial, financiamiento, balon, bono_bpp', 'Texto'],
      ['Fecha Vencimiento', 'Fecha en que vence la cuota', 'Fecha'],
      ['Monto', 'Monto a pagar de la cuota', 'Moneda S/'],
      ['Estado (calculado)', 'Estado real: Pagado, Pendiente o Vencido (recalculado)', 'Texto'],
      ['Fecha Pago', 'Fecha en que se realizó el pago (si aplica)', 'Fecha'],
      ['Días Vencido', 'Días transcurridos desde el vencimiento (solo cuotas vencidas)', 'Número'],
    ];

    legendData.forEach((row, i) => {
      const r = legendSheet.addRow(row);
      r.height = 18;
      if (i % 2 === 0) {
        r.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
      r.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // Fórmulas note
    const formulaRow = legendSheet.addRow([]);
    const noteRow = legendSheet.addRow(['FÓRMULAS CLAVE:']);
    noteRow.font = { bold: true, size: 11 };
    const formulas = [
      ['', 'Precio Total Real = Precio Venta − Descuento + Bono Techo Propio', ''],
      ['', '% Pagado (sin Bono) = Total Pagado ÷ Precio Total Real × 100', ''],
      ['', '% Pagado (con Bono) = (Total Pagado + Bono) ÷ Precio Total Real × 100', ''],
      ['', '5% Precio Total = Precio Total Real × 0.05', ''],
    ];
    formulas.forEach(f => {
      const r = legendSheet.addRow(f);
      r.getCell(2).font = { italic: true, color: { argb: 'FF4B5563' } };
    });

    legendSheet.getColumn(1).width = 24;
    legendSheet.getColumn(2).width = 60;
    legendSheet.getColumn(3).width = 24;

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
      'Nombre de Cuota',
      'Tipo',
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
        this.escapeCsvValue(schedule.notes || ''),
        schedule.type || '',
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
