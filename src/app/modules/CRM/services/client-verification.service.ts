import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VerificationRequest {
  type: 'email' | 'phone';
  value: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data: { verification_id: number; expires_at: string; delivery_to?: string };
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
  data: { client_id: number; type: 'email' | 'phone'; value: string };
}

@Injectable({ providedIn: 'root' })
export class ClientVerificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.URL_BACKEND}/v1/crm`;

  request(clientId: number, payload: VerificationRequest): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/clients/${clientId}/verifications/request`, payload);
  }

  confirm(clientId: number, verificationId: number, code: string): Observable<ConfirmResponse> {
    return this.http.post<ConfirmResponse>(`${this.baseUrl}/clients/${clientId}/verifications/confirm`, {
      verification_id: verificationId,
      code
    });
  }

  resend(clientId: number, verificationId: number): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/clients/${clientId}/verifications/resend`, {
      verification_id: verificationId
    });
  }

  requestAnon(payload: VerificationRequest & { relay_email?: string }): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/verifications/request-anon`, payload);
  }

  confirmAnon(verificationId: number, code: string): Observable<{ success: boolean; message: string; data: { type: 'email'|'phone'; value: string } }> {
    return this.http.post<{ success: boolean; message: string; data: { type: 'email'|'phone'; value: string } }>(`${this.baseUrl}/verifications/confirm-anon`, {
      verification_id: verificationId,
      code
    });
  }
}
