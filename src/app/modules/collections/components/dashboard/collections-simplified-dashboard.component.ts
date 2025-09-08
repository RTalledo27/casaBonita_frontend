import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, of } from 'rxjs';
import { startWith, switchMap, catchError, tap } from 'rxjs/operators';
import { 
  LucideAngularModule, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Activity
} from 'lucide-angular';
import { CollectionsSimplifiedService, CollectionsSimplifiedDashboard } from '../../services/collections-simplified.service';
import { PaymentSchedule } from '../../models/payment-schedule';
import { RecentContract } from '../../models/recent-contract';

@Component({
  selector: 'app-collections-simplified-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/80 dark:from-gray-900 dark:via-blue-900/15 dark:to-indigo-900/25 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.03),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.025),transparent_50%)]"></div>
      
      <div class="relative p-6 space-y-6">
        <!-- Modern Header -->
        <div class="mb-8">
          <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden">
            <!-- Header Gradient Background -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-400/8 via-purple-400/4 to-indigo-400/8 dark:from-blue-500/15 dark:via-purple-500/8 dark:to-indigo-500/15"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400"></div>
            
            <div class="relative flex justify-between items-center">
              <!-- Title Section -->
              <div class="flex items-center space-x-4">
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                  <lucide-angular [img]="ActivityIcon" class="w-8 h-8 text-white"></lucide-angular>
                </div>
                <div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    Dashboard de Cronogramas
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 mt-1 font-medium">Gestión simplificada de cronogramas de pagos</p>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-4">
                <button 
                  (click)="refreshDashboard()"
                  [disabled]="isLoading()"
                  class="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden disabled:opacity-50"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <lucide-angular [img]="ActivityIcon" class="w-5 h-5 relative z-10"></lucide-angular>
                  <span class="relative z-10">{{ isLoading() ? 'Actualizando...' : 'Actualizar' }}</span>
                  <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/50 to-green-500/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
                </button>
                
                <button 
                  routerLink="/collections-simplified/generator"
                  class="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold overflow-hidden"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <lucide-angular [img]="FileTextIcon" class="w-5 h-5 relative z-10"></lucide-angular>
                  <span class="relative z-10">Generar Cronograma</span>
                  <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/50 to-indigo-500/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Contracts -->
          <div class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-600/20 dark:via-indigo-600/10 dark:to-purple-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div class="relative flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Contratos Activos</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">{{ dashboardData()?.total_contracts || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Con cronogramas</p>
              </div>
              <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <lucide-angular [img]="FileTextIcon" class="w-8 h-8 text-white"></lucide-angular>
              </div>
            </div>
          </div>

          <!-- Pending Amount -->
          <div class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-amber-500/10 dark:from-yellow-600/20 dark:via-orange-600/10 dark:to-amber-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
            <div class="relative flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Monto Pendiente</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {{ formatCurrency(dashboardData()?.pending_amount || 0) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Por cobrar</p>
              </div>
              <div class="bg-gradient-to-br from-yellow-500 to-orange-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <lucide-angular [img]="ClockIcon" class="w-8 h-8 text-white"></lucide-angular>
              </div>
            </div>
          </div>

          <!-- Overdue Amount -->
          <div class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 via-pink-500/5 to-rose-500/10 dark:from-red-600/20 dark:via-pink-600/10 dark:to-rose-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-600"></div>
            <div class="relative flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Monto Vencido</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  {{ formatCurrency(dashboardData()?.overdue_amount || 0) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ dashboardData()?.overdue_count || 0 }} cuotas</p>
              </div>
              <div class="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <lucide-angular [img]="AlertTriangleIcon" class="w-8 h-8 text-white"></lucide-angular>
              </div>
            </div>
          </div>

          <!-- Payment Rate -->
          <div class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-600/20 dark:via-emerald-600/10 dark:to-teal-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <div class="relative flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Tasa de Pago</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {{ (dashboardData()?.payment_rate || 0).toFixed(1) }}%
                </p>
                <div class="flex items-center">
                  <lucide-angular [img]="TrendingUpIcon" class="w-4 h-4 text-green-500 mr-1"></lucide-angular>
                  <span class="text-xs text-green-600 dark:text-green-400 font-medium">Este mes</span>
                </div>
              </div>
              <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <lucide-angular [img]="CheckCircleIcon" class="w-8 h-8 text-white"></lucide-angular>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Three sections: Recent Created, Upcoming, and Overdue -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recently Created Schedules -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-600/20 dark:via-emerald-600/10 dark:to-teal-600/20"></div>
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
            
            <div class="relative">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">Cronogramas Recién Creados</h3>
                <button 
                  routerLink="/collections-simplified/schedules"
                  class="group text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-sm font-semibold transition-all duration-300 hover:scale-105"
                >
                  Ver todos
                </button>
              </div>
              @if (recentCreatedSchedules().length > 0) {
                <div class="space-y-4">
                  @for (contract of recentCreatedSchedules(); track contract.contract_id) {
                    <div class="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50/60 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/30 dark:border-green-700/30 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
                      <div>
                        <p class="font-bold text-gray-900 dark:text-white mb-1">{{ contract.contract_number }}</p>
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">{{ contract.client_name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ contract.lot_name }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-2xl bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{{ contract.total_schedules }}</p>
                        <p class="text-xs text-green-500 dark:text-green-400 font-semibold">cuotas</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <div class="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 p-6 rounded-2xl mb-4 inline-block">
                    <lucide-angular [img]="FileTextIcon" class="w-12 h-12 mx-auto text-green-500 dark:text-green-400"></lucide-angular>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 font-medium">No hay cronogramas recién creados</p>
                </div>
              }
            </div>
          </div>

          <!-- Upcoming Payment Schedules -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-400/8 via-indigo-400/4 to-purple-400/8 dark:from-blue-500/15 dark:via-indigo-500/8 dark:to-purple-500/15"></div>
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
            
            <div class="relative">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">Cuotas Próximas a Vencer</h3>
                <button 
                  routerLink="/collections-simplified/schedules"
                  class="group text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-semibold transition-all duration-300 hover:scale-105"
                >
                  Ver todas
                </button>
              </div>
              @if (recentSchedules().length > 0) {
                <div class="space-y-4">
                  @for (schedule of recentSchedules(); track schedule.schedule_id) {
                    <div class="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
                      <div>
                        <p class="font-bold text-gray-900 dark:text-white mb-1">Contrato #{{ schedule.contract_number }}</p>
                        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Vence: {{ formatDate(schedule.due_date) }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-1">{{ formatCurrency(schedule.amount) }}</p>
                        <span [class]="getStatusClass(schedule.status)">
                          {{ getStatusLabel(schedule.status) }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <div class="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-6 rounded-2xl mb-4 inline-block">
                    <lucide-angular [img]="CalendarIcon" class="w-12 h-12 mx-auto text-blue-500 dark:text-blue-400"></lucide-angular>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 font-medium">No hay cuotas próximas a vencer</p>
                </div>
              }
            </div>
          </div>

          <!-- Overdue Schedules -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-red-400/8 via-pink-400/4 to-rose-400/8 dark:from-red-500/15 dark:via-pink-500/8 dark:to-rose-500/15"></div>
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-pink-400 to-rose-400"></div>
            
            <div class="relative">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-300 dark:to-pink-300 bg-clip-text text-transparent">Cuotas Vencidas</h3>
                <button 
                  routerLink="/collections-simplified/installments"
                  [queryParams]="{ status: 'vencido' }"
                  class="group text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm font-semibold transition-all duration-300 hover:scale-105"
                >
                  Ver todas
                </button>
              </div>
              @if (overdueSchedules().length > 0) {
                <div class="space-y-4">
                  @for (schedule of overdueSchedules(); track schedule.schedule_id) {
                    <div class="group flex items-center justify-between p-4 bg-gradient-to-r from-red-50/60 to-pink-50/60 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200/30 dark:border-red-700/30 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
                      <div>
                        <p class="font-bold text-gray-900 dark:text-white mb-1">Contrato #{{ schedule.contract_number }}</p>
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">Vencido: {{ formatDate(schedule.due_date) }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-lg bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">{{ formatCurrency(schedule.amount) }}</p>
                        <button 
                          (click)="markAsPaid(schedule)"
                          class="group relative px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                        >
                          <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span class="relative z-10">Marcar Pagado</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <div class="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 p-6 rounded-2xl mb-4 inline-block">
                    <lucide-angular [img]="CheckCircleIcon" class="w-12 h-12 mx-auto text-green-500 dark:text-green-400"></lucide-angular>
                  </div>
                  <p class="text-green-600 dark:text-green-400 font-semibold">No hay cuotas vencidas</p>
                </div>
              }
            </div>
          </div>
      </div>

        <!-- Quick Actions -->
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-400/8 via-blue-400/4 to-indigo-400/8 dark:from-purple-500/15 dark:via-blue-500/8 dark:to-indigo-500/15"></div>
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400"></div>
          
          <div class="relative">
            <h3 class="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-300 dark:to-blue-300 bg-clip-text text-transparent mb-6">Acciones Rápidas</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                routerLink="/collections-simplified/generator"
                class="group relative flex items-center space-x-4 p-6 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl overflow-hidden"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-blue-400/8 to-indigo-400/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="bg-gradient-to-br from-blue-400 to-indigo-500 p-3 rounded-xl shadow-lg relative z-10">
                  <lucide-angular [img]="FileTextIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <div class="text-left relative z-10">
                  <p class="font-bold text-gray-900 dark:text-white mb-1">Generar Cronograma</p>
                  <p class="text-sm text-blue-500 dark:text-blue-400 font-medium">Crear nuevo cronograma de pagos</p>
                </div>
              </button>
              
              <button 
                routerLink="/collections-simplified/installments"
                class="group relative flex items-center space-x-4 p-6 bg-gradient-to-br from-green-50/60 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100/70 hover:to-emerald-100/70 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 rounded-2xl border border-green-200/30 dark:border-green-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl overflow-hidden"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-green-400/8 to-emerald-400/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg relative z-10">
                  <lucide-angular [img]="DollarSignIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <div class="text-left relative z-10">
                  <p class="font-bold text-gray-900 dark:text-white mb-1">Gestionar Cuotas</p>
                  <p class="text-sm text-green-500 dark:text-green-400 font-medium">Marcar pagos y gestionar cuotas</p>
                </div>
              </button>
              
              <button 
                routerLink="/collections-simplified/reports"
                class="group relative flex items-center space-x-4 p-6 bg-gradient-to-br from-purple-50/60 to-pink-50/60 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100/70 hover:to-pink-100/70 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 rounded-2xl border border-purple-200/30 dark:border-purple-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl overflow-hidden"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-purple-400/8 to-pink-400/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl shadow-lg relative z-10">
                  <lucide-angular [img]="FileTextIcon" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <div class="text-left relative z-10">
                  <p class="font-bold text-gray-900 dark:text-white mb-1">Ver Reportes</p>
                  <p class="text-sm text-purple-500 dark:text-purple-400 font-medium">Reportes de estado de pagos</p>
                </div>
              </button>
            </div>
          </div>
        </div>
    </div>
  `
})
export class CollectionsSimplifiedDashboardComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsSimplifiedService);
  private readonly destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  ActivityIcon = Activity;

  // Signals
  dashboardData = signal<CollectionsSimplifiedDashboard | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed values
  recentCreatedSchedules = computed(() => this.dashboardData()?.recent_created_schedules || [] as RecentContract[]);
  recentSchedules = computed(() => this.dashboardData()?.recent_schedules || []);
  overdueSchedules = computed(() => this.dashboardData()?.overdue_schedules || []);

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadDashboardData()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.collectionsService.getDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error.set('Error al cargar los datos del dashboard');
          this.isLoading.set(false);
          return of(null);
        }),
        tap((data) => {
          if (data) {
            this.dashboardData.set(data);
          }
          this.isLoading.set(false);
        })
      );
  }

  refreshDashboard() {
    this.loadDashboardData().subscribe();
  }

  markAsPaid(schedule: PaymentSchedule) {
    const today = new Date().toISOString().split('T')[0];
    
    this.collectionsService.markPaymentPaid(schedule.schedule_id, {
      payment_date: today,
      amount_paid: schedule.amount,
      payment_method: 'transfer',
      notes: 'Marcado como pagado desde dashboard'
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error marking payment as paid:', error);
        this.error.set('Error al marcar el pago como pagado');
      }
    });
  }

  formatCurrency(amount: number): string {
    const currency = this.dashboardData()?.currency || 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full';
      case 'vencido':
        return 'text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full';
      case 'pendiente':
      default:
        return 'text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }
}