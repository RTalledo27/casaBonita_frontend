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
    <!-- Modal Backdrop -->
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      (click)="closeModal()"
    >
      <!-- Modal Content -->
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Importar Empleados desde Excel</h2>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <lucide-angular [img]="X" size="24"></lucide-angular>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <!-- Información del template -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Formato del archivo Excel</h3>
            <p class="text-blue-700 dark:text-blue-300 mb-3">El archivo debe contener las siguientes columnas:</p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong class="text-gray-900 dark:text-gray-100">Columnas requeridas:</strong>
                <ul class="list-disc list-inside mt-1 text-blue-600 dark:text-blue-400">
                  <li>N°</li>
                  <li>COLABORADOR</li>
                  <li>TIPO EMPLEADO</li>
                  <li>FECHA INGRESO</li>
                  <li>SALARIO BASE</li>
                  <li>EMAIL</li>
                </ul>
              </div>
              <div>
                <strong class="text-gray-900 dark:text-gray-100">Columnas opcionales:</strong>
                <ul class="list-disc list-inside mt-1 text-blue-600 dark:text-blue-400">
                  <li>DNI</li>
                  <li>FECHA NACIMIENTO</li>
                  <li>DEPARTAMENTO</li>
                  <li>TELEFONO</li>
                  <li>DIRECCION</li>
                  <li>NUMERO EMERGENCIA</li>
                  <li>CONTACTO EMERGENCIA</li>
                </ul>
              </div>
            </div>
            <div class="mt-4">
              <button 
                (click)="downloadTemplate()"
                class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <lucide-angular [img]="FileText" size="16"></lucide-angular>
                Descargar Template
              </button>
            </div>
          </div>

          <!-- Selección de archivo -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar archivo Excel</label>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              (change)="onFileSelected($event)"
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30 file:transition-colors"
            >
            <p *ngIf="selectedFile" class="mt-2 text-sm text-green-600 dark:text-green-400">
              Archivo seleccionado: {{ selectedFile.name }}
            </p>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-4 mb-6">
            <button 
              (click)="validateFile()"
              [disabled]="!selectedFile || isValidating"
              class="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ isValidating ? 'Validando...' : 'Validar Archivo' }}
            </button>
            
            <button 
              (click)="importFile()"
              [disabled]="!validationResult?.success || isImporting"
              class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ isImporting ? 'Importando...' : 'Importar Empleados' }}
            </button>
          </div>

          <!-- Progreso de importación -->
          <div *ngIf="importProgress" class="mb-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Importando empleados...</h3>
              
              <div class="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-2">
                <span class="font-medium">Progreso: {{ importProgress.current }} de {{ importProgress.total }}</span>
                <span class="font-bold text-blue-800 dark:text-blue-200">{{ importProgress.percentage }}%</span>
              </div>
              
              <div class="w-full bg-blue-200 dark:bg-blue-800/30 rounded-full h-4 shadow-inner">
                <div 
                  class="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                  [style.width.%]="importProgress.percentage"
                >
                </div>
              </div>
              
              <p *ngIf="importProgress.currentEmployee" class="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                {{ importProgress.currentEmployee }}
              </p>
            </div>
          </div>

          <!-- Resultado de validación -->
          <div *ngIf="validationResult" class="mb-6">
            <div [ngClass]="{
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700': validationResult.success,
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700': !validationResult.success
            }" class="border rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <lucide-angular 
                  [img]="validationResult.success ? CheckCircle : AlertCircle" 
                  size="20" 
                  [class]="validationResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                ></lucide-angular>
                <h3 class="text-lg font-semibold" [ngClass]="{
                  'text-green-900 dark:text-green-100': validationResult.success,
                  'text-red-900 dark:text-red-100': !validationResult.success
                }">
                  {{ validationResult.success ? 'Validación exitosa' : 'Errores encontrados' }}
                </h3>
              </div>
              
              <p class="mb-3" [ngClass]="{
                'text-green-700 dark:text-green-300': validationResult.success,
                'text-red-700 dark:text-red-300': !validationResult.success
              }">
                {{ validationResult.message }}
              </p>
              
              <div *ngIf="validationResult.data" class="text-sm" [ngClass]="{
                'text-green-600 dark:text-green-400': validationResult.success,
                'text-red-600 dark:text-red-400': !validationResult.success
              }">
                <p><strong>Total de filas:</strong> {{ validationResult.data.total_rows }}</p>
              </div>
              
              <div *ngIf="validationResult.errors && validationResult.errors.length > 0" class="mt-3">
                <strong class="text-red-800 dark:text-red-200">Errores:</strong>
                <ul class="list-disc list-inside mt-1 text-red-700 dark:text-red-300">
                  <li *ngFor="let error of validationResult.errors">{{ error }}</li>
                </ul>
              </div>
              
              <div *ngIf="validationResult.warnings && validationResult.warnings.length > 0" class="mt-3">
                <strong class="text-yellow-800 dark:text-yellow-200">Advertencias:</strong>
                <ul class="list-disc list-inside mt-1 text-yellow-700 dark:text-yellow-300">
                  <li *ngFor="let warning of validationResult.warnings">{{ warning }}</li>
                </ul>
              </div>
            </div>

            <!-- Vista previa -->
            <div *ngIf="getPreviewKeys().length > 0" class="mt-4">
              <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Vista previa (primeras 5 filas):</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th *ngFor="let key of getPreviewKeys()" class="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {{ key }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of validationResult.data?.preview?.slice(0, 5); let i = index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td *ngFor="let key of getPreviewKeys()" class="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                        {{ row[key] || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Resultado de importación -->
          <div *ngIf="importResult" class="mb-6">
            <div [ngClass]="{
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700': importResult.success,
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700': !importResult.success
            }" class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-2" [ngClass]="{
                'text-green-900 dark:text-green-100': importResult.success,
                'text-red-900 dark:text-red-100': !importResult.success
              }">
                {{ importResult.success ? 'Importación exitosa' : 'Error en la importación' }}
              </h3>
              
              <p class="mb-3" [ngClass]="{
                'text-green-700 dark:text-green-300': importResult.success,
                'text-red-700 dark:text-red-300': !importResult.success
              }">
                {{ importResult.message }}
              </p>
              
              <div *ngIf="importResult.success" class="text-sm text-green-600 dark:text-green-400">
                <p><strong>Empleados importados:</strong> {{ importResult.imported_count }}</p>
              </div>
              
              <div *ngIf="importResult.errors && importResult.errors.length > 0" class="mt-3">
                <strong class="text-red-800 dark:text-red-200">Errores:</strong>
                <ul class="list-disc list-inside mt-1 text-red-700 dark:text-red-300">
                  <li *ngFor="let error of importResult.errors">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            (click)="closeModal()"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {{ importResult?.success ? 'Cerrar' : 'Cancelar' }}
          </button>
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