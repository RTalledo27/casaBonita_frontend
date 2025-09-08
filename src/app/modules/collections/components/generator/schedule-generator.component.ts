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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.03),transparent_50%)]"></div>
      
      <div class="relative p-6 space-y-8">
        <!-- Modern Header -->
        <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden">
          <!-- Header Gradient Background -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-400/8 via-purple-400/4 to-indigo-400/8 dark:from-blue-500/15 dark:via-purple-500/8 dark:to-indigo-500/15"></div>
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400"></div>
          
          <div class="relative flex items-center space-x-6">
            <button 
              routerLink="/collections/dashboard"
              class="group relative p-3 bg-gradient-to-br from-gray-100/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 hover:from-blue-100/80 hover:to-indigo-100/80 dark:hover:from-blue-800/50 dark:hover:to-indigo-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/30 dark:border-gray-600/30"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <lucide-angular [img]="ArrowLeftIcon" class="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 relative z-10 transition-colors duration-300"></lucide-angular>
            </button>
            
            <div class="flex items-center space-x-4">
              <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <lucide-angular [img]="CalendarIcon" class="w-8 h-8 text-white"></lucide-angular>
              </div>
              <div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Generador de Cronogramas
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1 font-medium">Crear cronogramas de pago para contratos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenedor de ambas secciones -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
          <!-- Seleccionar Contrato (izquierda) -->
          <section class="lg:col-span-5">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-8 relative overflow-hidden h-fit">
            <!-- Card Header Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-green-500/4 to-teal-500/8 dark:from-emerald-600/15 dark:via-green-600/8 dark:to-teal-600/15"></div>
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
            
            <div class="relative">
              <div class="flex items-center space-x-3 mb-6">
                <div class="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-2xl shadow-lg">
                  <lucide-angular [img]="SearchIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <h2 class="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 dark:from-emerald-300 dark:to-green-300 bg-clip-text text-transparent">Seleccionar Contrato</h2>
              </div>
          
              <!-- Search Contract -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Buscar Contrato</label>
                <div class="relative group">
                  <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg group-focus-within:shadow-xl group-focus-within:border-emerald-300/50 dark:group-focus-within:border-emerald-500/50 transition-all duration-300">
                    <lucide-angular [img]="SearchIcon" class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors duration-300"></lucide-angular>
                    <input
                      type="text"
                      [ngModel]="searchTerm()"
                      (input)="onSearchChange($event)"
                      placeholder="Buscar por número de contrato, cliente o lote..."
                      class="w-full pl-12 pr-4 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none font-medium"
                    >
                  </div>
                </div>
              </div>

              <!-- Contract List -->
              @if (isLoadingContracts()) {
                <div class="text-center py-12">
                  <div class="relative">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 mx-auto"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 mt-4 font-medium">Buscando contratos...</p>
                </div>
              } @else if (filteredContracts().length > 0) {
                <div class="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-600 scrollbar-track-transparent">
                  @for (contract of filteredContracts(); track contract.contract_id) {
                    <div 
                      (click)="selectContract(contract)"
                      [class]="selectedContract()?.contract_id === contract.contract_id ? 
                        'group relative bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/30 dark:to-green-900/30 border-2 border-emerald-300/50 dark:border-emerald-500/50 cursor-pointer p-5 rounded-2xl shadow-lg backdrop-blur-sm transform scale-[1.02]' : 
                        'group relative bg-white/60 dark:bg-gray-700/60 hover:bg-gradient-to-br hover:from-emerald-50/60 hover:to-green-50/60 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 cursor-pointer p-5 border border-gray-200/50 dark:border-gray-600/50 hover:border-emerald-200/50 dark:hover:border-emerald-500/30 rounded-2xl shadow-md hover:shadow-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.01]'"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                      <div class="relative flex justify-between items-start">
                        <div class="space-y-1">
                          <p class="font-bold text-gray-900 dark:text-white text-lg">{{ contract.contract_number }}</p>
                          <p class="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{{ contract.client_name }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Lote: {{ contract.lot_name }}</p>
                        </div>
                        <div class="text-right space-y-1">
                          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(contract.financing_amount || 0) }}</p>
                          <p class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{{ contract.term_months || 0 }} meses</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <div class="bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-700/50 dark:to-gray-800/50 p-8 rounded-3xl mb-6 inline-block backdrop-blur-sm">
                    <lucide-angular [img]="FileTextIcon" class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"></lucide-angular>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 font-semibold text-lg">No se encontraron contratos</p>
                  @if (searchTerm()) {
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Intenta con otros términos de búsqueda</p>
                  }
                </div>
              }
            </div>
            </div>
          </section>

          <!-- Configuración del Cronograma (derecha) -->
          <section class="lg:col-span-7">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-8 relative overflow-hidden h-fit">
              <!-- Card Header Gradient -->
              <div class="absolute inset-0 bg-gradient-to-br from-blue-400/8 via-indigo-400/4 to-purple-400/8 dark:from-blue-500/15 dark:via-indigo-500/8 dark:to-purple-500/15"></div>
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
            
            <div class="relative">
              <div class="flex items-center space-x-3 mb-6">
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <lucide-angular [img]="CalculatorIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <h2 class="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">Configuración del Cronograma</h2>
              </div>
          
              @if (selectedContract()) {
                <form [formGroup]="scheduleForm" (ngSubmit)="generateSchedule()" class="space-y-6">
                  <!-- Contract Details -->
                  <div class="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
                    <div class="flex items-center space-x-3 mb-4">
                      <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-md">
                        <lucide-angular [img]="FileTextIcon" class="w-5 h-5 text-white"></lucide-angular>
                      </div>
                      <h3 class="font-bold text-blue-900 dark:text-blue-200 text-lg">Detalles del Contrato</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-6 text-sm">
                      <div class="space-y-1">
                        <span class="text-blue-600 dark:text-blue-400 font-semibold">Cliente:</span>
                        <p class="font-bold text-blue-900 dark:text-blue-100">{{ selectedContract()!.client_name }}</p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-blue-600 dark:text-blue-400 font-semibold">Lote:</span>
                        <p class="font-bold text-blue-900 dark:text-blue-100">{{ selectedContract()!.lot_name }}</p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-blue-600 dark:text-blue-400 font-semibold">Monto a Financiar:</span>
                        <p class="font-bold text-blue-900 dark:text-blue-100">{{ formatCurrency(selectedContract()!.financing_amount || 0) }}</p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-blue-600 dark:text-blue-400 font-semibold">Plazo:</span>
                        <p class="font-bold text-blue-900 dark:text-blue-100">{{ selectedContract()!.term_months }} meses</p>
                      </div>
                    </div>
                  </div>

                  <!-- Schedule Parameters -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fecha de Inicio</label>
                      <div class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <input
                          type="date"
                          formControlName="start_date"
                          class="relative w-full px-4 py-4 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg focus:shadow-xl focus:border-blue-300/50 dark:focus:border-blue-500/50 focus:outline-none text-gray-900 dark:text-white font-medium transition-all duration-300"
                        >
                      </div>
                      @if (scheduleForm.get('start_date')?.invalid && scheduleForm.get('start_date')?.touched) {
                        <p class="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">La fecha de inicio es requerida</p>
                      }
                    </div>

                    <div class="space-y-2">
                      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Frecuencia de Pago</label>
                      <div class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <select
                          formControlName="frequency"
                          class="relative w-full px-4 py-4 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg focus:shadow-xl focus:border-blue-300/50 dark:focus:border-blue-500/50 focus:outline-none text-gray-900 dark:text-white font-medium transition-all duration-300 appearance-none cursor-pointer"
                        >
                          <option value="monthly">Mensual</option>
                          <option value="biweekly">Quincenal</option>
                          <option value="weekly">Semanal</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Calculation -->
                  <div class="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-2xl border border-indigo-200/50 dark:border-indigo-700/50 backdrop-blur-sm">
                    <div class="flex items-center space-x-3 mb-4">
                      <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-md">
                        <lucide-angular [img]="CalculatorIcon" class="w-5 h-5 text-white"></lucide-angular>
                      </div>
                      <h4 class="font-bold text-indigo-900 dark:text-indigo-200 text-lg">Cálculo de Cuotas</h4>
                    </div>
                    <div class="grid grid-cols-2 gap-6 text-sm">
                      <div class="space-y-1">
                        <span class="text-indigo-600 dark:text-indigo-400 font-semibold">Cuota Mensual:</span>
                        <p class="font-bold text-indigo-900 dark:text-indigo-100 text-lg">{{ formatCurrency(calculatedMonthlyPayment()) }}</p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-indigo-600 dark:text-indigo-400 font-semibold">Total de Cuotas:</span>
                        <p class="font-bold text-indigo-900 dark:text-indigo-100 text-lg">{{ selectedContract()!.term_months }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notas (Opcional)</label>
                    <div class="relative group">
                      <div class="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                      <textarea
                        formControlName="notes"
                        rows="3"
                        placeholder="Agregar notas sobre el cronograma..."
                        class="relative w-full px-4 py-4 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg focus:shadow-xl focus:border-violet-300/50 dark:focus:border-violet-500/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium transition-all duration-300 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      [disabled]="scheduleForm.invalid || isGenerating()"
                      class="group relative flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-300 rounded-2xl"></div>
                      @if (isGenerating()) {
                        <div class="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white relative z-10"></div>
                        <span class="relative z-10">Generando...</span>
                      } @else {
                        <lucide-angular [img]="CalendarIcon" class="w-5 h-5 relative z-10"></lucide-angular>
                        <span class="relative z-10">Generar Cronograma</span>
                      }
                    </button>
                    <button
                      type="button"
                      (click)="clearSelection()"
                      class="group relative px-6 py-4 bg-white/80 dark:bg-gray-700/80 hover:bg-gray-50/80 dark:hover:bg-gray-600/80 border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300/50 dark:hover:border-gray-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-sm font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-gray-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                      <span class="relative z-10">Limpiar</span>
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
          </section>
        </div>

        <!-- Success/Error Messages -->
      @if (successMessage()) {
        <div class="relative bg-gradient-to-br from-emerald-50/90 to-green-50/90 dark:from-emerald-900/30 dark:to-green-900/30 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
          <div class="relative z-10 flex items-start space-x-4">
            <div class="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-2xl shadow-lg flex-shrink-0">
              <lucide-angular [img]="CheckCircleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
            <div class="flex-1">
              <p class="text-emerald-900 dark:text-emerald-100 font-bold text-lg mb-2">{{ successMessage() }}</p>
              <button 
                (click)="viewGeneratedSchedule()"
                class="group relative inline-flex items-center space-x-2 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <span class="relative z-10">Ver cronograma generado</span>
                <svg class="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <div class="relative bg-gradient-to-br from-red-50/90 to-rose-50/90 dark:from-red-900/30 dark:to-rose-900/30 backdrop-blur-xl border border-red-200/50 dark:border-red-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-3xl blur-xl"></div>
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400"></div>
          <div class="relative z-10 flex items-center space-x-4">
            <div class="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-2xl shadow-lg flex-shrink-0">
              <lucide-angular [img]="AlertCircleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
            <p class="text-red-900 dark:text-red-100 font-bold text-lg">{{ errorMessage() }}</p>
          </div>
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