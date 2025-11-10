import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExternalLotImportStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface ExternalLotImportResult {
  success: boolean;
  message: string;
  data?: {
    stats: ExternalLotImportStats;
    errors: string[];
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  data?: {
    connected: boolean;
    sample_count: number;
    sample_properties: any[];
  };
}

export interface PreviewData {
  success: boolean;
  data: {
    total_available: number;
    preview_count: number;
    properties: Array<{
      external_id: string | null;
      code: string;
      status: string;
      area: string | number;
      price: string | number;
      currency: string;
    }>;
  };
}

/**
 * Servicio para importación de lotes desde API externa de LOGICWARE CRM
 */
@Injectable({
  providedIn: 'root'
})
export class ExternalLotImportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/inventory/external-lot-import`;

  /**
   * Probar conexión con el API externa
   */
  testConnection(): Observable<ConnectionTestResult> {
    return this.http.get<ConnectionTestResult>(`${this.baseUrl}/test-connection`);
  }

  /**
   * Sincronizar todos los lotes disponibles
   */
  syncAll(): Observable<ExternalLotImportResult> {
    return this.http.post<ExternalLotImportResult>(`${this.baseUrl}/sync-all`, {});
  }

  /**
   * Sincronizar un lote específico por código
   * @param code Código del lote (Ej: "E2-02")
   */
  syncByCode(code: string): Observable<ExternalLotImportResult> {
    return this.http.post<ExternalLotImportResult>(`${this.baseUrl}/sync-by-code`, { code });
  }

  /**
   * Obtener estadísticas de la última importación
   */
  getStats(): Observable<{ success: boolean; data: { stats: ExternalLotImportStats; errors: string[] } }> {
    return this.http.get<{ success: boolean; data: { stats: ExternalLotImportStats; errors: string[] } }>(`${this.baseUrl}/stats`);
  }

  /**
   * Obtener vista previa de lotes a importar
   * @param limit Número de lotes a previsualizar (default: 10)
   */
  preview(limit: number = 10): Observable<PreviewData> {
    return this.http.get<PreviewData>(`${this.baseUrl}/preview`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Obtener ventas desde el backend (usa caché por defecto)
   */
  getSales(startDate?: string, endDate?: string, forceRefresh: boolean = false): Observable<any> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (forceRefresh) params.force_refresh = '1';
    return this.http.get<any>(`${this.baseUrl}/sales`, { params });
  }

  /**
   * Importar ventas al sistema local (crea clientes/contratos)
   */
  importSales(startDate?: string, endDate?: string, forceRefresh: boolean = false): Observable<any> {
    const body: any = {};
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;
    body.force_refresh = forceRefresh ? 1 : 0;
    return this.http.post<any>(`${this.baseUrl}/sales/import`, body);
  }

  /**
   * Refrescar token de autenticación
   */
  refreshToken(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/refresh-token`, {});
  }
}
