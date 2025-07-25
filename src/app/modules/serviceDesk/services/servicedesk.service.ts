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
  constructor(private http: HttpClient) {}

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
   * Usa POST si tu backend lo espera así, o PATCH/PUT si cambias la convención.
   */
  update(
    id: number,
    fd: FormData | ServiceDeskTicket
  ): Observable<ServiceDeskTicket> {
    return this.http
      .post<ApiResponse<ServiceDeskTicket>>(`${this.base}/${id}`, fd)
      .pipe(map((res) => res.data));
    // Si usas PATCH:
    // return this.http.patch<ApiResponse<ServiceDeskTicket>>(`${this.base}/${id}`, fd).pipe(map((res) => res.data));
  }

  /**
   * Elimina un ticket.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}