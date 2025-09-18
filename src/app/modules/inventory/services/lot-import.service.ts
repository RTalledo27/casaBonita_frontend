import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface LotImportResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    success: number;
    errors: string[];
    financing_rules?: any;
    column_mapping?: any;
    import_id?: string;
    total_rows?: number;
    processed_rows?: number;
    successful_rows?: number;
    error_rows?: number;
    skipped_rows?: number;
    processing_time?: string;
  };
}

export interface LotImportLog {
  import_id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  status: string;
  created_at: string;
  errors?: string[];
  financing_rules?: any;
}

export interface LotCatalogItem {
  lot_id: number;
  manzana: string;
  num_lot: string;
  area_m2: number;
  street_type: string;
  total_price: number;
  status: string;
  financing_options: {
    cash_price?: number;
    installment_options?: {
      months: number;
      monthly_payment: number;
    }[];
  };
}

export interface FinancingSimulationRequest {
  lot_id: number;
  financing_type: 'cash' | 'installments';
  installment_months?: number;
  down_payment?: number;
}

export interface FinancingSimulationResponse {
  success: boolean;
  data?: {
    lot_id: number;
    financing_type: string;
    total_price: number;
    down_payment: number;
    financing_amount: number;
    monthly_payment: number;
    total_payments: number;
    interest_rate?: number;
    balloon_payment?: number;
    bpp_bonus?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LotImportService {
  private baseUrl = API_ROUTES.INVENTORY.LOT_IMPORT;

  constructor(private http: HttpClient) {}

  /**
   * Validar estructura del archivo Excel
   */
  validateStructure(file: File): Observable<LotImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<LotImportResponse>(`${this.baseUrl}/validate`, formData);
  }

  /**
   * Importar lotes desde Excel
   */
  importLots(file: File): Observable<LotImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<LotImportResponse>(`${this.baseUrl}`, formData);
  }

  /**
   * Importar lotes de forma asíncrona
   */
  importLotsAsync(file: File): Observable<LotImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<LotImportResponse>(`${this.baseUrl}/async`, formData);
  }

  /**
   * Obtener estado de importación
   */
  getImportStatus(importId: string): Observable<LotImportResponse> {
    return this.http.get<LotImportResponse>(`${this.baseUrl}/status/${importId}`);
  }

  /**
   * Obtener historial de importaciones
   */
  getImportHistory(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/history`);
  }

  /**
   * Descargar plantilla de Excel para importación
   */
  downloadTemplate(): Observable<Blob> {
    const timestamp = new Date().getTime();
    const url = `${this.baseUrl}/template?t=${timestamp}`;
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  /**
   * Obtener catálogo público de lotes
   */
  getPublicCatalog(): Observable<{ data: LotCatalogItem[] }> {
    return this.http.get<{ data: LotCatalogItem[] }>(`${API_ROUTES.INVENTORY.LOTS}/catalog`);
  }

  /**
   * Simular financiamiento para un lote
   */
  simulateFinancing(request: FinancingSimulationRequest): Observable<FinancingSimulationResponse> {
    return this.http.post<FinancingSimulationResponse>(`${API_ROUTES.INVENTORY.LOTS}/financing-simulator`, request);
  }

  /**
   * Obtener template financiero de un lote
   */
  getLotFinancialTemplate(lotId: number): Observable<any> {
    return this.http.get(`${API_ROUTES.INVENTORY.LOTS}/${lotId}/financial-template`);
  }

  /**
   * Obtener reglas de financiamiento por manzana
   */
  getManzanaFinancingRules(): Observable<any> {
    return this.http.get(`${API_ROUTES.INVENTORY.LOTS}/manzana-financing-rules`);
  }

  /**
   * Obtener estadísticas de importación
   */
  getImportStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`);
  }
}