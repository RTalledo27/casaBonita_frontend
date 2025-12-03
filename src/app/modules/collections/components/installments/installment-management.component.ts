import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { 
  LucideAngularModule, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  ArrowLeft,
  Download,
  Eye,
  Edit,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  FileText,
  Mail
} from 'lucide-angular';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { PaymentSchedule, ContractSummary, MarkPaymentPaidRequest } from '../../models/payment-schedule';

@Component({
  selector: 'app-installment-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.04),transparent_50%)]"></div>
      
      <div class="relative p-6 space-y-8">
        <!-- Modern Header -->
        <div class="mb-8">
          <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 dark:from-blue-600/20 dark:via-purple-600/10 dark:to-indigo-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
            
            <div class="relative flex justify-between items-center">
              <!-- Title Section -->
              <div class="flex items-center space-x-4">
                <button 
                  routerLink="/collections/dashboard"
                  class="group relative p-3 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <lucide-angular [img]="ArrowLeftIcon" class="w-6 h-6"></lucide-angular>
                </button>
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                  <lucide-angular [img]="DollarSignIcon" class="w-8 h-8 text-white"></lucide-angular>
                </div>
                <div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    Gestión de Contratos y Cuotas
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 mt-1 font-medium">Administrar contratos con sus cronogramas de pago</p>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-4">
                <button 
                  (click)="exportContracts()"
                  [disabled]="isLoading()"
                  class="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <lucide-angular [img]="DownloadIcon" class="w-5 h-5 relative z-10"></lucide-angular>
                  <span class="relative z-10">Exportar</span>
                  <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/50 to-green-500/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Filters -->
        <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <div class="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <lucide-angular [img]="FilterIcon" class="w-6 h-6 text-white"></lucide-angular>
              </div>
              <h2 class="text-xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Filtros de Búsqueda
              </h2>
            </div>
            <button 
              (click)="clearFilters()
              "
              class="group relative px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span class="relative z-10">Limpiar Filtros</span>
            </button>
          </div>
          
          <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="group">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-blue-600">
                Número de Contrato
              </label>
              <div class="relative">
                <lucide-angular [img]="SearchIcon" class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"></lucide-angular>
                <input
                  type="text"
                  formControlName="contract_number"
                  placeholder="Buscar por contrato..."
                  class="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                >
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div class="group">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-blue-600">
                Cliente
              </label>
              <div class="relative">
                <lucide-angular [img]="UserIcon" class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"></lucide-angular>
                <input
                  type="text"
                  formControlName="client_name"
                  placeholder="Buscar por cliente..."
                  class="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                >
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div class="group">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-blue-600">
                Estado
              </label>
              <div class="relative">
                <select
                  formControlName="status"
                  class="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <lucide-angular [img]="ChevronDownIcon" class="w-5 h-5 text-gray-400"></lucide-angular>
                </div>
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modern Contracts List -->
        <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <!-- List Header -->
          <div class="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 dark:from-blue-600/20 dark:via-purple-600/10 dark:to-indigo-600/20 px-8 py-6 border-b border-white/20 dark:border-gray-700/50">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <lucide-angular [img]="DollarSignIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <h2 class="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Contratos con Cronogramas
                </h2>
              </div>
              <div class="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 px-4 py-2 rounded-2xl">
                <span class="text-sm font-bold text-blue-800 dark:text-blue-200">
                  {{ filteredContracts().length }} contratos encontrados
                </span>
              </div>
            </div>
          </div>

          @if (isLoading()) {
            <div class="text-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-gray-600 mt-2">Cargando contratos...</p>
            </div>
          } @else {
            @if (filteredContracts().length > 0) {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gradient-to-r from-gray-50/80 via-blue-50/40 to-indigo-50/60 dark:from-gray-800/80 dark:via-blue-900/40 dark:to-indigo-900/60 backdrop-blur-sm">
                    <tr>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Contrato</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Cliente</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Asesor</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Lote</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Cuotas</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Progreso</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Próximo Vencimiento</th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm divide-y divide-gray-200/30 dark:divide-gray-700/30">
                    @for (contract of paginatedContracts(); track contract.contract_id) {
                      <!-- Contract Row -->
                      <tr class="group hover:bg-white/60 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] transform" (click)="toggleContractExpansion(contract)">
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-2 rounded-xl mr-3 group-hover:shadow-lg transition-all duration-300">
                              <lucide-angular 
                                [img]="contract.expanded ? ChevronDownIcon : ChevronRightIcon" 
                                class="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110"
                              ></lucide-angular>
                            </div>
                            <div>
                              <p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{{ contract.contract_number }}</p>
                              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">ID: {{ contract.contract_id }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 p-2 rounded-xl mr-3 group-hover:shadow-lg transition-all duration-300">
                              <lucide-angular [img]="UserIcon" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110"></lucide-angular>
                            </div>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{{ contract.client_name }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 p-2 rounded-xl mr-3 group-hover:shadow-lg transition-all duration-300">
                              <lucide-angular [img]="UsersIcon" class="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-300 group-hover:scale-110"></lucide-angular>
                            </div>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{{ contract.advisor_name }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-3 py-2 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                            <span class="text-sm font-semibold text-amber-800 dark:text-amber-200">{{ contract.lot_name }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                            <div class="flex items-center space-x-2 mb-2">
                              <span class="font-bold text-gray-900 dark:text-white text-lg">{{ contract.total_schedules }}</span>
                              <span class="text-gray-600 dark:text-gray-400 font-medium">cuotas</span>
                            </div>
                            <div class="flex flex-wrap gap-2 text-xs">
                              <span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg font-semibold border border-green-200 dark:border-green-700">{{ contract.paid_schedules }} pagadas</span>
                              <span class="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-lg font-semibold border border-yellow-200 dark:border-yellow-700">{{ contract.pending_schedules }} pendientes</span>
                              @if (contract.overdue_schedules > 0) {
                                <span class="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg font-semibold border border-red-200 dark:border-red-700">{{ contract.overdue_schedules }} vencidas</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          <div class="bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/30 p-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <div class="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                              <div 
                                class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-sm transition-all duration-500 ease-out" 
                                [style.width.%]="contract.payment_rate"
                              ></div>
                            </div>
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-bold text-gray-700 dark:text-gray-300">{{ contract.payment_rate }}% completado</span>
                              <div class="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-lg">
                                <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">{{ contract.payment_rate }}%</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap">
                          @if (contract.next_due_date) {
                            <div class="bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-900/30 dark:to-red-900/30 p-3 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                              <div class="flex items-center mb-1">
                                <div class="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 p-2 rounded-xl mr-3">
                                  <lucide-angular [img]="CalendarIcon" class="w-4 h-4 text-orange-600 dark:text-orange-400"></lucide-angular>
                                </div>
                                <div>
                                  <span class="text-sm font-bold text-gray-900 dark:text-white">{{ formatDate(contract.next_due_date) }}</span>
                                  <p class="text-xs text-orange-600 dark:text-orange-400 font-medium">Próximo vencimiento</p>
                                </div>
                              </div>
                            </div>
                          } @else {
                            <div class="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded-xl border border-green-200/50 dark:border-green-700/50">
                              <span class="text-sm font-semibold text-green-700 dark:text-green-300">Sin cuotas pendientes</span>
                            </div>
                          }
                        </td>
                        <td class="px-6 py-5 whitespace-nowrap text-sm font-medium">
                          <div class="flex gap-2">
                            <button 
                              (click)="viewContractDetails(contract); $event.stopPropagation()"
                              class="group relative p-3 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 dark:hover:from-blue-800/60 dark:hover:to-indigo-800/60 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 border border-blue-200/50 dark:border-blue-700/50"
                              title="Ver detalles"
                            >
                              <lucide-angular [img]="EyeIcon" class="w-4 h-4 transition-transform duration-300 group-hover:scale-110"></lucide-angular>
                              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Expanded Schedules -->
                     <!-- Expanded Schedules -->
@if (contract.expanded) {
  <tr>
    <td colspan="8" class="px-6 py-0">
      <div class="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-hidden shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur">
        <!-- Subheader -->
        <div class="px-5 py-3 text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900/40 dark:to-indigo-900/30 border-b border-slate-200/70 dark:border-slate-700/60">
          Cronograma de Cuotas
        </div>

        <div class="overflow-x-auto max-h-[420px]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/80 backdrop-blur">
              <tr class="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th class="py-3 px-4 font-semibold">Cuota</th>
                <th class="py-3 px-4 font-semibold">Vencimiento</th>
                <th class="py-3 px-4 font-semibold text-right">Monto</th>
                <th class="py-3 px-4 font-semibold">Estado</th>
                <th class="py-3 px-4 font-semibold">Días Vencido</th>
                <th class="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-200/70 dark:divide-slate-700/50">
              @for (schedule of contract.schedules; track schedule.schedule_id) {
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-slate-900 dark:text-slate-100">
                        {{ schedule.installment_number || 'N/A' }}
                      </span>
                      @if (schedule.notes) {
                        <span class="text-xs text-slate-500 dark:text-slate-300">/ {{ schedule.notes }}</span>
                      }
                      @if (schedule.type) {
                        <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 ring-1 ring-slate-200/70 dark:ring-slate-700/60">
                          {{ schedule.type }}
                        </span>
                      }
                    </div>
                  </td>

                  <td class="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {{ formatDate(schedule.due_date) }}
                  </td>

                  <td class="py-3 px-4 text-right">
                    <span class="font-semibold text-slate-900 dark:text-white">
                      {{ formatCurrency(schedule.amount) }}
                    </span>
                  </td>

                  <td class="py-3 px-4">
                    <span [class]="getStatusClass(schedule.status)">
                      {{ getStatusLabel(schedule.status) }}
                    </span>
                  </td>

                  <td class="py-3 px-4">
                    @if (schedule.status === 'vencido') {
                      <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-200/70 dark:ring-red-800/60">
                        {{ getDaysOverdue(schedule.due_date) }} días
                      </span>
                    } @else {
                      <span class="text-slate-400">-</span>
                    }
                  </td>

                  <td class="py-3 px-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        (click)="sendReminder(schedule); $event.stopPropagation()"
                        class="inline-flex items-center justify-center h-8 w-8 rounded-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 ring-1 ring-blue-200/70 dark:ring-blue-800/60 transition"
                        title="Enviar aviso"
                      >
                        <lucide-angular [img]="MailIcon" class="w-4 h-4"></lucide-angular>
                      </button>
                      <button
                        (click)="openCustomMessageModal(schedule); $event.stopPropagation()"
                        class="inline-flex items-center justify-center h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ring-1 ring-indigo-200/70 dark:ring-indigo-800/60 transition"
                        title="Mensaje personalizado"
                      >
                        <lucide-angular [img]="EditIcon" class="w-4 h-4"></lucide-angular>
                      </button>
                      @if (schedule.status !== 'pagado') {
                        <button
                          (click)="openMarkPaidModal(schedule)"
                          class="inline-flex items-center justify-center h-8 w-8 rounded-full text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ring-1 ring-emerald-200/70 dark:ring-emerald-800/60 transition"
                          title="Marcar como pagado"
                        >
                          <lucide-angular [img]="CheckCircleIcon" class="w-4 h-4"></lucide-angular>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </td>
  </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              @if (totalPages() > 1 || contracts().length > 0) {
                <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="text-sm text-gray-700">
                      @if (paginationInfo()) {
                        Mostrando {{ paginationInfo()!.from }} a {{ paginationInfo()!.to }} de {{ paginationInfo()!.total }} resultados
                      } @else {
                        Mostrando {{ contracts().length }} resultados
                      }
                    </div>
                    <div class="flex items-center space-x-2">
                      <label class="text-sm text-gray-700">Mostrar:</label>
                      <select 
                        [value]="pageSize()"
                        (change)="onPageSizeChange($event)"
                        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span class="text-sm text-gray-700">por página</span>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      (click)="previousPage()"
                      [disabled]="currentPage() === 1"
                      class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    @for (page of getPageNumbers(); track page) {
                      <button 
                        (click)="goToPage(page)"
                        [class]="page === currentPage() ? 
                          'px-3 py-1 bg-blue-600 text-white rounded text-sm' : 
                          'px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'"
                      >
                        {{ page }}
                      </button>
                    }
                    <button 
                      (click)="nextPage()"
                      [disabled]="currentPage() === totalPages()"
                      class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              }
            } @else {
              <!-- Empty state -->
              <div class="text-center py-16 relative">
                <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-12 relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20"></div>
                  <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
                
                  <div class="relative">
                    <div class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-6 rounded-3xl shadow-lg mb-6 mx-auto w-fit">
                      <lucide-angular [img]="CalendarIcon" class="w-16 h-16 text-gray-400 dark:text-gray-500"></lucide-angular>
                    </div>
                    <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-3">
                      No se encontraron contratos
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto">
                      Intenta ajustar los filtros de búsqueda para encontrar los contratos que necesitas
                    </p>
                  </div>
                </div>
              </div>
            }
          }

        </div> <!-- /Modern Contracts List -->

        <!-- Modern Mark as Paid Modal -->
        @if (showMarkPaidModal()) {
          <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/50 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              
              <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-4">
                    <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                      <lucide-angular [img]="CheckCircleIcon" class="w-6 h-6 text-white"></lucide-angular>
                    </div>
                    <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent">Marcar como Pagado</h3>
                  </div>
                  <button 
                    (click)="closeMarkPaidModal()"
                    class="group relative p-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <lucide-angular [img]="XIcon" class="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"></lucide-angular>
                  </button>
                </div>
                
                @if (selectedScheduleForPayment()) {
                  <form [formGroup]="markPaidForm" (ngSubmit)="markAsPaid()" class="space-y-6">
                    <div class="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
                      <div class="space-y-3">
                        <div class="flex justify-between items-center">
                          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Contrato:</span>
                          <span class="font-bold text-gray-900 dark:text-white">{{ selectedScheduleForPayment()!.contract_id }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Monto:</span>
                          <span class="font-bold text-green-600 dark:text-green-400 text-lg">{{ formatCurrency(selectedScheduleForPayment()!.amount) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Vencimiento:</span>
                          <span class="font-bold text-gray-900 dark:text-white">{{ formatDate(selectedScheduleForPayment()!.due_date) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <div class="group">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-blue-600">Fecha de Pago</label>
                        <div class="relative">
                          <input
                            type="date"
                            formControlName="payment_date"
                            class="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                          >
                          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                      <div class="group">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-green-600">Monto Pagado</label>
                        <div class="relative">
                          <input
                            type="number"
                            step="0.01"
                            formControlName="amount_paid"
                            class="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                          >
                          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div class="group">
                      <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-purple-600">Método de Pago</label>
                      <div class="relative">
                        <select
                          formControlName="payment_method"
                          class="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="cash">💵 Efectivo</option>
                          <option value="transfer">🏦 Transferencia</option>
                          <option value="check">📄 Cheque</option>
                          <option value="card">💳 Tarjeta</option>
                        </select>
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div class="group">
                      <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors group-focus-within:text-indigo-600">Notas</label>
                      <div class="relative">
                        <textarea
                          formControlName="notes"
                          rows="3"
                          placeholder="Notas adicionales sobre el pago..."
                          class="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white resize-none"
                        ></textarea>
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div class="flex space-x-4 pt-6">
                      <button
                        type="submit"
                        [disabled]="markPaidForm.invalid || isMarkingPaid()"
                        class="group relative flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        @if (isMarkingPaid()) {
                          <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent relative z-10"></div>
                          <span class="relative z-10">Procesando...</span>
                        } @else {
                          <lucide-angular [img]="CheckCircleIcon" class="w-5 h-5 relative z-10"></lucide-angular>
                          <span class="relative z-10">Marcar como Pagado</span>
                        }
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/50 to-emerald-500/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
                      </button>
                      <button
                        type="button"
                        (click)="closeMarkPaidModal()"
                        class="group relative px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden"
                      >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span class="relative z-10">Cancelar</span>
                      </button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </div>
        }

        <!-- Modern Error/Success Messages -->
        @if (errorMessage()) {
          <div class="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 rounded-2xl shadow-xl p-6 flex items-center space-x-4 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/5 dark:from-red-600/20 dark:to-pink-600/10"></div>
            <div class="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-2xl shadow-lg relative z-10">
              <lucide-angular [img]="AlertTriangleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
            <p class="text-red-800 dark:text-red-200 font-semibold relative z-10">{{ errorMessage() }}</p>
          </div>
        }

        @if (successMessage()) {
          <div class="bg-green-50/80 dark:bg-green-900/20 backdrop-blur-xl border border-green-200/50 dark:border-green-800/50 rounded-2xl shadow-xl p-6 flex items-center space-x-4 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/5 dark:from-green-600/20 dark:to-emerald-600/10"></div>
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg relative z-10">
              <lucide-angular [img]="CheckCircleIcon" class="w-6 h-6 text-white"></lucide-angular>
            </div>
            <p class="text-green-800 dark:text-green-200 font-semibold relative z-10">{{ successMessage() }}</p>
          </div>
        }
      </div> <!-- /relative p-6 -->
    </div> <!-- /min-h-screen -->

    @if (showCustomMessageModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full border border-white/20 dark:border-gray-700/50 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500"></div>
          <div class="p-8">
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <lucide-angular [img]="EditIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200">Mensaje personalizado</h3>
              </div>
              <button (click)="closeCustomMessageModal()" class="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <lucide-angular [img]="XIcon" class="w-5 h-5"></lucide-angular>
              </button>
            </div>

            <form [formGroup]="customMessageForm" (ngSubmit)="sendCustomMessage()" class="space-y-5">
              <div>
                <label class="block text-sm font-bold mb-2">Asunto</label>
                <input type="text" formControlName="subject" aria-label="Asunto" class="w-full px-4 py-3 rounded-2xl border" />
              </div>
              <div>
                <label class="block text-sm font-bold mb-2">Plantilla</label>
                <select formControlName="template" aria-label="Plantilla" (change)="applyTemplate($event)" class="w-full px-4 py-3 rounded-2xl border">
                  <option value="">Sin plantilla</option>
                  <option value="friendly">Recordatorio amistoso</option>
                  <option value="last_notice">Último aviso</option>
                  <option value="thanks">Gracias por su pago</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold mb-2">Mensaje</label>
                <textarea formControlName="message" rows="5" aria-label="Mensaje" class="w-full px-4 py-3 rounded-2xl border" placeholder="Escribe tu mensaje..."></textarea>
                <div class="text-xs mt-1" [class]="customMessageForm.controls['message'].invalid && customMessageForm.controls['message'].touched ? 'text-red-600' : 'text-gray-500'">
                  Mínimo 10 y máximo 500 caracteres
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold mb-2">Fuente</label>
                  <select formControlName="font" aria-label="Fuente" class="w-full px-4 py-3 rounded-2xl border">
                    <option>Arial</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Verdana</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-bold mb-2">Color</label>
                  <input type="color" formControlName="color" aria-label="Color" class="w-10 h-10 p-0 border rounded" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold mb-2">Imagen (URL)</label>
                <input type="url" formControlName="imageUrl" aria-label="Imagen" class="w-full px-4 py-3 rounded-2xl border" placeholder="https://..." />
              </div>
              <div class="p-4 rounded-2xl border">
                <div [ngStyle]="{ 'font-family': customMessageForm.value.font, 'color': customMessageForm.value.color }">
                  <p class="mb-2">Vista previa</p>
                  <div [innerHTML]="previewHtml()"></div>
                </div>
              </div>
              <button type="submit" [disabled]="customMessageForm.invalid" class="w-full px-6 py-3 rounded-2xl bg-indigo-600 text-white">
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class InstallmentManagementComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ClockIcon = Clock;
  ArrowLeftIcon = ArrowLeft;
  DownloadIcon = Download;
  EyeIcon = Eye;
  EditIcon = Edit;
  XIcon = X;
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  UsersIcon = Users;
  UserIcon = User;
  FileTextIcon = FileText;
  MailIcon = Mail;

  // Signals
  contracts = signal<ContractSummary[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showMarkPaidModal = signal(false);
  showCustomMessageModal = signal(false);
  selectedScheduleForPayment = signal<PaymentSchedule | null>(null);
  selectedScheduleForMessage = signal<PaymentSchedule | null>(null);
  isMarkingPaid = signal(false);
  isSendingReminder = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  paginationInfo = signal<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  // Forms
  filterForm: FormGroup;
  markPaidForm: FormGroup;
  customMessageForm: FormGroup;

  // Computed properties - Now using backend pagination
  paginatedContracts = computed(() => {
    return this.contracts();
  });

  totalPages = computed(() => {
    const paginationInfo = this.paginationInfo();
    return paginationInfo ? paginationInfo.last_page : 1;
  });

  filteredContracts = computed(() => {
    return this.contracts();
  });

  Math = Math;
  currentDate =  new Date();
  currentDateFormat = this.currentDate.toISOString().split('T')[0];

  constructor() {
    this.filterForm = this.fb.group({
      contract_number: [''],
      client_name: [''],
      status: ['']
    });

    this.markPaidForm = this.fb.group({
      payment_date: [new Date().toISOString().split('T')[0], Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0.01)]],
      payment_method: ['cash', Validators.required],
      notes: ['']
    });

    this.customMessageForm = this.fb.group({
      subject: ['Mensaje de Cobranzas', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      template: [''],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      font: ['Arial', Validators.required],
      color: ['#111827', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit() {
    this.loadContracts();


    
    // Setup filter changes
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadContracts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContracts() {
    this.isLoading.set(true);
    this.clearMessages();
    
    const filters = this.filterForm.value;
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
    );
    
    // Add pagination parameters
    const paginationFilters = {
      ...cleanFilters,
      page: this.currentPage(),
      per_page: this.pageSize()
    };
    
this.collectionsService.getContractsWithSchedulesSummary(paginationFilters)
  .pipe(
    takeUntil(this.destroy$),
    catchError(error => {
      console.error('Error loading contracts:', error);
      this.errorMessage.set('Error cargando contratos: ' + (error?.error?.message || error.message));
      // Emitimos un “fallo” controlado
      return of({ success: false, data: [], pagination: null });
    }),
    finalize(() => this.isLoading.set(false))
  )
  .subscribe((response: any) => {
    if (!response?.success) {
      // Manejo claro del caso de error
      this.contracts.set([]);
      this.paginationInfo.set(null);
      return;
    }

    // Success
    const safeData = Array.isArray(response.data) ? response.data : [];
    const contractsWithExpanded = safeData.map((contract: ContractSummary) => ({
      ...contract,
      expanded: false
    }));
    this.contracts.set(contractsWithExpanded);

    if (response.pagination) {
      this.paginationInfo.set(response.pagination);
      this.totalItems.set(response.pagination.total);
    } else {
      // (Opcional) Fallback si el backend no manda paginación
      const total = contractsWithExpanded.length;
      this.paginationInfo.set({
        current_page: 1,
        last_page: 1,
        per_page: total || this.pageSize(),
        total,
        from: total ? 1 : 0,
        to: total
      });
      this.totalItems.set(total);
    }
  });
}

  toggleContractExpansion(contract: ContractSummary) {
    const contracts = this.contracts();
    const updatedContracts = contracts.map(c => 
      c.contract_id === contract.contract_id 
        ? { ...c, expanded: !c.expanded }
        : c
    );
    this.contracts.set(updatedContracts);
  }

  clearFilters() {
    this.filterForm.reset({
      contract_number: '',
      client_name: '',
      status: ''
    });
    this.currentPage.set(1);
  }

  viewContractDetails(contract: ContractSummary) {
    console.log('View contract details:', contract);
    // TODO: Navigate to contract details page
  }

  openMarkPaidModal(schedule: PaymentSchedule) {
    console.log('DEBUG: openMarkPaidModal called with schedule:', schedule);
    console.log('DEBUG: schedule_id value:', schedule.schedule_id);
    this.selectedScheduleForPayment.set(schedule);
    this.markPaidForm.patchValue({
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: schedule.amount,
      payment_method: 'cash',
      notes: ''
    });
    this.showMarkPaidModal.set(true);
  }

  openCustomMessageModal(schedule: PaymentSchedule) {
    this.selectedScheduleForMessage.set(schedule);
    this.customMessageForm.reset({
      subject: 'Mensaje de Cobranzas',
      template: '',
      message: '',
      font: 'Arial',
      color: '#111827',
      imageUrl: ''
    });
    this.showCustomMessageModal.set(true);
  }

  closeCustomMessageModal() {
    this.showCustomMessageModal.set(false);
    this.selectedScheduleForMessage.set(null);
  }

  applyTemplate(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const templates: Record<string, string> = {
      friendly: 'Hola, te recordamos tu próxima cuota. Muchas gracias por tu confianza. 😊',
      last_notice: 'Último aviso: tu cuota está próxima a vencer. Evita cargos adicionales realizando tu pago a tiempo.',
      thanks: 'Gracias por su pago. ¡Seguimos a tu disposición para cualquier consulta!'
    };
    if (templates[value]) {
      this.customMessageForm.controls['message'].setValue(templates[value]);
    }
  }

  previewHtml(): string {
    const v = this.customMessageForm.value;
    const msg = this.escapeHtml(v.message || '');
    const emojiMsg = msg;
    const imgTag = v.imageUrl ? `<div><img src="${v.imageUrl}" alt="imagen" style="max-width:100%;border-radius:12px"/></div>` : '';
    return `<div style="font-family:${v.font};color:${v.color};line-height:1.5">${emojiMsg}${imgTag}</div>`;
  }

  private escapeHtml(s: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return s.replace(/[&<>"']/g, c => map[c]);
  }

  sendCustomMessage() {
    if (this.customMessageForm.invalid) return;
    const schedule = this.selectedScheduleForMessage();
    if (!schedule) return;
    const v = this.customMessageForm.value;
    const html = this.previewHtml();
    this.collectionsService.sendCustomEmailForSchedule(schedule.schedule_id, v.subject, html)
      .pipe(
        catchError(error => {
          this.errorMessage.set('Error enviando mensaje: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        if (res?.success) {
          this.successMessage.set('Mensaje enviado');
          this.closeCustomMessageModal();
        }
      });
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
    this.selectedScheduleForPayment.set(null);
  }

  markAsPaid() {
    if (this.markPaidForm.invalid) {
      return;
    }

    const selectedSchedule = this.selectedScheduleForPayment();
    if (!selectedSchedule) return;

    console.log('DEBUG: markAsPaid - selectedSchedule:', selectedSchedule);
    console.log('DEBUG: markAsPaid - schedule_id:', selectedSchedule.schedule_id);

    this.isMarkingPaid.set(true);
    this.clearMessages();

    const request: MarkPaymentPaidRequest = {
      payment_date: this.markPaidForm.value.payment_date,
      amount_paid: this.markPaidForm.value.amount_paid,
      payment_method: this.markPaidForm.value.payment_method,
      notes: this.markPaidForm.value.notes
    };

    console.log('DEBUG: About to call markPaymentPaid with schedule_id:', selectedSchedule.schedule_id, 'and request:', request);
    this.collectionsService.markPaymentPaid(selectedSchedule.schedule_id, request)
      .pipe(
        catchError(error => {
          console.error('Error marking payment as paid:', error);
          this.errorMessage.set('Error marcando pago: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isMarkingPaid.set(false);
        if (response.success) {
          this.successMessage.set('Pago marcado como pagado exitosamente');
          this.closeMarkPaidModal();
          this.loadContracts(); // Reload to get updated data
        }
      });
  }

  sendReminder(schedule: PaymentSchedule) {
    this.isSendingReminder.set(true);
    this.clearMessages();
    this.collectionsService.sendInstallmentReminder(schedule.schedule_id)
      .pipe(
        catchError(error => {
          this.errorMessage.set('Error enviando aviso: ' + (error.error?.message || error.message));
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        this.isSendingReminder.set(false);
        if (response?.success) {
          this.successMessage.set('Aviso enviado correctamente');
        }
      });
  }

  exportContracts() {
    console.log('Export contracts');
    // TODO: Implement export functionality
  }

  //calcular dias vencidos
 

  // Pagination methods
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadContracts();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadContracts();
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadContracts();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageSize.set(newPageSize);
    this.currentPage.set(1); // Reset to first page
    this.loadContracts();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

getStatusClass(status: string): string {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1';
  switch (status) {
    case 'pagado':
      return `${base} bg-green-100 text-green-700 ring-green-200/70 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-800/60`;
    case 'pendiente':
      return `${base} bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800/60`;
    case 'vencido':
      return `${base} bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800/60`;
    default:
      return `${base} bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-700/60`;
  }
}


  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  }

  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    
    // Normalizar las fechas al inicio del día para evitar problemas de zona horaria
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Si no está vencido, retornar 0
    if (now <= due) {
      return 0;
    }
    
    // Calcular días exactos sin decimales
    const diffTime = now.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Función adicional para mostrar días y horas de forma más detallada
  getOverdueDisplay(dueDate: string): string {
    const due = new Date(dueDate);
    const now = new Date();
    
    // Si no está vencido
    if (now <= due) {
      return '';
    }
    
    const diffTime = now.getTime() - due.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days === 0) {
      return `${hours}h`;
    } else if (days === 1) {
      return '1 día';
    } else {
      return `${days} días`;
    }
  }
}
