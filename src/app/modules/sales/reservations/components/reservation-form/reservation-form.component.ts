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

// Importar modelos
import { Client } from '../../../../CRM/models/client';
import { Manzana } from '../../../../inventory/models/manzana';
import { Lot } from '../../../../inventory/models/lot';

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

  // Signals para los datos de los dropdowns
  clients = signal<Client[]>([]);
  manzanas = signal<Manzana[]>([]);
  lots = signal<Lot[]>([]);
  
  // Signals para estados de carga
  loadingClients = signal<boolean>(false);
  loadingManzanas = signal<boolean>(false);
  loadingLots = signal<boolean>(false);

  @Output() submitForm = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationsService,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private clientsService: ClientsService,
    private manzanasService: ManzanasService,
    private lotService: LotService
  ) {
    this.form = this.fb.group({
      client_id: ['', Validators.required],
      manzana_id: ['', Validators.required],
      lot_id: ['', Validators.required],
      date: ['', Validators.required],
      status: ['pending'],
    });
  }

  ngOnInit() {
    // Cargar datos iniciales
    this.loadClients();
    this.loadManzanas();
    
    // Configurar listener para cambios en manzana
    this.form.get('manzana_id')?.valueChanges.subscribe(manzanaId => {
      if (manzanaId) {
        this.loadLotsByManzana(manzanaId);
        // Limpiar selección de lote cuando cambie la manzana
        this.form.get('lot_id')?.setValue('');
      } else {
        this.lots.set([]);
      }
    });

    // Verificar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.reservationService
        .get(this.editingId)
        .subscribe((r) => this.form.patchValue(r));
    }
  }

  private loadClients(): void {
    this.loadingClients.set(true);
    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loadingClients.set(false);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loadingClients.set(false);
      }
    });
  }

  private loadManzanas(): void {
    this.loadingManzanas.set(true);
    this.manzanasService.list().subscribe({
      next: (manzanas) => {
        this.manzanas.set(manzanas);
        this.loadingManzanas.set(false);
      },
      error: (error) => {
        console.error('Error loading manzanas:', error);
        this.loadingManzanas.set(false);
      }
    });
  }

  private loadLotsByManzana(manzanaId: number): void {
    this.loadingLots.set(true);
    this.lotService.paginate({
      manzana_id: manzanaId,
      status: 'disponible'
    }).subscribe({
      next: (response) => {
        this.lots.set(response.data);
        this.loadingLots.set(false);
      },
      error: (error) => {
        console.error('Error loading lots:', error);
        this.loadingLots.set(false);
      }
    });
  }

  // Métodos helper para obtener nombres para mostrar
  getClientDisplayName(client: Client): string {
    return `${client.first_name} ${client.last_name}`;
  }

  getManzanaDisplayName(manzana: Manzana): string {
    return manzana.name;
  }

  getLotDisplayName(lot: Lot): string {
    return `Lote ${lot.num_lot} - ${lot.area_m2}m²`;
  }

  submit() {
    if (this.form.invalid) return;
    
    const formData = this.form.getRawValue();
    const fd = new FormData();
    
    // Convertir los IDs a los nombres para compatibilidad con la API actual
    const selectedClient = this.clients().find(c => c.client_id == formData.client_id);
    const selectedLot = this.lots().find(l => l.lot_id == formData.lot_id);
    
    if (selectedClient) {
      fd.append('client_name', this.getClientDisplayName(selectedClient));
    }
    if (selectedLot) {
      fd.append('lot_name', this.getLotDisplayName(selectedLot));
    }
    
    // Agregar otros campos
    fd.append('date', formData.date);
    fd.append('status', formData.status);
    
    if (this.isEditMode) fd.append('_method', 'PATCH');
    
    const req$ =
      this.isEditMode && this.editingId
        ? this.reservationService.update(this.editingId, fd)
        : this.reservationService.create(fd);
        
    req$.subscribe(() => {
      this.submitForm.emit();
    });
  }

  cancel() {
    console.log('🔴 Cancel button clicked - START');
    console.log('🔴 About to emit modalClosed event');
    this.modalClosed.emit();
    console.log('🔴 modalClosed event emitted - END');
  }
}
