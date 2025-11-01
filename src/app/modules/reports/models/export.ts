export type ExportFormat = 'excel' | 'pdf' | 'csv';

export interface ExportRequest {
  reportType: 'sales' | 'payments' | 'projected';
  format: ExportFormat;
  type?: string; // Agregada propiedad type
  data?: any; // Agregada propiedad data
  filename?: string;
  filters: any;
  columns?: string[];
  title?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  reportType: string;
  format: string;
  columns: ExportColumn[];
  settings: ExportSettings;
}

export interface ExportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;
  format?: string;
  visible: boolean;
}

export interface ExportSettings {
  includeHeader: boolean;
  includeFooter: boolean;
  includeSummary: boolean;
  includeCharts: boolean;
  pageOrientation: 'portrait' | 'landscape';
  fontSize: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}