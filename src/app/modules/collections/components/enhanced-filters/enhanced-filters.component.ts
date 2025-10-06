import { Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  Filter,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Search,
  X,
  ChevronDown,
  RefreshCw,
  Download,
  Settings,
  Clock,
  Target,
  TrendingUp
} from 'lucide-angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdvancedReportsService, AdvancedFilters } from '../../services/advanced-reports.service';
import { CollectorsService } from '../../services/collectors.service';

interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  title: string;
  icon: any;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'daterange' | 'search';
  options?: FilterOption[];
  value?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  expanded?: boolean;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedFilters;
  createdAt: Date;
  isDefault?: boolean;
}

@Component({
  selector: 'app-enhanced-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
  <!-- Header -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-center gap-3">
      <lucide-angular [img]="FilterIcon" class="w-6 h-6 text-blue-500"></lucide-angular>
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Filtros Avanzados</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">Personaliza tu análisis de cobranza</p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <!-- Saved Filters Dropdown -->
      <div class="relative">
        <button 
          (click)="toggleSavedFilters()"
          class="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <lucide-angular [img]="SettingsIcon" class="w-4 h-4"></lucide-angular>
          <span class="text-sm">Filtros Guardados</span>
          <lucide-angular [img]="ChevronDownIcon" class="w-4 h-4"></lucide-angular>
        </button>
        
        @if (showSavedFilters()) {
          <div class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
            <div class="p-3 border-b border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-2">
                <input 
                  [(ngModel)]="newFilterName"
                  placeholder="Nombre del filtro"
                  class="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                <button 
                  (click)="saveCurrentFilter()"
                  [disabled]="!newFilterName().trim()"
                  class="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
            
            <div class="max-h-48 overflow-y-auto">
              @for (filter of savedFilters(); track filter.id) {
                <div class="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ filter.name }}</span>
                      @if (filter.isDefault) {
                        <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">Por defecto</span>
                      }
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">{{ filter.createdAt | date:'short' }}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button 
                      (click)="loadSavedFilter(filter)"
                      class="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Cargar filtro"
                    >
                      <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
                    </button>
                    <button 
                      (click)="deleteSavedFilter(filter.id)"
                      class="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar filtro"
                    >
                      <lucide-angular [img]="XIcon" class="w-4 h-4"></lucide-angular>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="p-3 text-center text-sm text-slate-500 dark:text-slate-400">
                  No hay filtros guardados
                </div>
              }
            </div>
          </div>
        }
      </div>
      
      <button 
        (click)="resetFilters()"
        class="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <lucide-angular [img]="RefreshCwIcon" class="w-4 h-4"></lucide-angular>
        <span class="text-sm">Limpiar</span>
      </button>
      
      <button 
        (click)="applyFilters()"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <lucide-angular [img]="SearchIcon" class="w-4 h-4"></lucide-angular>
        <span class="text-sm">Aplicar</span>
      </button>
    </div>
  </div>

  <!-- Quick Filters -->
  <div class="flex flex-wrap gap-2">
    @for (quickFilter of quickFilters(); track quickFilter.id) {
      <button 
        (click)="applyQuickFilter(quickFilter)"
        [class]="getQuickFilterClasses(quickFilter)"
      >
        <lucide-angular [img]="quickFilter.icon" class="w-4 h-4"></lucide-angular>
        <span class="text-sm">{{ quickFilter.label }}</span>
        @if (quickFilter.count) {
          <span class="px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">{{ quickFilter.count }}</span>
        }
      </button>
    }
  </div>

  <!-- Filter Groups -->
  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    @for (group of filterGroups(); track group.id) {
      <div class="space-y-3">
        <button 
          (click)="toggleFilterGroup(group.id)"
          class="flex items-center justify-between w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <div class="flex items-center gap-2">
            <lucide-angular [img]="group.icon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
            <span class="font-medium text-slate-900 dark:text-white">{{ group.title }}</span>
          </div>
          <lucide-angular 
            [img]="ChevronDownIcon" 
            class="w-4 h-4 text-slate-500 transition-transform"
            [class.rotate-180]="group.expanded"
          ></lucide-angular>
        </button>
        
        @if (group.expanded) {
          <div class="space-y-3 pl-4">
            <!-- Date Range Filter -->
            @if (group.type === 'daterange') {
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Desde</label>
                  <input 
                    type="date"
                    [(ngModel)]="currentFilters().dateFrom"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hasta</label>
                  <input 
                    type="date"
                    [(ngModel)]="currentFilters().dateTo"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                </div>
              </div>
            }
            
            <!-- Range Filter -->
            @if (group.type === 'range') {
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mínimo</label>
                    <input 
                      type="number"
                      [min]="group.min"
                      [max]="group.max"
                      [step]="group.step"
                      [(ngModel)]="getFilterValue(group.id + '_min')"
                      [placeholder]="group.placeholder"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    >
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Máximo</label>
                    <input 
                      type="number"
                      [min]="group.min"
                      [max]="group.max"
                      [step]="group.step"
                      [(ngModel)]="getFilterValue(group.id + '_max')"
                      [placeholder]="group.placeholder"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    >
                  </div>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  Rango: {{ formatCurrency(group.min || 0) }} - {{ formatCurrency(group.max || 1000000) }}
                </div>
              </div>
            }
            
            <!-- Select Filter -->
            @if (group.type === 'select') {
              <select 
                [(ngModel)]="getFilterValue(group.id)"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value="">{{ group.placeholder || 'Seleccionar...' }}</option>
                @for (option of group.options; track option.value) {
                  <option [value]="option.value">
                    {{ option.label }}
                    @if (option.count) {
                      ({{ option.count }})
                    }
                  </option>
                }
              </select>
            }
            
            <!-- Multi-select Filter -->
            @if (group.type === 'multiselect') {
              <div class="space-y-2 max-h-32 overflow-y-auto">
                @for (option of group.options; track option.value) {
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      [checked]="isOptionSelected(group.id, option.value)"
                      (change)="toggleMultiSelectOption(group.id, option.value, $event)"
                      class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    >
                    <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.label }}</span>
                    @if (option.count) {
                      <span class="text-xs text-slate-500 dark:text-slate-400">({{ option.count }})</span>
                    }
                  </label>
                }
              </div>
            }
            
            <!-- Search Filter -->
            @if (group.type === 'search') {
              <div class="relative">
                <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"></lucide-angular>
                <input 
                  type="text"
                  [(ngModel)]="getFilterValue(group.id)"
                  [placeholder]="group.placeholder"
                  class="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                >
              </div>
            }
          </div>
        }
      </div>
    }
  </div>

  <!-- Comparison Filters -->
  <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
    <h4 class="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
      <lucide-angular [img]="TrendingUpIcon" class="w-5 h-5 text-green-500"></lucide-angular>
      Comparación de Períodos
    </h4>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Comparar con</label>
        <select 
          [(ngModel)]="currentFilters().comparisonPeriod"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="">Sin comparación</option>
          <option value="previous_month">Mes anterior</option>
          <option value="previous_quarter">Trimestre anterior</option>
          <option value="previous_year">Año anterior</option>
          <option value="same_month_last_year">Mismo mes año anterior</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Métrica principal</label>
        <select 
          [(ngModel)]="currentFilters().primaryMetric"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="collection_rate">Tasa de cobranza</option>
          <option value="collected_amount">Monto cobrado</option>
          <option value="accounts_resolved">Cuentas resueltas</option>
          <option value="avg_resolution_time">Tiempo promedio</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Agrupación</label>
        <select 
          [(ngModel)]="currentFilters().groupBy"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="day">Por día</option>
          <option value="week">Por semana</option>
          <option value="month">Por mes</option>
          <option value="collector">Por cobrador</option>
          <option value="status">Por estado</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Active Filters Summary -->
  @if (activeFiltersCount() > 0) {
    <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ activeFiltersCount() }} filtro(s) activo(s)
        </span>
        <button 
          (click)="clearActiveFilters()"
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Limpiar todos
        </button>
      </div>
      
      <div class="flex flex-wrap gap-2">
        @for (filter of getActiveFiltersSummary(); track filter.key) {
          <div class="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            <span>{{ filter.label }}: {{ filter.value }}</span>
            <button 
              (click)="removeActiveFilter(filter.key)"
              class="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
            >
              <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
            </button>
          </div>
        }
      </div>
    </div>
  }
</div>
  `
})
export class EnhancedFiltersComponent implements OnInit {
  private destroy$ = new Subject<void>();
  private advancedReportsService = inject(AdvancedReportsService);
  private collectorsService = inject(CollectorsService);
  private fb = inject(FormBuilder);

  // Icons
  FilterIcon = Filter;
  CalendarIcon = Calendar;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  BarChart3Icon = BarChart3;
  SearchIcon = Search;
  XIcon = X;
  ChevronDownIcon = ChevronDown;
  RefreshCwIcon = RefreshCw;
  DownloadIcon = Download;
  SettingsIcon = Settings;
  ClockIcon = Clock;
  TargetIcon = Target;
  TrendingUpIcon = TrendingUp;

  // Outputs
  filtersChanged = output<AdvancedFilters>();

  // Signals
  currentFilters = signal<AdvancedFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });
  
  collectors = signal<any[]>([]);
  showSavedFilters = signal(false);
  newFilterName = signal('');
  savedFilters = signal<SavedFilter[]>([]);

  filterGroups = signal<FilterGroup[]>([
    {
      id: 'dateRange',
      title: 'Período de Análisis',
      icon: this.CalendarIcon,
      type: 'daterange',
      expanded: true
    },
    {
      id: 'collectors',
      title: 'Cobradores',
      icon: this.UsersIcon,
      type: 'multiselect',
      options: [],
      expanded: false
    },
    {
      id: 'amountRange',
      title: 'Rango de Montos',
      icon: this.DollarSignIcon,
      type: 'range',
      min: 0,
      max: 1000000,
      step: 1000,
      placeholder: 'Monto',
      expanded: false
    },
    {
      id: 'status',
      title: 'Estado de Cuenta',
      icon: this.BarChart3Icon,
      type: 'multiselect',
      options: [
        { value: 'current', label: 'Al día', count: 150 },
        { value: 'overdue_1_30', label: '1-30 días vencido', count: 89 },
        { value: 'overdue_31_60', label: '31-60 días vencido', count: 45 },
        { value: 'overdue_60_plus', label: '60+ días vencido', count: 23 }
      ],
      expanded: false
    },
    {
      id: 'priority',
      title: 'Prioridad',
      icon: this.TargetIcon,
      type: 'select',
      options: [
        { value: 'high', label: 'Alta', count: 67 },
        { value: 'medium', label: 'Media', count: 134 },
        { value: 'low', label: 'Baja', count: 89 }
      ],
      placeholder: 'Seleccionar prioridad',
      expanded: false
    },
    {
      id: 'searchTerm',
      title: 'Búsqueda de Texto',
      icon: this.SearchIcon,
      type: 'search',
      placeholder: 'Buscar por nombre, teléfono, etc.',
      expanded: false
    }
  ]);

  quickFilters = signal([
    {
      id: 'today',
      label: 'Hoy',
      icon: this.ClockIcon,
      filters: { dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0] },
      active: false,
      count: 23
    },
    {
      id: 'this_week',
      label: 'Esta Semana',
      icon: this.CalendarIcon,
      filters: { 
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      },
      active: false,
      count: 156
    },
    {
      id: 'this_month',
      label: 'Este Mes',
      icon: this.CalendarIcon,
      filters: {
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      },
      active: true,
      count: 487
    },
    {
      id: 'overdue',
      label: 'Vencidas',
      icon: this.TargetIcon,
      filters: { status: ['overdue_1_30', 'overdue_31_60', 'overdue_60_plus'] },
      active: false,
      count: 157
    },
    {
      id: 'high_amount',
      label: 'Montos Altos',
      icon: this.DollarSignIcon,
      filters: { amountMin: 50000 },
      active: false,
      count: 89
    }
  ]);

  // Computed properties
  activeFiltersCount = computed(() => {
    const filters = this.currentFilters();
    let count = 0;
    
    if (filters.collectors?.length) count++;
    if (filters.status?.length) count++;
    if (filters.priority) count++;
    if (filters.amountMin || filters.amountMax) count++;
    if (filters.searchTerm) count++;
    if (filters.comparisonPeriod) count++;
    
    return count;
  });

  ngOnInit() {
    this.loadCollectors();
    this.loadSavedFilters();
    this.setupFilterGroups();
  }

  loadCollectors() {
    this.collectorsService.getCollectors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (collectors) => {
          this.collectors.set(collectors);
          this.updateCollectorOptions();
        },
        error: (error) => console.error('Error loading collectors:', error)
      });
  }

  updateCollectorOptions() {
    const groups = this.filterGroups();
    const collectorGroup = groups.find(g => g.id === 'collectors');
    if (collectorGroup) {
      collectorGroup.options = this.collectors().map(collector => ({
        value: collector.id,
        label: collector.name,
        count: collector.assigned_accounts || 0
      }));
      this.filterGroups.set([...groups]);
    }
  }

  setupFilterGroups() {
    // Initialize expanded state based on saved preferences
    const groups = this.filterGroups();
    groups[0].expanded = true; // Always expand date range
    this.filterGroups.set(groups);
  }

  toggleFilterGroup(groupId: string) {
    const groups = this.filterGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.expanded = !group.expanded;
      this.filterGroups.set([...groups]);
    }
  }

  getFilterValue(key: string): any {
    const filters = this.currentFilters();
    return (filters as any)[key];
  }

  setFilterValue(key: string, value: any) {
    const filters = { ...this.currentFilters() };
    (filters as any)[key] = value;
    this.currentFilters.set(filters);
  }

  isOptionSelected(groupId: string, value: any): boolean {
    const filterValue = this.getFilterValue(groupId);
    return Array.isArray(filterValue) ? filterValue.includes(value) : filterValue === value;
  }

  toggleMultiSelectOption(groupId: string, value: any, event: Event) {
    const target = event.target as HTMLInputElement;
    const currentValue = this.getFilterValue(groupId) || [];
    
    let newValue;
    if (target.checked) {
      newValue = [...currentValue, value];
    } else {
      newValue = currentValue.filter((v: any) => v !== value);
    }
    
    this.setFilterValue(groupId, newValue);
  }

  applyQuickFilter(quickFilter: any) {
    // Reset all quick filters
    const filters = this.quickFilters();
    filters.forEach(f => f.active = false);
    quickFilter.active = true;
    this.quickFilters.set([...filters]);
    
    // Apply the filter
    const newFilters = { ...this.currentFilters(), ...quickFilter.filters };
    this.currentFilters.set(newFilters);
    this.applyFilters();
  }

  getQuickFilterClasses(quickFilter: any): string {
    const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    
    if (quickFilter.active) {
      return `${baseClasses} bg-blue-600 text-white`;
    }
    
    return `${baseClasses} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600`;
  }

  applyFilters() {
    this.filtersChanged.emit(this.currentFilters());
  }

  resetFilters() {
    this.currentFilters.set({
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    });
    
    // Reset quick filters
    const filters = this.quickFilters();
    filters.forEach(f => f.active = false);
    this.quickFilters.set([...filters]);
    
    this.applyFilters();
  }

  toggleSavedFilters() {
    this.showSavedFilters.set(!this.showSavedFilters());
  }

  saveCurrentFilter() {
    const name = this.newFilterName().trim();
    if (!name) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...this.currentFilters() },
      createdAt: new Date()
    };
    
    const saved = this.savedFilters();
    saved.push(newFilter);
    this.savedFilters.set([...saved]);
    
    // Save to localStorage
    localStorage.setItem('collections_saved_filters', JSON.stringify(saved));
    
    this.newFilterName.set('');
    this.showSavedFilters.set(false);
  }

  loadSavedFilter(filter: SavedFilter) {
    this.currentFilters.set({ ...filter.filters });
    this.showSavedFilters.set(false);
    this.applyFilters();
  }

  deleteSavedFilter(filterId: string) {
    const saved = this.savedFilters().filter(f => f.id !== filterId);
    this.savedFilters.set(saved);
    localStorage.setItem('collections_saved_filters', JSON.stringify(saved));
  }

  loadSavedFilters() {
    const saved = localStorage.getItem('collections_saved_filters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        this.savedFilters.set(filters);
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }

  getActiveFiltersSummary() {
    const filters = this.currentFilters();
    const summary: { key: string; label: string; value: string }[] = [];
    
    if (filters.collectors?.length) {
      const collectorNames = filters.collectors.map(id => {
        const collector = this.collectors().find(c => c.id === id);
        return collector?.name || id;
      }).join(', ');
      summary.push({ key: 'collectors', label: 'Cobradores', value: collectorNames });
    }
    
    if (filters.status?.length) {
      const statusLabels = filters.status.map(status => {
        const statusGroup = this.filterGroups().find(g => g.id === 'status');
        const option = statusGroup?.options?.find(o => o.value === status);
        return option?.label || status;
      }).join(', ');
      summary.push({ key: 'status', label: 'Estados', value: statusLabels });
    }
    
    if (filters.priority) {
      const priorityGroup = this.filterGroups().find(g => g.id === 'priority');
      const option = priorityGroup?.options?.find(o => o.value === filters.priority);
      summary.push({ key: 'priority', label: 'Prioridad', value: option?.label || filters.priority });
    }
    
    if (filters.amountMin || filters.amountMax) {
      const min = filters.amountMin ? this.formatCurrency(filters.amountMin) : 'Sin límite';
      const max = filters.amountMax ? this.formatCurrency(filters.amountMax) : 'Sin límite';
      summary.push({ key: 'amountRange', label: 'Rango de Montos', value: `${min} - ${max}` });
    }
    
    if (filters.searchTerm) {
      summary.push({ key: 'searchTerm', label: 'Búsqueda', value: filters.searchTerm });
    }
    
    if (filters.comparisonPeriod) {
      const periods: Record<string, string> = {
        'previous_month': 'Mes anterior',
        'previous_quarter': 'Trimestre anterior',
        'previous_year': 'Año anterior',
        'same_month_last_year': 'Mismo mes año anterior'
      };
      summary.push({ key: 'comparisonPeriod', label: 'Comparación', value: periods[filters.comparisonPeriod] });
    }
    
    return summary;
  }

  removeActiveFilter(key: string) {
    const filters = { ...this.currentFilters() };
    
    switch (key) {
      case 'collectors':
        delete filters.collectors;
        break;
      case 'status':
        delete filters.status;
        break;
      case 'priority':
        delete filters.priority;
        break;
      case 'amountRange':
        delete filters.amountMin;
        delete filters.amountMax;
        break;
      case 'searchTerm':
        delete filters.searchTerm;
        break;
      case 'comparisonPeriod':
        delete filters.comparisonPeriod;
        break;
    }
    
    this.currentFilters.set(filters);
    this.applyFilters();
  }

  clearActiveFilters() {
    this.resetFilters();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}