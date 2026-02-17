import { Component, EventEmitter, Output, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationsService } from '../../../services/reservations.service';
import { ActivatedRoute } from '@angular/router';
import { ModalService } from '../../../../../core/services/modal.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

// Importar servicios necesarios
import { ClientsService } from '../../../../CRM/services/clients.service';
import { ManzanasService } from '../../../../inventory/services/manzanas.service';
import { LotService } from '../../../../inventory/services/lot.service';
import { EmployeeService } from '../../../../humanResources/services/employee.service';

// Importar modelos
import { Client } from '../../../../CRM/models/client';
import { Manzana } from '../../../../inventory/models/manzana';
import { Lot } from '../../../../inventory/models/lot';
import { Employee } from '../../../../humanResources/models/employee';

@Component({
  selector: 'app-reservation-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
})
export class ReservationFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  editingId?: number;
  submitting = signal(false);

  // Signals para los datos de los dropdowns
  clients = signal<Client[]>([]);
  manzanas = signal<Manzana[]>([]);
  lots = signal<Lot[]>([]);
  advisors = signal<Employee[]>([]);

  // Signals para estados de carga
  loadingClients = signal(false);
  loadingManzanas = signal(false);
  loadingLots = signal(false);
  loadingAdvisors = signal(false);

  @Output() submitForm = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  depositMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'deposito', label: 'Depósito bancario' },
  ];

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationsService,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private clientsService: ClientsService,
    private manzanasService: ManzanasService,
    private lotService: LotService,
    private employeeService: EmployeeService
  ) {
    const today = new Date().toISOString().split('T')[0];
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    const expirationStr = expiration.toISOString().split('T')[0];

    this.form = this.fb.group({
      client_id: ['', Validators.required],
      manzana_id: [''],
      lot_id: ['', Validators.required],
      advisor_id: ['', Validators.required],
      reservation_date: [today, Validators.required],
      expiration_date: [expirationStr, Validators.required],
      deposit_amount: [100, [Validators.required, Validators.min(0)]],
      deposit_method: [''],
      deposit_reference: [''],
      status: ['pendiente_pago'],
    });
  }

  ngOnInit() {
    this.loadClients();
    this.loadManzanas();
    this.loadAdvisors();

    // Filtrar lotes cuando cambie la manzana
    this.form.get('manzana_id')?.valueChanges.subscribe(manzanaId => {
      if (manzanaId) {
        this.loadLotsByManzana(manzanaId);
        this.form.get('lot_id')?.setValue('');
      } else {
        this.lots.set([]);
      }
    });

    // Modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.reservationService.get(this.editingId).subscribe((r) => {
        // Si hay un lote con manzana, cargar lotes de esa manzana primero
        if (r.lot?.manzana?.manzana_id) {
          this.form.get('manzana_id')?.setValue(r.lot.manzana.manzana_id, { emitEvent: false });
          this.loadLotsByManzana(r.lot.manzana.manzana_id);
        }
        this.form.patchValue({
          client_id: r.client_id,
          lot_id: r.lot_id,
          advisor_id: r.advisor_id,
          reservation_date: r.reservation_date,
          expiration_date: r.expiration_date,
          deposit_amount: r.deposit_amount,
          deposit_method: r.deposit_method || '',
          deposit_reference: r.deposit_reference || '',
          status: r.status,
        });
      });
    }
  }

  private loadClients(): void {
    this.loadingClients.set(true);
    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loadingClients.set(false);
      },
      error: () => this.loadingClients.set(false),
    });
  }

  private loadManzanas(): void {
    this.loadingManzanas.set(true);
    this.manzanasService.list().subscribe({
      next: (manzanas) => {
        this.manzanas.set(manzanas);
        this.loadingManzanas.set(false);
      },
      error: () => this.loadingManzanas.set(false),
    });
  }

  private loadLotsByManzana(manzanaId: number): void {
    this.loadingLots.set(true);
    this.lotService.paginate({ manzana_id: manzanaId, status: 'disponible' }).subscribe({
      next: (response) => {
        this.lots.set(response.data);
        this.loadingLots.set(false);
      },
      error: () => this.loadingLots.set(false),
    });
  }

  private loadAdvisors(): void {
    this.loadingAdvisors.set(true);
    this.employeeService.getAllEmployees({ employee_type: 'asesor_inmobiliario' }).subscribe({
      next: (response) => {
        this.advisors.set(response.data);
        this.loadingAdvisors.set(false);
      },
      error: () => this.loadingAdvisors.set(false),
    });
  }

  getClientDisplayName(client: Client): string {
    return `${client.first_name} ${client.last_name}`;
  }

  getManzanaDisplayName(manzana: Manzana): string {
    return manzana.name;
  }

  getLotDisplayName(lot: Lot): string {
    return `Lote ${lot.num_lot} - ${lot.area_m2}m²`;
  }

  getAdvisorDisplayName(advisor: Employee): string {
    return advisor.full_name || `${advisor.first_name ?? ''} ${advisor.last_name ?? ''}`.trim() || 'Sin nombre';
  }

  submit() {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);

    const v = this.form.getRawValue();

    const payload: any = {
      lot_id: +v.lot_id,
      client_id: +v.client_id,
      advisor_id: +v.advisor_id,
      reservation_date: v.reservation_date,
      expiration_date: v.expiration_date,
      deposit_amount: +v.deposit_amount,
      status: v.status,
    };

    if (v.deposit_method) payload.deposit_method = v.deposit_method;
    if (v.deposit_reference) payload.deposit_reference = v.deposit_reference;

    const req$ = this.isEditMode && this.editingId
      ? this.reservationService.update(this.editingId, payload)
      : this.reservationService.create(payload);

    req$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitForm.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Error saving reservation:', err);
      },
    });
  }

  cancel() {
    this.modalClosed.emit();
  }
}
