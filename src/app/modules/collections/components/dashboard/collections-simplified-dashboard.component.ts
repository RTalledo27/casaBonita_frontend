import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, of } from 'rxjs';
import { startWith, switchMap, catchError, tap } from 'rxjs/operators';
import { 
  LucideAngularModule, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Activity
} from 'lucide-angular';
import { CollectionsSimplifiedService, CollectionsSimplifiedDashboard } from '../../services/collections-simplified.service';
import { PaymentSchedule } from '../../models/payment-schedule';

@Component({
  selector: 'app-collections-simplified-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard de Cronogramas</h1>
          <p class="text-gray-600 mt-1">Gestión simplificada de cronogramas de pagos</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="refreshDashboard()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="ActivityIcon" class="w-4 h-4"></lucide-angular>
            <span>{{ isLoading() ? 'Actualizando...' : 'Actualizar' }}</span>
          </button>
          <button 
            routerLink="/collections/generator"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <lucide-angular [img]="FileTextIcon" class="w-4 h-4"></lucide-angular>
            <span>Generar Cronograma</span>
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Contracts -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Contratos Activos</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ dashboardData()?.total_contracts || 0 }}</p>
              <p class="text-xs text-gray-500 mt-1">Con cronogramas</p>
            </div>
            <div class="bg-blue-500 p-3 rounded-lg">
              <lucide-angular [img]="FileTextIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Pending Amount -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Monto Pendiente</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ formatCurrency(dashboardData()?.pending_amount || 0) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">Por cobrar</p>
            </div>
            <div class="bg-yellow-500 p-3 rounded-lg">
              <lucide-angular [img]="ClockIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Overdue Amount -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Monto Vencido</p>
              <p class="text-2xl font-bold text-red-600 mt-1">
                {{ formatCurrency(dashboardData()?.overdue_amount || 0) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ dashboardData()?.overdue_count || 0 }} cuotas</p>
            </div>
            <div class="bg-red-500 p-3 rounded-lg">
              <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
          </div>
        </div>

        <!-- Payment Rate -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Tasa de Pago</p>
              <p class="text-2xl font-bold text-green-600 mt-1">
                {{ (dashboardData()?.payment_rate || 0).toFixed(1) }}%
              </p>
              <div class="flex items-center mt-1">
                <lucide-angular [img]="TrendingUpIcon" class="w-3 h-3 text-green-500 mr-1"></lucide-angular>
                <span class="text-xs text-green-600">Este mes</span>
              </div>
            </div>
            <div class="bg-green-500 p-3 rounded-lg">
              <lucide-angular [img]="CheckCircleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Schedules and Overdue -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Payment Schedules -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Cronogramas Recientes</h3>
            <button 
              routerLink="/collections/schedules"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          @if (recentSchedules().length > 0) {
            <div class="space-y-3">
              @for (schedule of recentSchedules(); track schedule.schedule_id) {
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">Contrato #{{ schedule.contract_id }}</p>
                    <p class="text-sm text-gray-600">Vence: {{ formatDate(schedule.due_date) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-gray-900">{{ formatCurrency(schedule.amount) }}</p>
                    <span [class]="getStatusClass(schedule.status)">
                      {{ getStatusLabel(schedule.status) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-500">
              <lucide-angular [img]="CalendarIcon" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-angular>
              <p>No hay cronogramas recientes</p>
            </div>
          }
        </div>

        <!-- Overdue Schedules -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Cuotas Vencidas</h3>
            <button 
              routerLink="/collections/installments"
              [queryParams]="{ status: 'vencido' }"
              class="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Ver todas
            </button>
          </div>
          @if (overdueSchedules().length > 0) {
            <div class="space-y-3">
              @for (schedule of overdueSchedules(); track schedule.schedule_id) {
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p class="font-medium text-gray-900">Contrato #{{ schedule.contract_id }}</p>
                    <p class="text-sm text-red-600">Vencido: {{ formatDate(schedule.due_date) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-red-600">{{ formatCurrency(schedule.amount) }}</p>
                    <button 
                      (click)="markAsPaid(schedule)"
                      class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Marcar Pagado
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-500">
              <lucide-angular [img]="CheckCircleIcon" class="w-8 h-8 mx-auto mb-2 text-green-400"></lucide-angular>
              <p class="text-green-600">No hay cuotas vencidas</p>
            </div>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            routerLink="/collections/generator"
            class="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <lucide-angular [img]="FileTextIcon" class="w-5 h-5 text-blue-600"></lucide-angular>
            <div class="text-left">
              <p class="font-medium text-gray-900">Generar Cronograma</p>
              <p class="text-sm text-gray-600">Crear nuevo cronograma de pagos</p>
            </div>
          </button>
          
          <button 
            routerLink="/collections/installments"
            class="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <lucide-angular [img]="DollarSignIcon" class="w-5 h-5 text-green-600"></lucide-angular>
            <div class="text-left">
              <p class="font-medium text-gray-900">Gestionar Cuotas</p>
              <p class="text-sm text-gray-600">Marcar pagos y gestionar cuotas</p>
            </div>
          </button>
          
          <button 
            routerLink="/collections/reports"
            class="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <lucide-angular [img]="FileTextIcon" class="w-5 h-5 text-purple-600"></lucide-angular>
            <div class="text-left">
              <p class="font-medium text-gray-900">Ver Reportes</p>
              <p class="text-sm text-gray-600">Reportes de estado de pagos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CollectionsSimplifiedDashboardComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  ActivityIcon = Activity;

  // Signals
  dashboardData = signal<CollectionsSimplifiedDashboard | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed values
  recentSchedules = computed(() => this.dashboardData()?.recent_schedules || []);
  overdueSchedules = computed(() => this.dashboardData()?.overdue_schedules || []);

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadDashboardData()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.collectionsService.getDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error.set('Error al cargar los datos del dashboard');
          this.isLoading.set(false);
          return of(null);
        }),
        tap((data) => {
          if (data) {
            this.dashboardData.set(data);
          }
          this.isLoading.set(false);
        })
      );
  }

  refreshDashboard() {
    this.loadDashboardData().subscribe();
  }

  markAsPaid(schedule: PaymentSchedule) {
    const today = new Date().toISOString().split('T')[0];
    
    this.collectionsService.markPaymentPaid(schedule.schedule_id, {
      payment_date: today,
      amount_paid: schedule.amount,
      payment_method: 'transfer',
      notes: 'Marcado como pagado desde dashboard'
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error marking payment as paid:', error);
        this.error.set('Error al marcar el pago como pagado');
      }
    });
  }

  formatCurrency(amount: number): string {
    const currency = this.dashboardData()?.currency || 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full';
      case 'vencido':
        return 'text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full';
      case 'pendiente':
      default:
        return 'text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }
}