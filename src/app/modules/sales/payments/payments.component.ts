import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { BehaviorSubject, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule, SharedTableComponent, TranslateModule, RouterOutlet, LucideAngularModule ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('originTpl', { static: true }) originTpl!: TemplateRef<any>;
  @ViewChild('clientTpl', { static: true }) clientTpl!: TemplateRef<any>;
  @ViewChild('contractTpl', { static: true }) contractTpl!: TemplateRef<any>;
  @ViewChild('lotTpl', { static: true }) lotTpl!: TemplateRef<any>;
  @ViewChild('installmentTpl', { static: true }) installmentTpl!: TemplateRef<any>;
  @ViewChild('methodTpl', { static: true }) methodTpl!: TemplateRef<any>;
  @ViewChild('voucherTpl', { static: true }) voucherTpl!: TemplateRef<any>;
  @ViewChild('referenceTpl', { static: true }) referenceTpl!: TemplateRef<any>;

  private paymentsSubject = new BehaviorSubject<any[]>([]);
  payments$ = this.paymentsSubject.asObservable();
  private rawRows: any[] = [];
  private filterChanges$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  startDate = this.getMonthStartString();
  endDate = this.getTodayString();
  searchTerm = '';
  typeFilter = '';
  hasVoucherOnly = false;
  methodFilter = '';
  perPage = 50;
  page = 1;
  total = 0;
  lastPage = 1;
  from = 0;
  to = 0;
  kpis: any | null = null;
  isLoadingKpis = false;
  kpisError: string | null = null;
  isLoadingLedger = false;
  ledgerError: string | null = null;

  // 5% report
  fivePercentData: any | null = null;
  isLoadingFivePercent = false;
  fivePercentError: string | null = null;
  showFivePercentDetail = false;
  isExportingFivePercent = false;
  fivePercentStartDate = '';
  fivePercentEndDate = '';
  detailRow: any | null = null;
  isEditingPayment = false;
  editForm: any = {};
  isSavingEdit = false;
  editError: string | null = null;
  isDeletingPayment = false;
  showDeleteConfirm = false;
  deleteError: string | null = null;
  voucherFile: File | null = null;
  isUploadingVoucher = false;
  voucherError: string | null = null;
  isLoadingVoucherPreview = false;
  voucherPreviewError: string | null = null;
  voucherPreviewUrl: string | null = null;
  voucherPreviewSafeUrl: SafeResourceUrl | null = null;
  voucherPreviewType: 'image' | 'pdf' | 'other' | null = null;

  columns: ColumnDef[] = [
    {
      header: 'Origen',
      translate: false,
      tpl: 'origin',
      width: '170px',
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
    { header: 'Método', translate: false, tpl: 'method', width: '150px' },
    { field: 'bank_name', header: 'Banco', translate: false },
    { header: 'Nº Operación', translate: false, tpl: 'reference' },
    { header: 'Voucher', translate: false, tpl: 'voucher', width: '110px', align: 'center' },
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

  constructor(
    private paymentService: PaymentsService,
    private salesCutService: SalesCutService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.templates = {
      actions: this.actionsTpl,
      origin: this.originTpl,
      client: this.clientTpl,
      contract: this.contractTpl,
      lot: this.lotTpl,
      installment: this.installmentTpl,
      method: this.methodTpl,
      voucher: this.voucherTpl,
      reference: this.referenceTpl,
    };
    this.filterChanges$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadPayments();
      });
    this.refresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loadPayments();
    this.loadKpis();
    this.loadFivePercentReport();
  }

  loadPayments() {
    this.isLoadingLedger = true;
    this.ledgerError = null;

    this.paymentService.ledger({
      start_date: this.startDate,
      end_date: this.endDate,
      per_page: this.perPage,
      page: this.page,
      q: this.searchTerm?.trim() || undefined,
      movement_type: this.typeFilter || undefined,
      method: this.methodFilter || undefined,
      has_voucher: this.hasVoucherOnly ? 1 : undefined,
    }).subscribe({
      next: (res: any) => {
        const paginated = res?.data;
        const rows = paginated?.data ?? paginated ?? [];
        this.rawRows = Array.isArray(rows) ? rows : [];
        this.total = Number(paginated?.total || 0);
        this.lastPage = Number(paginated?.last_page || 1);
        this.from = Number(paginated?.from || 0);
        this.to = Number(paginated?.to || 0);
        this.isLoadingLedger = false;
        this.paymentsSubject.next(this.rawRows);
      },
      error: () => {
        this.isLoadingLedger = false;
        this.ledgerError = 'No se pudo cargar el detalle de movimientos';
        this.rawRows = [];
        this.total = 0;
        this.lastPage = 1;
        this.from = 0;
        this.to = 0;
        this.paymentsSubject.next([]);
      }
    });
  }

  loadKpis() {
    this.isLoadingKpis = true;
    this.kpisError = null;

    this.paymentService.summary({ start_date: this.startDate, end_date: this.endDate }).subscribe({
      next: (res: any) => {
        this.kpis = res?.data ?? null;
        this.isLoadingKpis = false;
      },
      error: () => {
        this.kpisError = 'No se pudo cargar el resumen de pagos';
        this.isLoadingKpis = false;
      }
    });
  }

  loadFivePercentReport() {
    this.isLoadingFivePercent = true;
    this.fivePercentError = null;

    const params: any = {};
    if (this.fivePercentStartDate) params.start_date = this.fivePercentStartDate;
    if (this.fivePercentEndDate) params.end_date = this.fivePercentEndDate;

    this.paymentService.fivePercentReport(params).subscribe({
      next: (res: any) => {
        this.fivePercentData = res?.data ?? null;
        this.isLoadingFivePercent = false;
      },
      error: () => {
        this.fivePercentError = 'No se pudo cargar el reporte del 5%';
        this.isLoadingFivePercent = false;
      }
    });
  }

  toggleFivePercentDetail() {
    this.showFivePercentDetail = !this.showFivePercentDetail;
  }

  exportFivePercentToExcel() {
    this.isExportingFivePercent = true;

    const params: any = {};
    if (this.fivePercentStartDate) params.start_date = this.fivePercentStartDate;
    if (this.fivePercentEndDate) params.end_date = this.fivePercentEndDate;

    this.paymentService.exportFivePercentReport(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_5_Porciento_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.isExportingFivePercent = false;
      },
      error: () => {
        this.isExportingFivePercent = false;
        this.fivePercentError = 'No se pudo exportar el reporte';
      }
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

  onFiltersChanged() {
    const snapshot = JSON.stringify({
      startDate: this.startDate,
      endDate: this.endDate,
      searchTerm: this.searchTerm?.trim() || '',
      typeFilter: this.typeFilter || '',
      methodFilter: this.methodFilter || '',
      hasVoucherOnly: !!this.hasVoucherOnly,
      perPage: this.perPage,
    });
    this.filterChanges$.next(snapshot);
  }

  goToPage(nextPage: number) {
    const safe = Math.max(1, Math.min(this.lastPage || 1, nextPage));
    if (safe === this.page) return;
    this.page = safe;
    this.loadPayments();
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

  getMethodPillClass(row: any): string {
    const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1';
    const method = String(row?.method || '').toLowerCase();
    if (method === 'cash') return `${base} bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800/60`;
    if (method === 'transfer') return `${base} bg-blue-100 text-blue-700 ring-blue-200/70 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800/60`;
    if (method === 'card') return `${base} bg-purple-100 text-purple-700 ring-purple-200/70 dark:bg-purple-900/40 dark:text-purple-200 dark:ring-purple-800/60`;
    if (method === 'check') return `${base} bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/60`;
    if (row?.source === 'schedule' && !row?.payment_id) return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60`;
    return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60`;
  }

  getMovementTypePillClass(row: any): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1';
    const type = String(row?.movement_type || '');
    if (type === 'reservation_deposit') return `${base} bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/60`;
    if (type === 'installment') return `${base} bg-indigo-100 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-800/60`;
    return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60`;
  }

  getVoucherPillClass(row: any): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1';
    if (row?.has_voucher) {
      return `${base} bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800/60`;
    }
    return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60`;
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
    this.clearVoucherPreview();
    if (row?.has_voucher) {
      this.loadVoucherPreview();
    }
  }

  closeDetail() {
    this.detailRow = null;
    this.voucherFile = null;
    this.voucherError = null;
    this.isEditingPayment = false;
    this.editForm = {};
    this.editError = null;
    this.showDeleteConfirm = false;
    this.deleteError = null;
    this.clearVoucherPreview();
  }

  startEditPayment() {
    const src = this.detailRow?.source;
    if (src === 'payment' && !this.detailRow?.payment_id) return;
    if (src === 'schedule' && !this.detailRow?.schedule_id) return;
    if (src !== 'payment' && src !== 'schedule') return;
    this.isEditingPayment = true;
    this.editError = null;
    this.editForm = {
      amount: this.detailRow.amount || 0,
      payment_date: (this.detailRow.date || '').toString().slice(0, 10),
      method: this.detailRow.method || '',
      reference: this.detailRow.reference || '',
    };
  }

  cancelEditPayment() {
    this.isEditingPayment = false;
    this.editForm = {};
    this.editError = null;
  }

  saveEditPayment() {
    this.isSavingEdit = true;
    this.editError = null;

    const src = this.detailRow?.source;
    let req$;
    if (src === 'payment' && this.detailRow?.payment_id) {
      req$ = this.paymentService.update(this.detailRow.payment_id, this.editForm);
    } else if (src === 'schedule' && this.detailRow?.schedule_id) {
      req$ = this.paymentService.updateSchedule(this.detailRow.schedule_id, this.editForm);
    } else {
      this.isSavingEdit = false;
      return;
    }

    req$.subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.isEditingPayment = false;
        this.closeDetail();
        this.refresh();
      },
      error: (err: any) => {
        this.isSavingEdit = false;
        this.editError = err?.error?.message || 'No se pudo actualizar';
      }
    });
  }

  confirmDeletePayment() {
    this.showDeleteConfirm = true;
    this.deleteError = null;
  }

  cancelDeletePayment() {
    this.showDeleteConfirm = false;
    this.deleteError = null;
  }

  executeDeletePayment() {
    this.isDeletingPayment = true;
    this.deleteError = null;

    const src = this.detailRow?.source;
    let req$;
    if (src === 'payment' && this.detailRow?.payment_id) {
      req$ = this.paymentService.delete(this.detailRow.payment_id);
    } else if (src === 'schedule' && this.detailRow?.schedule_id) {
      req$ = this.paymentService.revertSchedule(this.detailRow.schedule_id);
    } else {
      this.isDeletingPayment = false;
      return;
    }

    req$.subscribe({
      next: () => {
        this.isDeletingPayment = false;
        this.closeDetail();
        this.refresh();
      },
      error: (err: any) => {
        this.isDeletingPayment = false;
        this.deleteError = err?.error?.message || 'No se pudo eliminar';
      }
    });
  }

  onVoucherSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.voucherFile = file;
    this.voucherError = null;
  }

  uploadVoucher() {
    if (!this.detailRow?.transaction_id && !this.detailRow?.payment_id) return;
    if (!this.voucherFile) {
      this.voucherError = 'Selecciona un archivo (JPG/PNG/PDF) primero';
      return;
    }

    this.isUploadingVoucher = true;
    this.voucherError = null;

    const req$ = this.detailRow?.transaction_id
      ? this.paymentService.uploadTransactionVoucher(this.detailRow.transaction_id, this.voucherFile)
      : this.paymentService.uploadVoucher(this.detailRow.payment_id, this.voucherFile);

    req$.subscribe({
      next: () => {
        this.isUploadingVoucher = false;
        this.refresh();
        this.detailRow = { ...this.detailRow, has_voucher: 1 };
        this.loadVoucherPreview();
      },
      error: () => {
        this.isUploadingVoucher = false;
        this.voucherError = 'No se pudo subir el voucher';
      }
    });
  }

  downloadVoucher() {
    if (!this.detailRow?.transaction_id && !this.detailRow?.payment_id) return;

    const req$ = this.detailRow?.transaction_id
      ? this.paymentService.downloadTransactionVoucher(this.detailRow.transaction_id)
      : this.paymentService.downloadVoucher(this.detailRow.payment_id);

    req$.subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.detailRow?.transaction_id
          ? `voucher_transaccion_${this.detailRow.transaction_id}`
          : `voucher_pago_${this.detailRow.payment_id}`;
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

  private clearVoucherPreview() {
    if (this.voucherPreviewUrl) {
      window.URL.revokeObjectURL(this.voucherPreviewUrl);
    }
    this.voucherPreviewUrl = null;
    this.voucherPreviewSafeUrl = null;
    this.voucherPreviewType = null;
    this.voucherPreviewError = null;
    this.isLoadingVoucherPreview = false;
  }

  loadVoucherPreview() {
    if (!this.detailRow?.transaction_id && !this.detailRow?.payment_id) return;
    if (!this.detailRow?.has_voucher) return;

    this.isLoadingVoucherPreview = true;
    this.voucherPreviewError = null;

    const req$ = this.detailRow?.transaction_id
      ? this.paymentService.downloadTransactionVoucher(this.detailRow.transaction_id)
      : this.paymentService.downloadVoucher(this.detailRow.payment_id);

    req$.subscribe({
      next: (blob: Blob) => {
        this.clearVoucherPreview();
        const url = window.URL.createObjectURL(blob);
        this.voucherPreviewUrl = url;
        const type = String(blob.type || '').toLowerCase();
        if (type.startsWith('image/')) {
          this.voucherPreviewType = 'image';
        } else if (type === 'application/pdf') {
          this.voucherPreviewType = 'pdf';
          this.voucherPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else {
          this.voucherPreviewType = 'other';
        }
        this.isLoadingVoucherPreview = false;
      },
      error: () => {
        this.isLoadingVoucherPreview = false;
        this.voucherPreviewError = 'No se pudo cargar la vista previa del voucher';
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
      this.loadPayments();
    });
    component.submitForm.subscribe(() => {
      this.isModalOpen = false;
      this.modalService.close(this.route);
      this.loadPayments();
    });
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
