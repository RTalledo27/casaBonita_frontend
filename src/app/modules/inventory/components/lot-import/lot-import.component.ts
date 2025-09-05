import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Upload, Download, FileText, AlertCircle, CheckCircle, X, Loader, BarChart3, DollarSign, ChevronUp, ChevronDown, XCircle, Clock, Zap, Trash2, History, FileX, AlertTriangle, Info } from 'lucide-angular';
import { LotImportService, LotImportResponse, LotImportLog } from '../../services/lot-import.service';
import { finalize } from 'rxjs/operators';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-lot-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    LucideAngularModule
  ],
  templateUrl: './lot-import.component.html',
  styleUrls: ['./lot-import.component.scss']
})
export class LotImportComponent {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() importCompleted = new EventEmitter<void>();
  
  // Exponer Object para usar en el template
  Object = Object;

  // Icons
  uploadIcon = Upload;
  downloadIcon = Download;
  fileIcon = FileText;
  alertIcon = AlertTriangle;
  checkIcon = CheckCircle;
  closeIcon = X;
  loaderIcon = Loader;
  loadingIcon = Loader;
  progressIcon = Clock;
  dollarIcon = DollarSign;
  chevronUpIcon = ChevronUp;
  chevronDownIcon = ChevronDown;
  xCircleIcon = XCircle;
  clockIcon = Clock;
  zapIcon = Zap;
  trashIcon = Trash2;
  historyIcon = History;
  fileXIcon = FileX;
  checkCircleIcon = CheckCircle;
  infoIcon = Info;

  // Utility
  Math = Math;

  // State
  selectedFile: File | null = null;
  isUploading = false;
  isValidating = false;
  validationResult: LotImportResponse | null = null;
  importResult: LotImportResponse | null = null;
  importHistory: LotImportLog[] = [];
  showHistory = false;
  dragOver = false;
  isImporting = false;

  // Progress tracking
  validationProgress = {
    percentage: 0,
    currentStep: '',
    steps: [
      'Verificando formato del archivo Excel...',
      'Validando estructura de columnas...',
      'Analizando reglas de financiamiento por manzana...',
      'Verificando integridad de datos de lotes...',
      'Validando precios y opciones de financiamiento...'
    ],
    currentStepIndex: 0
  };

  // Legacy progress (mantener compatibilidad)
  progress = {
    percentage: 0,
    currentStep: '',
    steps: [
      'Verificando formato del archivo...',
      'Validando estructura de columnas...',
      'Analizando datos...',
      'Verificando integridad...'
    ],
    currentStepIndex: 0
  };

  importProgress = {
    percentage: 0,
    currentStep: '',
    steps: [
      'Preparando importación de lotes...',
      'Extrayendo reglas de financiamiento...',
      'Procesando datos de lotes...',
      'Creando templates financieros...',
      'Guardando en base de datos...',
      'Finalizando proceso...'
    ],
    currentStepIndex: 0,
    processedRows: 0,
    totalRows: 0,
    estimatedTimeRemaining: 0
  };

  constructor(
    private importService: LotImportService,
    private router: Router,
    public theme: ThemeService
  ) {
    this.loadImportHistory();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.validateFile();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.validateFile();
    }
  }

  async validateFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.isValidating = true;
    this.validationResult = null;
    this.importResult = null;
    this.resetValidationProgress();

    // Simulate step-by-step validation progress
    this.simulateValidationProgress();

    this.importService.validateStructure(this.selectedFile)
      .pipe(finalize(() => {
        this.isValidating = false;
        this.validationProgress.percentage = 100;
        this.validationProgress.currentStep = 'Validación completada';
      }))
      .subscribe({
        next: (result) => {
          this.validationResult = result;
        },
        error: (error) => {
          console.error('Error validating file:', error);
          this.validationResult = {
            success: false,
            message: 'Error al validar el archivo'
          };
        }
      });
  }

  importFile(async: boolean = false) {
    if (!this.selectedFile || !this.validationResult?.success) return;

    this.isUploading = true;
    this.importResult = null;
    this.resetImportProgress();

    // Estimate total rows based on file size (rough estimation)
    this.importProgress.totalRows = Math.floor(this.selectedFile.size / 150); // Rough estimate for lot data

    // Simulate step-by-step import progress
    this.simulateImportProgress();

    const importMethod = async ? 
      this.importService.importLotsAsync(this.selectedFile) : 
      this.importService.importLots(this.selectedFile);

    importMethod
      .pipe(finalize(() => {
        this.isUploading = false;
        this.importProgress.percentage = 100;
        this.importProgress.currentStep = 'Importación de lotes completada';
        this.importProgress.estimatedTimeRemaining = 0;
      }))
      .subscribe({
        next: (result) => {
          this.importResult = result;
          if (result.success) {
            this.loadImportHistory();
            this.importCompleted.emit();
          }
        },
        error: (error) => {
          console.error('Error importing file:', error);
          this.importResult = {
            success: false,
            message: 'Error al importar el archivo de lotes'
          };
        }
      });
  }

  downloadTemplate() {
    this.importService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla_importacion_lotes.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading template:', error);
      }
    });
  }

  loadImportHistory() {
    this.importService.getImportHistory().subscribe({
      next: (response) => {
        // Filtrar datos válidos y manejar propiedades null
        this.importHistory = (response.data || []).filter(log => 
          log && log.import_id && log.filename
        );
      },
      error: (error) => {
        console.error('Error al obtener el historial:', error);
        this.importHistory = []; // Inicializar como array vacío en caso de error
      }
    });
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }

  closeModal() {
    this.modalClosed.emit();
    this.router.navigate(['/inventory/lots']);
  }

  resetForm() {
    this.selectedFile = null;
    this.validationResult = null;
    this.importResult = null;
    this.isUploading = false;
    this.isValidating = false;
    this.resetValidationProgress();
    this.resetImportProgress();
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isExcelFile(file: File): boolean {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  }

  private resetValidationProgress() {
    this.validationProgress = {
      percentage: 0,
      currentStep: '',
      steps: [
        'Verificando formato del archivo Excel...',
        'Validando estructura de columnas...',
        'Analizando reglas de financiamiento por manzana...',
        'Verificando integridad de datos de lotes...',
        'Validando precios y opciones de financiamiento...'
      ],
      currentStepIndex: 0
    };
  }

  private resetImportProgress() {
    this.importProgress = {
      percentage: 0,
      currentStep: '',
      steps: [
        'Preparando importación de lotes...',
        'Extrayendo reglas de financiamiento...',
        'Procesando datos de lotes...',
        'Creando templates financieros...',
        'Guardando en base de datos...',
        'Finalizando proceso...'
      ],
      currentStepIndex: 0,
      processedRows: 0,
      totalRows: 0,
      estimatedTimeRemaining: 0
    };
  }

  private simulateValidationProgress() {
    const stepDuration = 900; // milliseconds per step
    const totalSteps = this.validationProgress.steps.length;
    
    const progressInterval = setInterval(() => {
      if (!this.isValidating || this.validationProgress.currentStepIndex >= totalSteps) {
        clearInterval(progressInterval);
        return;
      }

      this.validationProgress.currentStep = this.validationProgress.steps[this.validationProgress.currentStepIndex];
      this.validationProgress.percentage = Math.floor((this.validationProgress.currentStepIndex / totalSteps) * 90); // Max 90% during simulation
      this.validationProgress.currentStepIndex++;
    }, stepDuration);
  }

  private simulateImportProgress() {
    const stepDuration = 1400; // milliseconds per step
    const totalSteps = this.importProgress.steps.length;
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      if (!this.isUploading || this.importProgress.currentStepIndex >= totalSteps) {
        clearInterval(progressInterval);
        return;
      }

      this.importProgress.currentStep = this.importProgress.steps[this.importProgress.currentStepIndex];
      this.importProgress.percentage = Math.floor((this.importProgress.currentStepIndex / totalSteps) * 85); // Max 85% during simulation
      
      // Simulate processed rows
      if (this.importProgress.currentStepIndex >= 2) { // After "Extrayendo reglas de financiamiento..."
        const progressRatio = this.importProgress.currentStepIndex / totalSteps;
        this.importProgress.processedRows = Math.floor(this.importProgress.totalRows * progressRatio * 0.8);
        
        // Calculate estimated time remaining
        const elapsedTime = Date.now() - startTime;
        const estimatedTotalTime = elapsedTime / progressRatio;
        this.importProgress.estimatedTimeRemaining = Math.max(0, Math.floor((estimatedTotalTime - elapsedTime) / 1000));
      }
      
      this.importProgress.currentStepIndex++;
    }, stepDuration);
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  // Legacy methods for compatibility
  resetProgress() {
    this.progress.percentage = 0;
    this.progress.currentStep = '';
    this.progress.currentStepIndex = 0;
  }

  simulateProgress() {
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < this.progress.steps.length) {
        this.progress.currentStep = this.progress.steps[stepIndex];
        this.progress.currentStepIndex = stepIndex;
        this.progress.percentage = Math.min(90, (stepIndex + 1) * 20);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);
  }

  // Helper methods for displaying import results
  getFinancingRulesCount(): number {
    return this.importResult?.data?.financing_rules ? Object.keys(this.importResult.data.financing_rules).length : 0;
  }

  getColumnMappingCount(): number {
    return this.importResult?.data?.column_mapping ? Object.keys(this.importResult.data.column_mapping).length : 0;
  }

  hasFinancingRules(): boolean {
    return this.getFinancingRulesCount() > 0;
  }

  hasColumnMapping(): boolean {
    return this.getColumnMappingCount() > 0;
  }

  getColumnMappingText(): string {
    const count = this.getColumnMappingCount();
    return count > 0 ? `${count} columnas mapeadas` : 'Sin mapeo disponible';
  }

  importLots(async: boolean = false) {
    if (!this.selectedFile || !this.validationResult?.success) return;

    this.isImporting = true;
    this.importResult = null;
    this.resetImportProgress();

    // Estimate total rows based on file size (rough estimation)
    this.importProgress.totalRows = Math.floor(this.selectedFile.size / 100); // Rough estimate

    // Simulate step-by-step import progress
    this.simulateImportProgress();

    const importMethod = async ? 
      this.importService.importLotsAsync(this.selectedFile) : 
      this.importService.importLots(this.selectedFile);

    importMethod
      .pipe(finalize(() => {
        this.isImporting = false;
        this.importProgress.percentage = 100;
        this.importProgress.currentStep = 'Importación completada';
        this.importProgress.estimatedTimeRemaining = 0;
      }))
      .subscribe({
        next: (result) => {
          this.importResult = result;
          if (result.success) {
            this.loadImportHistory();
            this.importCompleted.emit();
          }
        },
        error: (error) => {
          console.error('Error importing file:', error);
          this.importResult = {
            success: false,
            message: 'Error al importar el archivo de lotes'
          };
        }
      });
  }
}