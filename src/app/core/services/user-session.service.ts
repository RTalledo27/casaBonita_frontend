import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserSession {
  session_id: number;
  started_at: string;
  last_activity_at?: string;
  session_type: 'auto' | 'manual';
  status: 'active' | 'paused' | 'ended';
  current_duration: number;
  formatted_duration: string;
}

export interface SessionStats {
  period: string;
  start_date: string;
  end_date: string;
  stats: {
    total_sessions: number;
    total_seconds: number;
    total_hours: number;
    average_session_duration: number;
    formatted_total: string;
  };
  active_session: UserSession | null;
}

export interface SessionHistory {
  session_id: number;
  started_at: string;
  ended_at: string | null;
  session_type: 'auto' | 'manual';
  status: 'active' | 'paused' | 'ended';
  total_duration: number;
  formatted_duration: string;
  started_at_human: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private apiUrl = `${environment.URL_BACKEND}/v1/sessions`;
  
  // Signals para el estado reactivo
  private activeSessionSignal = signal<UserSession | null>(null);
  private isTrackingSignal = signal<boolean>(false);
  
  // Computed signals públicos
  public activeSession = computed(() => this.activeSessionSignal());
  public isTracking = computed(() => this.isTrackingSignal());
  public sessionDuration = computed(() => {
    const session = this.activeSessionSignal();
    if (!session || !session.formatted_duration) {
      return null; // Retornar null si no hay sesión válida
    }
    return session.formatted_duration;
  });
  public isActive = computed(() => this.activeSessionSignal()?.status === 'active');
  public isPaused = computed(() => this.activeSessionSignal()?.status === 'paused');
  
  // Heartbeat para actualizar actividad
  private heartbeatSubscription: Subscription | null = null;
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minuto
  
  // Timer para actualizar duración en tiempo real
  private timerSubscription: Subscription | null = null;
  private readonly TIMER_INTERVAL = 1000; // 1 segundo

  constructor(private http: HttpClient) {}

  /**
   * Obtener sesión activa del usuario
   */
  getActiveSession(): Observable<ApiResponse<UserSession | null>> {
    return this.http.get<ApiResponse<UserSession | null>>(`${this.apiUrl}/active`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.activeSessionSignal.set(response.data);
          this.isTrackingSignal.set(true);
          this.startHeartbeat();
          this.startTimer();
        } else {
          this.activeSessionSignal.set(null);
          this.isTrackingSignal.set(false);
          this.stopHeartbeat();
          this.stopTimer();
        }
      })
    );
  }

  /**
   * Iniciar sesión manualmente
   */
  startSession(): Observable<ApiResponse<UserSession>> {
    return this.http.post<ApiResponse<UserSession>>(`${this.apiUrl}/start`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.activeSessionSignal.set(response.data);
          this.isTrackingSignal.set(true);
          this.startHeartbeat();
          this.startTimer();
        }
      })
    );
  }

  /**
   * Finalizar sesión
   */
  endSession(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/end`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.activeSessionSignal.set(null);
          this.isTrackingSignal.set(false);
          this.stopHeartbeat();
          this.stopTimer();
        }
      })
    );
  }

  /**
   * Pausar sesión
   */
  pauseSession(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/pause`, {}).pipe(
      tap(response => {
        if (response.success && this.activeSessionSignal()) {
          const session = this.activeSessionSignal();
          if (session) {
            this.activeSessionSignal.set({
              ...session,
              status: 'paused'
            });
          }
          this.stopTimer();
        }
      })
    );
  }

  /**
   * Reanudar sesión
   */
  resumeSession(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/resume`, {}).pipe(
      tap(response => {
        if (response.success && this.activeSessionSignal()) {
          const session = this.activeSessionSignal();
          if (session) {
            this.activeSessionSignal.set({
              ...session,
              status: 'active'
            });
          }
          this.startTimer();
        }
      })
    );
  }

  /**
   * Actualizar actividad (heartbeat)
   */
  private updateActivity(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/heartbeat`, {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          const session = this.activeSessionSignal();
          if (session) {
            this.activeSessionSignal.set({
              ...session,
              current_duration: response.data.current_duration,
              formatted_duration: response.data.formatted_duration,
              last_activity_at: response.data.last_activity_at
            });
          }
        }
      })
    );
  }

  /**
   * Obtener estadísticas
   */
  getStats(period: 'today' | 'week' | 'month' | 'year' = 'today'): Observable<ApiResponse<SessionStats>> {
    return this.http.get<ApiResponse<SessionStats>>(`${this.apiUrl}/stats`, {
      params: { period }
    });
  }

  /**
   * Obtener historial de sesiones
   */
  getHistory(page: number = 1, perPage: number = 20): Observable<PaginatedResponse<SessionHistory>> {
    return this.http.get<PaginatedResponse<SessionHistory>>(`${this.apiUrl}/history`, {
      params: {
        page: page.toString(),
        per_page: perPage.toString()
      }
    });
  }

  /**
   * Iniciar heartbeat automático
   */
  private startHeartbeat(): void {
    if (this.heartbeatSubscription) {
      return; // Ya está corriendo
    }

    this.heartbeatSubscription = interval(this.HEARTBEAT_INTERVAL).subscribe(() => {
      if (this.isActive()) {
        this.updateActivity().subscribe({
          error: (error) => console.error('Error en heartbeat:', error)
        });
      }
    });
  }

  /**
   * Detener heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = null;
    }
  }

  /**
   * Iniciar timer para actualizar duración en tiempo real
   */
  private startTimer(): void {
    if (this.timerSubscription) {
      return;
    }

    // Actualizar inmediatamente al iniciar
    this.updateTimerDuration();

    this.timerSubscription = interval(this.TIMER_INTERVAL).subscribe(() => {
      this.updateTimerDuration();
    });
  }

  /**
   * Actualizar duración del timer
   */
  private updateTimerDuration(): void {
    const session = this.activeSessionSignal();
    if (session && session.status === 'active') {
      // Calcular duración basada en la diferencia entre started_at y ahora
      const startTime = new Date(session.started_at).getTime();
      const now = Date.now();
      const durationInSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      
      this.activeSessionSignal.set({
        ...session,
        current_duration: durationInSeconds,
        formatted_duration: this.formatDuration(durationInSeconds)
      });
    }
  }

  /**
   * Detener timer
   */
  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  /**
   * Formatear duración en segundos a texto legible
   */
  private formatDuration(seconds: number): string {
    // Asegurar que los segundos sean positivos
    const totalSeconds = Math.max(0, Math.floor(seconds));
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Inicializar servicio (llamar después del login)
   */
  initialize(): void {
    this.getActiveSession().subscribe({
      next: (response) => {
        console.log('📊 Sesión de tracking inicializada:', response.data);
      },
      error: (error) => {
        console.error('Error al inicializar tracking:', error);
      }
    });
  }

  /**
   * Limpiar al cerrar sesión
   */
  cleanup(): void {
    this.stopHeartbeat();
    this.stopTimer();
    this.activeSessionSignal.set(null);
    this.isTrackingSignal.set(false);
  }
}
