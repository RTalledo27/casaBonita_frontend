import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { ReservationsService } from '../services/reservations.service';
import { CommonModule } from '@angular/common';
import { ReservationFormComponent } from './components/reservation-form/reservation-form.component';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LotImportService } from '../../inventory/services/lot-import.service';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { BehaviorSubject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { Reservation } from '../models/reservation';

@Component({
  selector: 'app-reservations',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    PaginationComponent,
    RouterOutlet,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent {
  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  reservations$ = this.reservationsSubject.asObservable();
  loading = false;

  searchTerm = '';
  statusFilter = '';

  pagination = {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 15,
  };

  plus = Plus;
  isModalOpen = false;

  // Modales de acción
  showConfirmPaymentModal = signal(false);
  showConvertModal = signal(false);
  selectedReservation = signal<Reservation | null>(null);
  actionLoading = signal(false);

  // Form para confirmar pago
  confirmPaymentForm: FormGroup;

  // Form para convertir a contrato
  convertForm: FormGroup;

  depositMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'deposito', label: 'Depósito bancario' },
  ];

  // Template financiero del lote
  loadingTemplate = signal(false);
  templateLoaded = signal(false);
  templateInfo = signal<string>('');

  constructor(
    private reservationService: ReservationsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    private lotImportService: LotImportService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.confirmPaymentForm = this.fb.group({
      deposit_method: ['', Validators.required],
      deposit_reference: [''],
    });

    this.convertForm = this.fb.group({
      contract_number: ['', Validators.required],
      sign_date: [new Date().toISOString().split('T')[0], Validators.required],
      total_price: ['', [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      currency: ['PEN', Validators.required],
      down_payment: ['', [Validators.required, Validators.min(0)]],
      financing_amount: ['', [Validators.required, Validators.min(0)]],
      interest_rate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      term_months: [12, [Validators.required, Validators.min(1), Validators.max(360)]],
      monthly_payment: [''],
      // Campos financieros adicionales
      balloon_payment: [0],
      bpp: [0],
      bfh: [0],
      // Generación de cronograma
      auto_generate_schedule: [true],
      schedule_start_date: [''],
      schedule_frequency: ['monthly'],
    });
  }

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations(page: number = 1) {
    this.loading = true;
    this.reservationService
      .list({
        page,
        per_page: this.pagination.perPage,
        search: this.searchTerm?.trim() || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.reservationsSubject.next(res.data ?? []);
          this.pagination = {
            currentPage: res.meta?.current_page || page,
            totalPages: res.meta?.last_page || 1,
            total: res.meta?.total || 0,
            perPage: res.meta?.per_page || this.pagination.perPage,
          };
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.reservationsSubject.next([]);
          this.pagination = { ...this.pagination, currentPage: 1, totalPages: 1, total: 0 };
        },
      });
  }

  // Helpers de estado
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente_pago: 'Pendiente de pago',
      completada: 'Completada',
      cancelada: 'Cancelada',
      convertida: 'Convertida',
    };
    return map[status] || status;
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      pendiente_pago: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      convertida: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getClientName(r: Reservation): string {
    return r.client ? `${r.client.first_name} ${r.client.last_name}` : '-';
  }

  getAdvisorName(r: Reservation): string {
    return r.advisor ? `${r.advisor.first_name} ${r.advisor.last_name}` : '-';
  }

  getDaysRemaining(r: Reservation): number | null {
    if (!r.expiration_date || r.status !== 'pendiente_pago') return null;
    const exp = new Date(r.expiration_date);
    const now = new Date();
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Filtros
  onSearchChange(): void {
    this.pagination.currentPage = 1;
    this.loadReservations(1);
  }

  onStatusChange(): void {
    this.pagination.currentPage = 1;
    this.loadReservations(1);
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.loadReservations(page);
  }

  // CRUD modal (crear/editar)
  onCreate() {
    this.modalService.open(['create'], this.route);
    this.isModalOpen = true;
  }

  onEdit(id: number) {
    this.modalService.open([id.toString(), 'edit'], this.route);
    this.isModalOpen = true;
  }

  // Confirmar pago
  openConfirmPayment(reservation: Reservation) {
    this.selectedReservation.set(reservation);
    this.confirmPaymentForm.reset({ deposit_method: '', deposit_reference: '' });
    this.showConfirmPaymentModal.set(true);
  }

  submitConfirmPayment() {
    if (this.confirmPaymentForm.invalid || this.actionLoading()) return;
    const res = this.selectedReservation();
    if (!res) return;

    this.actionLoading.set(true);
    this.reservationService.confirmPayment(res.reservation_id, this.confirmPaymentForm.value).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showConfirmPaymentModal.set(false);
        this.loadReservations(this.pagination.currentPage);
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Error confirming payment:', err);
      },
    });
  }

  // Convertir a contrato
  openConvert(reservation: Reservation) {
    this.selectedReservation.set(reservation);
    const lot = reservation.lot;
    const today = new Date().toISOString().split('T')[0];
    // Fecha de inicio del cronograma: un mes después de la firma
    const scheduleStart = new Date();
    scheduleStart.setMonth(scheduleStart.getMonth() + 1);
    const scheduleStartStr = scheduleStart.toISOString().split('T')[0];

    this.templateLoaded.set(false);
    this.templateInfo.set('');

    this.convertForm.reset({
      contract_number: '',
      sign_date: today,
      total_price: lot?.price || '',
      discount: 0,
      currency: 'PEN',
      down_payment: reservation.deposit_amount || '',
      financing_amount: lot?.price ? (lot.price - (reservation.deposit_amount || 0)) : '',
      interest_rate: 0,
      term_months: 12,
      monthly_payment: '',
      balloon_payment: 0,
      bpp: 0,
      bfh: 0,
      auto_generate_schedule: true,
      schedule_start_date: scheduleStartStr,
      schedule_frequency: 'monthly',
    });
    this.actionLoading.set(false);
    this.showConvertModal.set(true);

    // Cargar template financiero del lote automáticamente
    if (lot?.lot_id) {
      this.loadLotFinancialTemplate(lot.lot_id);
    }
  }

  private parseMoneyValue(value: any): number {
    if (!value) return 0;
    const cleanValue = String(value).replace(/[S\/\$,\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  private loadLotFinancialTemplate(lotId: number) {
    this.loadingTemplate.set(true);
    this.lotImportService.getLotFinancialTemplate(lotId).subscribe({
      next: (response: any) => {
        this.loadingTemplate.set(false);
        if (response?.success && response.data) {
          const template = response.data;

          // Obtener installment y plazo del template
          const { monthlyPayment, termMonths } = this.getInstallmentFromTemplate(template);

          // Obtener precio del template
          const templatePrice = this.parseMoneyValue(template.precio_venta) || this.parseMoneyValue(template.precio_lista);
          const currentPrice = +this.convertForm.get('total_price')?.value || 0;
          const finalPrice = templatePrice > 0 ? templatePrice : currentPrice;

          const initialPayment = this.parseMoneyValue(template.cuota_inicial);
          const financedAmount = Math.max(0, finalPrice - initialPayment);

          this.convertForm.patchValue({
            total_price: finalPrice,
            discount: this.parseMoneyValue(template.descuento) || 0,
            down_payment: initialPayment,
            financing_amount: financedAmount,
            interest_rate: 0,
            term_months: termMonths,
            monthly_payment: monthlyPayment,
          });

          this.templateLoaded.set(true);
          this.templateInfo.set(`Template cargado: ${termMonths} meses a S/ ${monthlyPayment.toFixed(2)}/mes`);
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loadingTemplate.set(false);
        this.templateInfo.set('');
        // Sin template: mantener valores manuales, recalcular cuota
        this.calculateMonthlyPayment();
      },
    });
  }

  private getInstallmentFromTemplate(template: any): { monthlyPayment: number; termMonths: number } {
    const availableInstallments = [
      { months: 24, amount: template.installments_24 },
      { months: 40, amount: template.installments_40 },
      { months: 44, amount: template.installments_44 },
      { months: 55, amount: template.installments_55 },
    ].filter(inst => {
      const amount = this.parseMoneyValue(inst.amount);
      return !isNaN(amount) && amount > 0;
    });

    if (availableInstallments.length === 0) {
      return { monthlyPayment: 0, termMonths: 24 };
    }

    // Priorizar: 40, 44, 24, 55 meses
    const priorityOrder = [40, 44, 24, 55];
    for (const priority of priorityOrder) {
      const found = availableInstallments.find(inst => inst.months === priority);
      if (found) {
        return { monthlyPayment: this.parseMoneyValue(found.amount), termMonths: found.months };
      }
    }

    const first = availableInstallments[0];
    return { monthlyPayment: this.parseMoneyValue(first.amount), termMonths: first.months };
  }

  onTotalPriceOrDownPaymentChange() {
    const total = +this.convertForm.get('total_price')?.value || 0;
    const discount = +this.convertForm.get('discount')?.value || 0;
    const down = +this.convertForm.get('down_payment')?.value || 0;
    const effectivePrice = Math.max(0, total - discount);
    this.convertForm.get('financing_amount')?.setValue(Math.max(0, effectivePrice - down), { emitEvent: false });

    // Si hay descuento, forzar recálculo de cuota mensual incluso con template cargado
    if (discount > 0) {
      this.recalculateMonthlyFromFinancing();
    } else {
      this.calculateMonthlyPayment();
    }
  }

  private recalculateMonthlyFromFinancing() {
    const financing = +this.convertForm.get('financing_amount')?.value || 0;
    const rate = +this.convertForm.get('interest_rate')?.value || 0;
    const months = +this.convertForm.get('term_months')?.value || 1;

    if (financing <= 0 || months <= 0) {
      this.convertForm.get('monthly_payment')?.setValue(0);
      return;
    }

    if (rate === 0) {
      this.convertForm.get('monthly_payment')?.setValue(+(financing / months).toFixed(2));
    } else {
      const monthlyRate = rate / 100 / 12;
      const payment = financing * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      this.convertForm.get('monthly_payment')?.setValue(+payment.toFixed(2));
    }
  }

  calculateMonthlyPayment() {
    // No recalcular si el template ya cargó un valor
    if (this.templateLoaded()) return;

    const financing = +this.convertForm.get('financing_amount')?.value || 0;
    const rate = +this.convertForm.get('interest_rate')?.value || 0;
    const months = +this.convertForm.get('term_months')?.value || 1;

    if (financing <= 0 || months <= 0) {
      this.convertForm.get('monthly_payment')?.setValue(0);
      return;
    }

    if (rate === 0) {
      this.convertForm.get('monthly_payment')?.setValue(+(financing / months).toFixed(2));
    } else {
      const monthlyRate = rate / 100 / 12;
      const payment = financing * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      this.convertForm.get('monthly_payment')?.setValue(+payment.toFixed(2));
    }
  }

  getInvalidControls(): string[] {
    const invalid: string[] = [];
    const labels: Record<string, string> = {
      contract_number: 'Nº Contrato',
      sign_date: 'Fecha firma',
      total_price: 'Precio total',
      down_payment: 'Cuota inicial',
      financing_amount: 'Monto financiado',
      interest_rate: 'Tasa anual',
      term_months: 'Plazo',
    };
    Object.keys(this.convertForm.controls).forEach(key => {
      if (this.convertForm.get(key)?.invalid) {
        invalid.push(labels[key] || key);
      }
    });
    return invalid;
  }

  submitConvert() {
    if (this.convertForm.invalid || this.actionLoading()) return;
    const res = this.selectedReservation();
    if (!res) return;

    this.actionLoading.set(true);

    const formValue = { ...this.convertForm.value };
    const autoGenerate = formValue.auto_generate_schedule;
    delete formValue.auto_generate_schedule;

    // Solo enviar schedule_start_date y schedule_frequency si auto_generate está activado
    if (!autoGenerate) {
      delete formValue.schedule_start_date;
      delete formValue.schedule_frequency;
    }

    // Limpiar campos opcionales con valor 0 para no enviar basura
    ['balloon_payment', 'bpp', 'bfh'].forEach(field => {
      if (!formValue[field] || formValue[field] === 0) {
        formValue[field] = 0;
      }
    });

    this.reservationService.convert(res.reservation_id, formValue).subscribe({
      next: (contract) => {
        this.actionLoading.set(false);
        this.showConvertModal.set(false);
        this.toast.success('Contrato creado exitosamente');
        this.loadReservations(this.pagination.currentPage);
        // Navegar al contrato creado
        if (contract?.contract_id) {
          this.router.navigate(['/sales/contracts', contract.contract_id]);
        }
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Error converting reservation:', err);
        // El toast de error lo maneja el errorInterceptor automáticamente
      },
    });
  }

  // Eliminar
  onDelete(reservation: Reservation) {
    if (!confirm(`¿Estás seguro de eliminar la reserva #${reservation.reservation_id}?`)) return;
    this.reservationService.delete(reservation.reservation_id).subscribe({
      next: () => this.loadReservations(this.pagination.currentPage),
      error: (err) => console.error('Error deleting reservation:', err),
    });
  }

  // Modal outlet handlers
  onModalActivate(component: any) {
    if (component instanceof ReservationFormComponent) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadReservations();
      });
      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadReservations();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
