import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  contracts: {
    vigente: number;
    pendiente: number;
    total: number;
  };
  lots: {
    disponible: number;
    reservado: number;
    vendido: number;
    total: number;
  };
  clients: {
    total: number;
  };
  reservations: {
    activa: number;
    convertida: number;
  };
  payments: {
    pendiente: number;
    vencido: number;
    pagado: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.URL_BACKEND}/v1`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
}
