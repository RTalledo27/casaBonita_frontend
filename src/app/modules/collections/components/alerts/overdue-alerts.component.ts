import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { LucideAngularModule, AlertTriangle, Bell, Settings, Plus, Edit, Trash2, Eye, Clock, CheckCircle, X, Filter } from 'lucide-angular';
import { AlertsService } from '../../services/alerts.service';
import { Alert, AlertConfiguration, AlertSummary, AlertFilters } from '../../models/alert-configuration';

@Component({
  selector: 'app-overdue-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Alertas de Vencimiento</h1>
          <p class="text-gray-600 mt-1">Gestión de alertas automáticas y notificaciones de cuentas vencidas</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="showConfigModal = true"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <lucide-angular [img]="Settings" class="w-4 h-4"></lucide-angular>
            <span>Configurar</span>
          </button>
          <button 
            (click)="refreshAlerts()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <lucide-angular [img]="Bell" class="w-4 h-4"></lucide-angular>
            <span>{{ isLoading() ? 'Actualizando...' : 'Actualizar' }}</span>
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      @if (alertSummary(); as summary) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-red-100 p-3 rounded-lg">
                <lucide-angular [img]="AlertTriangle" class="w-6 h-6 text-red-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p class="text-2xl font-bold text-red-600">{{ summary.active_alerts }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-yellow-100 p-3 rounded-lg">
                <lucide-angular [img]="Clock" class="w-6 h-6 text-yellow-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Pendientes</p>
                <p class="text-2xl font-bold text-yellow-600">{{ summary.pending_alerts }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-green-100 p-3 rounded-lg">
                <lucide-angular [img]="CheckCircle" class="w-6 h-6 text-green-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Resueltas Hoy</p>
                <p class="text-2xl font-bold text-green-600">{{ summary.resolved_today }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center space-x-3">
              <div class="bg-blue-100 p-3 rounded-lg">
                <lucide-angular [img]="Bell" class="w-6 h-6 text-blue-600"></lucide-angular>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total del Mes</p>
                <p class="text-2xl font-bold text-blue-600">{{ summary.total_month }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form [formGroup]="filtersForm" class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select 
              formControlName="status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="acknowledged">Reconocida</option>
              <option value="resolved">Resuelta</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select 
              formControlName="priority"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              formControlName="alert_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="overdue">Vencimiento</option>
              <option value="upcoming_due">Próximo Vencimiento</option>
              <option value="payment_reminder">Recordatorio de Pago</option>
              <option value="escalation">Escalamiento</option>
            </select>
          </div>
          <button 
            type="button"
            (click)="clearFilters()"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
        </form>
      </div>

      <!-- Alerts List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Cargando alertas...</span>
          </div>
        } @else {
          <div class="divide-y divide-gray-200">
            @for (alert of filteredAlerts(); track alert.alert_id) {
              <div class="p-6 hover:bg-gray-50">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-4">
                    <div [class]="getAlertIconClass(alert.priority, alert.status) + ' p-2 rounded-lg'">
                      <lucide-angular [img]="getAlertIcon(alert.alert_type)" class="w-5 h-5 text-white"></lucide-angular>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-1">
                        <h4 class="text-lg font-medium text-gray-900">{{ alert.title }}</h4>
                        <span [class]="getPriorityClass(alert.priority) + ' px-2 py-1 rounded-full text-xs font-medium'">
                          {{ getPriorityLabel(alert.priority) }}
                        </span>
                        <span [class]="getStatusClass(alert.status) + ' px-2 py-1 rounded-full text-xs font-medium'">
                          {{ getStatusLabel(alert.status) }}
                        </span>
                      </div>
                      <p class="text-gray-600 mb-2">{{ alert.description }}</p>
                      <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Cuenta: {{ alert.account_receivable_id }}</span>
                        <span>Creada: {{ alert.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                        @if (alert.due_date) {
                          <span>Vence: {{ alert.due_date | date:'dd/MM/yyyy' }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    @if (alert.status === 'pending') {
                      <button 
                        (click)="acknowledgeAlert(alert)"
                        class="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        title="Reconocer alerta"
                      >
                        Reconocer
                      </button>
                      <button 
                        (click)="resolveAlert(alert)"
                        class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        title="Resolver alerta"
                      >
                        Resolver
                      </button>
                    }
                    @if (alert.status === 'acknowledged') {
                      <button 
                        (click)="resolveAlert(alert)"
                        class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        title="Resolver alerta"
                      >
                        Resolver
                      </button>
                    }
                    <button 
                      (click)="viewAlertDetails(alert)"
                      class="p-1 text-blue-600 hover:text-blue-800 rounded"
                      title="Ver detalles"
                    >
                      <lucide-angular [img]="Eye" class="w-4 h-4"></lucide-angular>
                    </button>
                    @if (alert.status !== 'resolved') {
                      <button 
                        (click)="cancelAlert(alert)"
                        class="p-1 text-red-600 hover:text-red-800 rounded"
                        title="Cancelar alerta"
                      >
                        <lucide-angular [img]="X" class="w-4 h-4"></lucide-angular>
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @empty {
              <div class="p-12 text-center text-gray-500">
                <lucide-angular [img]="Bell" class="w-12 h-12 text-gray-300 mx-auto mb-4"></lucide-angular>
                <p class="text-lg font-medium">No hay alertas</p>
                <p class="text-sm">No se encontraron alertas con los filtros seleccionados</p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Configuration Modal -->
      @if (showConfigModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Configuración de Alertas</h3>
                <button 
                  (click)="showConfigModal = false"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <lucide-angular [img]="X" class="w-6 h-6"></lucide-angular>
                </button>
              </div>
            </div>
            <div class="p-6">
              <form [formGroup]="configForm" (ngSubmit)="saveConfiguration()">
                <div class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Configuración</label>
                    <input
                      type="text"
                      formControlName="name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Alertas de Vencimiento Estándar"
                    >
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Alerta</label>
                      <select 
                        formControlName="alert_type"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="overdue">Vencimiento</option>
                        <option value="upcoming_due">Próximo Vencimiento</option>
                        <option value="payment_reminder">Recordatorio de Pago</option>
                        <option value="escalation">Escalamiento</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                      <select 
                        formControlName="priority"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Días antes del vencimiento</label>
                      <input
                        type="number"
                        formControlName="days_before_due"
                        min="0"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Días después del vencimiento</label>
                      <input
                        type="number"
                        formControlName="days_after_due"
                        min="0"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Monto mínimo</label>
                    <input
                      type="number"
                      formControlName="min_amount"
                      step="0.01"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    >
                  </div>

                  <div class="space-y-3">
                    <label class="block text-sm font-medium text-gray-700">Opciones</label>
                    <div class="space-y-2">
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          formControlName="auto_escalate"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        >
                        <span class="ml-2 text-sm text-gray-700">Escalamiento automático</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          formControlName="send_email"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        >
                        <span class="ml-2 text-sm text-gray-700">Enviar notificación por email</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          formControlName="send_sms"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        >
                        <span class="ml-2 text-sm text-gray-700">Enviar notificación por SMS</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          formControlName="is_active"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        >
                        <span class="ml-2 text-sm text-gray-700">Configuración activa</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    type="button"
                    (click)="showConfigModal = false"
                    class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    [disabled]="configForm.invalid || isSavingConfig()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {{ isSavingConfig() ? 'Guardando...' : 'Guardar Configuración' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class OverdueAlertsComponent implements OnInit, OnDestroy {
  private readonly alertsService = inject(AlertsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Icons
  readonly AlertTriangle = AlertTriangle;
  readonly Bell = Bell;
  readonly Settings = Settings;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly X = X;
  readonly Filter = Filter;

  // Signals
  isLoading = signal(false);
  isSavingConfig = signal(false);
  alerts = signal<Alert[]>([]);
  alertSummary = signal<AlertSummary | null>(null);

  // Modal states
  showConfigModal = false;

  // Forms
  filtersForm: FormGroup;
  configForm: FormGroup;

  // Computed values
  filteredAlerts = computed(() => {
    const alerts = this.alerts();
    const filters = this.filtersForm.value;
    
    return alerts.filter(alert => {
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.priority && alert.priority !== filters.priority) return false;
      if (filters.alert_type && alert.alert_type !== filters.alert_type) return false;
      return true;
    });
  });

  constructor() {
    this.filtersForm = this.fb.group({
      status: [''],
      priority: [''],
      alert_type: ['']
    });

    this.configForm = this.fb.group({
      name: ['', Validators.required],
      alert_type: ['overdue', Validators.required],
      priority: ['medium', Validators.required],
      days_before_due: [3],
      days_after_due: [0],
      min_amount: [0],
      auto_escalate: [false],
      send_email: [true],
      send_sms: [false],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadAlerts();
    this.loadAlertSummary();
    this.setupAutoRefresh();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoRefresh(): void {
    // Auto-refresh every 2 minutes
    interval(120000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadAlerts()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private setupFilters(): void {
    this.filtersForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Filters are applied via computed signal
      });
  }

  loadAlerts() {
    this.isLoading.set(true);
    
    const filters: AlertFilters = {
      limit: 50,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    return this.alertsService.getActiveAlerts(filters)
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (response) => {
            this.alerts.set(response.data);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading alerts:', error);
            this.isLoading.set(false);
          }
        })
      );
  }

  loadAlertSummary(): void {
    this.alertsService.getAlertSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.alertSummary.set(response.data);
        },
        error: (error) => {
          console.error('Error loading alert summary:', error);
        }
      });
  }

  refreshAlerts(): void {
    this.loadAlerts();
    this.loadAlertSummary();
  }

  clearFilters(): void {
    this.filtersForm.reset();
  }

  acknowledgeAlert(alert: Alert): void {
    this.alertsService.acknowledgeAlert(alert.alert_id.toString(), {
      notes: 'Alerta reconocida desde el dashboard'
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadAlerts();
        this.loadAlertSummary();
      },
      error: (error) => {
        console.error('Error acknowledging alert:', error);
      }
    });
  }

  resolveAlert(alert: Alert): void {
    const resolution = prompt('Ingrese la resolución de la alerta:');
    if (resolution) {
      this.alertsService.resolveAlert(alert.alert_id.toString(), {
        resolution,
        notes: 'Alerta resuelta desde el dashboard'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAlerts();
          this.loadAlertSummary();
        },
        error: (error) => {
          console.error('Error resolving alert:', error);
        }
      });
    }
  }

  cancelAlert(alert: Alert): void {
    if (confirm('¿Está seguro de cancelar esta alerta?')) {
      this.alertsService.cancelAlert(alert.alert_id.toString(), {
        reason: 'Cancelada desde el dashboard'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAlerts();
          this.loadAlertSummary();
        },
        error: (error) => {
          console.error('Error cancelling alert:', error);
        }
      });
    }
  }

  viewAlertDetails(alert: Alert): void {
    // This would typically open a detailed modal or navigate to a detail page
    console.log('View alert details:', alert);
  }

  saveConfiguration(): void {
    if (this.configForm.invalid) return;

    this.isSavingConfig.set(true);
    const configData = this.configForm.value;

    this.alertsService.createConfiguration(configData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showConfigModal = false;
          this.configForm.reset();
          this.isSavingConfig.set(false);
          // Optionally reload configurations or show success message
        },
        error: (error: any) => {
           console.error('Error creating configuration:', error);
           this.isSavingConfig.set(false);
         }
      });
  }

  // Helper methods
  getAlertIcon(alertType: string): any {
    const icons: { [key: string]: any } = {
      'overdue': AlertTriangle,
      'upcoming_due': Clock,
      'payment_reminder': Bell,
      'escalation': AlertTriangle
    };
    return icons[alertType] || AlertTriangle;
  }

  getAlertIconClass(priority: string, status: string): string {
    if (status === 'resolved') return 'bg-green-500';
    if (status === 'cancelled') return 'bg-gray-500';
    
    const classes: { [key: string]: string } = {
      'high': 'bg-red-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-blue-500'
    };
    return classes[priority] || 'bg-gray-500';
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-blue-100 text-blue-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'active': 'bg-red-100 text-red-800',
      'acknowledged': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Activa',
      'acknowledged': 'Reconocida',
      'resolved': 'Resuelta',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }
}