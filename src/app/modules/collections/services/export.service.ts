import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';

export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'excel' | 'pdf';
  includeCharts?: boolean;
  sheets?: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  data: any[];
  headers?: string[];
  chartData?: ChartExportData;
}

export interface ChartExportData {
  chart: Chart;
  title: string;
  position?: { row: number; col: number };
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], filename: string = 'export', headers?: string[]): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    let csvContent = '';
    
    // Add headers
    if (headers && headers.length > 0) {
      csvContent += headers.join(',') + '\n';
    } else {
      // Use object keys as headers
      const firstRow = data[0];
      if (typeof firstRow === 'object') {
        csvContent += Object.keys(firstRow).join(',') + '\n';
      }
    }

    // Add data rows
    data.forEach(row => {
      if (typeof row === 'object') {
        const values = Object.values(row).map(value => {
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      } else {
        csvContent += row + '\n';
      }
    });

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  /**
   * Export data to Excel format with multiple sheets
   */
  async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      // Dynamic import to reduce bundle size
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.utils.book_new();
      
      if (options.sheets && options.sheets.length > 0) {
        for (const sheet of options.sheets) {
          await this.addSheetToWorkbook(workbook, sheet, XLSX);
        }
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const filename = options.filename || 'export';
      
      this.downloadFile(
        new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${filename}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      // Fallback to CSV if Excel export fails
      if (options.sheets && options.sheets.length > 0) {
        this.exportToCSV(options.sheets[0].data, options.filename);
      }
    }
  }

  /**
   * Add a sheet to the workbook
   */
  private async addSheetToWorkbook(workbook: any, sheet: ExcelSheet, XLSX: any): Promise<void> {
    let worksheet: any;
    
    if (sheet.headers && sheet.headers.length > 0) {
      // Create worksheet with custom headers
      const wsData = [sheet.headers, ...sheet.data.map(row => {
        if (typeof row === 'object') {
          return sheet.headers!.map(header => row[header] || '');
        }
        return row;
      })];
      worksheet = XLSX.utils.aoa_to_sheet(wsData);
    } else {
      // Create worksheet from JSON data
      worksheet = XLSX.utils.json_to_sheet(sheet.data);
    }

    // Add chart if provided
    if (sheet.chartData) {
      await this.addChartToWorksheet(worksheet, sheet.chartData);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  /**
   * Add chart image to worksheet
   */
  private async addChartToWorksheet(worksheet: any, chartData: ChartExportData): Promise<void> {
    try {
      const chartImage = await this.exportChartAsImage(chartData.chart);
      
      // Note: Adding images to Excel requires additional libraries
      // For now, we'll add a placeholder text
      const position = chartData.position || { row: 1, col: 1 };
      const cellAddress = this.getCellAddress(position.row, position.col);
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = {};
      }
      
      worksheet[cellAddress].v = `[GRÁFICO: ${chartData.title}]`;
      worksheet[cellAddress].t = 's';
      
    } catch (error) {
      console.error('Error adding chart to worksheet:', error);
    }
  }

  /**
   * Export chart as image
   */
  async exportChartAsImage(chart: Chart, filename?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = chart.canvas;
        if (!canvas) {
          reject(new Error('Chart canvas not found'));
          return;
        }

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          if (filename) {
            // Download the image
            this.downloadFile(blob, `${filename}.png`, 'image/png');
          }

          // Return data URL for embedding
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsDataURL(blob);
        }, 'image/png', 0.9);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export multiple charts as images in a ZIP file
   */
  async exportChartsAsZip(charts: { chart: Chart; filename: string }[], zipFilename: string = 'charts'): Promise<void> {
    try {
      // Dynamic import to reduce bundle size
      const JSZip = await import('jszip');
      const zip = new JSZip.default();

      // Add each chart to the ZIP
      for (const chartData of charts) {
        try {
          const imageDataUrl = await this.exportChartAsImage(chartData.chart);
          const base64Data = imageDataUrl.split(',')[1];
          zip.file(`${chartData.filename}.png`, base64Data, { base64: true });
        } catch (error) {
          console.error(`Error adding chart ${chartData.filename} to ZIP:`, error);
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadFile(zipBlob, `${zipFilename}.zip`, 'application/zip');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      // Fallback: download charts individually
      for (const chartData of charts) {
        try {
          await this.exportChartAsImage(chartData.chart, chartData.filename);
        } catch (chartError) {
          console.error(`Error exporting chart ${chartData.filename}:`, chartError);
        }
      }
    }
  }

  /**
   * Generate comprehensive report with data and charts
   */
  async exportComprehensiveReport(reportData: {
    title: string;
    summary: any[];
    details: any[];
    charts: { chart: Chart; title: string }[];
    metadata?: any;
  }, filename: string = 'comprehensive-report'): Promise<void> {
    const sheets: ExcelSheet[] = [
      {
        name: 'Resumen',
        data: reportData.summary,
        headers: reportData.summary.length > 0 ? Object.keys(reportData.summary[0]) : []
      },
      {
        name: 'Detalles',
        data: reportData.details,
        headers: reportData.details.length > 0 ? Object.keys(reportData.details[0]) : []
      }
    ];

    // Add metadata sheet if provided
    if (reportData.metadata) {
      sheets.push({
        name: 'Metadatos',
        data: Object.entries(reportData.metadata).map(([key, value]) => ({ Campo: key, Valor: value })),
        headers: ['Campo', 'Valor']
      });
    }

    // Export Excel with multiple sheets
    await this.exportToExcel({
      filename,
      format: 'excel',
      sheets,
      includeCharts: true
    });

    // Export charts separately if any
    if (reportData.charts && reportData.charts.length > 0) {
      const chartExports = reportData.charts.map((chartData, index) => ({
        chart: chartData.chart,
        filename: `${filename}_chart_${index + 1}_${chartData.title.replace(/\s+/g, '_').toLowerCase()}`
      }));
      
      await this.exportChartsAsZip(chartExports, `${filename}_charts`);
    }
  }

  /**
   * Schedule automatic report generation
   */
  scheduleReport(reportConfig: {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    exportOptions: ExportOptions;
    dataProvider: () => Promise<any[]>;
  }): void {
    // TODO: Implement report scheduling
    // This would typically involve:
    // 1. Storing the configuration in localStorage or backend
    // 2. Setting up a service worker or background task
    // 3. Triggering the report generation at specified intervals
    
    console.log('Report scheduling to be implemented:', reportConfig);
    
    // For now, just store in localStorage as a placeholder
    const scheduledReports = JSON.parse(localStorage.getItem('scheduledReports') || '[]');
    scheduledReports.push({
      ...reportConfig,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('scheduledReports', JSON.stringify(scheduledReports));
  }

  /**
   * Get scheduled reports
   */
  getScheduledReports(): any[] {
    return JSON.parse(localStorage.getItem('scheduledReports') || '[]');
  }

  /**
   * Remove scheduled report
   */
  removeScheduledReport(reportId: string): void {
    const scheduledReports = this.getScheduledReports();
    const updatedReports = scheduledReports.filter(report => report.id !== reportId);
    localStorage.setItem('scheduledReports', JSON.stringify(updatedReports));
  }

  /**
   * Utility method to download files
   */
  private downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }

  /**
   * Convert row/col to Excel cell address (e.g., A1, B2)
   */
  private getCellAddress(row: number, col: number): string {
    let colStr = '';
    let colNum = col;
    
    while (colNum > 0) {
      colStr = String.fromCharCode(65 + ((colNum - 1) % 26)) + colStr;
      colNum = Math.floor((colNum - 1) / 26);
    }
    
    return colStr + row;
  }

  /**
   * Format data for export based on type
   */
  formatDataForExport(data: any[], type: 'currency' | 'date' | 'percentage' | 'number' = 'number'): any[] {
    return data.map(item => {
      const formatted = { ...item };
      
      Object.keys(formatted).forEach(key => {
        const value = formatted[key];
        
        switch (type) {
          case 'currency':
            if (typeof value === 'number') {
              formatted[key] = new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN'
              }).format(value);
            }
            break;
          case 'date':
            if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
              formatted[key] = new Date(value).toLocaleDateString('es-PE');
            }
            break;
          case 'percentage':
            if (typeof value === 'number') {
              formatted[key] = `${(value * 100).toFixed(2)}%`;
            }
            break;
          case 'number':
            if (typeof value === 'number') {
              formatted[key] = new Intl.NumberFormat('es-PE').format(value);
            }
            break;
        }
      });
      
      return formatted;
    });
  }
}