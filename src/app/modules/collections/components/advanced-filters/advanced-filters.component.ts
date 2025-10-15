import { Component, OnInit, OnDestroy, inject, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  LucideAngularModule, 
  Filter, 
  Search,
  Calendar,
  DollarSign,
  User,
  Users,
  Building,
  Tag,
  X,
  RotateCcw,
  Save,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-angular';
import { PaymentScheduleFilters } from '../../models/payment-schedule';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: PaymentScheduleFilters;
  isDefault?: boolean;
  createdAt: Date;
}

export interface SmartSuggestion {
  type: 'quick_filter' | 'date_range' | 'amount_range' | 'status_combo';
  title: string;
  description: string;
  filters: Partial<PaymentScheduleFilters>;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Filter Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
            <lucide-angular [img]="FilterIcon" class="w-5 h-5"></lucide-angular>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Filtros Avanzados</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400">Personaliza tu búsqueda con criterios específicos</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            (click)="toggleSmartSuggestions()"
            [class]="showSmartSuggestions() ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium border shadow hover:shadow-lg transition"
            title="Sugerencias Inteligentes"
          >
            <lucide-angular [img]="ZapIcon" class="w-4 h-4"></lucide-angular>
            <span class="hidden sm:inline">Smart</span>
          </button>
          
          <button
            (click)="togglePresets()"
            [class]="showPresets() ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium border shadow hover:shadow-lg transition"
            title="Filtros Guardados"
          >
            <lucide-angular [img]="BookmarkIcon" class="w-4 h-4"></lucide-angular>
            <span class="hidden sm:inline">Guardados</span>
          </button>
          
          <button
            (click)="resetFilters()"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow hover:shadow-lg transition"
            title="Limpiar Filtros"
          >
            <lucide-angular [img]="RotateCcwIcon" class="w-4 h-4"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- Smart Suggestions -->
      @if (showSmartSuggestions()) {
        <div class="relative overflow-hidden rounded-2xl border border-purple-200/70 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <lucide-angular [img]="ZapIcon" class="w-5 h-5 text-purple-600 dark:text-purple-400"></lucide-angular>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Sugerencias Inteligentes</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              @for (suggestion of getSmartSuggestions(); track suggestion.title) {
                <button
                  (click)="applySuggestion(suggestion)"
                  class="group relative overflow-hidden rounded-xl p-4 text-left bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 shadow hover:shadow-lg transition-all duration-200"
                >
                  <div class="flex items-start gap-3">
                    <div [class]="'p-2 rounded-lg shadow ' + suggestion.color">
                      <lucide-angular [img]="suggestion.icon" class="w-4 h-4 text-white"></lucide-angular>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-slate-900 dark:text-white text-sm">{{ suggestion.title }}</h4>
                      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">{{ suggestion.description }}</p>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Filter Presets -->
      @if (showPresets()) {
        <div class="relative overflow-hidden rounded-2xl border border-indigo-200/70 dark:border-indigo-700/60 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/20 dark:to-blue-900/20 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <lucide-angular [img]="BookmarkIcon" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Filtros Guardados</h3>
              </div>
              
              <button
                (click)="saveCurrentFilters()"
                [disabled]="!hasActiveFilters()"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                <lucide-angular [img]="SaveIcon" class="w-4 h-4"></lucide-angular>
                <span>Guardar Actual</span>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (preset of filterPresets(); track preset.id) {
                <div class="group relative overflow-hidden rounded-xl p-4 bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700/50 shadow hover:shadow-lg transition-all duration-200">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-slate-900 dark:text-white text-sm">{{ preset.name }}</h4>
                      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">{{ preset.description }}</p>
                      @if (preset.isDefault) {
                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium mt-2">
                          <lucide-angular [img]="SettingsIcon" class="w-3 h-3"></lucide-angular>
                          Por defecto
                        </span>
                      }
                    </div>
                    
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        (click)="applyPreset(preset)"
                        class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                        title="Aplicar"
                      >
                        <lucide-angular [img]="FilterIcon" class="w-3 h-3"></lucide-angular>
                      </button>
                      
                      @if (!preset.isDefault) {
                        <button
                          (click)="deletePreset(preset.id)"
                          class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                          title="Eliminar"
                        >
                          <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="col-span-full text-center py-8">
                  <lucide-angular [img]="BookmarkIcon" class="w-12 h-12 text-slate-400 mx-auto mb-3"></lucide-angular>
                  <p class="text-slate-600 dark:text-slate-400">No hay filtros guardados</p>
                  <p class="text-sm text-slate-500 dark:text-slate-500 mt-1">Configura filtros y guárdalos para uso futuro</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Main Filter Form -->
      <form [formGroup]="filterForm" class="space-y-6">
        
        <!-- Quick Search -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <lucide-angular [img]="SearchIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Búsqueda Rápida</h3>
            </div>
            
            <div class="relative">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"></lucide-angular>
              <input
                type="text"
                formControlName="search"
                placeholder="Buscar por cliente, contrato, número de cronograma..."
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
            </div>
          </div>
        </div>

        <!-- Date Filters -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <lucide-angular [img]="CalendarIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Filtros de Fecha</h3>
              </div>
              
              <button
                type="button"
                (click)="toggleDateSection()"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
              >
                <lucide-angular [img]="isDateSectionExpanded() ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
            
            @if (isDateSectionExpanded()) {
              <div class="space-y-4">
                <!-- Quick Date Ranges -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rangos Rápidos</label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    @for (range of getQuickDateRanges(); track range.label) {
                      <button
                        type="button"
                        (click)="applyQuickDateRange(range)"
                        [class]="isQuickRangeActive(range) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
                        class="px-3 py-2 rounded-lg border text-sm font-medium transition"
                      >
                        {{ range.label }}
                      </button>
                    }
                  </div>
                </div>
                
                <!-- Custom Date Range -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Desde</label>
                    <input
                      type="date"
                      formControlName="dateFrom"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Hasta</label>
                    <input
                      type="date"
                      formControlName="dateTo"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Status and Amount Filters -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Status Filters -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <lucide-angular [img]="TagIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Estado de Pagos</h3>
              </div>
              
              <div class="space-y-3">
                @for (status of getPaymentStatuses(); track status.value) {
                  <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      [value]="status.value"
                      formControlName="statuses"
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    >
                    <div [class]="'w-3 h-3 rounded-full ' + status.color"></div>
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ status.label }}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-auto">{{ status.count || 0 }}</span>
                  </label>
                }
              </div>
            </div>
          </div>

          <!-- Amount Filters -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <lucide-angular [img]="DollarSignIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Rango de Montos</h3>
              </div>
              
              <div class="space-y-4">
                <!-- Quick Amount Ranges -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rangos Rápidos</label>
                  <div class="grid grid-cols-2 gap-2">
                    @for (range of getQuickAmountRanges(); track range.label) {
                      <button
                        type="button"
                        (click)="applyQuickAmountRange(range)"
                        [class]="isQuickAmountRangeActive(range) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
                        class="px-3 py-2 rounded-lg border text-sm font-medium transition"
                      >
                        {{ range.label }}
                      </button>
                    }
                  </div>
                </div>
                
                <!-- Custom Amount Range -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto Mínimo</label>
                    <input
                      type="number"
                      formControlName="amountMin"
                      placeholder="0"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto Máximo</label>
                    <input
                      type="number"
                      formControlName="amountMax"
                      placeholder="Sin límite"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Filters -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <lucide-angular [img]="SettingsIcon" class="w-5 h-5 text-slate-600 dark:text-slate-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Filtros Adicionales</h3>
              </div>
              
              <button
                type="button"
                (click)="toggleAdditionalSection()"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition"
              >
                <lucide-angular [img]="isAdditionalSectionExpanded() ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4"></lucide-angular>
              </button>
            </div>
            
            @if (isAdditionalSectionExpanded()) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Client Selection with Search -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cliente</label>
                  <div class="relative">
                    <select
                      formControlName="clientId"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Todos los clientes</option>
                      @for (client of getClients(); track client.id) {
                        <option [value]="client.id" [title]="'Deuda total: ' + formatCurrency(client.totalDebt)">
                          {{ client.name }} - {{ formatCurrency(client.totalDebt) }}
                        </option>
                      }
                    </select>
                    <lucide-angular [img]="UserIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
                
                <!-- Product Type Selection -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Producto</label>
                  <div class="relative">
                    <select
                      formControlName="productType"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Todos los productos</option>
                      @for (product of getProductTypes(); track product.value) {
                        <option [value]="product.value" [title]="product.category">
                          {{ product.label }}
                        </option>
                      }
                    </select>
                    <lucide-angular [img]="TagIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
                
                <!-- Contract Type Selection -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Contrato</label>
                  <div class="relative">
                    <select
                      formControlName="contractType"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Todos los tipos</option>
                      @for (type of getContractTypes(); track type.value) {
                        <option [value]="type.value" [title]="type.description">
                          {{ type.label }}
                        </option>
                      }
                    </select>
                    <lucide-angular [img]="BuildingIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
                
                <!-- Collector Selection -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cobrador Asignado</label>
                  <div class="relative">
                    <select
                      formControlName="collectorId"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Todos los cobradores</option>
                      @for (collector of getCollectors(); track collector.id) {
                        <option [value]="collector.id" [title]="'Eficiencia: ' + collector.efficiency + '% - Cuentas: ' + collector.activeAccounts">
                          {{ collector.name }} ({{ collector.efficiency }}%)
                        </option>
                      }
                    </select>
                    <lucide-angular [img]="UsersIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
                
                <!-- Priority Level -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nivel de Prioridad</label>
                  <div class="relative">
                    <select
                      formControlName="priority"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Todas las prioridades</option>
                      <option value="high">Alta - Casos urgentes</option>
                      <option value="medium">Media - Seguimiento regular</option>
                      <option value="low">Baja - Monitoreo básico</option>
                    </select>
                    <lucide-angular [img]="AlertCircleIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
                
                <!-- Aging Days -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Días de Vencimiento</label>
                  <div class="relative">
                    <select
                      formControlName="overdueDays"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Cualquier antigüedad</option>
                      <option value="0-30">0-30 días - Reciente</option>
                      <option value="31-60">31-60 días - Moderado</option>
                      <option value="61-90">61-90 días - Crítico</option>
                      <option value="91-120">91-120 días - Muy crítico</option>
                      <option value="120+">Más de 120 días - Extremo</option>
                    </select>
                    <lucide-angular [img]="ClockIcon" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></lucide-angular>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </form>

      <!-- Active Filters Summary -->
      @if (hasActiveFilters()) {
        <div class="relative overflow-hidden rounded-2xl border border-blue-200/70 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <lucide-angular [img]="FilterIcon" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Filtros Activos</h3>
                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                  {{ getActiveFiltersCount() }}
                </span>
              </div>
              
              <button
                (click)="clearAllFilters()"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 shadow hover:shadow-lg transition text-sm"
              >
                <lucide-angular [img]="XIcon" class="w-4 h-4"></lucide-angular>
                <span>Limpiar Todo</span>
              </button>
            </div>
            
            <div class="flex flex-wrap gap-2">
              @for (filter of getActiveFilterTags(); track filter.key) {
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700/50 rounded-lg text-sm">
                  <span class="font-medium text-slate-700 dark:text-slate-300">{{ filter.label }}</span>
                  <span class="text-slate-600 dark:text-slate-400">{{ filter.value }}</span>
                  <button
                    (click)="removeFilter(filter.key)"
                    class="p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                  >
                    <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Apply Filters Button -->
      <div class="flex items-center justify-center">
        <button
          type="button"
          (click)="applyFilters()"
          [disabled]="!hasActiveFilters()"
          class="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          <lucide-angular [img]="FilterIcon" class="w-5 h-5"></lucide-angular>
          <span>Aplicar Filtros</span>
          @if (hasActiveFilters()) {
            <span class="px-2 py-1 bg-white/20 rounded-lg text-sm">{{ getActiveFiltersCount() }}</span>
          }
        </button>
      </div>
    </div>
  `
})
export class AdvancedFiltersComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @Input() initialFilters: PaymentScheduleFilters | null = null;
  @Output() filtersChanged = new EventEmitter<PaymentScheduleFilters>();
  @Output() filtersApplied = new EventEmitter<PaymentScheduleFilters>();

  // Icons
  readonly SearchIcon = Search;
  readonly CalendarIcon = Calendar;
  readonly FilterIcon = Filter;
  readonly XIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly BookmarkIcon = Bookmark;
  readonly RotateCcwIcon = RotateCcw;
  readonly UserIcon = User;
  readonly TagIcon = Tag;
  readonly BuildingIcon = Building;
  readonly AlertCircleIcon = AlertCircle;
  readonly ClockIcon = Clock;
  readonly DollarSignIcon = DollarSign;
  readonly SaveIcon = Save;
  readonly SettingsIcon = Settings;
  readonly ZapIcon = Zap;
  readonly TrendingUpIcon = TrendingUp;
  readonly UsersIcon = Users;

  // Signals
  showSmartSuggestions = signal(false);
  showPresets = signal(false);
  isDateSectionExpanded = signal(true);
  isAdditionalSectionExpanded = signal(false);
  filterPresets = signal<FilterPreset[]>([]);

  // Form
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: [''],
      statuses: [[]],
      amountFrom: [''],
      amountTo: [''],
      clientId: [''],
      contractType: [''],
      productType: [''],
      collectorId: [''],
      priority: [''],
      overdueDays: ['']
    });
  });

    
    this.setupFormSubscriptions();
    this.loadFilterPresets();
  }

  ngOnInit() {
    if (this.initialFilters) {
      this.applyFiltersToForm(this.initialFilters);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscriptions() {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        const filters = this.buildFiltersFromForm(value);
        this.filtersChanged.emit(filters);
      });
  }

  private loadFilterPresets() {
    // Load from localStorage or API
    const savedPresets = localStorage.getItem('collection-filter-presets');
    if (savedPresets) {
      try {
        const presets = JSON.parse(savedPresets);
        this.filterPresets.set(presets);
      } catch (error) {
        console.error('Error loading filter presets:', error);
      }
    }

    // Add default presets if none exist
    if (this.filterPresets().length === 0) {
      this.addDefaultPresets();
    }
  }

  private addDefaultPresets() {
    const defaultPresets: FilterPreset[] = [
      {
        id: 'overdue',
        name: 'Pagos Vencidos',
        description: 'Cronogramas con pagos vencidos',
        filters: { status: 'vencido' },
        isDefault: true,
        createdAt: new Date()
      },
      {
        id: 'this-month',
        name: 'Este Mes',
        description: 'Cronogramas del mes actual',
        filters: { 
          date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          date_to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
        },
        isDefault: true,
        createdAt: new Date()
      },
      {
        id: 'high-amounts',
        name: 'Montos Altos',
        description: 'Cronogramas con montos superiores a S/ 10,000',
        filters: { amount_min: 10000 },
        isDefault: true,
        createdAt: new Date()
      }
    ];

    this.filterPresets.set(defaultPresets);
    this.savePresetsToStorage();
  }

  private savePresetsToStorage() {
    localStorage.setItem('collection-filter-presets', JSON.stringify(this.filterPresets()));
  }

  private buildFiltersFromForm(formValue: any): PaymentScheduleFilters {
    const filters: PaymentScheduleFilters = {};

    if (formValue.search?.trim()) {
      filters.search = formValue.search.trim();
    }

    if (formValue.dateFrom) {
      filters.date_from = formValue.dateFrom;
    }

    if (formValue.dateTo) {
      filters.date_to = formValue.dateTo;
    }

    if (formValue.statuses?.length > 0) {
      filters.status = formValue.statuses.join(',');
    }

    if (formValue.amountMin) {
      filters.amount_min = Number(formValue.amountMin);
    }

    if (formValue.amountMax) {
      filters.amount_max = Number(formValue.amountMax);
    }

    if (formValue.clientId) {
      filters.client_id = formValue.clientId;
    }

    if (formValue.contractType) {
      filters.contract_type = formValue.contractType;
    }

    if (formValue.productType) {
      filters.product_type = formValue.productType;
    }

    if (formValue.collectorId) {
      filters.collector_id = formValue.collectorId;
    }

    if (formValue.priority) {
      filters.priority = formValue.priority;
    }

    if (formValue.overdueDays) {
      filters.overdue_days = formValue.overdueDays;
    }

    return filters;
  }

  private applyFiltersToForm(filters: PaymentScheduleFilters) {
    this.filterForm.patchValue({
      search: filters.search || '',
      dateFrom: filters.date_from || '',
      dateTo: filters.date_to || '',
      statuses: filters.status ? filters.status.split(',') : [],
      amountMin: filters.amount_min || '',
      amountMax: filters.amount_max || '',
      clientId: filters.client_id || '',
      contractType: filters.contract_type || '',
      productType: filters.product_type || '',
      collectorId: filters.collector_id || '',
      priority: filters.priority || '',
      overdueDays: filters.overdue_days || ''
    });
  }

  // Public methods
  toggleSmartSuggestions() {
    this.showSmartSuggestions.set(!this.showSmartSuggestions());
  }

  togglePresets() {
    this.showPresets.set(!this.showPresets());
  }

  toggleDateSection() {
    this.isDateSectionExpanded.set(!this.isDateSectionExpanded());
  }

  toggleAdditionalSection() {
    this.isAdditionalSectionExpanded.set(!this.isAdditionalSectionExpanded());
  }

  resetFilters() {
    this.filterForm.reset();
  }

  applyFilters() {
    const filters = this.buildFiltersFromForm(this.filterForm.value);
    this.filtersApplied.emit(filters);
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.search?.trim() ||
      formValue.dateFrom ||
      formValue.dateTo ||
      (formValue.statuses?.length > 0) ||
      formValue.amountMin ||
      formValue.amountMax ||
      formValue.clientId ||
      formValue.contractType ||
      formValue.productType ||
      formValue.collectorId ||
      formValue.priority ||
      formValue.overdueDays
    );
  }

  getActiveFiltersCount(): number {
    const formValue = this.filterForm.value;
    let count = 0;
    
    if (formValue.search?.trim()) count++;
    if (formValue.dateFrom) count++;
    if (formValue.dateTo) count++;
    if (formValue.statuses?.length > 0) count++;
    if (formValue.amountMin) count++;
    if (formValue.amountMax) count++;
    if (formValue.clientId) count++;
    if (formValue.contractType) count++;
    if (formValue.productType) count++;
    if (formValue.collectorId) count++;
    if (formValue.priority) count++;
    if (formValue.overdueDays) count++;
    
    return count;
  }

  getActiveFilterTags(): { key: string; label: string; value: string }[] {
    const formValue = this.filterForm.value;
    const tags: { key: string; label: string; value: string }[] = [];

    if (formValue.search?.trim()) {
      tags.push({ key: 'search', label: 'Búsqueda', value: formValue.search });
    }

    if (formValue.dateFrom || formValue.dateTo) {
      const from = formValue.dateFrom || 'Inicio';
      const to = formValue.dateTo || 'Fin';
      tags.push({ key: 'dateRange', label: 'Fechas', value: `${from} - ${to}` });
    }

    if (formValue.statuses?.length > 0) {
      tags.push({ key: 'statuses', label: 'Estados', value: `${formValue.statuses.length} seleccionados` });
    }

    if (formValue.amountMin || formValue.amountMax) {
      const min = formValue.amountMin ? `S/ ${formValue.amountMin}` : 'Min';
      const max = formValue.amountMax ? `S/ ${formValue.amountMax}` : 'Max';
      tags.push({ key: 'amountRange', label: 'Montos', value: `${min} - ${max}` });
    }

    if (formValue.clientId) {
      tags.push({ key: 'clientId', label: 'Cliente', value: 'Seleccionado' });
    }

    if (formValue.contractType) {
      tags.push({ key: 'contractType', label: 'Tipo de Contrato', value: this.getContractTypes().find(t => t.value === formValue.contractType)?.label || formValue.contractType });
    }

    if (formValue.productType) {
      tags.push({ key: 'productType', label: 'Tipo de Producto', value: this.getProductTypes().find(p => p.value === formValue.productType)?.label || formValue.productType });
    }

    if (formValue.collectorId) {
      tags.push({ key: 'collectorId', label: 'Cobrador', value: this.getCollectors().find(c => c.id === formValue.collectorId)?.name || formValue.collectorId });
    }

    if (formValue.priority) {
      const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Baja' };
      tags.push({ key: 'priority', label: 'Prioridad', value: priorityLabels[formValue.priority as keyof typeof priorityLabels] || formValue.priority });
    }

    if (formValue.overdueDays) {
      tags.push({ key: 'overdueDays', label: 'Días de Vencimiento', value: formValue.overdueDays });
    }

    return tags;
  }

  removeFilter(key: string) {
    switch (key) {
      case 'search':
        this.filterForm.patchValue({ search: '' });
        break;
      case 'dateRange':
        this.filterForm.patchValue({ dateFrom: '', dateTo: '' });
        break;
      case 'statuses':
        this.filterForm.patchValue({ statuses: [] });
        break;
      case 'amountRange':
        this.filterForm.patchValue({ amountMin: '', amountMax: '' });
        break;
      case 'clientId':
        this.filterForm.patchValue({ clientId: '' });
        break;
      case 'contractType':
        this.filterForm.patchValue({ contractType: '' });
        break;
      case 'productType':
        this.filterForm.patchValue({ productType: '' });
        break;
      case 'collectorId':
        this.filterForm.patchValue({ collectorId: '' });
        break;
      case 'priority':
        this.filterForm.patchValue({ priority: '' });
        break;
      case 'overdueDays':
        this.filterForm.patchValue({ overdueDays: '' });
        break;
    }
  }

  clearAllFilters() {
    this.filterForm.reset({
      search: '',
      dateFrom: '',
      dateTo: '',
      statuses: [],
      amountFrom: '',
      amountTo: '',
      clientId: '',
      contractType: '',
      productType: '',
      collectorId: '',
      priority: '',
      overdueDays: ''
    });
  }

  // Smart Suggestions
  getSmartSuggestions(): SmartSuggestion[] {
    return [
      {
        type: 'quick_filter',
        title: 'Pagos Vencidos',
        description: 'Ver cronogramas con pagos atrasados',
        filters: { status: 'vencido' },
        icon: this.AlertCircleIcon,
        color: 'bg-gradient-to-br from-red-500 to-red-600'
      },
      {
        type: 'date_range',
        title: 'Esta Semana',
        description: 'Cronogramas de los últimos 7 días',
        filters: { 
          date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        icon: this.CalendarIcon,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600'
      },
      {
        type: 'amount_range',
        title: 'Montos Altos',
        description: 'Cronogramas > S/ 5,000',
        filters: { amount_from: 5000 },
        icon: this.TrendingUpIcon,
        color: 'bg-gradient-to-br from-green-500 to-green-600'
      },
      {
        type: 'status_combo',
        title: 'Próximos a Vencer',
        description: 'Pagos pendientes próximos',
        filters: { status: 'pendiente', overdue_days: '0-7' },
        icon: this.ClockIcon,
        color: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
      }
    ];
  }

  applySuggestion(suggestion: SmartSuggestion) {
    const filters = suggestion.filters;
    
    if (filters.status) {
      this.filterForm.patchValue({ statuses: [filters.status] });
    }
    
    if (filters.date_from) {
      this.filterForm.patchValue({ dateFrom: filters.date_from });
    }
    
    if (filters.amount_from) {
      this.filterForm.patchValue({ amountMin: filters.amount_from });
    }
    
    if (filters.overdue_days) {
      this.filterForm.patchValue({ overdueDays: filters.overdue_days });
    }
  }

  // Filter Presets
  applyPreset(preset: FilterPreset) {
    this.applyFiltersToForm(preset.filters);
  }

  saveCurrentFilters() {
    const filters = this.buildFiltersFromForm(this.filterForm.value);
    const name = prompt('Nombre para este filtro:');
    
    if (name?.trim()) {
      const preset: FilterPreset = {
        id: Date.now().toString(),
        name: name.trim(),
        description: `Filtro personalizado creado el ${new Date().toLocaleDateString()}`,
        filters,
        createdAt: new Date()
      };
      
      const presets = [...this.filterPresets(), preset];
      this.filterPresets.set(presets);
      this.savePresetsToStorage();
    }
  }

  deletePreset(presetId: string) {
    if (confirm('¿Estás seguro de eliminar este filtro guardado?')) {
      const presets = this.filterPresets().filter(p => p.id !== presetId);
      this.filterPresets.set(presets);
      this.savePresetsToStorage();
    }
  }

  // Quick Date Ranges
  getQuickDateRanges() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    return [
      {
        label: 'Hoy',
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Esta Semana',
        from: startOfWeek.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Este Mes',
        from: startOfMonth.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Este Año',
        from: startOfYear.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    ];
  }

  applyQuickDateRange(range: any) {
    this.filterForm.patchValue({
      dateFrom: range.from,
      dateTo: range.to
    });
  }

  isQuickRangeActive(range: any): boolean {
    const formValue = this.filterForm.value;
    return formValue.dateFrom === range.from && formValue.dateTo === range.to;
  }

  // Quick Amount Ranges
  getQuickAmountRanges() {
    return [
      { label: '< S/ 1,000', min: 0, max: 1000 },
      { label: 'S/ 1,000 - S/ 5,000', min: 1000, max: 5000 },
      { label: 'S/ 5,000 - S/ 10,000', min: 5000, max: 10000 },
      { label: '> S/ 10,000', min: 10000, max: null }
    ];
  }

  applyQuickAmountRange(range: any) {
    this.filterForm.patchValue({
      amountMin: range.min,
      amountMax: range.max
    });
  }

  isQuickAmountRangeActive(range: any): boolean {
    const formValue = this.filterForm.value;
    return formValue.amountMin == range.min && formValue.amountMax == range.max;
  }

  // Data providers
  getPaymentStatuses() {
    return [
      { value: 'paid', label: 'Pagado', color: 'bg-green-500', count: 45 },
      { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500', count: 23 },
      { value: 'overdue', label: 'Vencido', color: 'bg-red-500', count: 12 },
      { value: 'partial', label: 'Pago Parcial', color: 'bg-blue-500', count: 8 }
    ];
  }

  getClients() {
    // Enhanced mock data with more realistic client information
    return [
      { id: '1', name: 'Juan Pérez', email: 'juan.perez@email.com', totalDebt: 25000 },
      { id: '2', name: 'María García', email: 'maria.garcia@email.com', totalDebt: 18500 },
      { id: '3', name: 'Carlos López', email: 'carlos.lopez@email.com', totalDebt: 32000 },
      { id: '4', name: 'Ana Rodríguez', email: 'ana.rodriguez@email.com', totalDebt: 15000 },
      { id: '5', name: 'Luis Martínez', email: 'luis.martinez@email.com', totalDebt: 28000 },
      { id: '6', name: 'Carmen Sánchez', email: 'carmen.sanchez@email.com', totalDebt: 22000 },
      { id: '7', name: 'Roberto Torres', email: 'roberto.torres@email.com', totalDebt: 35000 },
      { id: '8', name: 'Patricia Morales', email: 'patricia.morales@email.com', totalDebt: 19500 }
    ];
  }

  getContractTypes() {
    return [
      { value: 'personal', label: 'Préstamo Personal', description: 'Préstamos para gastos personales' },
      { value: 'vehicle', label: 'Préstamo Vehicular', description: 'Financiamiento de vehículos' },
      { value: 'mortgage', label: 'Hipotecario', description: 'Préstamos hipotecarios' },
      { value: 'business', label: 'Empresarial', description: 'Créditos comerciales' },
      { value: 'education', label: 'Educativo', description: 'Préstamos educativos' },
      { value: 'medical', label: 'Médico', description: 'Financiamiento médico' }
    ];
  }

  getProductTypes() {
    return [
      { value: 'credit_card', label: 'Tarjeta de Crédito', category: 'revolving' },
      { value: 'personal_loan', label: 'Préstamo Personal', category: 'installment' },
      { value: 'auto_loan', label: 'Préstamo Automotriz', category: 'secured' },
      { value: 'mortgage', label: 'Hipoteca', category: 'secured' },
      { value: 'line_of_credit', label: 'Línea de Crédito', category: 'revolving' },
      { value: 'business_loan', label: 'Préstamo Comercial', category: 'business' }
    ];
  }

  getCollectors() {
    return [
      { id: '1', name: 'Ana Collector', efficiency: 92.5, activeAccounts: 45 },
      { id: '2', name: 'Carlos Cobrador', efficiency: 88.3, activeAccounts: 52 },
      { id: '3', name: 'María Gestora', efficiency: 95.1, activeAccounts: 38 },
      { id: '4', name: 'Luis Recuperador', efficiency: 85.7, activeAccounts: 48 }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }
}