import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
interface Paginated<T> {
  data: T[];
  meta: any;
  links: any;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceDeskTicketsService {
  constructor(private http: HttpClient) { }

  private base = API_ROUTES.SERVICEDESK.TICKETS; // Debe ser '/api/service-requests'

  getDashboardStats(params: any): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(API_ROUTES.SERVICEDESK.DASHBOARD, {
        params: params,
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Lista tickets, puedes añadir filtros con params si tu API los soporta.
   */
  list(params?: any): Observable<ServiceDeskTicket[]> {
    return this.http
      .get<Paginated<ServiceDeskTicket>>(this.base, { params })
      .pipe(map((resp) => resp.data));
  }

  /**
   * Obtiene un ticket por id.
   */
  get(id: number): Observable<ServiceDeskTicket> {
    return this.http
      .get<ApiResponse<ServiceDeskTicket>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Crea un nuevo ticket.
   * Usa FormData si tienes archivos, o un objeto JSON si solo texto.
   */
  create(fd: FormData | ServiceDeskTicket): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(this.base, fd)
      .pipe(map((res) => res.data));
  }

  /**
   * Actualiza un ticket existente.
   * Usa PUT como espera el backend (Laravel resource route)
   */
  update(
    id: number,
    fd: FormData | ServiceDeskTicket
  ): Observable<ServiceDeskTicket> {
    return this.http
      .put<ApiResponse<ServiceDeskTicket>>(`${this.base}/${id}`, fd)
      .pipe(map((res) => res.data));
  }

  /**
   * Elimina un ticket.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ========== ENTERPRISE METHODS ==========

  /**
   * Assign ticket to a technician
   */
  assign(ticketId: number, userId: number): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(`${this.base}/${ticketId}/assign`, { user_id: userId })
      .pipe(map((res) => res.data));
  }

  /**
   * Change ticket status
   */
  changeStatus(ticketId: number, status: string, notes?: string): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(`${this.base}/${ticketId}/status`, { status, notes })
      .pipe(map((res) => res.data));
  }

  /**
   * Escalate a ticket
   */
  escalate(ticketId: number, reason?: string): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(`${this.base}/${ticketId}/escalate`, { reason })
      .pipe(map((res) => res.data));
  }

  /**
   * Add a comment/action to a ticket
   */
  /**
   * Add a comment/action to a ticket
   */
  addComment(ticketId: number, notes: string, actionType: string = 'comentario'): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(`${this.base}/${ticketId}/comment`, { notes, action_type: actionType })
      .pipe(map((res) => res.data));
  }

  /**
   * Get ticket actions/history
   */
  getActions(ticketId: number): Observable<any[]> {
    return this.http
      .get<{ data: any[] }>(`${this.base}/${ticketId}/actions`)
      .pipe(map((res) => res.data));
  }

  /**
   * Get available technicians for assignment
   */
  getTechnicians(): Observable<any[]> {
    // Uses existing users endpoint with role filter
    return this.http
      .get<{ data: any[] }>(`${API_ROUTES.SECURITY.USERS}`, { params: { role: 'tecnico' } })
      .pipe(map((res) => res.data || []));
  }

  // ========== SLA CONFIGURATION METHODS ==========

  /**
   * Get all SLA configurations
   */
  getSlaConfigs(): Observable<any> {
    return this.http.get<any>(`${API_ROUTES.SERVICEDESK.BASE}/sla-configs`);
  }

  /**
   * Update SLA configurations in bulk
   */
  updateSlaConfigs(configs: { id: number; response_hours: number; resolution_hours: number }[]): Observable<any> {
    return this.http.post<any>(`${API_ROUTES.SERVICEDESK.BASE}/sla-configs/bulk`, { configs });
  }

  // ========== CATEGORY METHODS ==========

  /**
   * Get all categories
   */
  getCategories(): Observable<any> {
    return this.http.get<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories`);
  }

  /**
   * Get active categories only
   */
  getActiveCategories(): Observable<any> {
    return this.http.get<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories/active`);
  }

  /**
   * Create a new category
   */
  createCategory(data: { name: string; description: string; icon: string; color: string }): Observable<any> {
    return this.http.post<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories`, data);
  }

  /**
   * Update an existing category
   */
  updateCategory(id: number, data: { name: string; description: string; icon: string; color: string }): Observable<any> {
    return this.http.put<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories/${id}`, data);
  }

  /**
   * Delete a category
   */
  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories/${id}`);
  }

  /**
   * Toggle category active status
   */
  toggleCategoryStatus(id: number): Observable<any> {
    return this.http.post<any>(`${API_ROUTES.SERVICEDESK.BASE}/categories/${id}/toggle`, {});
  }
}