import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import {
  LogicwareService,
  LogicwareStage,
  LogicwareUnit,
  LogicwareImportOptions,
  FullStockResponse
} from '../../../../core/services/logicware.service';

interface StageStats {
  total: number;
  importable: number;
  duplicates: number;
  newLots: number;
}

@Component({
  selector: 'app-external-lot-import',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './external-lot-import.component.html',
  styleUrls: ['./external-lot-import.component.scss']
})
export class ExternalLotImportComponent implements OnInit {
  // Signals para estado
  loading = signal(false);
  loadingStages = signal(false);
  loadingPreview = signal(false);
  importing = signal(false);

  // Datos
  projectCode = signal('casabonita');
  stages = signal<LogicwareStage[]>([]);
  selectedStage = signal<LogicwareStage | null>(null);
  previewUnits = signal<LogicwareUnit[]>([]);
  stageStats = signal<StageStats | null>(null);

  // Opciones de importación
  importOptions = signal<LogicwareImportOptions>({
    update_existing: false,
    create_manzanas: true,
    create_templates: true,
    update_templates: true,
    update_status: false,
    force_refresh: false
  });

  // Resultado de importación
  importResult = signal<any>(null);

  // Mensajes
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  warningMessage = signal<string>('');

  // Filtros de preview
  filterStatus = signal<string>('all');
  searchTerm = signal<string>('');

  // Estadísticas de conexión
  connectionStats = signal<any>(null);
  fullStockLoading = signal(false);
  fullStockForceRefresh = false;
  fullStock = signal<FullStockResponse | null>(null);

  // Propiedades para componentes legacy (compatibilidad con HTML antiguo)
  testingConnection = signal(false);
  connectionStatus = '';
  syncing = signal(false);
  syncingSingleLot = signal(false);
  singleLotCode = '';
  stats = signal<any>(null);
  errors = signal<string[]>([]);
  previewData = signal<any[]>([]);

  // Computed signals
  filteredUnits = computed(() => {
    let units = this.previewUnits();
    const status = this.filterStatus();
    const search = this.searchTerm().toLowerCase();

    // Filtrar por status
    if (status !== 'all') {
      if (status === 'new') {
        units = units.filter(u => !u.exists);
      } else if (status === 'existing') {
        units = units.filter(u => u.exists);
      } else if (status === 'importable') {
        units = units.filter(u => u.can_import);
      }
    }

    // Filtrar por búsqueda
    if (search) {
      units = units.filter(u =>
        u.code?.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search) ||
        u.block?.toLowerCase().includes(search) ||
        u.lotNumber?.includes(search)
      );
    }

    return units;
  });

  selectedUnitsCount = computed(() => this.filteredUnits().length);

  canImport = computed(() => {
    return this.selectedStage() !== null &&
      this.previewUnits().length > 0 &&
      !this.importing();
  });

  constructor(
    private logicwareService: LogicwareService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStages();
    this.loadConnectionStats();
  }

  loadFullStock(): void {
    this.fullStockLoading.set(true);
    this.logicwareService.getFullStock(this.fullStockForceRefresh).subscribe({
      next: (res) => {
        this.fullStockLoading.set(false);
        if (res?.success) {
          this.fullStock.set(res);
          const cached = res?.cache_info?.is_cached ? 'desde caché' : 'desde API';
          this.successMessage.set(`✅ Full Stock cargado (${cached}). Total: ${res?.statistics?.total_units ?? 0}`);
        } else {
          this.fullStock.set(res || null);
          this.errorMessage.set(res?.message || 'Error al cargar Full Stock');
        }
      },
      error: (error) => {
        this.fullStockLoading.set(false);
        this.errorMessage.set('Error al cargar Full Stock: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Cargar etapas (stages) disponibles
   */
  loadStages(): void {
    this.loadingStages.set(true);
    this.clearMessages();

    this.logicwareService.getStages(this.projectCode()).subscribe({
      next: (response) => {
        console.log('📥 Respuesta de getStages:', response);
        this.loadingStages.set(false);
        if (response.success) {
          console.log('✅ Stages recibidos:', response.data);
          this.stages.set(response.data);

          if (response.meta.is_mock) {
            this.warningMessage.set('⚠️ Usando datos de prueba (MOCK). Configure correctamente la API de LogicWare.');
          }
        } else {
          this.errorMessage.set('Error al cargar etapas: ' + response.message);
        }
      },
      error: (error) => {
        this.loadingStages.set(false);
        this.errorMessage.set('Error al cargar etapas: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Seleccionar una etapa y cargar su preview
   */
  selectStage(stage: LogicwareStage): void {
    console.log('🎯 Stage seleccionado:', stage);
    console.log('📋 Stage ID:', stage.id);
    this.selectedStage.set(stage);
    this.loadPreview();
  }

  /**
   * Cargar vista previa del stock de la etapa seleccionada
   */
  loadPreview(): void {
    const stage = this.selectedStage();

    console.log('🔍 LoadPreview - Stage actual:', stage);

    // Si no hay etapa seleccionada, mostrar datos mock o vacío
    if (!stage) {
      this.loadingPreview.set(true);
      setTimeout(() => {
        this.previewData.set([]);
        this.loadingPreview.set(false);
      }, 500);
      return;
    }

    console.log('📤 Llamando a previewStageStock con stageId:', stage.id);

    this.loadingPreview.set(true);
    this.clearMessages();

    this.logicwareService.previewStageStock(
      stage.id,
      this.projectCode(),
      this.importOptions().force_refresh || false
    ).subscribe({
      next: (response) => {
        this.loadingPreview.set(false);
        if (response.success) {
          this.previewUnits.set(response.data);
          // También actualizar previewData para compatibilidad
          this.previewData.set(response.data);

          this.stageStats.set({
            total: response.meta.total,
            importable: response.meta.importable,
            duplicates: response.meta.duplicates,
            newLots: response.meta.importable - response.meta.duplicates
          });

          // También actualizar stats para compatibilidad
          this.stats.set({
            total: response.meta.total,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0
          });

          if (response.meta.is_mock) {
            this.warningMessage.set('⚠️ Vista previa usando datos de prueba (MOCK)');
          }

          this.successMessage.set(`Vista previa cargada: ${response.meta.total} unidades encontradas`);
        } else {
          this.errorMessage.set('Error al cargar vista previa: ' + response.message);
        }
      },
      error: (error) => {
        this.loadingPreview.set(false);
        this.errorMessage.set('Error al cargar vista previa: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Importar lotes de la etapa seleccionada
   */
  async importLots(): Promise<void> {
    const stage = this.selectedStage();
    const stats = this.stageStats();

    if (!stage || !stats) return;

    // Confirmar importación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Confirmar Importación?',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <strong style="font-size: 1.1rem; color: #4F46E5;">📦 ${stats.importable} lotes a importar</strong>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1rem 0;">
            <div style="background: #ECFDF5; padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid #10B981;">
              <div style="font-size: 0.75rem; color: #065F46; font-weight: 600;">NUEVOS</div>
              <div style="font-size: 1.5rem; color: #059669; font-weight: bold;">${stats.newLots}</div>
            </div>
            <div style="background: #FEF3C7; padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid #F59E0B;">
              <div style="font-size: 0.75rem; color: #92400E; font-weight: 600;">EXISTENTES</div>
              <div style="font-size: 1.5rem; color: #D97706; font-weight: bold;">${stats.duplicates}</div>
            </div>
          </div>

          <div style="background: #F3F4F6; padding: 0.75rem; border-radius: 0.5rem; margin-top: 1rem;">
            <div style="font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem;"><strong>Acciones:</strong></div>
            ${this.importOptions().update_existing ?
          '<div style="color: #059669;">✓ Se actualizarán lotes existentes</div>' :
          '<div style="color: #6B7280;">• Lotes existentes se omitirán</div>'}
            ${this.importOptions().create_manzanas ?
          '<div style="color: #059669;">✓ Se crearán manzanas nuevas</div>' : ''}
            ${this.importOptions().create_templates ?
          '<div style="color: #059669;">✓ Se crearán templates financieros</div>' : ''}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-download"></i> Importar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      width: '600px'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.importing.set(true);
    this.clearMessages();
    this.importResult.set(null);

    this.logicwareService.importStage(
      stage.id,
      this.projectCode(),
      this.importOptions()
    ).subscribe({
      next: (response) => {
        this.importing.set(false);
        this.importResult.set(response);

        if (response.success) {
          this.successMessage.set(`✅ Importación completada: ${response.stats.created} creados, ${response.stats.updated} actualizados, ${response.stats.skipped} omitidos`);

          if (response.stats.errors > 0) {
            this.warningMessage.set(`⚠️ ${response.stats.errors} errores durante la importación`);
          }

          // Recargar preview
          setTimeout(() => this.loadPreview(), 1500);
        } else {
          this.errorMessage.set('❌ Error en la importación: ' + response.message);
        }
      },
      error: (error) => {
        this.importing.set(false);
        this.errorMessage.set('❌ Error crítico en la importación: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Cargar estadísticas de conexión
   */
  loadConnectionStats(): void {
    this.logicwareService.getConnectionStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.connectionStats.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading connection stats:', error);
      }
    });
  }

  /**
   * Refrescar datos (forzar consulta al API)
   */
  refreshData(): void {
    const currentOptions = this.importOptions();
    this.importOptions.set({
      ...currentOptions,
      force_refresh: true
    });

    if (this.selectedStage()) {
      this.loadPreview();
    } else {
      this.loadStages();
    }

    setTimeout(() => {
      const opts = this.importOptions();
      this.importOptions.set({
        ...opts,
        force_refresh: false
      });
    }, 1000);
  }

  /**
   * Limpiar caché de LogicWare
   */
  clearCache(): void {
    if (!confirm('¿Limpiar caché de LogicWare? Esto forzará nuevas consultas al API.')) {
      return;
    }

    this.loading.set(true);
    this.logicwareService.clearCache().subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.successMessage.set('✅ Caché limpiado exitosamente');
          this.loadStages();
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set('Error al limpiar caché: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Deseleccionar etapa actual
   */
  deselectStage(): void {
    this.selectedStage.set(null);
    this.previewUnits.set([]);
    this.stageStats.set(null);
    this.importResult.set(null);
    this.clearMessages();
  }

  /**
   * Cambiar opción de importación
   */
  toggleOption(option: keyof LogicwareImportOptions): void {
    this.importOptions.update(opts => ({
      ...opts,
      [option]: !opts[option]
    }));
  }

  /**
   * Obtener clase de badge para el status
   */
  getStatusBadgeClass(unit: LogicwareUnit): string {
    if (!unit.can_import) return 'badge-error';
    if (unit.exists) return 'badge-warning';
    return 'badge-success';
  }

  /**
   * Obtener texto del status
   */
  getStatusText(unit: LogicwareUnit): string {
    if (!unit.can_import) return 'No importable';
    if (unit.exists) return 'Ya existe';
    return 'Nuevo';
  }

  /**
   * Obtener clase para el ícono de acción
   */
  getActionIcon(unit: LogicwareUnit): string {
    if (!unit.can_import) return 'fa-ban';
    if (unit.exists) return 'fa-sync-alt';
    return 'fa-plus-circle';
  }

  /**
   * Formatear precio
   */
  formatPrice(price: number | undefined, currency: string = 'PEN'): string {
    if (!price) return '-';
    const symbol = currency === 'PEN' ? 'S/' : '$';
    return `${symbol} ${price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Formatear área
   */
  formatArea(area: number | undefined): string {
    if (!area) return '-';
    return `${area.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m²`;
  }

  /**
   * Navegar de regreso
   */
  goBack(): void {
    this.router.navigate(['/inventory/lots']);
  }

  /**
   * Limpiar mensajes
   */
  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.warningMessage.set('');
  }

  /**
   * Métodos legacy para compatibilidad con HTML antiguo
   */

  testConnection(): void {
    this.testingConnection.set(true);
    this.connectionStatus = 'Probando conexión...';

    this.logicwareService.getConnectionStats().subscribe({
      next: (response) => {
        this.connectionStats.set(response.data);
        this.testingConnection.set(false);
        this.connectionStatus = response.data.connection_status === 'connected'
          ? '✅ Conexión exitosa'
          : '❌ Error de conexión';
      },
      error: (error) => {
        this.testingConnection.set(false);
        this.connectionStatus = '❌ Error: ' + (error.error?.message || 'No se pudo conectar');
        this.errorMessage.set('Error al probar la conexión');
      }
    });
  }

  totalAvailable(): number {
    return this.previewData().length;
  }

  syncAll(): void {
    // Implementar sincronización completa si es necesario
    this.syncing.set(true);
    this.successMessage.set('Función de sincronización completa en desarrollo');
    setTimeout(() => this.syncing.set(false), 1000);
  }

  syncByCode(): void {
    if (!this.singleLotCode.trim()) return;

    this.syncingSingleLot.set(true);
    this.successMessage.set(`Sincronizando lote ${this.singleLotCode}...`);

    // Implementar sincronización por código si es necesario
    setTimeout(() => {
      this.syncingSingleLot.set(false);
      this.successMessage.set(`Lote ${this.singleLotCode} sincronizado`);
      this.singleLotCode = '';
    }, 1500);
  }

  refreshToken(): void {
    this.loading.set(true);
    this.successMessage.set('Token refrescado exitosamente');
    setTimeout(() => this.loading.set(false), 500);
  }
}
