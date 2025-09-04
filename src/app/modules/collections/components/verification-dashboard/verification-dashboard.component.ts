import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, interval, startWith } from 'rxjs';
import { 
  CommissionVerificationService, 
  VerificationStats,
  CommissionRequiringVerification 
} from '../../services/commission-verification.service';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PusherNotificationService } from '../../services/pusher-notification.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-verification-dashboard',
  templateUrl: './verification-dashboard.component.html',
  styleUrls: ['./verification-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    BaseChartDirective
  ]
})
export class VerificationDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Datos del dashboard
  stats: VerificationStats | null = null;
  recentVerifications: CommissionRequiringVerification[] = [];
  loading = false;
  
  // Configuración de gráficos
  statusChartData: ChartConfiguration<'doughnut'>['data'] | null = null;
  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  amountChartData: ChartConfiguration<'bar'>['data'] | null = null;
  amountChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return `$${Number(value).toLocaleString('es-ES')}`;
          }
        }
      }
    }
  };
  
  // Métricas calculadas
  get verificationRate(): number {
    if (!this.stats) return 0;
    const total = this.stats.total_pending + this.stats.total_verified + this.stats.total_failed;
    return total > 0 ? (this.stats.total_verified / total) * 100 : 0;
  }
  
  get pendingAmount(): number {
    return this.stats?.pending_amount || 0;
  }
  
  get verifiedAmount(): number {
    return this.stats?.verified_amount || 0;
  }
  
  constructor(
    private commissionVerificationService: CommissionVerificationService,
    private pusherNotificationService: PusherNotificationService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.setupAutoRefresh();
    this.setupRealtimeUpdates();
    this.setupRealTimeUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura la actualización automática cada 5 minutos
   */
  private setupAutoRefresh(): void {
    interval(300000) // 5 minutos
      .pipe(
        startWith(0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadDashboardData();
      });
  }
  
  /**
   * Configura las actualizaciones en tiempo real
   */
  private setupRealtimeUpdates(): void {
    this.commissionVerificationService.verificationsUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        if (updated) {
          this.loadDashboardData();
        }
      });
  }

  /**
   * Configura las actualizaciones en tiempo real con Pusher
   */
  private setupRealTimeUpdates(): void {
    console.log('🔄 Configurando actualizaciones en tiempo real...');
    
    // Escuchar actualizaciones de verificaciones (siempre disponible)
    this.commissionVerificationService.getVerificationsUpdateObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔔 Actualización de verificaciones recibida');
        this.loadDashboardData();
      });
    
    // Escuchar notificaciones de verificación (solo si Pusher está disponible)
    if (this.pusherNotificationService.isNotificationsAvailable()) {
      console.log('📡 Configurando notificaciones Pusher...');
      this.pusherNotificationService.getVerificationUpdates()
        .pipe(takeUntil(this.destroy$))
        .subscribe(update => {
          if (update) {
            console.log('🔔 Notificación Pusher recibida:', update);
            // Actualizar estadísticas en tiempo real
            this.updateStatsFromNotification(update);
            // Recargar datos completos
            this.loadDashboardData();
          }
        });
    } else {
      console.log('⚠️ Pusher no disponible, usando solo actualizaciones manuales');
      // En modo fallback, configurar actualización automática más frecuente
      this.setupFallbackRefresh();
    }
  }
  
  /**
   * Carga todos los datos del dashboard
   */
  loadDashboardData(): void {
    console.log('🔄 Iniciando carga de datos del dashboard...');
    this.loading = true;
    
    // Cargar estadísticas
    console.log('📊 Solicitando estadísticas de verificación...');
    this.commissionVerificationService.getVerificationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('✅ Estadísticas recibidas:', stats);
          this.stats = stats;
          this.updateCharts();
          this.loading = false;
          console.log('🎯 Carga de estadísticas completada exitosamente');
        },
        error: (error) => {
          console.error('❌ Error loading stats:', error);
          console.error('📋 Detalles del error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          this.showError('Error al cargar estadísticas');
          this.loading = false;
        }
      });
    
    // Cargar verificaciones recientes
    console.log('📋 Cargando verificaciones recientes...');
    this.loadRecentVerifications();
  }
  
  /**
   * Carga las verificaciones más recientes
   */
  private loadRecentVerifications(): void {
    console.log('📋 Solicitando verificaciones recientes...');
    this.commissionVerificationService.getCommissionsRequiringVerification({
      per_page: 5,
      page: 1
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Verificaciones recientes recibidas:', response);
          this.recentVerifications = response.data;
          console.log('📊 Total de verificaciones recientes:', this.recentVerifications.length);
        },
        error: (error) => {
          console.error('❌ Error loading recent verifications:', error);
          console.error('📋 Detalles del error de verificaciones:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
        }
      });
  }
  
  /**
   * Actualiza los gráficos con los datos actuales
   */
  private updateCharts(): void {
    if (!this.stats) return;
    
    // Gráfico de estado (doughnut)
    this.statusChartData = {
      labels: ['Pendientes', 'Verificadas', 'Fallidas'],
      datasets: [{
        data: [
          this.stats.total_pending,
          this.stats.total_verified,
          this.stats.total_failed
        ],
        backgroundColor: [
          '#fbbf24', // yellow-400
          '#10b981', // green-500
          '#ef4444'  // red-500
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
    
    // Gráfico de montos (bar)
    this.amountChartData = {
      labels: ['Pendiente', 'Verificado'],
      datasets: [{
        label: 'Monto ($)',
        data: [this.stats.pending_amount, this.stats.verified_amount],
        backgroundColor: [
          '#fbbf24', // yellow-400
          '#10b981'  // green-500
        ],
        borderColor: [
          '#f59e0b', // yellow-500
          '#059669'  // green-600
        ],
        borderWidth: 1
      }]
    };
  }
  
  /**
   * Procesa verificaciones automáticas
   */
  processAutomaticVerifications(): void {
    this.loading = true;
    
    this.commissionVerificationService.processAutomaticVerifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccess(`Se procesaron ${response.processed_count || 0} verificaciones automáticas`);
          this.loadDashboardData();
        },
        error: (error) => {
          console.error('Error processing automatic verifications:', error);
          this.showError('Error al procesar verificaciones automáticas');
          this.loading = false;
        }
      });
  }
  
  /**
   * Refresca manualmente los datos
   */
  refreshData(): void {
    console.log('🔄 Refresh manual iniciado por el usuario');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
      this.loadDashboardData();
      this.showInfo('Datos actualizados');
      console.log('✅ Refresh completado exitosamente');
    } catch (error) {
      console.error('❌ Error durante el refresh:', error);
      this.showError('Error al actualizar los datos');
    }
  }
  
  /**
   * Obtiene el texto del estado de verificación
   */
  getStatusText(status: string): string {
    return this.commissionVerificationService.getVerificationStatusText(status);
  }
  
  /**
   * Obtiene la clase CSS del estado de verificación
   */
  getStatusClass(status: string): string {
    return this.commissionVerificationService.getVerificationStatusClass(status);
  }
  
  /**
   * Obtiene el color del indicador de tendencia
   */
  getTrendColor(value: number): string {
    if (value > 80) return 'text-green-600';
    if (value > 60) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  /**
   * Obtiene el ícono de tendencia
   */
  getTrendIcon(value: number): string {
    if (value > 80) return 'trending_up';
    if (value > 60) return 'trending_flat';
    return 'trending_down';
  }
  
  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return amount.toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    });
  }
  
  /**
   * Formatea un porcentaje
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  /**
   * Muestra mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
  
  /**
   * Muestra mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  /**
   * Muestra mensaje informativo
   */
  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Actualiza las estadísticas basado en una notificación
   */
  private updateStatsFromNotification(update: any): void {
    if (!this.stats) return;
    
    // Actualizar contadores según el estado
    if (update.verification_status === 'verified') {
      this.stats.total_pending = Math.max(0, this.stats.total_pending - 1);
      this.stats.total_verified += 1;
    } else if (update.verification_status === 'failed') {
      this.stats.total_pending = Math.max(0, this.stats.total_pending - 1);
      this.stats.total_failed += 1;
    }
    
    // Actualizar gráficos
    this.updateCharts();
  }

  /**
   * Configura refresh automático cuando Pusher no está disponible
   */
  private setupFallbackRefresh(): void {
    console.log('🔄 Configurando refresh automático de fallback...');
    // Actualización más frecuente cuando no hay notificaciones en tiempo real
    interval(60000) // 1 minuto en lugar de 5
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('⏰ Refresh automático de fallback ejecutado');
        this.loadDashboardData();
      });
  }

  /**
   * Obtiene el estado de conexión de notificaciones
   */
  isNotificationsConnected(): boolean {
    return this.pusherNotificationService.isConnected();
  }

  /**
   * Reconecta las notificaciones
   */
  reconnectNotifications(): void {
    console.log('🔄 Intentando reconectar notificaciones...');
    this.pusherNotificationService.reconnect();
    // Forzar actualización después de intentar reconectar
    setTimeout(() => {
      this.loadDashboardData();
    }, 2000);
  }
}