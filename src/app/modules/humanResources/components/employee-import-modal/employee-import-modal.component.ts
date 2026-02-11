import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Upload, FileText, CheckCircle, AlertCircle, Building2, Users, Layers, ChevronRight, ChevronLeft, Eye, Check, RefreshCw, Briefcase } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { EmployeeService } from '../../services/employee.service';

interface ImportPreview {
  total_employees: number;
  new_employees: number;
  existing_employees: number;
  offices: { name: string; is_new: boolean }[];
  teams: { name: string; is_new: boolean }[];
  areas: { name: string; is_new: boolean }[];
  positions: { name: string; is_new: boolean; category: string }[];
  employees: { row: number; name: string; dni: string; email: string; office: string; team: string; area: string; position: string; status: string }[];
  new_offices: number;
  new_teams: number;
  new_areas: number;
  new_positions: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  errors: string[];
}

@Component({
  selector: 'app-employee-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" *ngIf="isOpen">
  <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-700/50">
    
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
      <div class="flex items-center gap-4">
        <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
          <lucide-angular [img]="Upload" class="w-7 h-7 text-white"></lucide-angular>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-white">Importar Empleados</h2>
          <p class="text-blue-100 text-sm mt-0.5">{{ getStepDescription() }}</p>
        </div>
      </div>
      <button (click)="closeModal()" class="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all">
        <lucide-angular [img]="X" class="w-6 h-6"></lucide-angular>
      </button>
    </div>

    <!-- Step Indicator -->
    <div class="px-8 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50">
      <div class="flex items-center justify-between max-w-2xl mx-auto">
        @for (step of steps; track step.id; let i = $index) {
          <div class="flex items-center">
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                   [class]="currentStep() > i ? 'bg-emerald-500 text-white' : currentStep() === i ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
                @if (currentStep() > i) {
                  <lucide-angular [img]="Check" class="w-5 h-5"></lucide-angular>
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <span class="text-xs mt-2 font-medium" [class]="currentStep() >= i ? 'text-gray-900 dark:text-white' : 'text-gray-400'">{{ step.label }}</span>
            </div>
            @if (i < steps.length - 1) {
              <div class="w-16 h-0.5 mx-2" [class]="currentStep() > i ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      
      <!-- Step 1: Upload -->
      @if (currentStep() === 0) {
        <div class="space-y-6">
          <!-- Template Download -->
          <div class="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                  <lucide-angular [img]="FileText" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white">Plantilla de Importación</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Descarga la plantilla con el formato requerido</p>
                </div>
              </div>
              <button (click)="downloadTemplate()" class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <lucide-angular [img]="FileText" class="w-4 h-4"></lucide-angular>
                Descargar
              </button>
            </div>
          </div>

          <!-- File Upload -->
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10">
            <div class="flex flex-col items-center gap-4">
              <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-full shadow-lg">
                <lucide-angular [img]="Upload" class="w-10 h-10 text-white"></lucide-angular>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Arrastra y suelta tu archivo aquí</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">o haz clic para seleccionar • Formatos: .xlsx, .xls</p>
              </div>
              <input type="file" id="fileInput" class="hidden" accept=".xlsx,.xls" (change)="onFileSelected($event)">
              <label for="fileInput" class="cursor-pointer px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <lucide-angular [img]="Upload" class="w-5 h-5"></lucide-angular>
                Seleccionar archivo
              </label>
            </div>
          </div>

          <!-- Selected File -->
          @if (selectedFile) {
            <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                  <lucide-angular [img]="FileText" class="w-6 h-6 text-white"></lucide-angular>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900 dark:text-white">{{ selectedFile.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
                </div>
              </div>
              <button (click)="clearFile()" class="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <lucide-angular [img]="X" class="w-5 h-5"></lucide-angular>
              </button>
            </div>
          }
        </div>
      }

      <!-- Step 2: Preview -->
      @if (currentStep() === 1) {
        @if (isAnalyzing()) {
          <div class="flex flex-col items-center justify-center py-16">
            <div class="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Analizando archivo...</h3>
            <p class="text-gray-500 dark:text-gray-400">Verificando datos y detectando entidades</p>
          </div>
        } @else if (preview()) {
          <div class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <!-- Employees -->
              <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/30 dark:border-blue-700/30">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 bg-blue-500 rounded-lg">
                    <lucide-angular [img]="Users" class="w-4 h-4 text-white"></lucide-angular>
                  </div>
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Empleados</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.total_employees }}</div>
                <div class="flex gap-2 mt-1 text-xs">
                  <span class="text-emerald-600 dark:text-emerald-400">{{ preview()!.new_employees }} nuevos</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ preview()!.existing_employees }} actualizar</span>
                </div>
              </div>

              <!-- Offices -->
              <div class="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl border border-purple-200/30 dark:border-purple-700/30">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 bg-purple-500 rounded-lg">
                    <lucide-angular [img]="Building2" class="w-4 h-4 text-white"></lucide-angular>
                  </div>
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Oficinas</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.offices.length }}</div>
                <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{{ preview()!.new_offices }} se crearán</div>
              </div>

              <!-- Teams -->
              <div class="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/30 dark:border-amber-700/30">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 bg-amber-500 rounded-lg">
                    <lucide-angular [img]="Users" class="w-4 h-4 text-white"></lucide-angular>
                  </div>
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Equipos</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.teams.length }}</div>
                <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{{ preview()!.new_teams }} se crearán</div>
              </div>

              <!-- Areas -->
              <div class="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl border border-teal-200/30 dark:border-teal-700/30">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 bg-teal-500 rounded-lg">
                    <lucide-angular [img]="Layers" class="w-4 h-4 text-white"></lucide-angular>
                  </div>
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Áreas</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.areas.length }}</div>
                <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{{ preview()!.new_areas }} se crearán</div>
              </div>

              <!-- Positions (Cargos) -->
              <div class="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl border border-rose-200/30 dark:border-rose-700/30">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 bg-rose-500 rounded-lg">
                    <lucide-angular [img]="Briefcase" class="w-4 h-4 text-white"></lucide-angular>
                  </div>
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Cargos</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.positions.length }}</div>
                <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{{ preview()!.new_positions }} se crearán</div>
              </div>
            </div>

            <!-- Entity Lists -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <!-- Offices -->
              @if (preview()!.offices.length > 0) {
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  <div class="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200/60 dark:border-gray-700/60">
                    <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <lucide-angular [img]="Building2" class="w-4 h-4 text-purple-600"></lucide-angular>
                      Oficinas
                    </h4>
                  </div>
                  <div class="p-3 max-h-40 overflow-y-auto">
                    @for (office of preview()!.offices; track office.name) {
                      <div class="flex items-center justify-between py-1.5">
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ office.name }}</span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="office.is_new ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'">
                          {{ office.is_new ? 'NUEVO' : 'EXISTE' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Teams -->
              @if (preview()!.teams.length > 0) {
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  <div class="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200/60 dark:border-gray-700/60">
                    <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <lucide-angular [img]="Users" class="w-4 h-4 text-amber-600"></lucide-angular>
                      Equipos
                    </h4>
                  </div>
                  <div class="p-3 max-h-40 overflow-y-auto">
                    @for (team of preview()!.teams; track team.name) {
                      <div class="flex items-center justify-between py-1.5">
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ team.name }}</span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="team.is_new ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'">
                          {{ team.is_new ? 'NUEVO' : 'EXISTE' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Areas -->
              @if (preview()!.areas.length > 0) {
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  <div class="px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border-b border-gray-200/60 dark:border-gray-700/60">
                    <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <lucide-angular [img]="Layers" class="w-4 h-4 text-teal-600"></lucide-angular>
                      Áreas
                    </h4>
                  </div>
                  <div class="p-3 max-h-40 overflow-y-auto">
                    @for (area of preview()!.areas; track area.name) {
                      <div class="flex items-center justify-between py-1.5">
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ area.name }}</span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="area.is_new ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'">
                          {{ area.is_new ? 'NUEVO' : 'EXISTE' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Positions (Cargos) -->
              @if (preview()!.positions.length > 0) {
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  <div class="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-gray-200/60 dark:border-gray-700/60">
                    <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <lucide-angular [img]="Briefcase" class="w-4 h-4 text-rose-600"></lucide-angular>
                      Cargos
                    </h4>
                  </div>
                  <div class="p-3 max-h-40 overflow-y-auto">
                    @for (position of preview()!.positions; track position.name) {
                      <div class="flex items-center justify-between py-1.5">
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-gray-700 dark:text-gray-300">{{ position.name }}</span>
                          <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 uppercase">{{ position.category }}</span>
                        </div>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="position.is_new ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'">
                          {{ position.is_new ? 'NUEVO' : 'EXISTE' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Employee Preview Table -->
            @if (preview()!.employees.length > 0) {
              <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <lucide-angular [img]="Eye" class="w-4 h-4 text-blue-600"></lucide-angular>
                    Vista Previa de Empleados (primeras {{ preview()!.employees.length }} filas)
                  </h4>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">#</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Nombre</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">DNI</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Email</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Cargo</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Oficina</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Equipo</th>
                        <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                      @for (emp of preview()!.employees; track emp.row) {
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td class="px-4 py-2 text-gray-500">{{ emp.row }}</td>
                          <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ emp.name }}</td>
                          <td class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ emp.dni }}</td>
                          <td class="px-4 py-2 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{{ emp.email }}</td>
                          <td class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ emp.position }}</td>
                          <td class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ emp.office }}</td>
                          <td class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ emp.team }}</td>
                          <td class="px-4 py-2">
                            <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="emp.status === 'new' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'">
                              {{ emp.status === 'new' ? 'NUEVO' : 'ACTUALIZAR' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Step 3: Import -->
      @if (currentStep() === 2) {
        @if (isImporting()) {
          <div class="flex flex-col items-center justify-center py-16">
            <div class="w-20 h-20 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Importando empleados...</h3>
            <p class="text-gray-500 dark:text-gray-400">Este proceso puede tomar unos segundos</p>
          </div>
        } @else if (importResult()) {
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" [class]="importResult()!.success ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'">
              <lucide-angular [img]="importResult()!.success ? CheckCircle : AlertCircle" class="w-10 h-10" [class]="importResult()!.success ? 'text-emerald-600' : 'text-red-600'"></lucide-angular>
            </div>
            <h3 class="text-2xl font-bold mb-2" [class]="importResult()!.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">
              {{ importResult()!.success ? '¡Importación Exitosa!' : 'Error en la Importación' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-center max-w-md">{{ importResult()!.message }}</p>
            
            @if (importResult()!.success) {
              <div class="mt-6 px-8 py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center">
                <div class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{{ importResult()!.imported_count }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Empleados importados</div>
              </div>
            }

            @if (importResult()!.errors && importResult()!.errors.length > 0) {
              <div class="mt-6 w-full max-w-lg p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-700/30">
                <h4 class="font-bold text-red-800 dark:text-red-300 mb-2">Errores encontrados:</h4>
                <ul class="text-sm text-red-700 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                  @for (error of importResult()!.errors.slice(0, 5); track error) {
                    <li class="flex items-start gap-2">
                      <span class="text-red-500">•</span>
                      <span>{{ error }}</span>
                    </li>
                  }
                  @if (importResult()!.errors.length > 5) {
                    <li class="text-red-500 italic">... y {{ importResult()!.errors.length - 5 }} errores más</li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      }

    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-between">
      <button 
        *ngIf="currentStep() > 0 && !isImporting() && !importResult()"
        (click)="prevStep()"
        class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        <lucide-angular [img]="ChevronLeft" class="w-4 h-4"></lucide-angular>
        Anterior
      </button>
      <div *ngIf="currentStep() === 0"></div>

      <div class="flex items-center gap-3">
        <button (click)="closeModal()" class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors">
          {{ importResult() ? 'Cerrar' : 'Cancelar' }}
        </button>

        @if (currentStep() === 0) {
          <button 
            [disabled]="!selectedFile"
            (click)="analyzeFile()"
            class="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            Analizar
            <lucide-angular [img]="ChevronRight" class="w-4 h-4"></lucide-angular>
          </button>
        }

        @if (currentStep() === 1 && preview()) {
          <button 
            (click)="startImport()"
            class="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            Importar {{ preview()!.total_employees }} Empleados
            <lucide-angular [img]="ChevronRight" class="w-4 h-4"></lucide-angular>
          </button>
        }

        @if (currentStep() === 2 && importResult()?.success) {
          <button 
            (click)="closeAndRefresh()"
            class="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <lucide-angular [img]="RefreshCw" class="w-4 h-4"></lucide-angular>
            Actualizar Lista
          </button>
        }
      </div>
    </div>
  </div>
</div>
  `
})
export class EmployeeImportModalComponent {
  @Input() isOpen = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() importSuccessEvent = new EventEmitter<void>();

  private employeeService = inject(EmployeeService);

  // Icons
  X = X;
  Upload = Upload;
  FileText = FileText;
  CheckCircle = CheckCircle;
  AlertCircle = AlertCircle;
  Building2 = Building2;
  Users = Users;
  Layers = Layers;
  ChevronRight = ChevronRight;
  ChevronLeft = ChevronLeft;
  Eye = Eye;
  Check = Check;
  RefreshCw = RefreshCw;
  Briefcase = Briefcase;

  steps = [
    { id: 0, label: 'Subir Archivo' },
    { id: 1, label: 'Vista Previa' },
    { id: 2, label: 'Importar' }
  ];

  currentStep = signal(0);
  selectedFile: File | null = null;
  isAnalyzing = signal(false);
  preview = signal<ImportPreview | null>(null);
  isImporting = signal(false);
  importResult = signal<ImportResult | null>(null);

  getStepDescription(): string {
    switch (this.currentStep()) {
      case 0: return 'Paso 1: Selecciona el archivo Excel';
      case 1: return 'Paso 2: Revisa lo que se va a importar';
      case 2: return 'Paso 3: Resultado de la importación';
      default: return '';
    }
  }

  closeModal(): void {
    this.resetState();
    this.closeModalEvent.emit();
  }

  resetState(): void {
    this.currentStep.set(0);
    this.selectedFile = null;
    this.preview.set(null);
    this.importResult.set(null);
    this.isAnalyzing.set(false);
    this.isImporting.set(false);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.preview.set(null);
      this.importResult.set(null);
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.preview.set(null);
  }

  downloadTemplate(): void {
    this.employeeService.downloadTemplate();
    toast.success('Descargando plantilla...');
  }

  async analyzeFile(): Promise<void> {
    if (!this.selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    this.currentStep.set(1);
    this.isAnalyzing.set(true);
    this.preview.set(null);

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const result = await this.employeeService.analyzeImport(formData);

      if (result.success) {
        this.preview.set(result.data);
        toast.success('Archivo analizado correctamente');
      } else {
        toast.error(result.message || 'Error al analizar el archivo');
        this.currentStep.set(0);
      }
    } catch (error: any) {
      console.error('Error analyzing file:', error);
      toast.error(error.error?.message || 'Error al analizar el archivo');
      this.currentStep.set(0);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  async startImport(): Promise<void> {
    if (!this.selectedFile) {
      toast.error('No hay archivo seleccionado');
      return;
    }

    this.currentStep.set(2);
    this.isImporting.set(true);
    this.importResult.set(null);

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const result = await this.employeeService.importEmployees(formData);
      const importedCount = result.data?.imported || result.imported_count || 0;

      this.importResult.set({
        success: result.success || (importedCount > 0),
        message: result.message || `Se importaron ${importedCount} empleados`,
        imported_count: importedCount,
        errors: result.data?.errors || result.errors || []
      });

      if (result.success || importedCount > 0) {
        toast.success(`¡Importación exitosa! ${importedCount} empleados procesados`);
      } else {
        toast.error('Error en la importación');
      }
    } catch (error: any) {
      console.error('Error importing file:', error);
      this.importResult.set({
        success: false,
        message: error.error?.message || 'Error al importar el archivo',
        imported_count: 0,
        errors: [error.error?.message || 'Error desconocido']
      });
      toast.error('Error al importar el archivo');
    } finally {
      this.isImporting.set(false);
    }
  }

  closeAndRefresh(): void {
    this.importSuccessEvent.emit();
    this.closeModal();
  }
}