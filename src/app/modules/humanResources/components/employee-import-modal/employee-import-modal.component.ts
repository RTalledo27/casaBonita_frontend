import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { EmployeeService } from '../../services/employee.service';

interface ImportValidationResult {
  success: boolean;
  message: string;
  data?: {
    total_rows: number;
    headers: string[];
    preview: any[];
  };
  errors?: string[];
  warnings?: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  errors: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentEmployee?: string;
}

@Component({
  selector: 'app-employee-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop" *ngIf="isOpen">
 
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto hover-lift dynamic-shadow animate-slide-in-up">

    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-600 to-purple-700 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
      <div class="flex items-center space-x-4 animate-slide-in-left">
        <div class="bg-white/20 dark:bg-white/10 p-3 rounded-xl backdrop-blur-sm animate-bounce-in">
          <lucide-angular [img]="FileText" class="w-7 h-7 text-white"></lucide-angular>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-white drop-shadow-sm">
            Importar Empleados desde Excel
          </h2>
          <p class="text-blue-100 dark:text-gray-300 text-sm mt-1">
            Gestiona y administra todos los empleados disponibles
          </p>
        </div>
      </div>
      <button 
        (click)="closeModal()" 
        class="text-white/80 hover:text-white dark:text-gray-300 dark:hover:text-white transition-all duration-200 hover:scale-110 p-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 backdrop-blur-sm"
      >
        <lucide-angular [img]="X" class="w-6 h-6"></lucide-angular>
      </button>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Template Download -->
      <div class="mb-6 p-6 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift animate-slide-in-up backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-5">
            <div class="bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-600 dark:to-green-700 p-4 rounded-2xl shadow-lg animate-bounce-in">
              <lucide-angular [img]="FileText" class="w-8 h-8 text-white drop-shadow-sm"></lucide-angular>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-1">
                Plantilla de Importación
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Descarga la plantilla con el formato requerido
              </p>
            </div>
          </div>
          <button 
            (click)="downloadTemplate()"
            class="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse-glow flex items-center space-x-3 backdrop-blur-sm"
          >
            <lucide-angular [img]="FileText" class="w-6 h-6"></lucide-angular>
            <span>Descargar Plantilla</span>
          </button>
        </div>
      </div>

      <!-- File Upload Area -->
      <div class="mb-8">
        <label class="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Seleccionar archivo
        </label>
        
        <div class="border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 hover-lift animate-fade-in border-gray-300/60 dark:border-gray-600/60 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/50 shadow-xl hover:shadow-2xl backdrop-blur-sm">
          <div class="flex flex-col items-center animate-bounce-in space-y-6">
            <div class="bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 p-6 rounded-full shadow-lg animate-pulse-glow">
              <lucide-angular [img]="Upload" class="w-16 h-16 text-white drop-shadow-sm"></lucide-angular>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-2xl font-bold text-gray-800 dark:text-white">
                Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
              </h3>
              <p class="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Formatos soportados: .xlsx, .xls
              </p>
            </div>
            
            <div class="pt-2">
              <input type="file" id="fileInput" class="hidden" accept=".xlsx,.xls" (change)="onFileSelected($event)">
              <label for="fileInput" class="cursor-pointer px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse-glow flex items-center gap-3 backdrop-blur-sm">
                <lucide-angular [img]="Upload" class="w-6 h-6"></lucide-angular>
                Seleccionar archivo
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected File Info -->
      <div *ngIf="selectedFile" class="mb-8 p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-in-left backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-5">
            <div class="bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 p-4 rounded-2xl shadow-lg animate-bounce-in">
              <lucide-angular [img]="FileText" class="w-10 h-10 text-white drop-shadow-sm"></lucide-angular>
            </div>
            <div>
              <h4 class="text-xl font-bold text-gray-800 dark:text-white mb-1">{{ selectedFile.name }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Tamaño: {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB | 
                Tipo: {{ selectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }}
              </p>
            </div>
          </div>
          <button 
            (click)="selectedFile = null; validationResult = null; importResult = null" 
            class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md hover:shadow-lg backdrop-blur-sm"
          >
            <lucide-angular [img]="X" class="w-6 h-6"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- Validation Actions -->
      <div *ngIf="selectedFile && !validationResult && !isValidating" class="mb-8">
        <div class="p-6 bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-slate-50/50 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-xl backdrop-blur-sm">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
            Validar Archivo
          </h3>
          <div class="flex gap-4">
            <button 
              (click)="validateFile()"
              class="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse-glow backdrop-blur-sm"
            >
              <lucide-angular [img]="CheckCircle" class="w-6 h-6"></lucide-angular>
              <span>Validar Archivo</span>
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-4 text-center bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm">
            <strong>Proceso:</strong> Se verificará la estructura y contenido del archivo antes de la importación.
          </p>
        </div>
      </div>

      <!-- Validation Progress -->
      <div *ngIf="isValidating" class="mb-8 p-8 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 rounded-3xl border border-amber-200/50 dark:border-amber-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-in-up backdrop-blur-sm">
        <div class="flex items-center space-x-6 mb-6">
          <div class="bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-600 dark:to-orange-700 p-4 rounded-2xl shadow-lg animate-bounce-in">
            <div class="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Validando archivo</h3>
            <p class="text-gray-600 dark:text-gray-300">Verificando estructura y contenido del archivo...</p>
          </div>
        </div>
      </div>

      <!-- Validation Result -->
      <div *ngIf="validationResult && !isValidating" class="mb-8">
        <div 
          class="p-6 rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-in-up backdrop-blur-sm"
          [ngClass]="{
            'bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/30 border-emerald-200/50 dark:border-emerald-700/50': validationResult.success,
            'bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 dark:from-red-900/30 dark:via-rose-900/30 dark:to-pink-900/30 border-red-200/50 dark:border-red-700/50': !validationResult.success
          }"
        >
          <div class="flex items-start space-x-5">
            <div class="p-3 rounded-2xl shadow-lg animate-bounce-in"
                 [ngClass]="{
                   'bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-600 dark:to-green-700': validationResult.success,
                   'bg-gradient-to-br from-red-400 to-rose-500 dark:from-red-600 dark:to-rose-700': !validationResult.success
                 }">
              <lucide-angular 
                [img]="validationResult.success ? CheckCircle : AlertCircle" 
                class="w-8 h-8 text-white drop-shadow-sm"
              ></lucide-angular>
            </div>
            <div class="flex-1">
              <h4 
                class="text-xl font-bold mb-2"
                [ngClass]="{
                  'text-emerald-800 dark:text-emerald-200': validationResult.success,
                  'text-red-800 dark:text-red-200': !validationResult.success
                }"
              >
                {{ validationResult.message }}
              </h4>
              
              <!-- Data Info -->
              <div *ngIf="validationResult.success && validationResult.data" class="mt-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-xl shadow-md backdrop-blur-sm">
                <div class="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Total de filas:</strong> {{ validationResult.data.total_rows }}
                </div>
              </div>
              
              <!-- Validation Errors -->
              <div *ngIf="validationResult.errors?.length" class="mt-4">
                <div class="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Errores encontrados:</div>
                <ul class="text-sm text-red-700 dark:text-red-300 space-y-2">
                  <li *ngFor="let error of (validationResult.errors || []).slice(0, 5)" class="flex items-start gap-2 p-2 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                    <span class="text-red-500 mt-0.5 font-bold">•</span>
                    <span>{{ error }}</span>
                  </li>
                  <li *ngIf="validationResult.errors && (validationResult.errors?.length || 0) > 5" class="text-red-600 dark:text-red-400 italic font-medium">
                    ... y {{ (validationResult.errors?.length || 0) - 5 }} errores más
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Actions -->
      <div *ngIf="validationResult?.success && !isImporting" class="mb-8">
        <div class="p-6 bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-slate-50/50 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-xl backdrop-blur-sm">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
            Opciones de Importación
          </h3>
          <div class="flex gap-4">
            <button 
              (click)="importFile()"
              class="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse-glow backdrop-blur-sm"
            >
              <lucide-angular [img]="Upload" class="w-6 h-6"></lucide-angular>
              <span>Importar Empleados</span>
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-4 text-center bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm">
            <strong>Proceso:</strong> Se validará y procesará cada empleado del archivo Excel.
          </p>
        </div>
      </div>

      <!-- Import Progress -->
      <div *ngIf="isImporting" class="mb-8">
        <div class="p-8 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/30 rounded-3xl border border-blue-200/50 dark:border-blue-600/30 shadow-2xl backdrop-blur-sm animate-slide-in-up">
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 animate-bounce-in">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Importando Empleados</h3>
            <p class="text-gray-600 dark:text-gray-300">Procesando archivo, por favor espere...</p>
          </div>
          
          <div *ngIf="importProgress" class="relative mb-4">
             <div class="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-4 overflow-hidden backdrop-blur-sm">
               <div class="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out animate-pulse-glow relative overflow-hidden" 
                    [style.width.%]="importProgress?.percentage || 0">
                 <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
               </div>
             </div>
             <div class="absolute -top-8 left-1/2 transform -translate-x-1/2">
               <span class="inline-block px-3 py-1 bg-white/90 dark:bg-gray-800/90 text-sm font-semibold text-gray-800 dark:text-white rounded-full shadow-lg backdrop-blur-sm">
                 {{ importProgress?.percentage || 0 }}%
               </span>
             </div>
           </div>
          
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Este proceso puede tomar unos momentos</p>
            <p *ngIf="importProgress?.currentEmployee" class="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
               {{ importProgress?.currentEmployee }}
             </p>
          </div>
        </div>
      </div>

      <!-- Import Result -->
      <div *ngIf="importResult && !isImporting" class="mb-8">
        <div 
          class="p-8 rounded-3xl shadow-2xl backdrop-blur-sm animate-slide-in-up"
          [ngClass]="{
            'bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/80 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-teal-900/30 border border-emerald-200/50 dark:border-emerald-600/30': importResult.success,
            'bg-gradient-to-br from-red-50/80 via-rose-50/60 to-pink-50/80 dark:from-red-900/30 dark:via-rose-900/20 dark:to-pink-900/30 border border-red-200/50 dark:border-red-600/30': !importResult.success
          }"
        >
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-bounce-in" 
                 [ngClass]="{
                   'bg-gradient-to-r from-emerald-500 to-green-600': importResult.success,
                   'bg-gradient-to-r from-red-500 to-rose-600': !importResult.success
                 }">
              <lucide-angular 
                [img]="importResult.success ? CheckCircle : AlertCircle" 
                class="w-10 h-10 text-white drop-shadow-lg"
              ></lucide-angular>
            </div>
            <h3 class="text-2xl font-bold mb-2" 
                [ngClass]="{
                  'text-emerald-800 dark:text-emerald-200': importResult.success,
                  'text-red-800 dark:text-red-200': !importResult.success
                }">
              {{ importResult.success ? '¡Importación Completada!' : 'Error en la Importación' }}
            </h3>
            <p class="text-lg" 
               [ngClass]="{
                 'text-emerald-600 dark:text-emerald-300': importResult.success,
                 'text-red-600 dark:text-red-300': !importResult.success
               }">
              {{ importResult.message }}
            </p>
          </div>
          
          <div *ngIf="importResult.success" class="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="text-center">
                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{{ importResult.imported_count }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Empleados Importados</div>
              </div>
            </div>
          </div>
          
          <div *ngIf="importResult.errors?.length" class="mt-6 p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
            <h4 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Errores encontrados:</h4>
            <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li *ngFor="let error of importResult.errors" class="flex items-start gap-2">
                <span class="text-red-500 mt-0.5">•</span>
                <span>{{ error }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Preview Table -->
      <div *ngIf="getPreviewKeys().length" class="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden shadow-xl">
        <div class="px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/80">
          <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100">Vista previa (primeras 5 filas)</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gradient-to-r from-gray-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-800 dark:via-blue-900/40 dark:to-indigo-900/40">
              <tr class="border-b border-gray-200/60 dark:border-gray-700/60">
                <th *ngFor="let key of getPreviewKeys()" class="px-4 py-3 text-left text-xs tracking-wider font-bold text-gray-600 dark:text-gray-300 uppercase">
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
              <tr *ngFor="let row of (validationResult?.data?.preview || []).slice(0, 5); let i = index" class="hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors">
                <td *ngFor="let key of getPreviewKeys()" class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ row[key] || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

  selectedFile: File | null = null;
  isValidating = false;
  isImporting = false;
  validationResult: ImportValidationResult | null = null;
  importResult: ImportResult | null = null;
  importProgress: ImportProgress | null = null;

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.validationResult = null;
      this.importResult = null;
    }
  }

  async validateFile(): Promise<void> {
    if (!this.selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    this.isValidating = true;
    this.validationResult = null;

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const result = await this.employeeService.validateImport(formData);
      this.validationResult = result;

      if (result.success) {
        toast.success('Archivo validado correctamente');
      } else {
        toast.error(result.message || 'Se encontraron errores en el archivo');
      }
    } catch (error: any) {
      console.error('Error validating file:', error);
      toast.error(error.error?.message || 'Error al validar el archivo');
    } finally {
      this.isValidating = false;
    }
  }

  async importFile(): Promise<void> {
    if (!this.selectedFile || !this.validationResult?.success) {
      toast.error('Por favor valida el archivo primero');
      return;
    }

    this.isImporting = true;
    this.importResult = null;
    this.importProgress = null;

    try {
      const totalRows = this.validationResult.data?.total_rows || 0;
      
      // Inicializar progreso
      this.importProgress = {
        current: 0,
        total: totalRows,
        percentage: 0,
        currentEmployee: 'Iniciando importación...'
      };

      // Obtener nombres de empleados para mostrar en el progreso
      const employeeNames = this.validationResult.data?.preview?.map(row => row['colaborador'] || row['COLABORADOR'] || `Empleado ${Math.random().toString(36).substr(2, 5)}`) || [];
      
      // Simular progreso durante la importación
      let currentIndex = 0;
      const progressInterval = setInterval(() => {
        if (this.importProgress && currentIndex < this.importProgress.total) {
          currentIndex++;
          this.importProgress.current = currentIndex;
          this.importProgress.percentage = Math.round((currentIndex / this.importProgress.total) * 100);
          
          // Mostrar nombre del empleado actual o genérico
          const currentEmployeeName = employeeNames[currentIndex - 1] || `Empleado ${currentIndex}`;
          this.importProgress.currentEmployee = `Procesando: ${currentEmployeeName}`;
        }
      }, Math.random() * 300 + 150); // Tiempo variable entre 150-450ms

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const result = await this.employeeService.importEmployees(formData);
      
      // Limpiar el intervalo
      clearInterval(progressInterval);
      
      // Completar progreso
      if (this.importProgress) {
        this.importProgress.current = this.importProgress.total;
        this.importProgress.percentage = 100;
        this.importProgress.currentEmployee = 'Importación completada';
      }
      
      // Esperar un momento para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.importResult = result;

      if (result.success) {
        toast.success(`Importación exitosa: ${result.imported_count} empleados importados`);
        this.importSuccessEvent.emit();
      } else {
        toast.error('Error en la importación');
      }
    } catch (error: any) {
      console.error('Error importing file:', error);
      toast.error(error.error?.message || 'Error al importar el archivo');
    } finally {
      this.isImporting = false;
      this.importProgress = null;
    }
  }

  downloadTemplate(): void {
    this.employeeService.downloadTemplate();
    toast.success('Descargando template...');
  }

  getPreviewKeys(): string[] {
    if (!this.validationResult?.data?.preview || !Array.isArray(this.validationResult.data.preview) || this.validationResult.data.preview.length === 0) {
      return [];
    }
    return Object.keys(this.validationResult.data.preview[0]);
  }
}