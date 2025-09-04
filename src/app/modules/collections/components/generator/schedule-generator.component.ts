import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { 
  LucideAngularModule, 
  Search, 
  Calculator, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-angular';
import { CollectionsSimplifiedService, ContractWithSchedules } from '../../services/collections-simplified.service';
import { GenerateScheduleRequest, GenerateScheduleResponse } from '../../models/payment-schedule';

@Component({
  selector: 'app-schedule-generator',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center space-x-4">
        <button 
          routerLink="/collections/dashboard"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <lucide-angular [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-angular>
        </button>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Generador de Cronogramas</h1>
          <p class="text-gray-600 mt-1">Crear cronogramas de pago para contratos</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Contract Selection -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Seleccionar Contrato</h2>
          
          <!-- Search Contract -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Contrato</label>
            <div class="relative">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-angular>
              <input
                type="text"
                [ngModel]="searchTerm()"
                (input)="onSearchChange($event)"
                placeholder="Buscar por número de contrato, cliente o lote..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <!-- Contract List -->
          @if (isLoadingContracts()) {
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-gray-600 mt-2">Buscando contratos...</p>
            </div>
          } @else if (filteredContracts().length > 0) {
            <div class="space-y-2 max-h-64 overflow-y-auto">
              @for (contract of filteredContracts(); track contract.contract_id) {
                <div 
                  (click)="selectContract(contract)"
                  [class]="selectedContract()?.contract_id === contract.contract_id ? 
                    'bg-blue-50 border-blue-200 cursor-pointer p-3 border rounded-lg' : 
                    'bg-gray-50 hover:bg-gray-100 cursor-pointer p-3 border border-gray-200 rounded-lg'"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-900">{{ contract.contract_number }}</p>
                      <p class="text-sm text-gray-600">{{ contract.client_name }}</p>
                      <p class="text-xs text-gray-500">Lote: {{ contract.lot_name }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">{{ formatCurrency(contract.financing_amount || 0) }}</p>
                      <p class="text-xs text-gray-500">{{ contract.term_months || 0 }} meses</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-500">
              <lucide-angular [img]="FileTextIcon" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-angular>
              <p>No se encontraron contratos</p>
              @if (searchTerm()) {
                <p class="text-sm">Intenta con otros términos de búsqueda</p>
              }
            </div>
          }
        </div>

        <!-- Schedule Configuration -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Configuración del Cronograma</h2>
          
          @if (selectedContract()) {
            <form [formGroup]="scheduleForm" (ngSubmit)="generateSchedule()" class="space-y-4">
              <!-- Contract Details -->
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-medium text-blue-900 mb-2">Detalles del Contrato</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-blue-700">Cliente:</span>
                    <p class="font-medium text-blue-900">{{ selectedContract()!.client_name }}</p>
                  </div>
                  <div>
                    <span class="text-blue-700">Lote:</span>
                    <p class="font-medium text-blue-900">{{ selectedContract()!.lot_name }}</p>
                  </div>
                  <div>
                    <span class="text-blue-700">Monto a Financiar:</span>
                    <p class="font-medium text-blue-900">{{ formatCurrency(selectedContract()!.financing_amount || 0) }}</p>
                  </div>
                  <div>
                    <span class="text-blue-700">Plazo:</span>
                    <p class="font-medium text-blue-900">{{ selectedContract()!.term_months }} meses</p>
                  </div>
                </div>
              </div>

              <!-- Schedule Parameters -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
                  <input
                    type="date"
                    formControlName="start_date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  @if (scheduleForm.get('start_date')?.invalid && scheduleForm.get('start_date')?.touched) {
                    <p class="text-red-600 text-xs mt-1">La fecha de inicio es requerida</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Pago</label>
                  <select
                    formControlName="frequency"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              <!-- Payment Calculation -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3 flex items-center">
                  <lucide-angular [img]="CalculatorIcon" class="w-4 h-4 mr-2"></lucide-angular>
                  Cálculo de Cuotas
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Cuota Mensual:</span>
                    <p class="font-semibold text-gray-900">{{ formatCurrency(calculatedMonthlyPayment()) }}</p>
                  </div>
                  <div>
                    <span class="text-gray-600">Total de Cuotas:</span>
                    <p class="font-semibold text-gray-900">{{ selectedContract()!.term_months }}</p>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notas (Opcional)</label>
                <textarea
                  formControlName="notes"
                  rows="3"
                  placeholder="Agregar notas sobre el cronograma..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4">
                <button
                  type="submit"
                  [disabled]="scheduleForm.invalid || isGenerating()"
                  class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  @if (isGenerating()) {
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generando...</span>
                  } @else {
                    <lucide-angular [img]="CalendarIcon" class="w-4 h-4"></lucide-angular>
                    <span>Generar Cronograma</span>
                  }
                </button>
                <button
                  type="button"
                  (click)="clearSelection()"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Limpiar
                </button>
              </div>
            </form>
          } @else {
            <div class="text-center py-12 text-gray-500">
              <lucide-angular [img]="FileTextIcon" class="w-12 h-12 mx-auto mb-4 text-gray-400"></lucide-angular>
              <p class="text-lg font-medium">Selecciona un Contrato</p>
              <p class="text-sm">Elige un contrato de la lista para configurar su cronograma de pagos</p>
            </div>
          }
        </div>
      </div>

      <!-- Success/Error Messages -->
      @if (successMessage()) {
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <lucide-angular [img]="CheckCircleIcon" class="w-5 h-5 text-green-600"></lucide-angular>
          <div>
            <p class="text-green-800 font-medium">{{ successMessage() }}</p>
            <button 
              (click)="viewGeneratedSchedule()"
              class="text-green-600 hover:text-green-800 text-sm underline mt-1"
            >
              Ver cronograma generado
            </button>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <lucide-angular [img]="AlertCircleIcon" class="w-5 h-5 text-red-600"></lucide-angular>
          <p class="text-red-800">{{ errorMessage() }}</p>
        </div>
      }
    </div>
  `
})
export class ScheduleGeneratorComponent implements OnInit {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  CalculatorIcon = Calculator;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  FileTextIcon = FileText;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  ArrowLeftIcon = ArrowLeft;

  // Signals
  contracts = signal<ContractWithSchedules[]>([]);
  selectedContract = signal<ContractWithSchedules | null>(null);
  isLoadingContracts = signal(false);
  isGenerating = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  searchTerm = signal('');
  generatedScheduleId: string | null = null;

  // Form
  scheduleForm: FormGroup;

  // Computed
  filteredContracts = computed(() => {
    const searchValue = this.searchTerm().trim();
    if (!searchValue) {
      return this.contracts();
    }
    
    const term = searchValue.toLowerCase();
    return this.contracts().filter(contract => 
      contract.contract_number.toLowerCase().includes(term) ||
      contract.client_name.toLowerCase().includes(term) ||
      contract.lot_name.toLowerCase().includes(term)
    );
  });

  calculatedMonthlyPayment = computed(() => {
    const contract = this.selectedContract();
    if (!contract || !contract.financing_amount || !contract.term_months) return 0;
    
    return contract.financing_amount / contract.term_months;
  });

  constructor() {
    this.scheduleForm = this.fb.group({
      start_date: [this.getDefaultStartDate(), Validators.required],
      frequency: ['monthly', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadContracts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContracts() {
    this.isLoadingContracts.set(true);
    this.errorMessage.set(null);
    
    // Load all contracts by setting a high per_page value
    this.collectionsService.getContractsWithFinancing({ per_page: 1000 })
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading contracts:', error);
          this.errorMessage.set('Error al cargar los contratos');
          return of({ data: [], meta: {} });
        })
      )
      .subscribe({
        next: (response) => {
          this.contracts.set(response.data || []);
          this.isLoadingContracts.set(false);
        },
        error: () => {
          this.isLoadingContracts.set(false);
        }
      });
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value);
  }

  selectContract(contract: ContractWithSchedules) {
    this.selectedContract.set(contract);
    // Actualizar la fecha de inicio basada en la fecha de venta del contrato
    this.scheduleForm.patchValue({
      start_date: this.getDefaultStartDate(contract)
    });
    this.clearMessages();
  }

  clearSelection() {
    this.selectedContract.set(null);
    this.scheduleForm.patchValue({
      start_date: this.getDefaultStartDate(),
      frequency: 'monthly',
      notes: ''
    });
    this.clearMessages();
  }

  generateSchedule() {
    if (this.scheduleForm.invalid || !this.selectedContract()) {
      return;
    }

    this.isGenerating.set(true);
    this.clearMessages();

    const formValue = this.scheduleForm.value;
    const contract = this.selectedContract()!;

    const request = {
      start_date: formValue.start_date,
      frequency: formValue.frequency,
      notes: formValue.notes
    };

    this.collectionsService.generateContractSchedule(contract.contract_id, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error generating schedule:', error);
          this.errorMessage.set('Error al generar el cronograma de pagos');
          return of(null);
        })
      )
      .subscribe(
        (response) => {
          if (response && response.success) {
            this.generatedScheduleId = contract.contract_id.toString();
            this.successMessage.set(`Cronograma generado exitosamente para el contrato ${contract.contract_number}`);
            // Reload contracts to get updated data with new schedule
            this.loadContracts();
            // Clear selection but keep success message
            this.selectedContract.set(null);
            this.scheduleForm.patchValue({
              start_date: this.getDefaultStartDate(),
              frequency: 'monthly',
              notes: ''
            });
            // Only clear error message, keep success message
            this.errorMessage.set(null);
          }
          this.isGenerating.set(false);
        },
        () => {
          this.isGenerating.set(false);
        }
      );
  }

  viewGeneratedSchedule() {
    if (this.generatedScheduleId) {
      this.router.navigate(['/collections/schedules', this.generatedScheduleId]);
    }
  }

  private getDefaultStartDate(contract?: ContractWithSchedules): string {
    if (contract && contract.sign_date) {
      // Usar la fecha de venta del contrato como base
      const signDate = new Date(contract.sign_date);
      // Iniciar cronograma el primer día del mes siguiente a la fecha de venta
      const nextMonth = new Date(signDate.getFullYear(), signDate.getMonth() + 1, 1);
      return nextMonth.toISOString().split('T')[0];
    }
    
    // Fallback: usar la fecha actual si no hay contrato seleccionado
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  }

  private clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }
}