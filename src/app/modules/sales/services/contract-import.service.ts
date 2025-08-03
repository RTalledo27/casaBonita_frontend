import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface ImportResponse {
  success: boolean;
  message: string;
  data?: {
    processed: number;
    errors: string[];
    import_id?: string;
  };
}

export interface ImportLog {
  import_id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  status: string;
  created_at: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContractImportService {
  private baseUrl = API_ROUTES.SALES.CONTRACT_IMPORT;

  constructor(private http: HttpClient) {}

  /**
   * Validar estructura del archivo
   */
  validateStructure(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.post<ImportResponse>(`${this.baseUrl}/validate`, formData);
  }

  /**
   * Importar contratos (síncrono)
   */
  importSync(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.post<ImportResponse>(`${this.baseUrl}`, formData);
  }

  /**
   * Importar contratos (asíncrono)
   */
  importAsync(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.post<ImportResponse>(`${this.baseUrl}/async`, formData);
  }

  /**
   * Obtener estado de importación
   */
  getImportStatus(importId: string): Observable<ImportResponse> {
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.get<ImportResponse>(`${this.baseUrl}/status/${importId}`);
  }

  /**
   * Obtener historial de importaciones
   */
  getImportHistory(): Observable<{ data: ImportLog[] }> {
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.get<{ data: ImportLog[] }>(`${this.baseUrl}/history`);
  }

  /**
   * Descargar plantilla de ejemplo con cache busting
   */
  downloadTemplate(): Observable<Blob> {
    // Agregar timestamp para evitar cache del navegador
    const timestamp = new Date().getTime();
    const url = `${this.baseUrl}/template?t=${timestamp}`;
    
    // El token interceptor se encarga de agregar automáticamente el header de autorización
    return this.http.get(url, {
      responseType: 'blob',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  // Método comentado porque la ruta /errors/{importId} no existe en el backend
  // getImportErrors(importId: string): Observable<{ data: any[] }> {
  //   return this.http.get<{ data: any[] }>(`${this.baseUrl}/errors/${importId}`);
  // }
}