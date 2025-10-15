import { Component, OnInit, OnDestroy, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { Filter, X, Calendar, DollarSign, Users, Building, CreditCard, Search, Save, RotateCcw } from 'lucide-angular';

export interface AdvancedFilters {
  client_id?: string;
  client_name?: string;
  product_type?: string;
  amount_min?: number;
  amount_max?: number;
  collector_id?: string;
  payment_method?: string;
  contract_type?: string;
  risk_level?: string;
  days_overdue_min?: number;
  days_overdue_max?: number;
  created_date_from?: string;
  created_date_to?: string;
  last_payment_from?: string;
  last_payment_to?: string;
}

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div class="flex items-center gap-3">
          <lucide-angular [img]="FilterIcon" class="w-5 h-5 text-blue-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Filtros Avanzados</h3>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="saveCurrentFilters()"
            [disabled]="!hasActiveFilters()"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <lucide-angular [img]="SaveIcon" class="w-4 h-4"></lucide-angular>
            Guardar
          </button>
          
          <button 
            type="button"
            (click)="resetFilters()"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <lucide-angular [img]="RotateCcwIcon" class="w-4 h-4"></lucide-angular>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Saved Filters -->
      <div *ngIf="savedFilters().length > 0" class="space-y-3">
        <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Filtros Guardados</h4>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let preset of savedFilters()"
            (click)="loadFilterPreset(preset)"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {{ preset.name }}
            <button
              (click)="deleteFilterPreset(preset.id); $event.stopPropagation()"
              class="ml-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
            </button>
          </button>
        </div>
      </div>

      <!-- Filter Form -->
      <form [formGroup]="filtersForm" class="space-y-6">
        <!-- Client Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="UsersIcon" class="w-4 h-4 text-blue-600"></lucide-angular>
            Filtros de Cliente
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ID Cliente</label>
              <input 
                type="text" 
                formControlName="client_id"
                placeholder="Buscar por ID..."
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Cliente</label>
              <div class="relative">
                <input 
                  type="text" 
                  formControlName="client_name"
                  placeholder="Buscar por nombre..."
                  class="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"></lucide-angular>
              </div>
            </div>
          </div>
        </div>

        <!-- Amount Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="DollarSignIcon" class="w-4 h-4 text-green-600"></lucide-angular>
            Filtros de Monto
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto Mínimo</label>
              <input 
                type="number" 
                formControlName="amount_min"
                placeholder="0.00"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto Máximo</label>
              <input 
                type="number" 
                formControlName="amount_max"
                placeholder="999999.99"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
            </div>
          </div>

          <!-- Quick Amount Ranges -->
          <div class="flex flex-wrap gap-2">
            <span class="text-xs font-medium text-slate-600 dark:text-slate-400 py-2">Rangos rápidos:</span>
            <button
              *ngFor="let range of amountRanges"
              type="button"
              (click)="setAmountRange(range.min, range.max)"
              class="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-md transition-colors"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <!-- Business Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="BuildingIcon" class="w-4 h-4 text-purple-600"></lucide-angular>
            Filtros de Negocio
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Producto</label>
              <select 
                formControlName="product_type"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Todos los productos</option>
                <option value="loan">Préstamo</option>
                <option value="credit">Crédito</option>
                <option value="mortgage">Hipoteca</option>
                <option value="card">Tarjeta de Crédito</option>
                <option value="lease">Arrendamiento</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cobrador</label>
              <select 
                formControlName="collector_id"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Todos los cobradores</option>
                <option value="1">Juan Pérez</option>
                <option value="2">María García</option>
                <option value="3">Carlos López</option>
                <option value="4">Ana Martínez</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nivel de Riesgo</label>
              <select 
                formControlName="risk_level"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Todos los niveles</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Payment Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="CreditCardIcon" class="w-4 h-4 text-indigo-600"></lucide-angular>
            Filtros de Pago
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Método de Pago</label>
              <select 
                formControlName="payment_method"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Todos los métodos</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
                <option value="check">Cheque</option>
                <option value="online">Pago en línea</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Contrato</label>
              <select 
                formControlName="contract_type"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Todos los contratos</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporativo</option>
                <option value="government">Gubernamental</option>
                <option value="nonprofit">Sin fines de lucro</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Date Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="CalendarIcon" class="w-4 h-4 text-orange-600"></lucide-angular>
            Filtros de Fecha
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Creation Date Range -->
            <div class="space-y-3">
              <h5 class="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Creación</h5>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Desde</label>
                  <input 
                    type="date" 
                    formControlName="created_date_from"
                    class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
                  <input 
                    type="date" 
                    formControlName="created_date_to"
                    class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                </div>
              </div>
            </div>

            <!-- Last Payment Date Range -->
            <div class="space-y-3">
              <h5 class="text-sm font-medium text-slate-700 dark:text-slate-300">Último Pago</h5>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Desde</label>
                  <input 
                    type="date" 
                    formControlName="last_payment_from"
                    class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
                  <input 
                    type="date" 
                    formControlName="last_payment_to"
                    class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Overdue Filters -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <lucide-angular [img]="CalendarIcon" class="w-4 h-4 text-red-600"></lucide-angular>
            Filtros de Vencimiento
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Días Vencidos (Mín)</label>
              <input 
                type="number" 
                formControlName="days_overdue_min"
                placeholder="0"
                min="0"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Días Vencidos (Máx)</label>
              <input 
                type="number" 
                formControlName="days_overdue_max"
                placeholder="365"
                min="0"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
            </div>
          </div>

          <!-- Quick Overdue Ranges -->
          <div class="flex flex-wrap gap-2">
            <span class="text-xs font-medium text-slate-600 dark:text-slate-400 py-2">Rangos rápidos:</span>
            <button
              *ngFor="let range of overdueRanges"
              type="button"
              (click)="setOverdueRange(range.min, range.max)"
              class="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-md transition-colors"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
      </form>

      <!-- Active Filters Summary -->
      <div *ngIf="hasActiveFilters()" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Filtros Activos</h4>
        <div class="flex flex-wrap gap-2">
          <span
            *ngFor="let filter of getActiveFilters()"
            class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-full"
          >
            {{ filter.label }}: {{ filter.value }}
            <button
              (click)="removeFilter(filter.key)"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
            </button>
          </span>
        </div>
      </div>

      <!-- Apply Button -->
      <div class="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <button 
          type="button"
          (click)="applyFilters()"
          [disabled]="!hasActiveFilters()"
          class="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <lucide-angular [img]="FilterIcon" class="w-4 h-4"></lucide-angular>
          Aplicar Filtros Avanzados
        </button>
      </div>
    </div>
  `
})
export class AdvancedFiltersComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @Output() filtersChange = new EventEmitter<AdvancedFilters>();

  // Icons
  FilterIcon = Filter;
  XIcon = X;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  BuildingIcon = Building;
  CreditCardIcon = CreditCard;
  SearchIcon = Search;
  SaveIcon = Save;
  RotateCcwIcon = RotateCcw;

  // Form
  filtersForm: FormGroup;

  // Signals
  savedFilters = signal<any[]>([]);

  // Quick ranges
  amountRanges = [
    { label: '0 - 1K', min: 0, max: 1000 },
    { label: '1K - 5K', min: 1000, max: 5000 },
    { label: '5K - 10K', min: 5000, max: 10000 },
    { label: '10K - 50K', min: 10000, max: 50000 },
    { label: '50K+', min: 50000, max: null }
  ];

  overdueRanges = [
    { label: '1-30 días', min: 1, max: 30 },
    { label: '31-60 días', min: 31, max: 60 },
    { label: '61-90 días', min: 61, max: 90 },
    { label: '90+ días', min: 90, max: null }
  ];

  constructor() {
    this.filtersForm = this.fb.group({
      client_id: [''],
      client_name: [''],
      product_type: [''],
      amount_min: [null, [Validators.min(0)]],
      amount_max: [null, [Validators.min(0)]],
      collector_id: [''],
      payment_method: [''],
      contract_type: [''],
      risk_level: [''],
      days_overdue_min: [null, [Validators.min(0)]],
      days_overdue_max: [null, [Validators.min(0)]],
      created_date_from: [''],
      created_date_to: [''],
      last_payment_from: [''],
      last_payment_to: ['']
    });
  }

  ngOnInit() {
    // Watch for form changes
    this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Auto-emit changes (optional)
      // this.applyFilters();
    });

    // Load saved filters from localStorage
    this.loadSavedFilters();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasActiveFilters(): boolean {
    const values = this.filtersForm.value;
    return Object.values(values).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  }

  getActiveFilters(): Array<{key: string, label: string, value: string}> {
    const values = this.filtersForm.value;
    const activeFilters: Array<{key: string, label: string, value: string}> = [];

    const fieldLabels: {[key: string]: string} = {
      client_id: 'ID Cliente',
      client_name: 'Nombre Cliente',
      product_type: 'Tipo Producto',
      amount_min: 'Monto Mín',
      amount_max: 'Monto Máx',
      collector_id: 'Cobrador',
      payment_method: 'Método Pago',
      contract_type: 'Tipo Contrato',
      risk_level: 'Nivel Riesgo',
      days_overdue_min: 'Días Vencidos Mín',
      days_overdue_max: 'Días Vencidos Máx',
      created_date_from: 'Creado Desde',
      created_date_to: 'Creado Hasta',
      last_payment_from: 'Último Pago Desde',
      last_payment_to: 'Último Pago Hasta'
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        activeFilters.push({
          key,
          label: fieldLabels[key] || key,
          value: String(value)
        });
      }
    });

    return activeFilters;
  }

  removeFilter(key: string) {
    this.filtersForm.patchValue({ [key]: '' });
  }

  setAmountRange(min: number, max: number | null) {
    this.filtersForm.patchValue({
      amount_min: min,
      amount_max: max
    });
  }

  setOverdueRange(min: number, max: number | null) {
    this.filtersForm.patchValue({
      days_overdue_min: min,
      days_overdue_max: max
    });
  }

  resetFilters() {
    this.filtersForm.reset();
  }

  applyFilters() {
    if (this.filtersForm.valid) {
      const filters = this.filtersForm.value;
      // Remove empty values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key as keyof AdvancedFilters] = value;
        }
        return acc;
      }, {} as AdvancedFilters);

      this.filtersChange.emit(cleanFilters);
    }
  }

  saveCurrentFilters() {
    if (!this.hasActiveFilters()) return;

    const filterName = prompt('Nombre para este conjunto de filtros:');
    if (!filterName) return;

    const newPreset = {
      id: Date.now().toString(),
      name: filterName,
      filters: this.filtersForm.value,
      created_at: new Date().toISOString()
    };

    const current = this.savedFilters();
    this.savedFilters.set([...current, newPreset]);
    this.saveSavedFilters();
  }

  loadFilterPreset(preset: any) {
    this.filtersForm.patchValue(preset.filters);
  }

  deleteFilterPreset(presetId: string) {
    const current = this.savedFilters();
    this.savedFilters.set(current.filter(p => p.id !== presetId));
    this.saveSavedFilters();
  }

  private loadSavedFilters() {
    try {
      const saved = localStorage.getItem('collections_advanced_filters');
      if (saved) {
        this.savedFilters.set(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Error loading saved filters:', error);
    }
  }

  private saveSavedFilters() {
    try {
      localStorage.setItem('collections_advanced_filters', JSON.stringify(this.savedFilters()));
    } catch (error) {
      console.warn('Error saving filters:', error);
    }
  }
}