import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LogicwareStage {
  id: string;
  name: string;
  code: string;
  projectCode: string;
  description?: string;
  totalUnits?: number;
  availableUnits?: number;
  status?: string;
}

export interface LogicwareUnit {
  id: string;
  code: string;
  name: string;
  stageId: string;
  stageName?: string;
  block?: string;
  lotNumber?: string;
  area?: number;
  frontage?: number;
  depth?: number;
  price?: number;
  currency?: string;
  status?: string;
  features?: string[];
  // Campos agregados por el backend
  can_import?: boolean;
  exists?: boolean;
  existing_lot_id?: number;
  import_action?: 'create' | 'update';
}

export interface LogicwareStagesResponse {
  success: boolean;
  message: string;
  data: LogicwareStage[];
  meta: {
    total: number;
    cached_at?: string;
    is_mock?: boolean;
    projectCode: string;
  };
}

export interface LogicwareStockPreviewResponse {
  success: boolean;
  message: string;
  data: LogicwareUnit[];
  meta: {
    total: number;
    importable: number;
    duplicates: number;
    cached_at?: string;
    is_mock?: boolean;
    stageId: string;
    projectCode: string;
  };
}

export interface LogicwareImportOptions {
  update_existing?: boolean;
  create_manzanas?: boolean;
  create_templates?: boolean;
  update_templates?: boolean;
  update_status?: boolean;
  force_refresh?: boolean;
}

export interface LogicwareImportResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  errors?: Array<{
    unit: string;
    error: string;
  }>;
  warnings?: Array<{
    unit: string;
    warning: string;
  }>;
  projectCode: string;
  stageId: string;
  is_mock?: boolean;
}

export interface LogicwareConnectionStats {
  success: boolean;
  data: {
    daily_requests_used: number;
    daily_requests_limit: number;
    daily_requests_remaining: number;
    has_available_requests: boolean;
    connection_status: string;
  };
}

export interface FullStockStatistics {
  total_units: number;
  by_status: Record<string, number>;
  with_seller: number;
  with_client: number;
  with_reservation: number;
  data_source: string;
}

export interface CacheInfo {
  cached_at: string;
  cache_expires_at: string;
  is_cached: boolean;
}

export interface ApiInfo {
  daily_requests_used: number;
  daily_requests_limit: number;
  has_available_requests: boolean;
}

export interface FullStockResponse {
  success: boolean;
  data: any[];
  statistics: FullStockStatistics;
  cache_info: CacheInfo;
  api_info: ApiInfo;
  message?: string;
}

/**
 * Servicio para integración con LogicWare API
 * Maneja stages, preview y importación de lotes
 */
@Injectable({
  providedIn: 'root'
})
export class LogicwareService {
  private readonly baseUrl = `${environment.apiUrl}/logicware`;

  constructor(private http: HttpClient) {}

  getFullStock(forceRefresh: boolean = false): Observable<FullStockResponse> {
    const params = new HttpParams().set('force_refresh', forceRefresh.toString());
    return this.http.get<FullStockResponse>(`${this.baseUrl}/full-stock`, { params });
  }

  /**
   * Obtener etapas (stages) disponibles del proyecto
   * 
   * @param projectCode Código del proyecto (default: 'casabonita')
   * @param forceRefresh Forzar consulta fresca sin caché
   * @returns Observable con las etapas disponibles
   */
  getStages(projectCode: string = 'casabonita', forceRefresh: boolean = false): Observable<LogicwareStagesResponse> {
    let params = new HttpParams()
      .set('projectCode', projectCode)
      .set('forceRefresh', forceRefresh.toString());

    return this.http.get<LogicwareStagesResponse>(`${this.baseUrl}/stages`, { params });
  }

  /**
   * Previsualizar stock de una etapa específica
   * 
   * @param stageId ID de la etapa
   * @param projectCode Código del proyecto
   * @param forceRefresh Forzar consulta fresca
   * @returns Observable con el stock y metadatos
   */
  previewStageStock(
    stageId: string, 
    projectCode: string = 'casabonita', 
    forceRefresh: boolean = false
  ): Observable<LogicwareStockPreviewResponse> {
    console.log('🌐 LogicwareService.previewStageStock llamado con:', { stageId, projectCode, forceRefresh });
    
    let params = new HttpParams()
      .set('projectCode', projectCode)
      .set('forceRefresh', forceRefresh.toString());

    const url = `${this.baseUrl}/stages/${stageId}/preview`;
    console.log('🔗 URL completa:', url);

    return this.http.get<LogicwareStockPreviewResponse>(
      url,
      { params }
    );
  }

  /**
   * Importar lotes de una etapa específica
   * 
   * @param stageId ID de la etapa
   * @param projectCode Código del proyecto
   * @param options Opciones de importación
   * @returns Observable con el resultado de la importación
   */
  importStage(
    stageId: string,
    projectCode: string = 'casabonita',
    options: LogicwareImportOptions = {}
  ): Observable<LogicwareImportResult> {
    return this.http.post<LogicwareImportResult>(
      `${this.baseUrl}/stages/${stageId}/import`,
      { projectCode, options }
    );
  }

  /**
   * Obtener estadísticas de conexión con LogicWare
   * 
   * @returns Observable con estadísticas de uso
   */
  getConnectionStats(): Observable<LogicwareConnectionStats> {
    return this.http.get<LogicwareConnectionStats>(`${this.baseUrl}/connection-stats`);
  }

  /**
   * Limpiar caché de LogicWare
   * 
   * @returns Observable con resultado de la operación
   */
  clearCache(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/clear-cache`, {});
  }
}
