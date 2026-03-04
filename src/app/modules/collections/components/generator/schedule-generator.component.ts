import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CollectionsSimplifiedService, ContractWithSchedules } from '../../services/collections-simplified.service';
import { GenerateScheduleRequest, GenerateScheduleResponse } from '../../models/payment-schedule';

@Component({
  selector: 'app-schedule-generator',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <button routerLink="/collections-simplified/dashboard"
                class="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div class="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Generador de Cronogramas</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Crear cronogramas de pago para contratos</p>
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 border border-gray-200/50 dark:border-gray-600/50">
              <button
                (click)="switchTab('individual')"
                [class]="activeTab() === 'individual' ?
                  'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' :
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                class="px-5 py-2 rounded-lg text-sm font-semibold transition-all">
                Individual
              </button>
              <button
                (click)="switchTab('mass')"
                [class]="activeTab() === 'mass' ?
                  'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' :
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                class="px-5 py-2 rounded-lg text-sm font-semibold transition-all">
                Masivo
              </button>
            </div>
          </div>
        </div>

        <!-- Contenido condicional según el tab activo -->
        @if (activeTab() === 'individual') {
          <!-- Individual Tab -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <!-- Seleccionar Contrato (izquierda) -->
            <section class="lg:col-span-5">
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-fit">
                <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2.5">
                  <div class="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 class="text-sm font-bold text-gray-900 dark:text-white">Seleccionar Contrato</h2>
                </div>

                <div class="p-5">
                  <!-- Search -->
                  <div class="relative mb-4">
                    <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" [ngModel]="searchTerm()" (input)="onSearchChange($event)"
                      placeholder="Buscar por contrato, cliente o lote..."
                      class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
                  </div>

                  <!-- Contract List -->
                  @if (isLoadingContracts()) {
                    <div class="text-center py-10">
                      <div class="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-500 mx-auto"></div>
                      <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">Buscando contratos...</p>
                    </div>
                  } @else if (filteredContracts().length > 0) {
                    <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      @for (contract of filteredContracts(); track contract.contract_id) {
                        <div (click)="selectContract(contract)"
                          [class]="selectedContract()?.contract_id === contract.contract_id ?
                            'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 ring-1 ring-emerald-200 dark:ring-emerald-700' :
                            'bg-gray-50/80 dark:bg-gray-700/30 border-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:border-emerald-200/50'"
                          class="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all">
                          <div class="min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ contract.contract_number }}</p>
                            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">{{ contract.client_name }}</p>
                            <p class="text-[10px] text-gray-400 dark:text-gray-500">Lote: {{ contract.lot_name }}</p>
                          </div>
                          <div class="text-right flex-shrink-0 ml-3">
                            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(+(contract.financing_amount ?? 0)) }}</p>
                            <p class="text-[10px] text-emerald-500 font-semibold">{{ contract.term_months || 0 }} meses</p>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="text-center py-10">
                      <div class="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex mb-3">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">No se encontraron contratos</p>
                      @if (searchTerm()) {
                        <p class="text-xs text-gray-400 mt-1">Intenta con otros términos</p>
                      }
                    </div>
                  }
                </div>
              </div>
            </section>

            <!-- Configuración del Cronograma (derecha) -->
            <section class="lg:col-span-7">
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-fit">
                <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2.5">
                  <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 class="text-sm font-bold text-gray-900 dark:text-white">Configuración del Cronograma</h2>
                </div>

                <div class="p-5">
                  @if (selectedContract()) {
                    <form [formGroup]="scheduleForm" (ngSubmit)="generateSchedule()" class="space-y-5">
                      <!-- Contract Details -->
                      <div class="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/40">
                        <div class="flex items-center gap-2 mb-3">
                          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 class="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Detalles del Contrato</h3>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="text-[11px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider">Cliente</span>
                            <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ selectedContract()!.client_name }}</p>
                          </div>
                          <div>
                            <span class="text-[11px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider">Lote</span>
                            <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ selectedContract()!.lot_name }}</p>
                          </div>
                          <div>
                            <span class="text-[11px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider">Monto a Financiar</span>
                            <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ formatCurrency(+(selectedContract()!.financing_amount ?? 0)) }}</p>
                          </div>
                          <div>
                            <span class="text-[11px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider">Plazo</span>
                            <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ selectedContract()!.term_months }} meses</p>
                          </div>
                        </div>
                      </div>

                      <!-- Schedule Parameters -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fecha de Inicio</label>
                          <input type="date" formControlName="start_date"
                            class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
                          @if (scheduleForm.get('start_date')?.invalid && scheduleForm.get('start_date')?.touched) {
                            <p class="text-red-500 text-xs mt-1">La fecha de inicio es requerida</p>
                          }
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Frecuencia de Pago</label>
                          <select formControlName="frequency"
                            class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all appearance-none cursor-pointer">
                            <option value="monthly">Mensual</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="weekly">Semanal</option>
                          </select>
                        </div>
                      </div>

                      <!-- Payment Calculation -->
                      <div class="bg-indigo-50/60 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-700/40">
                        <div class="flex items-center gap-2 mb-3">
                          <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <h4 class="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Cálculo de Cuotas</h4>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider">Cuota Mensual</span>
                            <p class="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{{ formatCurrency(calculatedMonthlyPayment()) }}</p>
                          </div>
                          <div>
                            <span class="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider">Total de Cuotas</span>
                            <p class="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{{ selectedContract()!.term_months }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Notes -->
                      <div>
                        <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notas (Opcional)</label>
                        <textarea formControlName="notes" rows="3" placeholder="Agregar notas sobre el cronograma..."
                          class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all resize-none"></textarea>
                      </div>

                      <!-- Actions -->
                      <div class="flex gap-3 pt-2">
                        <button type="submit" [disabled]="scheduleForm.invalid || isGenerating()"
                          class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          @if (isGenerating()) {
                            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            <span>Generando...</span>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Generar Cronograma</span>
                          }
                        </button>
                        <button type="button" (click)="clearSelection()"
                          class="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all">
                          Limpiar
                        </button>
                      </div>
                    </form>
                  } @else {
                    <div class="text-center py-14">
                      <div class="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex mb-3">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un Contrato</p>
                      <p class="text-xs text-gray-400 mt-1">Elige un contrato de la lista para configurar su cronograma</p>
                    </div>
                  }
                </div>
              </div>
            </section>
          </div>
        } @else {
          <!-- ═══════════════ MASS TAB ═══════════════ -->
          <div class="space-y-6">

            <!-- Seleccionar Contratos -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                    <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 class="text-sm font-bold text-gray-900 dark:text-white">Seleccionar Contratos</h3>
                </div>
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                  {{ getSelectedContractsCount() }} de {{ filteredContracts().length }} seleccionados
                </span>
              </div>

              <div class="p-5">
                <!-- Search -->
                <div class="relative mb-4">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Buscar por contrato, cliente o lote..." (input)="onSearchChange($event)"
                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all" />
                </div>

                <!-- Selection Actions -->
                <div class="flex gap-2 mb-4">
                  <button type="button" (click)="selectAllContracts()"
                    class="px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors">
                    Seleccionar Todos
                  </button>
                  <button type="button" (click)="clearBulkSelection()"
                    class="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Limpiar Selección
                  </button>
                </div>

                <!-- Contract List -->
                @if (isLoadingContracts()) {
                  <div class="text-center py-10">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-violet-200 border-t-violet-500 mx-auto"></div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">Cargando contratos...</p>
                  </div>
                } @else if (filteredContracts().length === 0) {
                  <div class="text-center py-10">
                    <div class="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex mb-3">
                      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p class="text-sm text-gray-500 font-medium">No se encontraron contratos</p>
                    <p class="text-xs text-gray-400 mt-1">Ajusta los filtros de búsqueda</p>
                  </div>
                } @else {
                  <div class="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    @for (contract of filteredContracts(); track contract.contract_id) {
                      <div (click)="toggleContractSelection(contract.contract_id)"
                        class="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-violet-50/50 dark:hover:bg-violet-900/10 border border-transparent hover:border-violet-200/50 cursor-pointer transition-all">
                        <input type="checkbox" [checked]="isContractSelected(contract.contract_id)"
                          class="w-4 h-4 text-violet-600 bg-white border-gray-300 rounded focus:ring-violet-500 flex-shrink-0"
                          (click)="$event.stopPropagation()" (change)="toggleContractSelection(contract.contract_id)" />
                        <div class="flex-1 min-w-0 flex items-center justify-between">
                          <div class="min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ contract.contract_number }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ contract.client_name }} · {{ contract.lot_name }}</p>
                          </div>
                          <span class="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0 ml-3">{{ formatCurrency(+(contract.financing_amount || 0)) }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Configuración Global -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2.5">
                <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">Configuración Global</h3>
              </div>

              <div class="p-5">
                <form [formGroup]="bulkScheduleForm" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fecha de Inicio</label>
                      <input type="date" formControlName="start_date"
                        class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Frecuencia de Pago</label>
                      <select formControlName="frequency"
                        class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all appearance-none cursor-pointer">
                        <option value="monthly">Mensual</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="weekly">Semanal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notas (Opcional)</label>
                    <textarea formControlName="notes" rows="2" placeholder="Agregar notas para todos los cronogramas..."
                      class="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all resize-none"></textarea>
                  </div>
                </form>
              </div>
            </div>

            <!-- Generate Button / Progress -->
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
              @if (isBulkGenerating()) {
                <div class="text-center">
                  <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Generando Cronogramas...</h3>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                    <div class="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all"
                      [style.width.%]="bulkProgress()"></div>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ bulkProgress() }}% completado</p>
                </div>
              } @else {
                <div class="text-center">
                  <button type="button" (click)="generateBulkSchedules()"
                    [disabled]="getSelectedContractsCount() === 0 || bulkScheduleForm.invalid"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Generar {{ getSelectedContractsCount() }} Cronogramas
                  </button>
                  @if (getSelectedContractsCount() === 0) {
                    <p class="text-xs text-gray-400 mt-2">Selecciona al menos un contrato para continuar</p>
                  }
                </div>
              }
            </div>

            <!-- Bulk Results -->
            @if (bulkResults()) {
              <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2.5">
                  <div class="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="text-sm font-bold text-gray-900 dark:text-white">Resultados de Generación</h3>
                </div>

                <div class="p-5">
                  <div class="grid grid-cols-3 gap-4 mb-5">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-700/40">
                      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ bulkResults()?.total_contracts }}</p>
                      <p class="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mt-0.5">Total</p>
                    </div>
                    <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200/50 dark:border-emerald-700/40">
                      <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ bulkResults()?.successful }}</p>
                      <p class="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mt-0.5">Exitosos</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200/50 dark:border-red-700/40">
                      <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ bulkResults()?.failed }}</p>
                      <p class="text-[11px] font-semibold text-red-500 uppercase tracking-wider mt-0.5">Fallidos</p>
                    </div>
                  </div>

                  @if (bulkResults()?.results && bulkResults()!.results.length > 0) {
                    <div class="max-h-60 overflow-y-auto space-y-1.5">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles</h4>
                      @for (detail of bulkResults()?.results; track detail.contract_id) {
                        <div class="flex items-center justify-between p-2.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-lg">
                          <span class="text-sm font-medium text-gray-900 dark:text-white">{{ detail.contract_number }}</span>
                          @if (detail.success) {
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Exitoso</span>
                          } @else {
                            <span class="text-xs font-semibold text-red-600 dark:text-red-400">✗ {{ detail.error }}</span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Success/Error Messages -->
        @if (successMessage()) {
          <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl p-5 flex items-start gap-4">
            <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex-shrink-0">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">{{ successMessage() }}</p>
              <button (click)="viewGeneratedSchedule()"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors">
                Ver cronograma generado
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-5 flex items-center gap-4">
            <div class="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
            </div>
            <p class="text-sm font-semibold text-red-800 dark:text-red-200">{{ errorMessage() }}</p>
          </div>
        }

      </div>
    </div>
  `
})
export class ScheduleGeneratorComponent implements OnInit {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Signals
  contracts = signal<ContractWithSchedules[]>([]);
  selectedContract = signal<ContractWithSchedules | null>(null);
  isLoadingContracts = signal(false);
  isGenerating = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  searchTerm = signal('');
  generatedScheduleId: string | null = null;

  // Mass generation signals
  activeTab = signal<'individual' | 'mass'>('individual');
  selectedContracts = signal<Set<string>>(new Set());
  isBulkGenerating = signal(false);
  bulkProgress = signal(0);
  bulkResults = signal<{ total_contracts: number; successful: number; failed: number; results: any[] } | null>(null);

  // Forms
  scheduleForm: FormGroup;
  bulkScheduleForm: FormGroup;

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
    
    const financingAmount = Number(contract.financing_amount);
    const termMonths = Number(contract.term_months);
    
    return financingAmount / termMonths;
  });

  constructor() {
    this.scheduleForm = this.fb.group({
      start_date: [this.getDefaultStartDate(), Validators.required],
      frequency: ['monthly', Validators.required],
      notes: ['']
    });

    this.bulkScheduleForm = this.fb.group({
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

  // Mass generation methods
  switchTab(tab: 'individual' | 'mass') {
    this.activeTab.set(tab);
    this.clearMessages();
    this.clearSelection();
    this.clearBulkSelection();
  }

  toggleContractSelection(contractId: number) {
    const contractIdStr = contractId.toString();
    const selected = new Set(this.selectedContracts());
    if (selected.has(contractIdStr)) {
      selected.delete(contractIdStr);
    } else {
      selected.add(contractIdStr);
    }
    this.selectedContracts.set(selected);
  }

  selectAllContracts() {
    const allIds = new Set(this.filteredContracts().map(c => c.contract_id.toString()));
    this.selectedContracts.set(allIds);
  }

  clearBulkSelection() {
    this.selectedContracts.set(new Set());
    this.bulkResults.set(null);
    this.bulkProgress.set(0);
  }

  generateBulkSchedules() {
    if (this.bulkScheduleForm.invalid || this.selectedContracts().size === 0) {
      return;
    }

    this.isBulkGenerating.set(true);
    this.clearMessages();
    this.bulkProgress.set(0);
    this.bulkResults.set(null);

    const formValue = this.bulkScheduleForm.value;
    const contractIds = Array.from(this.selectedContracts());

    // NO enviar frequency para que el backend use los lot financial templates
    const request = {
      contract_ids: contractIds,
      start_date: formValue.start_date,
      notes: formValue.notes
    };

    this.collectionsService.generateBulkSchedules(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error generating bulk schedules:', error);
          this.errorMessage.set('Error al generar los cronogramas masivamente');
          return of(null);
        })
      )
      .subscribe(
        (response) => {
          if (response && response.success) {
            this.bulkResults.set(response.data);
            this.successMessage.set(`Generación masiva completada: ${response.data.successful}/${response.data.total_contracts} cronogramas generados exitosamente`);
            // Reload contracts to get updated data
            this.loadContracts();
            // Clear selection
            this.clearBulkSelection();
            this.bulkScheduleForm.patchValue({
              start_date: this.getDefaultStartDate(),
              frequency: 'monthly',
              notes: ''
            });
          }
          this.isBulkGenerating.set(false);
        },
        () => {
          this.isBulkGenerating.set(false);
        }
      );
  }

  isContractSelected(contractId: number): boolean {
    return this.selectedContracts().has(contractId.toString());
  }

  getSelectedContractsCount(): number {
    return this.selectedContracts().size;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }
}