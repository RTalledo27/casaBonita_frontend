import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, CheckCircle, Info, AlertTriangle, XCircle, FileText, Check, Trash2, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-angular';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <lucide-icon [img]="bellIcon" class="w-6 h-6 text-blue-600 dark:text-blue-400"></lucide-icon>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ unreadCount() }} sin leer de {{ totalNotifications() }} totales
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3">
              <button
                (click)="markAllAsRead()"
                [disabled]="unreadCount() === 0"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <lucide-icon [img]="checkIcon" class="w-4 h-4"></lucide-icon>
                Marcar todas como leídas
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="mt-6 flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1 relative">
              <lucide-icon [img]="searchIcon" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                placeholder="Buscar notificaciones..."
                class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- Type Filter -->
            <div class="flex items-center gap-2">
              <lucide-icon [img]="filterIcon" class="w-5 h-5 text-gray-400"></lucide-icon>
              <select
                [(ngModel)]="selectedType"
                (change)="onFilterChange()"
                class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Todos los tipos</option>
                <option value="info">Información</option>
                <option value="success">Éxito</option>
                <option value="warning">Advertencia</option>
                <option value="error">Error</option>
              </select>
            </div>

            <!-- Status Filter -->
            <select
              [(ngModel)]="selectedStatus"
              (change)="onFilterChange()"
              class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">Todas</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídas</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          <!-- Loading State -->
          <div *ngIf="isLoading() && filteredNotifications().length === 0" class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && filteredNotifications().length === 0" class="p-12 text-center">
            <div class="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <lucide-icon [img]="bellIcon" class="w-8 h-8 text-gray-400"></lucide-icon>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay notificaciones
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ searchQuery || selectedType !== 'all' || selectedStatus !== 'all' 
                ? 'No se encontraron notificaciones con los filtros aplicados' 
                : 'Aún no tienes notificaciones' }}
            </p>
          </div>

          <!-- Notifications -->
          <div *ngIf="filteredNotifications().length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              *ngFor="let notification of filteredNotifications(); trackBy: trackByNotificationId"
              [ngClass]="{
                'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group': true,
                'bg-blue-50 dark:bg-blue-900/10': !notification.is_read
              }">
              
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div [class]="getIconContainerClasses(notification.type)">
                  <lucide-icon
                    [img]="getTypeIcon(notification.icon || notification.type)"
                    [class]="getIconClasses(notification.type)">
                  </lucide-icon>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ notification.title }}
                        </h4>
                        <span
                          *ngIf="!notification.is_read"
                          class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full">
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {{ notification.message }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {{ notification.time_ago }}
                      </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        *ngIf="!notification.is_read"
                        (click)="markAsRead(notification.id, $event)"
                        title="Marcar como leída"
                        class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <lucide-icon [img]="checkIcon" class="w-4 h-4"></lucide-icon>
                      </button>
                      <button
                        (click)="deleteNotification(notification.id, $event)"
                        title="Eliminar"
                        class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <lucide-icon [img]="trashIcon" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages() > 1" class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {{ ((currentPage() - 1) * perPage) + 1 }} - {{ Math.min(currentPage() * perPage, totalNotifications()) }} de {{ totalNotifications() }}
              </p>
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <lucide-icon [img]="chevronLeftIcon" class="w-5 h-5"></lucide-icon>
                </button>
                <span class="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                  Página {{ currentPage() }} de {{ totalPages() }}
                </span>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <lucide-icon [img]="chevronRightIcon" class="w-5 h-5"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsPageComponent implements OnInit {
  // Icons
  bellIcon = Bell;
  checkCircleIcon = CheckCircle;
  infoIcon = Info;
  alertTriangleIcon = AlertTriangle;
  xCircleIcon = XCircle;
  fileTextIcon = FileText;
  checkIcon = Check;
  trashIcon = Trash2;
  filterIcon = Filter;
  searchIcon = Search;
  chevronLeftIcon = ChevronLeft;
  chevronRightIcon = ChevronRight;

  // Filters
  searchQuery = '';
  selectedType = 'all';
  selectedStatus = 'all';

  // Pagination
  currentPage = signal(1);
  perPage = 20;
  totalNotifications = signal(0);
  totalPages = computed(() => Math.ceil(this.totalNotifications() / this.perPage));

  // State
  isLoading = signal(true);
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  // Computed
  filteredNotifications = computed(() => {
    let result = this.notifications();

    // Filter by search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.message.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      result = result.filter(n => n.type === this.selectedType);
    }

    // Filter by status
    if (this.selectedStatus === 'unread') {
      result = result.filter(n => !n.is_read);
    } else if (this.selectedStatus === 'read') {
      result = result.filter(n => n.is_read);
    }

    return result;
  });

  Math = Math;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getNotifications({ 
      page: this.currentPage(),
      per_page: this.perPage 
    }).subscribe({
      next: (response) => {
        this.notifications.set(response.data);
        this.totalNotifications.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.unread_count);
      }
    });
  }

  onSearchChange(): void {
    // Reload notifications when search changes
    this.currentPage.set(1);
    this.loadNotifications();
  }

  onFilterChange(): void {
    // Reload notifications when filters change
    this.currentPage.set(1);
    this.loadNotifications();
  }

  markAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notifs = this.notifications();
        const index = notifs.findIndex(n => n.id === id);
        if (index !== -1) {
          notifs[index].is_read = true;
          this.notifications.set([...notifs]);
          this.unreadCount.update(count => count - 1);
        }
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        const notifs = this.notifications().map(n => ({ ...n, is_read: true }));
        this.notifications.set(notifs);
        this.unreadCount.set(0);
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.delete(id).subscribe({
      next: () => {
        const notifs = this.notifications().filter(n => n.id !== id);
        this.notifications.set(notifs);
        this.totalNotifications.update(count => count - 1);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.loadNotifications();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      this.loadNotifications();
    }
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

  getIconContainerClasses(type: string): string {
    const classes = 'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center';
    const typeClasses: Record<string, string> = {
      'info': 'bg-blue-100 dark:bg-blue-900/20',
      'success': 'bg-green-100 dark:bg-green-900/20',
      'warning': 'bg-yellow-100 dark:bg-yellow-900/20',
      'error': 'bg-red-100 dark:bg-red-900/20'
    };
    return `${classes} ${typeClasses[type] || 'bg-gray-100 dark:bg-gray-700'}`;
  }

  getIconClasses(type: string): string {
    const classes = 'w-5 h-5';
    const typeClasses: Record<string, string> = {
      'info': 'text-blue-600 dark:text-blue-400',
      'success': 'text-green-600 dark:text-green-400',
      'warning': 'text-yellow-600 dark:text-yellow-400',
      'error': 'text-red-600 dark:text-red-400'
    };
    return `${classes} ${typeClasses[type] || 'text-gray-600 dark:text-gray-400'}`;
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}
