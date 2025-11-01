import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  department?: string;
  position?: string;
  avatar?: string;
  created_at: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  created_at: string;
  metadata?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.URL_BACKEND}/v1/profile`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener perfil del usuario
   */
  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(this.apiUrl);
  }

  /**
   * Actualizar perfil del usuario
   */
  updateProfile(data: { first_name: string; last_name: string; phone?: string; address?: string }): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(this.apiUrl, data);
  }

  /**
   * Cambiar contraseña
   */
  changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/change-password`, data);
  }

  /**
   * Obtener preferencias de notificaciones
   */
  getNotificationPreferences(): Observable<ApiResponse<{ email: boolean; push: boolean; system: boolean; weekly: boolean }>> {
    return this.http.get<ApiResponse<{ email: boolean; push: boolean; system: boolean; weekly: boolean }>>(`${this.apiUrl}/notification-preferences`);
  }

  /**
   * Actualizar preferencias de notificaciones
   */
  updateNotificationPreferences(preferences: { email: boolean; push: boolean; system: boolean; weekly: boolean }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/notification-preferences`, preferences);
  }

  /**
   * Obtener actividad reciente
   */
  getActivity(limit: number = 20): Observable<ApiResponse<ActivityLog[]>> {
    return this.http.get<ApiResponse<ActivityLog[]>>(`${this.apiUrl}/activity`, {
      params: { limit: limit.toString() }
    });
  }
}
