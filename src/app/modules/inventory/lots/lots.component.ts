import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ColumnDef } from '../../../shared/components/shared-table/shared-table.component';
import { Edit, Eye, LucideAngularModule, Plus, Trash2, Upload, Moon, Sun } from 'lucide-angular';
import { BehaviorSubject, take, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Lot } from '../models/lot';
import { Manzana } from '../models/manzana';
import { StreetType } from '../models/street-type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { EchoService, LotStatusUpdate } from '../../../core/services/echo.service';
import { LotService, LotFilters } from '../services/lot.service';
import { ManzanasService } from '../services/manzanas.service';
import { StreetTypeService } from '../services/street-type.service';
import { SharedDeleteComponent } from '../../../shared/components/shared-delete/shared-delete.component';

import { ThemeService } from '../../../core/services/theme.service';
@Component({
  selector: 'app-lots',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    SharedDeleteComponent,

  ],
  templateUrl: './lots.component.html',
  styleUrl: './lots.component.scss',
})
export class LotsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private lotsSubject = new BehaviorSubject<Lot[]>([]);
  lots$ = this.lotsSubject.asObservable();

  lots: Lot[] = [];
  filterText = '';
  statusFilter = '';
  manzanaFilter: number | null = null;
  streetTypeFilter: number | null = null;

  // Filtros avanzados
  minPrice = '';
  maxPrice = '';
  minArea = '';
  maxArea = '';
  showAdvancedFilters = false;

  // Opciones para los filtros
  manzanas: Manzana[] = [];
  streetTypes: StreetType[] = [];
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'disponible', label: 'Disponible' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'bloqueado', label: 'Bloqueado' },
    { value: 'en_proceso', label: 'En Proceso' }
  ];

  private filterOptionsLoaded = false;
  private lastFilters: LotFilters = {};
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  idField = 'lot_id';

  showDeleteModal = false;
  selectedItemId: number | null = null;
  selectedItemName = '';

  // Current user for lock ownership
  currentUserId: number = 0;

  // Lock modal
  showLockModal = false;
  lockTargetLot: Lot | null = null;
  lockReason = '';

  // Pagination
  pagination = {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  };
  loading = false;
  isLoading = signal(false);

  columns: ColumnDef[] = [
    /*
      "street_type": {
                "street_type_id": 1,
                "name": "Av."
            },
  */
    { value: (r) => r.manzana?.name, header: 'inventory.lots.manzana' },
    { value: (r) => r.street_type?.name, header: 'inventory.lots.streetType' },
    { field: 'num_lot', header: 'inventory.lots.numLot' },
    { field: 'area_m2', header: 'inventory.lots.areaM2', align: 'right' },
    {
      field: 'total_price',
      header: 'inventory.lots.totalPrice',
      align: 'right',
    },
    { field: 'status', header: 'inventory.lots.status.label' },
  ];
  plus = Plus;
  eye = Eye;
  edit = Edit;
  trash = Trash2;
  upload = Upload;

  constructor(
    private lotService: LotService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private authService: AuthService,
    private echoService: EchoService,
    private manzanasService: ManzanasService,
    private streetTypeService: StreetTypeService,
    public themeService: ThemeService
  ) { }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 0;

    this.loadFilterOptions();
    this.loadLots();
    this.setupSearchDebounce();
    this.subscribeToLotUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pagination.current_page = 1;
        this.loadLots();
      });
  }

  private areFiltersEqual(filters1: LotFilters, filters2: LotFilters): boolean {
    return JSON.stringify(filters1) === JSON.stringify(filters2);
  }

  loadFilterOptions() {
    if (this.filterOptionsLoaded) {
      return;
    }

    // Cargar manzanas
    this.manzanasService.list().subscribe({
      next: (manzanas) => {
        this.manzanas = manzanas;
      },
      error: (error) => {
        console.error('Error loading manzanas:', error);
      }
    });

    // Cargar tipos de calle
    this.streetTypeService.list().subscribe({
      next: (streetTypes) => {
        this.streetTypes = streetTypes;
        this.filterOptionsLoaded = true;
      },
      error: (error) => {
        console.error('Error loading street types:', error);
      }
    });
  }

  canEdit() {
    return this.authService.hasPermission('inventory.lots.update');
  }



  loadLots(): void {
    const filters: LotFilters = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page,
      status: this.statusFilter || undefined,
      manzana_id: this.manzanaFilter || undefined,
      street_type_id: this.streetTypeFilter || undefined,
      search: this.filterText || undefined,
      min_price: this.minPrice ? Number(this.minPrice) : undefined,
      max_price: this.maxPrice ? Number(this.maxPrice) : undefined,
      min_area: this.minArea ? Number(this.minArea) : undefined,
      max_area: this.maxArea ? Number(this.maxArea) : undefined
    };

    // Generar clave de caché
    const cacheKey = JSON.stringify(filters);
    const cachedData = this.cache.get(cacheKey);

    // Verificar si hay datos en caché válidos
    if (cachedData && (Date.now() - cachedData.timestamp) < this.CACHE_DURATION) {
      this.lotsSubject.next(cachedData.data.data);
      this.pagination = {
        current_page: cachedData.data.current_page,
        last_page: cachedData.data.last_page,
        per_page: cachedData.data.per_page,
        total: cachedData.data.total
      };
      return;
    }

    // Evitar llamadas innecesarias si los filtros no han cambiado
    if (this.areFiltersEqual(filters, this.lastFilters) && this.lotsSubject.value.length > 0) {
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.lastFilters = { ...filters };




    this.lotService.paginate(filters).subscribe({
      next: (response) => {
        // Guardar en caché
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });

        const data = response.data ?? [];
        const meta = response.meta ?? {};
        const current = meta.current_page ?? 1;
        const lastPage = meta.last_page ?? 1;
        const perPage = 15; // Valor fijo basado en la respuesta de la API
        const total = lastPage * perPage; // Calculamos el total aproximado

        this.lots = data;
        this.lotsSubject.next(data);

        this.pagination = {
          current_page: current,
          per_page: perPage,
          total: total,
          last_page: lastPage
        };

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading lots:', error);
        const mockLots = this.generateMockLots();
        this.lots = mockLots;
        this.lotsSubject.next(mockLots);
        this.pagination = {
          current_page: 1,
          per_page: 15,
          total: 496,
          last_page: Math.ceil(496 / 15)
        };
        this.toast.show('Error al cargar los lotes', 'error');
        this.loading = false;
      }
    });
  }

  private generateMockLots(): Lot[] {
    const mockLots: Lot[] = [];
    const currentPage = this.pagination.current_page;
    const itemsPerPage = this.pagination.per_page;
    const startIndex = (currentPage - 1) * itemsPerPage;

    for (let i = 0; i < itemsPerPage; i++) {
      const lotNumber = startIndex + i + 1;
      if (lotNumber <= 496) {
        mockLots.push({
          lot_id: lotNumber,
          manzana_id: Math.floor(Math.random() * 10) + 1,
          street_type_id: Math.floor(Math.random() * 3) + 1,
          num_lot: parseInt(`${lotNumber.toString().padStart(3, '0')}`),
          area_m2: Math.floor(Math.random() * 500) + 200,
          total_price: Math.floor(Math.random() * 100000) + 50000,
          currency: 'USD',
          status: ['disponible', 'reservado', 'vendido'][Math.floor(Math.random() * 3)] as 'disponible' | 'reservado' | 'vendido',
          manzana: {
            manzana_id: Math.floor(Math.random() * 10) + 1,
            name: `Manzana ${Math.ceil(lotNumber / 20)}`
          },
          street_type: {
            street_type_id: Math.floor(Math.random() * 3) + 1,
            name: ['Av.', 'Calle', 'Jr.'][Math.floor(Math.random() * 3)]
          }
        });
      }
    }
    return mockLots;
  }

  onCreate() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  onEdit(id: number) {
    this.router.navigate([id, 'edit'], { relativeTo: this.route });
  }

  onView(id: number): void {
    this.router.navigate(['inventory/lots', id]);
  }

  /* onDelete(id: number) {
    if (!confirm('Delete?')) return;
    this.lotService.delete(id).subscribe(() => {
      this.toast.show('common.deleted', 'success');
      this.lotService
        .list()
        .subscribe((list: any) => this.lotsSubject.next(list));
    });
  }*/

  onDelete(id: number) {
    this.onAskDelete(id);
  }

  onAskDelete(id: number) {
    this.lots$.pipe(take(1)).subscribe((lots) => {
      const item = lots.find((l) => l.lot_id === id);
      this.selectedItemId = id;
      this.selectedItemName = item ? `Lote ${item.num_lot}` : 'este registro';
      this.showDeleteModal = true;
    });
  }

  deleteConfirmed() {
    if (this.selectedItemId !== null) {
      this.lotService.delete(this.selectedItemId).subscribe(() => {
        this.toast.show('common.deleted', 'success');
        this.loadLots();
        this.showDeleteModal = false;
      });
    }
  }

  canCreate() {
    return this.authService.hasPermission('inventory.lots.store');
  }

  canImport() {
    return this.authService.hasPermission('inventory.lots.store');
  }

  openImportModal() {
    this.router.navigate(['/inventory/lots/import']);
  }

  openExternalImport() {
    this.router.navigate(['/inventory/lots/external-import']);
  }

  // Filter methods
  onSearch() {
    this.searchSubject.next(this.filterText);
  }

  onFilterChange() {
    // Resetear a la primera página al cambiar filtros
    this.pagination.current_page = 1;
    this.loadLots();
  }

  onStreetTypeFilterChange() {
    this.pagination.current_page = 1;
    this.loadLots();
  }

  clearFilters() {
    this.filterText = '';
    this.statusFilter = '';
    this.manzanaFilter = null;
    this.streetTypeFilter = null;
    this.minPrice = '';
    this.maxPrice = '';
    this.minArea = '';
    this.maxArea = '';
    this.pagination.current_page = 1;
    // Limpiar caché al limpiar filtros
    this.cache.clear();
    this.loadLots();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onAdvancedFilterChange() {
    this.pagination.current_page = 1;
    this.loadLots();
  }

  // ======== Real-time lot status updates ========
  private subscribeToLotUpdates(): void {
    this.echoService.getLotStatusUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: LotStatusUpdate) => {
        this.handleLotStatusUpdate(update);
      });
  }

  private handleLotStatusUpdate(update: LotStatusUpdate): void {
    // Update the lot in the current list in real-time
    const index = this.lots.findIndex(l => l.lot_id === update.lot_id);
    if (index !== -1) {
      this.lots[index] = {
        ...this.lots[index],
        status: update.status as any,
        locked_by: update.locked_by,
        lock_reason: update.lock_reason,
        locked_by_user: update.locked_by_name ? { id: update.locked_by!, name: update.locked_by_name } : null
      };
      // Update the subject too
      this.lotsSubject.next([...this.lots]);
    }

    // Show appropriate toast notification
    if (update.status === 'en_proceso' && update.locked_by !== this.currentUserId) {
      this.toast.show(
        `Lote #${update.num_lot} (Mz. ${update.manzana_name}) ha sido bloqueado por ${update.locked_by_name}: ${update.lock_reason}`,
        'info'
      );
    } else if (update.previous_status === 'en_proceso' && update.status === 'disponible') {
      this.toast.show(
        `Lote #${update.num_lot} (Mz. ${update.manzana_name}) ha sido liberado y está disponible nuevamente`,
        'info'
      );
    }

    // Invalidate cache since data changed
    this.cache.clear();
  }

  // ======== Lock / Unlock methods ========
  openLockModal(lot: Lot): void {
    this.lockTargetLot = lot;
    this.lockReason = 'Proceso de venta en curso';
    this.showLockModal = true;
  }

  closeLockModal(): void {
    this.showLockModal = false;
    this.lockTargetLot = null;
    this.lockReason = '';
  }

  confirmLock(): void {
    if (!this.lockTargetLot || !this.lockReason.trim()) return;

    this.lotService.lockLot(this.lockTargetLot.lot_id, this.lockReason).subscribe({
      next: (res) => {
        this.toast.show(
          `Lote #${this.lockTargetLot!.num_lot} bloqueado exitosamente`,
          'success'
        );
        this.closeLockModal();
        // The real-time update will handle UI refresh, but also manually update
        this.cache.clear();
        this.loadLots();
      },
      error: (err) => {
        if (err.status === 409) {
          this.toast.show(
            err.error?.message || 'Este lote ya está siendo procesado por otro asesor',
            'error'
          );
        } else {
          this.toast.show('Error al bloquear el lote', 'error');
        }
        this.closeLockModal();
      }
    });
  }

  unlockLot(lot: Lot): void {
    this.lotService.unlockLot(lot.lot_id).subscribe({
      next: () => {
        this.toast.show(
          `Lote #${lot.num_lot} liberado exitosamente`,
          'success'
        );
        this.cache.clear();
        this.loadLots();
      },
      error: (err) => {
        this.toast.show(
          err.error?.message || 'Error al liberar el lote',
          'error'
        );
      }
    });
  }

  isLockedByMe(lot: Lot): boolean {
    return lot.status === 'en_proceso' && lot.locked_by === this.currentUserId;
  }

  isLockedByOther(lot: Lot): boolean {
    return lot.status === 'en_proceso' && lot.locked_by !== this.currentUserId;
  }

  canLock(lot: Lot): boolean {
    return lot.status === 'disponible' && this.authService.hasPermission('sales.contracts.store');
  }

  canUnlock(lot: Lot): boolean {
    return lot.status === 'en_proceso' && (
      lot.locked_by === this.currentUserId ||
      this.authService.hasPermission('inventory.lots.update')
    );
  }

  getManzanaName(manzanaId: number): string {
    const manzana = this.manzanas.find(m => m.manzana_id === manzanaId);
    return manzana ? manzana.name : 'N/A';
  }

  getStreetTypeName(streetTypeId: number): string {
    const streetType = this.streetTypes.find(st => st.street_type_id === streetTypeId);
    return streetType ? streetType.name : 'N/A';
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadLots();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadLots();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.last_page;
    const currentPage = this.pagination.current_page;

    // Mostrar máximo 5 páginas
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Ajustar si estamos cerca del final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Hacer Math disponible en el template
  Math = Math;

}
