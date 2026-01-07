import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  related_module?: string;
  related_id?: number;
  related_url?: string;
  icon?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  time_ago: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  by_priority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface PaginatedNotifications {
  current_page: number;
  data: Notification[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  // Signals reactivos
  private unreadCountSignal = signal<number>(0);
  private notificationsSignal = signal<Notification[]>([]);
  private loadingSignal = signal<boolean>(false);
  
  // Computed signals
  public unreadCount = computed(() => this.unreadCountSignal());
  public notifications = computed(() => this.notificationsSignal());
  public isLoading = computed(() => this.loadingSignal());
  public hasUnread = computed(() => this.unreadCountSignal() > 0);

  // Subject para mostrar toasts
  private toastSubject = new BehaviorSubject<Notification | null>(null);
  public toast$ = this.toastSubject.asObservable();

  // Laravel Echo instance
  private echo: any = null;
  private websocketEnabled = environment.reverb?.enabled ?? false; // ⚠️ Controlado por environment
  private pollingSubscription: Subscription | null = null;
  
  // Preferencias del usuario
  private userPreferences = {
    push: true,
    email: true,
    system: true,
    weekly: false
  };

  constructor(private http: HttpClient) {
    // NO inicializar WebSocket automáticamente
    // Se inicializará cuando el usuario inicie sesión Y Soketi esté corriendo
    this.loadUserPreferences();
  }

  /**
   * Cargar preferencias de notificaciones del usuario
   */
  private loadUserPreferences(): void {
    this.http.get<any>(`${environment.URL_BACKEND}/v1/profile/notification-preferences`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.userPreferences = response.data;
          console.log('🔔 Preferencias de notificaciones cargadas:', this.userPreferences);
          
          // Si el usuario tiene push desactivado, no inicializar WebSocket
          if (!this.userPreferences.push) {
            this.websocketEnabled = false;
            console.log('⏸️ Notificaciones push desactivadas por el usuario');
          }
        }
      },
      error: (error) => {
        console.log('⚠️ No se pudieron cargar las preferencias, usando valores por defecto');
      }
    });
  }

  /**
   * Actualizar preferencias (llamar después de guardar en el perfil)
   */
  updatePreferences(preferences: { push: boolean; email: boolean; system: boolean; weekly: boolean }): void {
    this.userPreferences = preferences;
    
    // Si desactivan push, detener WebSocket y polling
    if (!preferences.push) {
      this.websocketEnabled = false;
      this.stopPolling();
      if (this.echo) {
        this.echo.disconnect();
        this.echo = null;
      }
      console.log('⏸️ Notificaciones push desactivadas');
    } else {
      // Si activan push, reactivar
      this.websocketEnabled = true;
      console.log('✅ Notificaciones push activadas');
    }
  }

  /**
   * Inicializar WebSocket con Laravel Reverb
   */
  private initializeWebSocket(): void {
    if (!this.websocketEnabled) {
      console.log('⏸️ WebSocket deshabilitado');
      return;
    }

    // Configurar Pusher para Laravel Echo
    (window as any).Pusher = Pusher;

    // Usar configuración del environment o valores por defecto seguros
    const reverbConfig = environment.reverb || {
      key: 'qycranehfycpswjvlj7o',
      wsHost: environment.production ? 'api.casabonita.pe' : '127.0.0.1',
      wsPort: environment.production ? 443 : 8080,
      wssPort: environment.production ? 443 : 8080,
      forceTLS: environment.production,
      enabled: false, // Deshabilitado por defecto si no está en environment
    };

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: reverbConfig.key,
      wsHost: reverbConfig.wsHost,
      wsPort: reverbConfig.wsPort,
      wssPort: reverbConfig.wssPort,
      forceTLS: reverbConfig.forceTLS ?? false,
      encrypted: reverbConfig.forceTLS ?? false,
      enabledTransports: ['ws', 'wss'],
    });

    console.log('✅ WebSocket inicializado con Laravel Reverb', {
      host: reverbConfig.wsHost,
      port: reverbConfig.wsPort,
      tls: reverbConfig.forceTLS
    });
  }

  /**
   * Conectar al canal de notificaciones del usuario
   */
  connectToUserChannel(userId: number): void {
    // Inicializar WebSocket si está habilitado
    if (this.websocketEnabled && !this.echo) {
      this.initializeWebSocket();
    }

    if (!this.echo) {
      console.log('⏸️ WebSocket no disponible, usando polling');
      return;
    }

    const channelName = `notifications.${userId}`;
    console.log(`🔔 Suscribiéndose al canal: ${channelName}`);

    this.echo.channel(channelName)
      .listen('.notification.created', (notification: Notification) => {
        console.log('📩 Nueva notificación recibida:', notification);
        
        // Incrementar contador
        this.unreadCountSignal.update(count => count + 1);
        
        // Agregar a la lista de notificaciones
        this.notificationsSignal.update(notifications => [notification, ...notifications]);
        
        // Mostrar toast
        this.showToast(notification);
      });
  }

  /**
   * Desconectar del canal
   */
  disconnectFromUserChannel(userId: number): void {
    if (!this.echo) return;
    
    const channelName = `notifications.${userId}`;
    this.echo.leave(channelName);
    console.log(`🔌 Desconectado del canal: ${channelName}`);
  }

  /**
   * Iniciar polling cada 30 segundos
   */
  startPolling(): void {
    // Detener polling anterior si existe
    this.stopPolling();
    
    console.log('🔄 Iniciando polling de notificaciones cada 30 segundos');
    
    // Polling cada 30 segundos
    this.pollingSubscription = interval(30000)
      .pipe(
        startWith(0), // Ejecutar inmediatamente
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (response) => {
          this.unreadCountSignal.set(response.unread_count);
        },
        error: (error) => {
          console.error('❌ Error en polling de notificaciones:', error);
        }
      });
  }

  /**
   * Detener polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
      console.log('⏹️ Polling de notificaciones detenido');
    }
  }

  /**
   * Obtener lista de notificaciones con paginación
   */
  getNotifications(params: {
    page?: number;
    per_page?: number;
    type?: string;
    priority?: string;
    is_read?: boolean;
    related_module?: string;
  } = {}): Observable<PaginatedNotifications> {
    this.loadingSignal.set(true);
    
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedNotifications>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => {
        this.notificationsSignal.set(response.data);
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Obtener contador de no leídas
   */
  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Refrescar contador
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe(response => {
      this.unreadCountSignal.set(response.unread_count);
    });
  }

  /**
   * Marcar una notificación como leída
   */
  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSignal();
        const updated = notifications.map(n => 
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        this.notificationsSignal.set(updated);
        
        const currentCount = this.unreadCountSignal();
        if (currentCount > 0) {
          this.unreadCountSignal.set(currentCount - 1);
        }
      })
    );
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSignal();
        const updated = notifications.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }));
        this.notificationsSignal.set(updated);
        this.unreadCountSignal.set(0);
      })
    );
  }

  /**
   * Eliminar una notificación
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const notifications = this.notificationsSignal();
        const notification = notifications.find(n => n.id === id);
        
        this.notificationsSignal.set(notifications.filter(n => n.id !== id));
        
        if (notification && !notification.is_read) {
          const currentCount = this.unreadCountSignal();
          if (currentCount > 0) {
            this.unreadCountSignal.set(currentCount - 1);
          }
        }
      })
    );
  }

  /**
   * Obtener estadísticas
   */
  getStats(): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Crear notificación de prueba
   */
  createTest(data: {
    type?: string;
    priority?: string;
    title?: string;
    message?: string;
    icon?: string;
  } = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/test`, data).pipe(
      tap(() => {
        this.refreshUnreadCount();
      })
    );
  }

  /**
   * Mostrar toast notification
   */
  showToast(notification: Notification): void {
    // Respetar preferencias del usuario
    if (!this.userPreferences.push) {
      console.log('Notificaciones push desactivadas por el usuario');
      return;
    }
    
    this.toastSubject.next(notification);
    
    setTimeout(() => {
      this.toastSubject.next(null);
    }, 5000);
  }

  /**
   * Ocultar toast
   */
  hideToast(): void {
    this.toastSubject.next(null);
  }

  /**
   * Obtener clase de color según el tipo
   */
  getTypeColor(type: string): string {
    const colors = {
      'info': 'blue',
      'success': 'green',
      'warning': 'yellow',
      'error': 'red'
    };
    return colors[type as keyof typeof colors] || 'gray';
  }

  /**
   * Obtener ícono según el tipo
   */
  getTypeIcon(type: string): string {
    const icons = {
      'info': 'info',
      'success': 'check-circle',
      'warning': 'alert-triangle',
      'error': 'alert-circle'
    };
    return icons[type as keyof typeof icons] || 'bell';
  }
}