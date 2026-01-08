import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Echo from 'laravel-echo';
import { environment } from 'src/environments/environment';

interface WebhookNotification {
  messageId: string;
  eventType: string;
  eventTimestamp: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  data?: any;
  timestamp: string;
}

@Component({
  selector: 'app-webhook-notifications',
  template: `
    <div class="webhook-notifications-container">
      <div 
        *ngFor="let notification of notifications" 
        class="notification-toast"
        [ngClass]="'notification-' + notification.type"
        [@slideIn]>
        
        <div class="notification-icon">
          <i [ngClass]="getIcon(notification.type)"></i>
        </div>
        
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-event">{{ formatEventType(notification.eventType) }}</span>
            <span class="notification-time">{{ formatTime(notification.eventTimestamp) }}</span>
          </div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        
        <button 
          class="notification-close" 
          (click)="removeNotification(notification.messageId)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .webhook-notifications-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .notification-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .notification-info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .notification-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .notification-error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .notification-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    .notification-success .notification-icon {
      color: #10b981;
    }

    .notification-info .notification-icon {
      color: #3b82f6;
    }

    .notification-warning .notification-icon {
      color: #f59e0b;
    }

    .notification-error .notification-icon {
      color: #ef4444;
    }

    .notification-content {
      flex: 1;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .notification-event {
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .notification-time {
      font-size: 11px;
      color: #6b7280;
    }

    .notification-message {
      font-size: 14px;
      color: #374151;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      font-size: 16px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .notification-close:hover {
      color: #6b7280;
    }
  `],
  animations: [
    // Agregar animaciones de Angular si es necesario
  ]
})
export class WebhookNotificationsComponent implements OnInit, OnDestroy {
  notifications: WebhookNotification[] = [];
  private echoSubscription?: Subscription;
  private echo: any;

  ngOnInit() {
    this.initializeWebSocketConnection();
  }

  ngOnDestroy() {
    if (this.echoSubscription) {
      this.echoSubscription.unsubscribe();
    }
    
    if (this.echo) {
      this.echo.disconnect();
    }
  }

  private initializeWebSocketConnection() {
    try {
      // Configurar Laravel Echo (si no está ya configurado globalmente)
      const Pusher = (window as any).Pusher;
      
      this.echo = new Echo({
        broadcaster: 'pusher',
        key: environment.pusher.key,
        cluster: environment.pusher.cluster,
        forceTLS: true,
        encrypted: true
      });

      // Escuchar canal de webhooks
      this.echo.channel('webhooks')
        .listen('.webhook.processed', (event: WebhookNotification) => {
          console.log('📥 Webhook notification received:', event);
          this.addNotification(event);
        });

      console.log('✅ WebSocket connection established for webhooks');
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  }

  private addNotification(notification: WebhookNotification) {
    // Agregar al inicio del array
    this.notifications.unshift(notification);

    // Limitar a 5 notificaciones visibles
    if (this.notifications.length > 5) {
      this.notifications = this.notifications.slice(0, 5);
    }

    // Auto-remover después de 8 segundos
    setTimeout(() => {
      this.removeNotification(notification.messageId);
    }, 8000);

    // Reproducir sonido de notificación (opcional)
    this.playNotificationSound(notification.type);
  }

  removeNotification(messageId: string) {
    this.notifications = this.notifications.filter(
      n => n.messageId !== messageId
    );
  }

  getIcon(type: string): string {
    const icons = {
      success: 'fas fa-check-circle',
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle'
    };
    return icons[type as keyof typeof icons] || 'fas fa-bell';
  }

  formatEventType(eventType: string): string {
    const labels: { [key: string]: string } = {
      'sales.process.completed': 'Venta Completada',
      'separation.process.completed': 'Separación Completada',
      'payment.created': 'Pago Registrado',
      'schedule.created': 'Cronograma Actualizado',
      'unit.updated': 'Lote Actualizado',
      'unit.created': 'Nuevo Lote',
      'proforma.created': 'Proforma Creada'
    };
    return labels[eventType] || eventType;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) {
      return 'Justo ahora';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else {
      return date.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  private playNotificationSound(type: string) {
    // Solo reproducir sonido para eventos importantes
    if (type === 'success' || type === 'error') {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(err => {
        // Ignorar errores si el audio no está disponible
        console.debug('Audio playback failed:', err);
      });
    }
  }
}
