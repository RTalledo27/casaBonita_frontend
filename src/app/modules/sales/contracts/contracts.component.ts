import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Plus, Upload, Database } from 'lucide-angular';
import { ContractsService } from '../services/contracts.service';
import { LogicwareService, FullStockResponse } from '../services/logicware.service';
import { Contract } from '../models/contract';
import { SharedTableComponent, ColumnDef } from '../../../shared/components/shared-table/shared-table.component';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ContractImportComponent } from './components/contract-import/contract-import.component';
import { ContractCreationModalComponent } from './contract-creation-modal/contract-creation-modal.component';
import { ContractDetailsModalComponent } from './components/contract-details-modal/contract-details-modal.component';
import { LogicwareFullStockModalComponent } from './logicware-full-stock-modal/logicware-full-stock-modal.component';
import { AdvisorsService, AdvisorOption } from '../services/advisors.service';
import { Subject, of, combineLatest } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { diffCalendarDays, parseApiDate } from '../../../core/utils/date';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    ContractImportComponent,
    ContractCreationModalComponent,
    ContractDetailsModalComponent,
    LogicwareFullStockModalComponent,
    // PaginationComponent,
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  statusFilter = '';
  withFinancingOnly = false;
  advisorId: number | null = null;
  signDateFrom = '';
  signDateTo = '';
  sortBy = 'sign_date';
  sortDir: 'asc' | 'desc' = 'desc';
  advisors: AdvisorOption[] = [];
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'vigente', label: 'Vigente' },
    { value: 'resuelto', label: 'Resuelto' },
    { value: 'cancelado', label: 'Cancelado' },
  ];
  readonly sortOptions = [
    { value: 'sign_date', label: 'Fecha de firma' },
    { value: 'contract_number', label: 'Número de contrato' },
    { value: 'total_price', label: 'Precio total' },
    { value: 'status', label: 'Estado' },
  ];
  pagination: any = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  };
  
  createEnabled = true;
  importEnabled = true;

  columns: ColumnDef[] = [
    { field: 'contract_number', header: 'Número de Contrato' },
    { field: 'client_name', header: 'Cliente' },
    { field: 'lot_name', header: 'Lote' },
    { field: 'advisor', header: 'Asesor', tpl: 'advisor' },
    { field: 'sign_date', header: 'Fecha de Firma', tpl: 'signDate' },
    { field: 'total_price', header: 'Precio Total', align: 'right' },
    { field: 'status', header: 'Estado' }
  ];
  idField = 'contract_id';
  plus = Plus;
  upload = Upload;
  database = Database;
  readonly Math = Math;
  isModalOpen = false;
  isImportModalOpen = false;
  isCreationModalOpen = false;
  isDetailsModalOpen = false;
  selectedContractId: number | null = null;

  // Logicware Full Stock
  isFullStockModalOpen = false;
  fullStockData: FullStockResponse | null = null;
  fullStockLoading = false;
  private search$ = new Subject<string>();
  private refresh$ = new Subject<void>();

  constructor(
    private contractsService: ContractsService,
    private logicwareService: LogicwareService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef,
    private advisorsService: AdvisorsService
  ) {
  }

  ngOnInit(): void {
    const user = this.authService.userSubject.value;
    
    if (!user) {
      return;
    }
    
    if (!this.authService.hasPermission('sales.contracts.view')) {
      return;
    }

    this.advisorsService
      .list()
      .pipe(
        map((r: any) => (Array.isArray(r?.data) ? r.data : [])),
        map((items: any[]) =>
          items
            .map((e) => ({
              id: Number(e?.employee_id),
              name: String(e?.full_name || e?.user?.full_name || e?.user?.first_name || 'Asesor'),
            }))
            .filter((a) => Number.isFinite(a.id))
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
        catchError(() => of([] as AdvisorOption[])),
      )
      .subscribe((advisors) => {
        this.advisors = advisors;
        this.cdr.detectChanges();
      });

    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.setQueryParams({ search: term || null, page: 1 });
    });

    const queryState$ = this.route.queryParamMap.pipe(
        map((pm) => ({
          page: Number(pm.get('page') || 1),
          per_page: Number(pm.get('per_page') || 10),
          search: pm.get('search') || '',
          status: pm.get('status') || '',
          with_financing: pm.get('with_financing') === '1',
          advisor_id: pm.get('advisor_id') ? Number(pm.get('advisor_id')) : null,
          sign_date_from: pm.get('sign_date_from') || '',
          sign_date_to: pm.get('sign_date_to') || '',
          sort_by: pm.get('sort_by') || 'sign_date',
          sort_dir: (pm.get('sort_dir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
        })),
        map((s) => ({
          ...s,
          page: Number.isFinite(s.page) && s.page > 0 ? s.page : 1,
          per_page: Number.isFinite(s.per_page) && s.per_page > 0 ? s.per_page : 10,
        })),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      );

    combineLatest([queryState$, this.refresh$.pipe(startWith(undefined))])
      .pipe(
        map(([s]) => s),
        tap((s) => {
          this.currentPage = s.page;
          this.pageSize = s.per_page;
          this.searchTerm = s.search;
          this.statusFilter = s.status;
          this.withFinancingOnly = s.with_financing;
          this.advisorId = s.advisor_id;
          this.signDateFrom = s.sign_date_from;
          this.signDateTo = s.sign_date_to;
          this.sortBy = s.sort_by;
          this.sortDir = s.sort_dir;
          this.loading = true;
          this.cdr.detectChanges();
        }),
        switchMap((s) =>
          this.contractsService
            .list({
              page: s.page,
              per_page: s.per_page,
              search: s.search || undefined,
              status: s.status || undefined,
              with_financing: s.with_financing ? 1 : 0,
              advisor_id: s.advisor_id ?? undefined,
              sign_date_from: s.sign_date_from || undefined,
              sign_date_to: s.sign_date_to || undefined,
              sort_by: s.sort_by || undefined,
              sort_dir: s.sort_dir || undefined,
            })
            .pipe(
              catchError(() => of({ data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: s.per_page } })),
              finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
              }),
            ),
        ),
      )
      .subscribe((response: any) => {
        const data = response?.data;
        this.contracts = Array.isArray(data) ? data : [];
        this.pagination = response?.meta || this.pagination;
        this.cdr.detectChanges();
      });
  }

  getAdvisorName(contract: any): string {
    return contract.advisor?.full_name || 'Sin asesor';
  }

  getAdvisorInitials(contract: any): string {
    const name = this.getAdvisorName(contract);
    if (name === 'Sin asesor') return 'SA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatSignDate(date: string): string {
    if (!date) return 'Sin fecha';
    return parseApiDate(date).toLocaleDateString('es-ES');
  }

  getRelativeDate(date: string): string {
    if (!date) return '';
    const today = new Date();
    const signDate = parseApiDate(date);
    const dayDiff = diffCalendarDays(today, signDate);

    if (dayDiff === 0) return 'Hoy';
    if (dayDiff === 1) return 'Ayer';
    if (dayDiff < 0) return 'Futuro';
    if (dayDiff < 7) return `Hace ${dayDiff} días`;
    if (dayDiff < 30) return `Hace ${Math.floor(dayDiff / 7)} semanas`;
    return `Hace ${Math.floor(dayDiff / 30)} meses`;
  }

  loadContracts(): void {
    this.refresh$.next();
  }
  
  onPageChange(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.pagination?.last_page || 1));
    this.setQueryParams({ page: nextPage });
  }

  onSearch(): void {
    this.search$.next(this.searchTerm);
  }

  onFiltersChange(): void {
    this.setQueryParams({
      page: 1,
      per_page: this.pageSize,
      status: this.statusFilter || null,
      with_financing: this.withFinancingOnly ? 1 : 0,
      advisor_id: this.advisorId ? this.advisorId : null,
      sign_date_from: this.signDateFrom || null,
      sign_date_to: this.signDateTo || null,
      sort_by: this.sortBy || null,
      sort_dir: this.sortDir || null,
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.withFinancingOnly = false;
    this.advisorId = null;
    this.signDateFrom = '';
    this.signDateTo = '';
    this.sortBy = 'sign_date';
    this.sortDir = 'desc';
    this.pageSize = 10;
    this.setQueryParams({
      page: 1,
      per_page: 10,
      search: null,
      status: null,
      with_financing: 0,
      advisor_id: null,
      sign_date_from: null,
      sign_date_to: null,
      sort_by: null,
      sort_dir: null,
    });
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.onFiltersChange();
  }

  private setQueryParams(params: any): void {
    const cleaned: Record<string, any> = {};
    Object.keys(params).forEach((k) => {
      const v = params[k];
      cleaned[k] = v === undefined || v === '' ? null : v;
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleaned,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openEditModal(id: number): void {
    // Implementar lógica para abrir modal de edición
    console.log('Edit contract:', id);
  }

  deleteContract(id: number): void {
    // Implementar lógica para eliminar contrato
    console.log('Delete contract:', id);
  }

  openViewModal(contractId: number) {
    console.log('=== MODAL DEBUG START ===');
    console.log('openViewModal called with contractId:', contractId);
    console.log('Before - isDetailsModalOpen:', this.isDetailsModalOpen);
    console.log('Before - selectedContractId:', this.selectedContractId);
    
    this.selectedContractId = contractId;
    this.isDetailsModalOpen = true;
    
    console.log('After - isDetailsModalOpen:', this.isDetailsModalOpen);
    console.log('After - selectedContractId:', this.selectedContractId);
    
    // Force change detection multiple times
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    console.log('Change detection triggered');
    
    // Check DOM after a delay
    setTimeout(() => {
      console.log('=== DOM CHECK ===');
      const modalElement = document.querySelector('app-contract-details-modal');
      console.log('Modal element found in DOM:', !!modalElement);
      console.log('Modal element:', modalElement);
      
      if (modalElement) {
        console.log('Modal innerHTML length:', modalElement.innerHTML.length);
        const modalBackdrop = modalElement.querySelector('div[class*="fixed"]');
        console.log('Modal backdrop found:', !!modalBackdrop);
        
        if (modalBackdrop) {
          const computedStyle = window.getComputedStyle(modalBackdrop);
          console.log('Modal styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex
          });
        } else {
          console.log('No backdrop div found, modal content:', modalElement.innerHTML.substring(0, 200));
        }
      }
      console.log('=== MODAL DEBUG END ===');
    }, 200);
  }

  onCreate(): void {
    // Implementar lógica para crear contrato
    console.log('Create contract');
    this.isCreationModalOpen = true;
  }

  onImport(): void {
    // Implementar lógica para importar contratos
    console.log('Import contracts');
    this.isImportModalOpen = true;
  }

  onImportModalClose(): void {
    this.isImportModalOpen = false;
  }

  onImportCompleted(): void {
    this.isImportModalOpen = false;
    this.loadContracts();
  }

  onCreationModalClose(): void {
    this.isCreationModalOpen = false;
  }

  onContractCreated(): void {
    this.isCreationModalOpen = false;
    this.loadContracts();
  }

  onDetailsModalClose(): void {
    this.isDetailsModalOpen = false;
    this.selectedContractId = null;
  }

  /**
   * Abrir modal de stock completo de Logicware
   * Obtiene todos los datos de unidades, asesores, clientes, reservas
   */
  async openFullStockModal(): Promise<void> {
    console.log('🔍 Opening Logicware Full Stock Modal');
    
    this.isFullStockModalOpen = true;
    this.fullStockLoading = true;
    
    try {
      this.logicwareService.getFullStock(false).subscribe({
        next: (response) => {
          console.log('✅ Full stock data received:', response);
          console.log('📊 Response type:', typeof response);
          console.log('📊 Response.data type:', typeof response?.data);
          console.log('📊 Response.data is Array?:', Array.isArray(response?.data));
          console.log('📊 Response.data length:', response?.data?.length);
          console.log('📊 Full response structure:', JSON.stringify(response, null, 2));
          this.fullStockData = response;
          this.fullStockLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading full stock:', error);
          this.fullStockLoading = false;
          // TODO: Show toast notification
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('❌ Exception in openFullStockModal:', error);
      this.fullStockLoading = false;
    }
  }

  /**
   * Cerrar modal de stock completo
   */
  onFullStockModalClose(): void {
    console.log('🔒 Closing Logicware Full Stock Modal');
    this.isFullStockModalOpen = false;
  }

  /**
   * Refrescar datos de stock completo desde Logicware (fuerza actualización)
   */
  onRefreshFullStock(): void {
    console.log('🔄 Refreshing Logicware Full Stock (force refresh)');
    
    this.fullStockLoading = true;
    
    this.logicwareService.getFullStock(true).subscribe({
      next: (response) => {
        console.log('✅ Full stock data refreshed:', response);
        this.fullStockData = response;
        this.fullStockLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error refreshing full stock:', error);
        this.fullStockLoading = false;
        // TODO: Show toast notification
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Obtener números de página para mostrar en la paginación
   * Muestra: 1 ... 3 4 [5] 6 7 ... 10 (ejemplo con página actual 5)
   */
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const current = this.pagination.current_page;
    const total = this.pagination.last_page;
    
    if (total <= 7) {
      // Si hay 7 o menos páginas, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);
      
      // Agregar puntos suspensivos si es necesario
      if (current > 3) {
        pages.push('...');
      }
      
      // Mostrar páginas alrededor de la actual
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Agregar puntos suspensivos al final si es necesario
      if (current < total - 2) {
        pages.push('...');
      }
      
      // Siempre mostrar última página
      pages.push(total);
    }
    
    return pages;
  }

  /**
   * Verificar si el valor es un número de página (no '...')
   */
  isPageNumber(page: number | string): page is number {
    return typeof page === 'number';
  }
}
