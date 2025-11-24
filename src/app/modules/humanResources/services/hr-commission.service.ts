/**
 * HR Commission Service
 * 
 * Servicio para gestionar esquemas de comisión y sus reglas asociadas.
 * Maneja todas las operaciones CRUD para esquemas y reglas de comisión.
 * 
 * @module HrCommissionService
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

/**
 * Interface para Esquema de Comisión
 */
export interface CommissionScheme {
    id?: number;
    name: string;
    description?: string;
    effective_from?: string | null;
    effective_to?: string | null;
    is_default?: boolean;
    rules?: CommissionRule[];
}

/**
 * Interface para Regla de Comisión
 * Define los criterios y porcentaje de comisión aplicables
 */
export interface CommissionRule {
    id?: number;
    scheme_id: number;
    min_sales: number;
    max_sales?: number | null;
    term_min_months?: number | null;
    term_max_months?: number | null;
    effective_from?: string | null;
    effective_to?: string | null;
    term_group: 'short' | 'long' | 'any';
    sale_type?: 'cash' | 'financed' | 'both';
    percentage: number;
    priority?: number;
}

/**
 * Servicio para gestión de comisiones de HR
 * 
 * Proporciona métodos para:
 * - CRUD de esquemas de comisión
 * - CRUD de reglas de comisión
 */
@Injectable({ providedIn: 'root' })
export class HrCommissionService {
    /**
     * URL base para endpoints de comisiones
     * Usa la configuración del environment para adaptarse a diferentes entornos
     */
    private base = `${environment.URL_BACKEND}/v1/hr`;

    constructor(private http: HttpClient) { }

    // ==========================================
    // COMMISSION SCHEMES ENDPOINTS
    // ==========================================

    /**
     * Lista todos los esquemas de comisión
     * @returns Observable con la lista de esquemas
     */
    listSchemes(): Observable<any> {
        return this.http.get(`${this.base}/commission-schemes`, { withCredentials: true });
    }

    /**
     * Obtiene un esquema específico por ID
     * @param id - ID del esquema
     * @returns Observable con el esquema solicitado
     */
    getScheme(id: number): Observable<any> {
        return this.http.get(`${this.base}/commission-schemes/${id}`, { withCredentials: true });
    }

    /**
     * Crea un nuevo esquema de comisión
     * @param payload - Datos del nuevo esquema
     * @returns Observable con el esquema creado
     */
    createScheme(payload: Partial<CommissionScheme>): Observable<any> {
        return this.http.post(`${this.base}/commission-schemes`, payload, { withCredentials: true });
    }

    /**
     * Actualiza un esquema existente
     * @param id - ID del esquema a actualizar
     * @param payload - Datos actualizados del esquema
     * @returns Observable con el esquema actualizado
     */
    updateScheme(id: number, payload: Partial<CommissionScheme>): Observable<any> {
        return this.http.put(`${this.base}/commission-schemes/${id}`, payload, { withCredentials: true });
    }

    /**
     * Elimina un esquema de comisión
     * @param id - ID del esquema a eliminar
     * @returns Observable con resultado de la operación
     */
    deleteScheme(id: number): Observable<any> {
        return this.http.delete(`${this.base}/commission-schemes/${id}`, { withCredentials: true });
    }

    // ==========================================
    // COMMISSION RULES ENDPOINTS
    // ==========================================

    /**
     * Lista todas las reglas de comisión
     * @returns Observable con la lista de reglas
     */
    listRules(): Observable<any> {
        return this.http.get(`${this.base}/commission-rules`, { withCredentials: true });
    }

    /**
     * Crea una nueva regla de comisión
     * @param payload - Datos de la nueva regla
     * @returns Observable con la regla creada
     */
    createRule(payload: Partial<CommissionRule>): Observable<any> {
        return this.http.post(`${this.base}/commission-rules`, payload, { withCredentials: true });
    }

    /**
     * Actualiza una regla existente
     * @param id - ID de la regla a actualizar
     * @param payload - Datos actualizados de la regla
     * @returns Observable con la regla actualizada
     */
    updateRule(id: number, payload: Partial<CommissionRule>): Observable<any> {
        return this.http.put(`${this.base}/commission-rules/${id}`, payload, { withCredentials: true });
    }

    /**
     * Elimina una regla de comisión
     * @param id - ID de la regla a eliminar
     * @returns Observable con resultado de la operación
     */
    deleteRule(id: number): Observable<any> {
        return this.http.delete(`${this.base}/commission-rules/${id}`, { withCredentials: true });
    }
}
