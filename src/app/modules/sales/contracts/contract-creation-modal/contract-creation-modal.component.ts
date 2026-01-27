import { Component, EventEmitter, Input, OnInit, Output, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Client } from '../../../CRM/models/client';
import { Lot } from '../../../inventory/models/lot';
import { Manzana } from '../../../inventory/models/manzana';
import { ClientsService } from '../../../CRM/services/clients.service';
import { ManzanasService } from '../../../inventory/services/manzanas.service';
import { LotService } from '../../../inventory/services/lot.service';
import { LotImportService } from '../../../inventory/services/lot-import.service';
import { ContractsService } from '../../services/contracts.service';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

export interface ContractCreationData {
  client_id: number;
  lot_id: number;
  sign_date: string;
  total_price: number;
  initial_payment: number;
  financed_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  status: string;
  currency: string;
}

@Component({
  selector: 'app-contract-creation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contract-creation-modal.component.html',
  styleUrls: ['./contract-creation-modal.component.scss']
})
export class ContractCreationModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() contractCreated = new EventEmitter<any>();

  contractForm!: FormGroup;
  
  // Signals para el estado reactivo
  manzanas = signal<Manzana[]>([]);
  availableLots = signal<Lot[]>([]);
  clients = signal<Client[]>([]);
  filteredClients = signal<Client[]>([]);
  selectedClient = signal<Client | null>(null);
  selectedLot = signal<Lot | null>(null);
  
  // Estados de carga
  loadingManzanas = signal(false);
  loadingLots = signal(false);
  loadingClients = signal(false);
  creatingContract = signal(false);
  
  // Estados de UI
  showClientForm = signal(false);
  clientSearchTerm = signal('');
  
  // Formulario para nuevo cliente
  newClientForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private lotService: LotService,
    private lotImportService: LotImportService,
    private manzanasService: ManzanasService,
    private contractsService: ContractsService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadManzanas();
    this.loadClients();
    this.setupClientSearch();
  }

  private initializeForms() {
    this.contractForm = this.fb.group({
      manzana_id: ['', Validators.required],
      lot_id: ['', Validators.required],
      client_id: ['', Validators.required],
      sign_date: [new Date().toISOString().split('T')[0], Validators.required],
      total_price: [0, [Validators.required, Validators.min(1)]],
      initial_payment: [0, [Validators.required, Validators.min(0)]],
      financed_amount: [0, Validators.required],
      interest_rate: [0, [Validators.required, Validators.min(0)]],
      term_months: [12, [Validators.required, Validators.min(1)]],
      monthly_payment: [0, Validators.required],
      status: ['active', Validators.required],
      currency: ['S/.', Validators.required]
    });

    this.newClientForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      doc_type: ['DNI', Validators.required],
      doc_number: ['', Validators.required],
      email: [''],
      primary_phone: [''],
      secondary_phone: [''],
      type: ['client']
    });

    // Watchers para cálculos automáticos
    this.setupFormWatchers();
  }

  private setupFormWatchers() {
    let isUpdatingFromTemplate = false;
    
    // Calcular monto financiado automáticamente
    this.contractForm.get('total_price')?.valueChanges.subscribe(() => {
      if (!isUpdatingFromTemplate) {
        this.calculateFinancedAmount();
      }
    });
    
    this.contractForm.get('initial_payment')?.valueChanges.subscribe(() => {
      if (!isUpdatingFromTemplate) {
        this.calculateFinancedAmount();
      }
    });

    // Calcular cuota mensual automáticamente solo si no hay template financiero cargado
    this.contractForm.get('financed_amount')?.valueChanges.subscribe(() => {
      if (!isUpdatingFromTemplate) {
        // Solo recalcular si no hay una cuota mensual del template
        const currentMonthlyPayment = this.contractForm.get('monthly_payment')?.value || 0;
        if (currentMonthlyPayment === 0) {
          this.calculateMonthlyPayment();
        }
      }
    });
    
    this.contractForm.get('interest_rate')?.valueChanges.subscribe(() => {
      if (!isUpdatingFromTemplate) {
        // Solo recalcular si no hay una cuota mensual del template
        const currentMonthlyPayment = this.contractForm.get('monthly_payment')?.value || 0;
        if (currentMonthlyPayment === 0) {
          this.calculateMonthlyPayment();
        }
      }
    });
    
    // Guardar referencia para poder controlar las actualizaciones del template
    (this as any).setTemplateUpdating = (updating: boolean) => {
      isUpdatingFromTemplate = updating;
    };
    
    // Nota: term_months ya no tiene listener porque es readonly y se determina automáticamente
  }

  private setupClientSearch() {
    // Implementar búsqueda de clientes con debounce
    this.contractForm.get('client_search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          return of([]);
        }
        return this.searchClients(term);
      })
    ).subscribe(clients => {
      this.filteredClients.set(clients);
    });
  }

  private loadManzanas() {
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

  private loadClients() {
    this.loadingClients.set(true);
    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.filteredClients.set(clients.slice(0, 10)); // Mostrar solo los primeros 10
        this.loadingClients.set(false);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loadingClients.set(false);
      }
    });
  }

  onManzanaChange(manzanaId: number) {
    if (!manzanaId) {
      this.availableLots.set([]);
      return;
    }

    this.loadingLots.set(true);
    this.lotService.paginate({ 
      manzana_id: manzanaId, 
      status: 'disponible',
      per_page: 100 
    }).subscribe({
      next: (response) => {
        this.availableLots.set(response.data);
        this.loadingLots.set(false);
        
        // Reset lot selection
        this.contractForm.patchValue({ lot_id: '' });
        this.selectedLot.set(null);
      },
      error: (error) => {
        console.error('Error loading lots:', error);
        this.loadingLots.set(false);
      }
    });
  }

  onLotSelect(lot: Lot) {
    this.selectedLot.set(lot);
    
    // Cargar datos básicos del lote
    this.contractForm.patchValue({ 
      lot_id: lot.lot_id,
      total_price: lot.total_price || 0
    });
    
    // Cargar datos del financial template
    this.loadLotFinancialTemplate(lot.lot_id);
  }
  
  private loadLotFinancialTemplate(lotId: number) {
    this.lotImportService.getLotFinancialTemplate(lotId).subscribe({
      next: (response) => {
        console.log('Template financiero recibido:', response);
        if (response && response.success && response.data) {
          const template = response.data;
          
          // Función para limpiar y convertir valores monetarios
          const parseMoneyValue = (value: any): number => {
            if (!value) return 0;
            // Remover símbolos de moneda, comas y espacios, luego convertir a número
            const cleanValue = String(value).replace(/[S\/\$,\s]/g, '');
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? 0 : parsed;
          };
          
          // Obtener el installment y term_months apropiados
          const { monthlyPayment, termMonths } = this.getInstallmentFromTemplate(template);
          
          console.log('Valores calculados:', { monthlyPayment, termMonths });
          console.log('Valores del template:', {
            precio_venta: template.precio_venta,
            precio_lista: template.precio_lista,
            cuota_inicial: template.cuota_inicial
          });
          
          // Desactivar listeners temporalmente para evitar bucles
          (this as any).setTemplateUpdating(true);
          
          // Obtener precio total del template o mantener el del lote
          const templatePrice = parseMoneyValue(template.precio_venta) || parseMoneyValue(template.precio_lista);
          const currentPrice = this.contractForm.get('total_price')?.value || 0;
          
          // Actualizar formulario con datos del template financiero
          this.contractForm.patchValue({
            total_price: templatePrice > 0 ? templatePrice : currentPrice, // No sobrescribir con 0
            initial_payment: parseMoneyValue(template.cuota_inicial),
            interest_rate: 0, // Los templates no usan interest_rate, usan installments directos
            term_months: termMonths,
            monthly_payment: monthlyPayment
          });
          
          console.log('Valores del formulario después del patchValue:', {
            total_price: this.contractForm.get('total_price')?.value,
            initial_payment: this.contractForm.get('initial_payment')?.value,
            term_months: this.contractForm.get('term_months')?.value,
            monthly_payment: this.contractForm.get('monthly_payment')?.value
          });
          
          // Recalcular solo el monto financiado
          this.calculateFinancedAmount();
          
          console.log('Monto financiado después del cálculo:', this.contractForm.get('financed_amount')?.value);
          
          // Reactivar listeners
          (this as any).setTemplateUpdating(false);
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          
          console.log('Getters después de detectChanges:', {
            totalPrice: this.totalPrice,
            initialPayment: this.initialPayment,
            financedAmount: this.financedAmount,
            monthlyPayment: this.monthlyPayment
          });
          
          // Verificar valores después de un delay
          setTimeout(() => {
            console.log('Valores después de 1 segundo:', {
              formValues: {
                total_price: this.contractForm.get('total_price')?.value,
                initial_payment: this.contractForm.get('initial_payment')?.value,
                financed_amount: this.contractForm.get('financed_amount')?.value,
                monthly_payment: this.contractForm.get('monthly_payment')?.value,
                term_months: this.contractForm.get('term_months')?.value
              },
              getters: {
                totalPrice: this.totalPrice,
                initialPayment: this.initialPayment,
                financedAmount: this.financedAmount,
                monthlyPayment: this.monthlyPayment
              }
            });
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error loading financial template:', error);
        // Si no hay template, usar valores por defecto
        this.contractForm.patchValue({
          initial_payment: 0,
          interest_rate: 0,
          term_months: 24,
          monthly_payment: 0
        }, { emitEvent: false });
      }
    });
  }
  
  private getInstallmentFromTemplate(template: any): { monthlyPayment: number, termMonths: number } {
    // Función para limpiar y convertir valores monetarios
    const parseMoneyValue = (value: any): number => {
      if (!value) return 0;
      // Remover símbolos de moneda, comas y espacios, luego convertir a número
      const cleanValue = String(value).replace(/[S\/\$,\s]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    // Obtener todos los installments disponibles (que no sean null, undefined, 0 o vacío)
    const availableInstallments = [
      { months: 24, amount: template.installments_24 },
      { months: 40, amount: template.installments_40 },
      { months: 44, amount: template.installments_44 },
      { months: 55, amount: template.installments_55 }
    ].filter(installment => {
      const amount = parseMoneyValue(installment.amount);
      return !isNaN(amount) && amount > 0;
    });

    // Si no hay installments disponibles, retornar valores por defecto
    if (availableInstallments.length === 0) {
      console.warn('No hay installments configurados en el template financiero');
      return { monthlyPayment: 0, termMonths: 24 };
    }

    // Priorizar en el orden: 40, 44, 24, 55 meses
    const priorityOrder = [40, 44, 24, 55];
    
    for (const priorityMonths of priorityOrder) {
      const found = availableInstallments.find(inst => inst.months === priorityMonths);
      if (found) {
        const cleanAmount = parseMoneyValue(found.amount);
        console.log(`Usando installment de ${found.months} meses: ${found.amount}`);
        return { monthlyPayment: cleanAmount, termMonths: found.months };
      }
    }

    // Si no se encuentra ninguno en el orden de prioridad, usar el primero disponible
    const firstAvailable = availableInstallments[0];
    const cleanAmount = parseMoneyValue(firstAvailable.amount);
    console.log(`Usando primer installment disponible de ${firstAvailable.months} meses: ${firstAvailable.amount}`);
    return { monthlyPayment: cleanAmount, termMonths: firstAvailable.months };
  }

  onClientSelect(client: Client) {
    this.selectedClient.set(client);
    this.contractForm.patchValue({ client_id: client.client_id });
    this.showClientForm.set(false);
  }

  searchClients(term: string) {
    const allClients = this.clients();
    const filtered = allClients.filter(client => 
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      client.doc_number?.toLowerCase().includes(term.toLowerCase()) ||
      client.email?.toLowerCase().includes(term.toLowerCase())
    );
    return of(filtered.slice(0, 10));
  }

  toggleClientForm() {
    this.showClientForm.set(!this.showClientForm());
    if (this.showClientForm()) {
      this.newClientForm.reset({
        doc_type: 'DNI',
        type: 'client'
      });
    }
  }

  createNewClient() {
    if (this.newClientForm.valid) {
      const formData = new FormData();
      Object.keys(this.newClientForm.value).forEach(key => {
        const value = this.newClientForm.value[key];
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      this.clientsService.create(formData).subscribe({
        next: (newClient) => {
          // Agregar el nuevo cliente a la lista
          const currentClients = this.clients();
          this.clients.set([newClient, ...currentClients]);
          
          // Seleccionar el nuevo cliente
          this.onClientSelect(newClient);
          
          // Cerrar el formulario
          this.showClientForm.set(false);
        },
        error: (error) => {
          console.error('Error creating client:', error);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });
    }
  }

  private calculateFinancedAmount() {
    const totalPrice = this.contractForm.get('total_price')?.value || 0;
    const initialPayment = this.contractForm.get('initial_payment')?.value || 0;
    const financedAmount = Math.max(0, totalPrice - initialPayment);
    
    this.contractForm.patchValue({ financed_amount: financedAmount });
  }

  private calculateMonthlyPayment() {
    const financedAmount = this.contractForm.get('financed_amount')?.value || 0;
    const interestRate = this.contractForm.get('interest_rate')?.value || 0;
    const termMonths = this.contractForm.get('term_months')?.value || 1;
    const currentMonthlyPayment = this.contractForm.get('monthly_payment')?.value || 0;

    // Si ya hay una cuota mensual establecida desde el template, no recalcular
    if (currentMonthlyPayment > 0) {
      return;
    }

    if (financedAmount > 0 && interestRate > 0 && termMonths > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                           (Math.pow(1 + monthlyRate, termMonths) - 1);
      
      this.contractForm.patchValue({ monthly_payment: Math.round(monthlyPayment * 100) / 100 });
    } else if (financedAmount > 0 && interestRate === 0 && currentMonthlyPayment === 0) {
      // Sin interés y sin cuota mensual del template
      const monthlyPayment = financedAmount / termMonths;
      this.contractForm.patchValue({ monthly_payment: Math.round(monthlyPayment * 100) / 100 });
    }
  }

  onSubmit() {
    if (this.contractForm.valid && this.selectedClient() && this.selectedLot()) {
      this.creatingContract.set(true);
      
      const contractData = {
        ...this.contractForm.value,
        client_id: this.selectedClient()!.client_id,
        lot_id: this.selectedLot()!.lot_id
      };

      this.contractsService.create(contractData).subscribe({
        next: (contract) => {
          this.contractCreated.emit(contract);
          this.onClose();
          this.creatingContract.set(false);
        },
        error: (error) => {
          console.error('Error creating contract:', error);
          this.creatingContract.set(false);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });
    }
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  private resetForm() {
    this.contractForm.reset({
      sign_date: new Date().toISOString().split('T')[0],
      status: 'active',
      currency: 'S/.',
      term_months: 12
    });
    this.newClientForm.reset({
      doc_type: 'DNI',
      type: 'client'
    });
    
    this.selectedClient.set(null);
    this.selectedLot.set(null);
    this.availableLots.set([]);
    this.showClientForm.set(false);
  }

  // Getters para facilitar el acceso en el template
  get isFormValid(): boolean {
    return this.contractForm.valid && !!this.selectedClient() && !!this.selectedLot();
  }

  get totalPrice(): number {
    return this.contractForm.get('total_price')?.value || 0;
  }

  get initialPayment(): number {
    return this.contractForm.get('initial_payment')?.value || 0;
  }

  get financedAmount(): number {
    return this.contractForm.get('financed_amount')?.value || 0;
  }

  get monthlyPayment(): number {
    return this.contractForm.get('monthly_payment')?.value || 0;
  }

  // TrackBy function para optimizar el renderizado de lotes
  trackByLotId(index: number, lot: Lot): number {
    return lot.lot_id;
  }
}
