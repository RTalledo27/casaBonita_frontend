import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

// ==================================================================================
// INTERFACES
// ==================================================================================

export interface LogicwareUnit {
  id: number;
  code: string;
  name: string;
  status: 'disponible' | 'reservado' | 'vendido';
  block?: string;
  lot?: string;
  area?: number;
  price?: number;
  
  // Advisor info
  advisor?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  
  // Client info
  client?: {
    id: number;
    name: string;
    document?: string;
    email?: string;
    phone?: string;
  };
  
  // Reservation info
  reservation?: {
    id: number;
    date: string;
    amount?: number;
    status?: string;
    duration_days?: number;
  };
  
  // Sale info
  sale?: {
    id: number;
    date: string;
    amount: number;
    payment_method?: string;
    contract_number?: string;
  };
  
  // Financial info
  financial?: {
    initial_payment?: number;
    monthly_payment?: number;
    num_installments?: number;
    total_amount?: number;
    down_payment_percentage?: number;
  };
  
  // Additional metadata
  created_at?: string;
  updated_at?: string;
  last_sync_at?: string;
}

export interface FullStockStatistics {
  total_units: number;
  by_status: {
    disponible?: number;
    reservado?: number;
    vendido?: number;
    [key: string]: number | undefined;
  };
  with_advisor: number;
  with_client: number;
  with_reservation: number;
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
  data: LogicwareUnit[];
  statistics: FullStockStatistics;
  cache_info: CacheInfo;
  api_info: ApiInfo;
  message?: string;
}

export interface TokenRenewalResponse {
  success: boolean;
  message: string;
  token_preview?: string;
}

export interface TokenInfoResponse {
  has_cached_token: boolean;
  cache_key: string;
}

// ==================================================================================
// SERVICE
// ==================================================================================

@Injectable({
  providedIn: 'root'
})
export class LogicwareService {
  constructor(private http: HttpClient) {}

  /**
   * Obtener stock completo de Logicware
   * Incluye: unidades, asesores, clientes, reservas, ventas, financiamiento
   * 
   * @param forceRefresh - Si es true, fuerza actualización desde API (ignora caché)
   * @returns Observable con datos completos de stock y estadísticas
   */
  getFullStock(forceRefresh: boolean = false): Observable<FullStockResponse> {
    const params = new HttpParams().set('force_refresh', forceRefresh.toString());
    
    return this.http.get<FullStockResponse>(
      API_ROUTES.LOGICWARE.FULL_STOCK,
      { params }
    );
  }

  /**
   * Renovar token de Logicware manualmente
   * Fuerza la generación de un nuevo token (ignora caché)
   * 
   * @returns Observable con resultado de renovación
   */
  renewToken(): Observable<TokenRenewalResponse> {
    return this.http.post<TokenRenewalResponse>(
      API_ROUTES.LOGICWARE.RENEW_TOKEN,
      {}
    );
  }

  /**
   * Obtener información sobre el token actual
   * Verifica si existe un token en caché
   * 
   * @returns Observable con información del token
   */
  getTokenInfo(): Observable<TokenInfoResponse> {
    return this.http.get<TokenInfoResponse>(
      API_ROUTES.LOGICWARE.TOKEN_INFO
    );
  }

  /**
   * Obtener estado de la conexión con Logicware
   * 
   * @returns Observable con estado de la conexión
   */
  getStatus(): Observable<any> {
    return this.http.get<any>(
      API_ROUTES.LOGICWARE.STATUS
    );
  }

  /**
   * Importar contratos desde Logicware
   * 
   * @param startDate - Fecha inicial (YYYY-MM-DD)
   * @param endDate - Fecha final (YYYY-MM-DD)
   * @returns Observable con resultado de importación
   */
  importContracts(startDate: string, endDate: string): Observable<any> {
    return this.http.post<any>(
      API_ROUTES.LOGICWARE.IMPORT_CONTRACTS,
      { start_date: startDate, end_date: endDate }
    );
  }
}
