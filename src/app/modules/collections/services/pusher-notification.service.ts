import { Injectable, OnDestroy, Inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommissionVerificationService } from './commission-verification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

// Declaración para Pusher (se debe instalar: npm install pusher-js)
declare const Pusher: any;

export interface NotificationMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  data?: any;
}

export interface VerificationNotification {
  commission_id: number;
  employee_name: string;
  client_name: string;
  verification_status: string;
  amount: number;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PusherNotificationService implements OnDestroy {
  private pusher: any;
  private channel: any;
  private destroy$ = new Subject<void>();
  
  // Subjects para notificaciones
  private notifications$ = new BehaviorSubject<NotificationMessage[]>([]);
  private verificationUpdates$ = new BehaviorSubject<VerificationNotification | null>(null);
  
  // Estado de conexión
  private connected$ = new BehaviorSubject<boolean>(false);
  private pusherAvailable = false;
  private fallbackMode = false;
  
  // Configuración
  private readonly PUSHER_CONFIG = {
    key: environment.pusher.key,
    cluster: environment.pusher.cluster,
    encrypted: true,
    authEndpoint: '/api/v1/pusher/auth'
  };
  
  constructor(
    private commissionVerificationService: CommissionVerificationService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar
  ) {
    this.initializePusher();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
  
  /**
   * Inicializa la conexión con Pusher
   */
  private initializePusher(): void {
    try {
      // Verificar si Pusher está disponible
      if (typeof Pusher === 'undefined') {
        console.warn('⚠️ Pusher no está disponible. Activando modo fallback.');
        this.enableFallbackMode();
        return;
      }
      
      // Verificar si la configuración es válida
      if (!this.PUSHER_CONFIG.key || this.PUSHER_CONFIG.key === 'your-pusher-app-key') {
        console.warn('⚠️ Pusher no está configurado correctamente. Activando modo fallback.');
        this.enableFallbackMode();
        return;
      }
      
      this.pusherAvailable = true;
      console.log('🔌 Inicializando conexión Pusher...');
      
      this.pusher = new Pusher(this.PUSHER_CONFIG.key, {
        cluster: this.PUSHER_CONFIG.cluster,
        encrypted: this.PUSHER_CONFIG.encrypted,
        authEndpoint: this.PUSHER_CONFIG.authEndpoint
      });
      
      // Eventos de conexión
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Conectado a Pusher');
        this.connected$.next(true);
        this.fallbackMode = false;
        this.subscribeToChannels();
      });
      
      this.pusher.connection.bind('disconnected', () => {
        console.log('❌ Desconectado de Pusher');
        this.connected$.next(false);
        this.enableFallbackMode();
      });
      
      this.pusher.connection.bind('error', (error: any) => {
        console.error('❌ Error de conexión Pusher:', error);
        this.connected$.next(false);
        this.enableFallbackMode();
      });
      
      // Timeout para detectar problemas de conexión
      setTimeout(() => {
        if (!this.connected$.value && this.pusherAvailable) {
          console.warn('⏰ Timeout de conexión Pusher. Activando modo fallback.');
          this.enableFallbackMode();
        }
      }, 10000); // 10 segundos
      
    } catch (error) {
      console.error('❌ Error inicializando Pusher:', error);
      this.enableFallbackMode();
    }
  }
  
  /**
   * Suscribe a los canales de notificaciones
   */
  private subscribeToChannels(): void {
    try {
      // Canal para verificaciones de comisiones
      this.channel = this.pusher.subscribe('commission-verifications');
      
      // Evento: Nueva verificación procesada
      this.channel.bind('verification.processed', (data: VerificationNotification) => {
        this.handleVerificationProcessed(data);
      });
      
      // Evento: Verificación fallida
      this.channel.bind('verification.failed', (data: VerificationNotification) => {
        this.handleVerificationFailed(data);
      });
      
      // Evento: Verificación automática completada
      this.channel.bind('verification.automatic.completed', (data: any) => {
        this.handleAutomaticVerificationCompleted(data);
      });
      
      // Evento: Pago de cliente recibido
      this.channel.bind('payment.received', (data: any) => {
        this.handlePaymentReceived(data);
      });
      
      console.log('Suscrito a canales de notificaciones');
      
    } catch (error) {
      console.error('Error suscribiendo a canales:', error);
    }
  }
  
  /**
   * Maneja notificación de verificación procesada
   */
  private handleVerificationProcessed(data: VerificationNotification): void {
    const notification: NotificationMessage = {
      id: `verification-${data.commission_id}-${Date.now()}`,
      type: 'success',
      title: 'Verificación Completada',
      message: `Comisión #${data.commission_id} de ${data.employee_name} ha sido verificada exitosamente`,
      timestamp: new Date(),
      data
    };
    
    this.addNotification(notification);
    this.verificationUpdates$.next(data);
    
    // Notificar al servicio de verificaciones para actualizar datos
    this.commissionVerificationService.triggerVerificationsUpdate();
    
    // Mostrar snackbar
    this.showSnackbar(notification.message, 'success');
  }
  
  /**
   * Maneja notificación de verificación fallida
   */
  private handleVerificationFailed(data: VerificationNotification): void {
    const notification: NotificationMessage = {
      id: `verification-failed-${data.commission_id}-${Date.now()}`,
      type: 'error',
      title: 'Verificación Fallida',
      message: `Error en verificación de comisión #${data.commission_id}: ${data.message}`,
      timestamp: new Date(),
      data
    };
    
    this.addNotification(notification);
    this.verificationUpdates$.next(data);
    
    // Notificar al servicio de verificaciones
    this.commissionVerificationService.triggerVerificationsUpdate();
    
    // Mostrar snackbar de error
    this.showSnackbar(notification.message, 'error');
  }
  
  /**
   * Maneja notificación de verificación automática completada
   */
  private handleAutomaticVerificationCompleted(data: any): void {
    const notification: NotificationMessage = {
      id: `auto-verification-${Date.now()}`,
      type: 'info',
      title: 'Verificación Automática',
      message: `Se procesaron ${data.processed_count} verificaciones automáticas`,
      timestamp: new Date(),
      data
    };
    
    this.addNotification(notification);
    
    // Notificar al servicio de verificaciones
    this.commissionVerificationService.triggerVerificationsUpdate();
    
    // Mostrar snackbar informativo
    this.showSnackbar(notification.message, 'info');
  }
  
  /**
   * Maneja notificación de pago recibido
   */
  private handlePaymentReceived(data: any): void {
    const notification: NotificationMessage = {
      id: `payment-received-${data.payment_id}-${Date.now()}`,
      type: 'info',
      title: 'Pago Recibido',
      message: `Nuevo pago de ${data.client_name} por $${data.amount.toLocaleString()}`,
      timestamp: new Date(),
      data
    };
    
    this.addNotification(notification);
    
    // Mostrar snackbar
    this.showSnackbar(notification.message, 'info');
  }
  
  /**
   * Agrega una notificación a la lista
   */
  private addNotification(notification: NotificationMessage): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Mantener solo las últimas 50
    this.notifications$.next(updatedNotifications);
  }
  
  /**
   * Muestra un snackbar con el mensaje
   */
  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = {
      success: ['success-snackbar'],
      error: ['error-snackbar'],
      info: ['info-snackbar']
    };
    
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: panelClass[type]
    });
  }
  
  /**
   * Obtiene el observable de notificaciones
   */
  getNotifications() {
    return this.notifications$.asObservable();
  }
  
  /**
   * Obtiene el observable de actualizaciones de verificación
   */
  getVerificationUpdates() {
    return this.verificationUpdates$.asObservable();
  }
  
  /**
   * Obtiene el estado de conexión
   */
  getConnectionStatus() {
    return this.connected$.asObservable();
  }
  
  /**
   * Marca una notificación como leída
   */
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    this.notifications$.next(updatedNotifications);
  }
  
  /**
   * Limpia todas las notificaciones
   */
  clearAllNotifications(): void {
    this.notifications$.next([]);
  }
  
  /**
   * Obtiene el número de notificaciones no leídas
   */
  getUnreadCount(): number {
    return this.notifications$.value.filter(n => !n.read).length;
  }
  
  /**
   * Activa el modo fallback cuando Pusher no está disponible
   */
  private enableFallbackMode(): void {
    console.log('🔄 Activando modo fallback para notificaciones');
    this.fallbackMode = true;
    this.connected$.next(false);
    
    // En modo fallback, simular que estamos "conectados" para la UI
    // pero sin funcionalidad en tiempo real
    console.log('ℹ️ Modo fallback activo: Las notificaciones en tiempo real están deshabilitadas');
  }

  /**
   * Verifica si las notificaciones están disponibles (Pusher o fallback)
   */
  isNotificationsAvailable(): boolean {
    return this.pusherAvailable || this.fallbackMode;
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    if (this.fallbackMode) {
      return false; // En modo fallback, mostrar como desconectado
    }
    return this.connected$.value;
  }

  /**
   * Reconecta a Pusher
   */
  reconnect(): void {
    console.log('🔄 Intentando reconectar...');
    
    if (this.fallbackMode && !this.pusherAvailable) {
      console.log('🔄 Reintentando inicialización de Pusher...');
      this.initializePusher();
      return;
    }
    
    if (this.pusher && this.pusherAvailable) {
      try {
        this.pusher.disconnect();
        setTimeout(() => {
          this.pusher.connect();
        }, 1000);
      } catch (error) {
        console.error('❌ Error al reconectar:', error);
        this.enableFallbackMode();
      }
    }
  }
  
  /**
   * Desconecta de Pusher
   */
  disconnect(): void {
    console.log('🔌 Desconectando Pusher...');
    
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe('commission-verifications');
    }
    
    if (this.pusher) {
      try {
        this.pusher.disconnect();
      } catch (error) {
        console.error('❌ Error al desconectar:', error);
      }
    }
    
    this.connected$.next(false);
  }
  
  /**
   * Simula una notificación (para testing)
   */
  simulateNotification(type: 'success' | 'error' | 'info' = 'info'): void {
    const notification: NotificationMessage = {
      id: `test-${Date.now()}`,
      type,
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación de prueba del sistema',
      timestamp: new Date()
    };
    
    this.addNotification(notification);
    this.showSnackbar(notification.message, type);
  }
}