import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  Filter,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  X,
  Search,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-angular';

import { CollectorsService } from '../../services/collectors.service';

export interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  collectorId?: number;
  amountFrom?: number;
  amountTo?: number;
  reportType: string;
  comparisonPeriod?: 'previous_month' | 'previous_quarter' | 'previous_year' | 'none';
  groupBy?: 'collector' | 'status' | 'month' | 'week';
  includeInactive?: boolean;
}

interface Collector {
  id: number;
  name: string;
  email: string;
  active: boolean;
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
<div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
    <div class="flex items-center gap-2">
      <lucide-angular [img]="FilterIcon" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-angular>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Filtros Avanzados</h3>
    </div>
    
    <button 
      type="button"
      (click)="toggleExpanded()"
      class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      <span>{{ isExpanded() ? 'Contraer' : 'Expandir' }}</span>
      <lucide-angular [img]="isExpanded() ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4"></lucide-angular>
    </button>
  </div>

  <!-- Filters Form -->
  <form [formGroup]="filtersForm" (ngSubmit)="onApplyFilters()" class="p-6">
    <!-- Basic Filters Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Date From -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <lucide-angular [img]="CalendarIcon" class="w-4 h-4 inline mr-1"></lucide-angular>
          Fecha Desde
        </label>
        <input
          type="date"
          formControlName="dateFrom"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
      </div>

      <!-- Date To -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <lucide-angular [img]="CalendarIcon" class="w-4 h-4 inline mr-1"></lucide-angular>
          Fecha Hasta
        </label>
        <input
          type="date"
          formControlName="dateTo"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Estado
        </label>
        <select
          formControlName="status"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="overdue">Vencido</option>
          <option value="partial">Pago Parcial</option>
        </select>
      </div>

      <!-- Report Type -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <lucide-angular [img]="BarChart3Icon" class="w-4 h-4 inline mr-1"></lucide-angular>
          Tipo de Reporte
        </label>
        <select
          formControlName="reportType"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="summary">Resumen</option>
          <option value="detailed">Detallado</option>
          <option value="overdue">Solo Vencidos</option>
          <option value="collector_efficiency">Eficiencia por Cobrador</option>
          <option value="aging_analysis">Análisis de Antigüedad</option>
          <option value="cash_flow">Proyección de Flujo</option>
        </select>
      </div>
    </div>

    <!-- Advanced Filters (Expandable) -->
    @if (isExpanded()) {
      <div class="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">
        <!-- Collector and Amount Filters -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Collector -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <lucide-angular [img]="UsersIcon" class="w-4 h-4 inline mr-1"></lucide-angular>
              Cobrador
            </label>
            <select
              formControlName="collectorId"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Todos los cobradores</option>
              @for (collector of collectors(); track collector.id) {
                <option [value]="collector.id">{{ collector.name }}</option>
              }
            </select>
          </div>

          <!-- Amount From -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <lucide-angular [img]="DollarSignIcon" class="w-4 h-4 inline mr-1"></lucide-angular>
              Monto Desde
            </label>
            <input
              type="number"
              formControlName="amountFrom"
              placeholder="0.00"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
          </div>

          <!-- Amount To -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <lucide-angular [img]="DollarSignIcon" class="w-4 h-4 inline mr-1"></lucide-angular>
              Monto Hasta
            </label>
            <input
              type="number"
              formControlName="amountTo"
              placeholder="999999.99"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
          </div>
        </div>

        <!-- Comparison and Grouping -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Comparison Period -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Comparar con Período
            </label>
            <select
              formControlName="comparisonPeriod"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="none">Sin comparación</option>
              <option value="previous_month">Mes anterior</option>
              <option value="previous_quarter">Trimestre anterior</option>
              <option value="previous_year">Año anterior</option>
            </select>
          </div>

          <!-- Group By -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Agrupar por
            </label>
            <select
              formControlName="groupBy"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Sin agrupación</option>
              <option value="collector">Cobrador</option>
              <option value="status">Estado</option>
              <option value="month">Mes</option>
              <option value="week">Semana</option>
            </select>
          </div>

          <!-- Include Inactive -->
          <div class="flex items-center pt-6">
            <input
              type="checkbox"
              formControlName="includeInactive"
              id="includeInactive"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            >
            <label for="includeInactive" class="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Incluir cobradores inactivos
            </label>
          </div>
        </div>

        <!-- Quick Date Presets -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Períodos Predefinidos
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="setDatePreset('today')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              (click)="setDatePreset('yesterday')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Ayer
            </button>
            <button
              type="button"
              (click)="setDatePreset('this_week')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Esta Semana
            </button>
            <button
              type="button"
              (click)="setDatePreset('this_month')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Este Mes
            </button>
            <button
              type="button"
              (click)="setDatePreset('last_month')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Mes Pasado
            </button>
            <button
              type="button"
              (click)="setDatePreset('last_quarter')"
              class="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Último Trimestre
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Action Buttons -->
    <div class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-2">
        <button
          type="button"
          (click)="onResetFilters()"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <lucide-angular [img]="RefreshCwIcon" class="w-4 h-4"></lucide-angular>
          Limpiar Filtros
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="onSavePreset()"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <lucide-angular [img]="SettingsIcon" class="w-4 h-4"></lucide-angular>
          Guardar Preset
        </button>
        
        <button
          type="submit"
          [disabled]="filtersForm.invalid || isLoading()"
          class="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          @if (isLoading()) {
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          } @else {
            <lucide-angular [img]="SearchIcon" class="w-4 h-4"></lucide-angular>
          }
          {{ isLoading() ? 'Aplicando...' : 'Aplicar Filtros' }}
        </button>
      </div>
    </div>
  </form>
</div>
  `
})
export class AdvancedFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly collectorsService = inject(CollectorsService);

  @Output() filtersChange = new EventEmitter<AdvancedFilters>();
  @Output() resetFilters = new EventEmitter<void>();

  // Icons
  FilterIcon = Filter;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  BarChart3Icon = BarChart3;
  XIcon = X;
  SearchIcon = Search;
  RefreshCwIcon = RefreshCw;
  SettingsIcon = Settings;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // Signals
  isExpanded = signal(false);
  isLoading = signal(false);
  collectors = signal<Collector[]>([]);

  // Form
  filtersForm: FormGroup;

  constructor() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filtersForm = this.fb.group({
      dateFrom: [firstDayOfMonth.toISOString().split('T')[0], Validators.required],
      dateTo: [today.toISOString().split('T')[0], Validators.required],
      status: [''],
      collectorId: [''],
      amountFrom: [''],
      amountTo: [''],
      reportType: ['summary', Validators.required],
      comparisonPeriod: ['none'],
      groupBy: [''],
      includeInactive: [false]
    });
  }

  ngOnInit() {
    this.loadCollectors();
  }

  private loadCollectors() {
    this.collectorsService.getCollectors()
      .subscribe({
        next: (collectors) => {
          this.collectors.set(collectors);
        },
        error: (error) => {
          console.error('Error loading collectors:', error);
        }
      });
  }

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
  }

  onApplyFilters() {
    if (this.filtersForm.valid) {
      this.isLoading.set(true);
      
      const filters: AdvancedFilters = {
        dateFrom: this.filtersForm.value.dateFrom,
        dateTo: this.filtersForm.value.dateTo,
        status: this.filtersForm.value.status,
        reportType: this.filtersForm.value.reportType,
        ...(this.filtersForm.value.collectorId && { collectorId: parseInt(this.filtersForm.value.collectorId) }),
        ...(this.filtersForm.value.amountFrom && { amountFrom: parseFloat(this.filtersForm.value.amountFrom) }),
        ...(this.filtersForm.value.amountTo && { amountTo: parseFloat(this.filtersForm.value.amountTo) }),
        ...(this.filtersForm.value.comparisonPeriod !== 'none' && { comparisonPeriod: this.filtersForm.value.comparisonPeriod }),
        ...(this.filtersForm.value.groupBy && { groupBy: this.filtersForm.value.groupBy }),
        includeInactive: this.filtersForm.value.includeInactive
      };

      this.filtersChange.emit(filters);
      
      // Simulate loading delay
      setTimeout(() => {
        this.isLoading.set(false);
      }, 1000);
    }
  }

  onResetFilters() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filtersForm.patchValue({
      dateFrom: firstDayOfMonth.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      status: '',
      collectorId: '',
      amountFrom: '',
      amountTo: '',
      reportType: 'summary',
      comparisonPeriod: 'none',
      groupBy: '',
      includeInactive: false
    });
    
    this.resetFilters.emit();
  }

  onSavePreset() {
    // TODO: Implement save preset functionality
    console.log('Save preset functionality to be implemented');
  }

  setDatePreset(preset: string) {
    const today = new Date();
    let dateFrom: Date;
    let dateTo: Date = today;

    switch (preset) {
      case 'today':
        dateFrom = today;
        break;
      case 'yesterday':
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - 1);
        dateTo = new Date(dateFrom);
        break;
      case 'this_week':
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - today.getDay());
        break;
      case 'this_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const lastQuarterStart = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
        const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        dateFrom = new Date(lastQuarterYear, lastQuarterStart, 1);
        dateTo = new Date(lastQuarterYear, lastQuarterStart + 3, 0);
        break;
      default:
        return;
    }

    this.filtersForm.patchValue({
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0]
    });
  }
}