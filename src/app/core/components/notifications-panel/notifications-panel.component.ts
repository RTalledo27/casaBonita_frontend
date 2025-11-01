import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Bell, 
  Check, 
  Trash2, 
  X,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  FileText
} from 'lucide-angular';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="relative">
      <!-- Bell Icon Button -->
      <button
        (click)="togglePanel()"
        class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        [class.bg-gray-100]="isOpen()"
        [class.dark:bg-gray-700]="isOpen()">
        <lucide-icon [name]="bellIcon" class="w-5 h-5 text-gray-600 dark:text-gray-300"></lucide-icon>
        
        <!-- Badge Counter -->
        <span
          *ngIf="notificationService.hasUnread()"
          class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div
        *ngIf="isOpen()"
        class="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ notificationService.unreadCount() }} no leída{{ notificationService.unreadCount() !== 1 ? 's' : '' }}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              *ngIf="notificationService.hasUnread()"
              (click)="markAllAsRead()"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              title="Marcar todas como leídas">
              Marcar todas
            </button>
            <button
              (click)="closePanel()"
              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <lucide-icon [name]="xIcon" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            (click)="filterType.set('all')"
            [ngClass]="{
              'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400': filterType() === 'all'
            }"
            class="px-3 py-1 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Todas
          </button>
          <button
            (click)="filterType.set('unread')"
            [ngClass]="{
              'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400': filterType() === 'unread'
            }"
            class="px-3 py-1 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            No leídas
          </button>
        </div>

        <!-- Notifications List -->
        <div class="flex-1 overflow-y-auto">
          <div *ngIf="notificationService.isLoading() && filteredNotifications().length === 0" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando...</p>
          </div>

          <div *ngIf="!notificationService.isLoading() && filteredNotifications().length === 0" class="p-8 text-center">
            <lucide-icon [img]="bellIcon" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2"></lucide-icon>
            <p class="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones</p>
          </div>

          <div *ngFor="let notification of filteredNotifications()" class="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div
              (click)="handleNotificationClick(notification)"
              [ngClass]="{
                'bg-blue-50 dark:bg-blue-900/10': !notification.is_read
              }"
              class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
              
              <div class="flex items-start gap-3">
                <!-- Icon -->
                <div
                  [ngClass]="getIconContainerClasses(notification.type)"
                  class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
                  <lucide-icon
                    [img]="getTypeIcon(notification.icon || getTypeIconName(notification.type))"
                    [ngClass]="getIconClasses(notification.type)"
                    class="w-5 h-5">
                  </lucide-icon>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4
                      [class.font-semibold]="!notification.is_read"
                      class="text-sm text-gray-900 dark:text-white">
                      {{ notification.title }}
                    </h4>
                    <button
                      (click)="deleteNotification(notification.id, $event)"
                      class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity">
                      <lucide-icon [name]="trashIcon" class="w-3 h-3 text-gray-500"></lucide-icon>
                    </button>
                  </div>
                  
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {{ notification.message }}
                  </p>
                  
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-gray-500 dark:text-gray-500">
                      {{ notification.time_ago }}
                    </span>
                    
                    <button
                      *ngIf="!notification.is_read"
                      (click)="markAsRead(notification.id, $event)"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Marcar leída
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            (click)="viewAllNotifications()"
            class="w-full text-sm text-center text-blue-600 dark:text-blue-400 hover:underline">
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      *ngIf="isOpen()"
      (click)="closePanel()"
      class="fixed inset-0 z-40"
      style="background: transparent;">
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  // Icons
  bellIcon = Bell;
  checkIcon = Check;
  trashIcon = Trash2;
  xIcon = X;
  alertTriangleIcon = AlertTriangle;
  xCircleIcon = XCircle;
  checkCircleIcon = CheckCircle;
  infoIcon = Info;
  fileTextIcon = FileText;

  // State
  isOpen = signal(false);
  filterType = signal<'all' | 'unread'>('all');

  // Filtered notifications
  filteredNotifications = computed(() => {
    const notifications = this.notificationService.notifications();
    if (this.filterType() === 'unread') {
      return notifications.filter(n => !n.is_read);
    }
    return notifications;
  });

  private subscriptions: Subscription[] = [];

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Iniciar polling
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  togglePanel(): void {
    this.isOpen.update(v => !v);
    
    // Cargar notificaciones al abrir
    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  loadNotifications(): void {
    this.notificationService.getNotifications({ per_page: 20 }).subscribe();
  }

  markAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.delete(id).subscribe();
  }

  handleNotificationClick(notification: Notification): void {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navegar si tiene URL
    if (notification.related_url) {
      this.router.navigate([notification.related_url]);
    }

    this.closePanel();
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
    this.closePanel();
  }

  getTypeColor(type: string): string {
    return this.notificationService.getTypeColor(type);
  }

  getTypeIcon(type: string): any {
    // Mapear string a iconos de Lucide (retorna el objeto de icono)
    const iconMap: { [key: string]: any } = {
      'info': Info,
      'check-circle': CheckCircle,
      'alert-triangle': AlertTriangle,
      'x-circle': XCircle,
      'file-text': FileText,
      'bell': Bell,
    };
    
    return iconMap[type] || Bell;
  }

  getTypeIconName(type: string): string {
    // Mapear tipo de notificación a nombre de icono (retorna string)
    const iconNameMap: { [key: string]: string } = {
      'info': 'info',
      'success': 'check-circle',
      'warning': 'alert-triangle',
      'error': 'x-circle',
    };
    
    return iconNameMap[type] || 'bell';
  }

  getIconContainerClasses(type: string): { [key: string]: boolean } {
    const color = this.getTypeColor(type);
    return {
      'bg-blue-100 dark:bg-blue-900/20': color === 'blue',
      'bg-green-100 dark:bg-green-900/20': color === 'green',
      'bg-yellow-100 dark:bg-yellow-900/20': color === 'yellow',
      'bg-red-100 dark:bg-red-900/20': color === 'red',
    };
  }

  getIconClasses(type: string): { [key: string]: boolean } {
    const color = this.getTypeColor(type);
    return {
      'text-blue-600 dark:text-blue-400': color === 'blue',
      'text-green-600 dark:text-green-400': color === 'green',
      'text-yellow-600 dark:text-yellow-400': color === 'yellow',
      'text-red-600 dark:text-red-400': color === 'red',
    };
  }
}
