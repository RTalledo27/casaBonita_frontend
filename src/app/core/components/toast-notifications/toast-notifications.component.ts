import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, Info, AlertTriangle, XCircle, Bell, FileText } from 'lucide-angular';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Toast Container -->
    <div class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      <div
        *ngIf="currentToast"
        [class]="'pointer-events-auto w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-out ' + (isClosing ? 'animate-slide-out' : 'animate-slide-in')">
        
        <!-- Progress Bar -->
        <div class="h-1 bg-gray-100 dark:bg-gray-700">
          <div
            class="h-full transition-all duration-[5000ms] ease-linear"
            [class]="'bg-' + getTypeColor(currentToast.type) + '-500'"
            [style.width.%]="progress">
          </div>
        </div>

        <div class="p-4">
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              [class]="'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-' + getTypeColor(currentToast.type) + '-100 dark:bg-' + getTypeColor(currentToast.type) + '-900/20'">
              <lucide-icon
                [img]="getTypeIcon(currentToast.icon || currentToast.type)"
                [class]="'w-5 h-5 text-' + getTypeColor(currentToast.type) + '-600 dark:text-' + getTypeColor(currentToast.type) + '-400'">
              </lucide-icon>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ currentToast.title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ currentToast.message }}
              </p>
              
              <!-- Action Button -->
              <button
                *ngIf="currentToast.related_url"
                (click)="handleAction()"
                [class]="'text-xs font-medium mt-2 text-' + getTypeColor(currentToast.type) + '-600 dark:text-' + getTypeColor(currentToast.type) + '-400 hover:underline'">
                Ver detalles →
              </button>
            </div>

            <!-- Close Button -->
            <button
              (click)="close()"
              class="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <lucide-icon [img]="xIcon" class="w-4 h-4 text-gray-500"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slide-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
    
    .animate-slide-out {
      animation: slide-out 0.3s ease-in;
    }
  `]
})
export class ToastNotificationsComponent implements OnInit, OnDestroy {
  // Icons
  xIcon = X;
  checkCircleIcon = CheckCircle;
  infoIcon = Info;
  alertTriangleIcon = AlertTriangle;
  xCircleIcon = XCircle;
  bellIcon = Bell;
  fileTextIcon = FileText;
  currentToast: Notification | null = null;
  progress = 100;
  isClosing = false;
  
  private subscription?: Subscription;
  private autoHideTimeout?: any;
  private closeTimeout?: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.toast$.subscribe(notification => {
      if (notification) {
        // Limpiar timeouts anteriores si hay una nueva notificación
        if (this.autoHideTimeout) {
          clearTimeout(this.autoHideTimeout);
        }
        // Nueva notificación entrante
        this.isClosing = false;
        this.currentToast = notification;
        this.startProgress();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

  private startProgress(): void {
    this.progress = 100;
    this.stopProgress();
    
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
    
    const duration = 5000; // 5 segundos
    
    // Usar timeout en lugar de interval para más precisión
    this.autoHideTimeout = setTimeout(() => {
      this.closeWithAnimation();
    }, duration);
    
    // Animar la barra de progreso con CSS transition
    setTimeout(() => {
      this.progress = 0;
    }, 10);
  }

  private stopProgress(): void {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = undefined;
    }
    this.progress = 100;
  }

  close(): void {
    this.closeWithAnimation();
  }

  private closeWithAnimation(): void {
    if (this.isClosing) return; // Evitar múltiples cierres
    
    this.isClosing = true;
    
    // Esperar a que termine la animación antes de limpiar
    this.closeTimeout = setTimeout(() => {
      this.currentToast = null;
      this.isClosing = false;
    }, 300); // Duración de la animación
  }

  handleAction(): void {
    if (this.currentToast?.related_url) {
      // TODO: Implementar navegación
      console.log('Navigate to:', this.currentToast.related_url);
    }
    this.close();
  }

  getTypeColor(type: string): string {
    return this.notificationService.getTypeColor(type);
  }

  getTypeIcon(type: string): any {
    const iconMap: Record<string, any> = {
      'info': this.infoIcon,
      'success': this.checkCircleIcon,
      'warning': this.alertTriangleIcon,
      'error': this.xCircleIcon,
      'bell': this.bellIcon,
      'check-circle': this.checkCircleIcon,
      'alert-triangle': this.alertTriangleIcon,
      'x-circle': this.xCircleIcon,
      'file-text': this.fileTextIcon
    };
    return iconMap[type] || this.bellIcon;
  }
}
