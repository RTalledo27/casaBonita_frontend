import { Component, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { PaymentsService } from '../services/payments.service';
import { SalesCutService } from '../services/sales-cut.service';
import { FormsModule } from '@angular/forms';
import { AdvisorsService, AdvisorOption } from '../services/advisors.service';
import { Subject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule, SharedTableComponent, TranslateModule, RouterOutlet, LucideAngularModule ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('clientTpl', { static: true }) clientTpl!: TemplateRef<any>;
  @ViewChild('contractTpl', { static: true }) contractTpl!: TemplateRef<any>;
  @ViewChild('lotTpl', { static: true }) lotTpl!: TemplateRef<any>;
  @ViewChild('installmentTpl', { static: true }) installmentTpl!: TemplateRef<any>;

  payments: any[] = [];
  pagination: any = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 25,
  };

  startDate = this.getMonthStartString();
  endDate = this.getTodayString();
  searchTerm = '';
  typeFilter = '';
  sourceFilter = '';
  methodFilter = '';
  advisorId: number | null = null;
  hasVoucherFilter: '' | '1' | '0' = '';
  sortBy = 'date';
  sortDir: 'asc' | 'desc' = 'desc';
  readonly pageSizeOptions = [25, 50, 100, 200];
  readonly sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'amount', label: 'Monto' },
    { value: 'client_name', label: 'Cliente' },
    { value: 'contract_number', label: 'Contrato' },
    { value: 'method', label: 'Método' },
    { value: 'movement_type', label: 'Tipo' },
    { value: 'source', label: 'Origen' },
  ];
  kpis: any | null = null;
  isLoadingKpis = false;
  kpisError: string | null = null;
  isLoadingLedger = false;
  ledgerError: string | null = null;
  detailRow: any | null = null;
  voucherFile: File | null = null;
  isUploadingVoucher = false;
  voucherError: string | null = null;

  columns: ColumnDef[] = [
    {
      header: 'Origen',
      translate: false,
      value: (row) => this.getOriginLabel(row),
    },
    {
      header: 'Cliente',
      translate: false,
      tpl: 'client',
    },
    {
      header: 'Contrato',
      translate: false,
      tpl: 'contract',
    },
    {
      header: 'Lote',
      translate: false,
      tpl: 'lot',
    },
    {
      header: 'Cuota',
      translate: false,
      align: 'left',
      width: '160px',
      tpl: 'installment',
    },
    {
      header: 'Concepto',
      translate: false,
      value: (row) => this.getInstallmentKindLabel(row),
    },
    { header: 'Método', translate: false, value: (row) => this.getMethodLabel(row) },
    { field: 'bank_name', header: 'Banco', translate: false },
    { field: 'reference', header: 'Referencia', translate: false },
    {
      header: 'Fecha',
      translate: false,
      value: (row) => this.formatDate(row.date),
    },
    {
      header: 'Monto',
      translate: false,
      align: 'right',
      value: (row) => this.formatCurrency(row.amount),
    },
    {
      header: '',
      translate: false,
      align: 'right',
      tpl: 'actions',
      width: '120px',
    }
  ];
  idField = 'row_key';
  plus = Plus;
  isModalOpen = false;
  templates: Record<string, TemplateRef<any>> = {};
  advisors: AdvisorOption[] = [];
  methodOptions: string[] = [];

  private refresh$ = new Subject<void>();
  private search$ = new Subject<string>();

  constructor(
    private paymentService: PaymentsService,
    private salesCutService: SalesCutService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    private advisorsService: AdvisorsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.templates = {
      actions: this.actionsTpl,
      client: this.clientTpl,
      contract: this.contractTpl,
      lot: this.lotTpl,
      installment: this.installmentTpl,
    };

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
        per_page: Number(pm.get('per_page') || 25),
        start_date: pm.get('start_date') || this.getMonthStartString(),
        end_date: pm.get('end_date') || this.getTodayString(),
        search: pm.get('search') || '',
        movement_type: pm.get('movement_type') || '',
        source: pm.get('source') || '',
        method: pm.get('method') || '',
        advisor_id: pm.get('advisor_id') ? Number(pm.get('advisor_id')) : null,
        has_voucher: (pm.get('has_voucher') as any) || '',
        sort_by: pm.get('sort_by') || 'date',
        sort_dir: (pm.get('sort_dir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
      })),
      map((s) => ({
        ...s,
        page: Number.isFinite(s.page) && s.page > 0 ? s.page : 1,
        per_page: Number.isFinite(s.per_page) && s.per_page > 0 ? s.per_page : 25,
      })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap((s) => {
        this.pagination.per_page = s.per_page;
        this.pagination.current_page = s.page;
        this.startDate = s.start_date;
        this.endDate = s.end_date;
        this.searchTerm = s.search;
        this.typeFilter = s.movement_type;
        this.sourceFilter = s.source;
        this.methodFilter = s.method;
        this.advisorId = s.advisor_id;
        this.hasVoucherFilter = (s.has_voucher as any) || '';
        this.sortBy = s.sort_by;
        this.sortDir = s.sort_dir;
        this.cdr.detectChanges();
      }),
    );

    combineLatest([queryState$, this.refresh$.pipe(startWith(undefined))])
      .pipe(
        map(([s]) => s),
        tap(() => {
          this.loadKpis();
          this.isLoadingLedger = true;
          this.ledgerError = null;
          this.cdr.detectChanges();
        }),
        switchMap((s) =>
          this.paymentService
            .ledger({
              start_date: s.start_date,
              end_date: s.end_date,
              page: s.page,
              per_page: s.per_page,
              search: s.search || undefined,
              movement_type: s.movement_type || undefined,
              source: s.source || undefined,
              method: s.method || undefined,
              advisor_id: s.advisor_id ?? undefined,
              has_voucher: s.has_voucher === '' ? undefined : (s.has_voucher === '1' ? 1 : 0),
              sort_by: s.sort_by || undefined,
              sort_dir: s.sort_dir || undefined,
            })
            .pipe(
              catchError(() => {
                this.ledgerError = 'No se pudo cargar el detalle de movimientos';
                return of(null);
              }),
              finalize(() => {
                this.isLoadingLedger = false;
                this.cdr.detectChanges();
              }),
            ),
        ),
      )
      .subscribe((res: any) => {
        const paginated = res?.data;
        const rows = paginated?.data ?? [];
        this.payments = Array.isArray(rows) ? rows : [];
        if (paginated) {
          this.pagination = {
            current_page: paginated.current_page ?? 1,
            last_page: paginated.last_page ?? 1,
            total: paginated.total ?? (this.payments.length || 0),
            per_page: paginated.per_page ?? this.pagination.per_page,
            from: paginated.from ?? null,
            to: paginated.to ?? null,
          };
        } else {
          this.pagination = {
            ...this.pagination,
            total: this.payments.length || 0,
            last_page: 1,
            current_page: 1,
          };
        }
        this.methodOptions = Array.isArray(this.kpis?.payments_by_method)
          ? this.kpis.payments_by_method.map((m: any) => String(m.method))
          : this.methodOptions;
        this.cdr.detectChanges();
      });

    this.refresh();
  }

  refresh() {
    this.refresh$.next();
  }

  loadKpis() {
    this.isLoadingKpis = true;
    this.kpisError = null;

    this.paymentService
      .summary({
        start_date: this.startDate,
        end_date: this.endDate,
        movement_type: this.typeFilter || undefined,
        source: this.sourceFilter || undefined,
        method: this.methodFilter || undefined,
        advisor_id: this.advisorId ?? undefined,
        has_voucher: this.hasVoucherFilter === '' ? undefined : this.hasVoucherFilter === '1' ? 1 : 0,
      })
      .pipe(
        finalize(() => {
          this.isLoadingKpis = false;
          this.cdr.detectChanges();
        }),
        catchError(() => {
          this.kpisError = 'No se pudo cargar el resumen de pagos';
          return of({ data: null });
        }),
      )
      .subscribe((res: any) => {
        this.kpis = res?.data ?? null;
        this.methodOptions = Array.isArray(this.kpis?.payments_by_method)
          ? this.kpis.payments_by_method.map((m: any) => String(m.method))
          : this.methodOptions;
      });
  }

  formatCurrency(amount: number): string {
    return this.salesCutService.formatCurrency(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('es-PE');
    } catch {
      return date;
    }
  }

  onSearch(): void {
    this.search$.next(this.searchTerm);
  }

  onFiltersChange(): void {
    const start = this.startDate;
    const end = this.endDate;
    let start_date = start;
    let end_date = end;
    if (start_date && end_date && start_date > end_date) {
      start_date = end;
      end_date = start;
    }

    this.setQueryParams({
      page: 1,
      per_page: this.pagination.per_page,
      start_date,
      end_date,
      movement_type: this.typeFilter || null,
      source: this.sourceFilter || null,
      method: this.methodFilter || null,
      advisor_id: this.advisorId ? this.advisorId : null,
      has_voucher: this.hasVoucherFilter || null,
      sort_by: this.sortBy || null,
      sort_dir: this.sortDir || null,
    });
  }

  onPageChange(page: number): void {
    const last = this.pagination?.last_page || 1;
    const next = Math.max(1, Math.min(page, last));
    this.setQueryParams({ page: next });
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.onFiltersChange();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.sourceFilter = '';
    this.methodFilter = '';
    this.advisorId = null;
    this.hasVoucherFilter = '';
    this.sortBy = 'date';
    this.sortDir = 'desc';
    this.pagination.per_page = 25;
    this.startDate = this.getMonthStartString();
    this.endDate = this.getTodayString();
    this.setQueryParams({
      page: 1,
      per_page: 25,
      start_date: this.startDate,
      end_date: this.endDate,
      search: null,
      movement_type: null,
      source: null,
      method: null,
      advisor_id: null,
      has_voucher: null,
      sort_by: null,
      sort_dir: null,
    });
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

  getOriginLabel(row: any): string {
    if (row.source === 'payment' && row.payment_id) return `Pago #${row.payment_id}`;
    if (row.source === 'schedule' && row.schedule_id) return `Cuota (cronograma) #${row.schedule_id}`;
    if (row.source === 'reservation' && row.reservation_id) return `Separación #${row.reservation_id}`;
    return row.id || '—';
  }

  getInstallmentKindLabel(row: any): string {
    if (row.movement_type === 'reservation_deposit') return 'Separación';
    if (row.installment_type) {
      const t = String(row.installment_type).toLowerCase();
      const notes = String(row.schedule_notes || '').toLowerCase();
      if (t === 'inicial' && (notes.includes('separ') || notes.includes('reserva') || Number(row.installment_number) === 0)) {
        return 'Separación';
      }
      if (t.includes('bono')) return 'Bono';
      if (t.includes('bpp')) return 'Bono BPP';
      if (t.includes('inicial') || t.includes('down') || t.includes('initial')) return 'Inicial';
    }
    return row.movement_type === 'installment' ? 'Financiamiento' : '—';
  }

  getMethodLabel(row: any): string {
    const method = row?.method || '';
    const bank = row?.bank_name || '';
    if (method && bank) return `${method} · ${bank}`;
    if (method) return method;
    if (row?.source === 'schedule' && !row?.payment_id) return 'Sin registrar';
    return '—';
  }

  openClient(clientId: number) {
    if (!clientId) return;
    this.router.navigate(['/crm', 'clients', clientId]);
  }

  openLot(lotId: number) {
    if (!lotId) return;
    this.router.navigate(['/inventory', 'lots', lotId]);
  }

  openContract(contractId: number) {
    if (!contractId) return;
    this.router.navigate(['/sales', 'contracts', { outlets: { modal: [String(contractId), 'edit'] } }]);
  }

  openDetail(row: any) {
    this.detailRow = row;
    this.voucherFile = null;
    this.voucherError = null;
  }

  closeDetail() {
    this.detailRow = null;
    this.voucherFile = null;
    this.voucherError = null;
  }

  onVoucherSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.voucherFile = file;
    this.voucherError = null;
  }

  uploadVoucher() {
    if (!this.detailRow?.payment_id) return;
    if (!this.voucherFile) {
      this.voucherError = 'Selecciona un archivo (JPG/PNG/PDF) primero';
      return;
    }

    this.isUploadingVoucher = true;
    this.voucherError = null;

    this.paymentService.uploadVoucher(this.detailRow.payment_id, this.voucherFile).subscribe({
      next: () => {
        this.isUploadingVoucher = false;
        this.refresh();
        this.detailRow = { ...this.detailRow, has_voucher: 1 };
      },
      error: () => {
        this.isUploadingVoucher = false;
        this.voucherError = 'No se pudo subir el voucher';
      }
    });
  }

  downloadVoucher() {
    if (!this.detailRow?.payment_id) return;
    this.paymentService.downloadVoucher(this.detailRow.payment_id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voucher_pago_${this.detailRow.payment_id}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.voucherError = 'No se pudo descargar el voucher';
      }
    });
  }

  openRegisterPayment(row: any) {
    if (!row?.schedule_id) return;
    const qp: any = {
      schedule_id: row.schedule_id,
      amount: row.amount,
      payment_date: (row.date || '').toString().slice(0, 10),
      method: row.method || 'transferencia',
      reference: row.reference || '',
    };
    this.closeDetail();
    this.router.navigate([{ outlets: { modal: ['create'] } }], {
      relativeTo: this.route,
      queryParams: qp,
    });
    this.isModalOpen = true;
  }

  getTypeAmount(type: string): number {
    const items = this.kpis?.payments_by_type || [];
    const found = items.find((it: any) => it.type === type);
    return found?.amount || 0;
  }

  getTypeCount(type: string): number {
    const items = this.kpis?.payments_by_type || [];
    const found = items.find((it: any) => it.type === type);
    return found?.count || 0;
  }

  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }

  private getMonthStartString(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  }

  onCreate() {
    this.modalService.open(['create'], this.route);
    this.isModalOpen = true;
  }

  onEdit(id: number) {
    this.modalService.open([id.toString(), 'edit'], this.route);
    this.isModalOpen = true;
  }

  onModalActivate(component: any) {
    const canSubscribe = component && component.modalClosed && component.submitForm;
    if (!canSubscribe) return;

    component.modalClosed.subscribe(() => {
      this.isModalOpen = false;
      this.modalService.close(this.route);
      this.refresh();
    });
    component.submitForm.subscribe(() => {
      this.isModalOpen = false;
      this.modalService.close(this.route);
      this.refresh();
    });
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
