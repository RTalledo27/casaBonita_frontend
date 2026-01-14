import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { BehaviorSubject } from 'rxjs';
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

  private paymentsSubject = new BehaviorSubject<any[]>([]);
  payments$ = this.paymentsSubject.asObservable();
  private rawRows: any[] = [];

  startDate = this.getMonthStartString();
  endDate = this.getTodayString();
  searchTerm = '';
  typeFilter = '';
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
    { field: 'method', header: 'Método', translate: false },
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

  constructor(
    private paymentService: PaymentsService,
    private salesCutService: SalesCutService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.templates = {
      actions: this.actionsTpl,
      client: this.clientTpl,
      contract: this.contractTpl,
      lot: this.lotTpl,
      installment: this.installmentTpl,
    };
    this.refresh();
  }

  refresh() {
    this.loadPayments();
    this.loadKpis();
  }

  loadPayments() {
    this.isLoadingLedger = true;
    this.ledgerError = null;

    this.paymentService.ledger({
      start_date: this.startDate,
      end_date: this.endDate,
      per_page: 200
    }).subscribe({
      next: (res: any) => {
        const rows = res?.data?.data ?? res?.data ?? [];
        this.rawRows = Array.isArray(rows) ? rows : [];
        this.applyFilters();
        this.isLoadingLedger = false;
      },
      error: () => {
        this.isLoadingLedger = false;
        this.ledgerError = 'No se pudo cargar el detalle de movimientos';
        this.rawRows = [];
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

  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    const type = this.typeFilter;

    const filtered = this.rawRows.filter((row) => {
      if (type && row.movement_type !== type) return false;
      if (!term) return true;

      const hay = [
        row.id,
        row.client_name,
        row.contract_number,
        row.contract_id,
        row.lot_name,
        row.method,
        row.reference,
        row.schedule_id,
        row.installment_number,
        row.payment_id,
        row.reservation_id,
      ]
        .filter((v: any) => v !== null && v !== undefined)
        .map((v: any) => String(v).toLowerCase())
        .join(' | ');

      return hay.includes(term);
    });

    this.paymentsSubject.next(filtered);
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
