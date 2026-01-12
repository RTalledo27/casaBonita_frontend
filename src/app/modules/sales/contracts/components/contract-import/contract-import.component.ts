import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Upload, Download, FileText, AlertCircle, CheckCircle, X, Loader, BarChart3, Trash2, ChevronUp, ChevronDown, History, FileX, Clock } from 'lucide-angular';
import { ContractImportService, ImportResponse, ImportLog } from '../../../services/contract-import.service';
import { finalize, switchMap, takeWhile } from 'rxjs/operators';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ExternalLotImportService } from '../../../../../core/services/external-lot-import.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-contract-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    LucideAngularModule
  ],
  templateUrl: './contract-import.component.html',
  styleUrls: ['./contract-import.component.scss']
})
export class ContractImportComponent {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() importCompleted = new EventEmitter<void>();

  // Icons
  uploadIcon = Upload;
  downloadIcon = Download;
  fileIcon = FileText;
  alertIcon = AlertCircle;
  checkIcon = CheckCircle;
  closeIcon = X;
  loaderIcon = Loader;
  loadingIcon = Loader;
  progressIcon = BarChart3;
  trashIcon = Trash2;
  chevronUpIcon = ChevronUp;
  chevronDownIcon = ChevronDown;
  historyIcon = History;
  fileXIcon = FileX;
  clockIcon = Clock;

  // Utility
  Math = Math;

  // State
  selectedFile: File | null = null;
  isUploading = false;
  isValidating = false;
  validationResult: ImportResponse | null = null;
  importResult: ImportResponse | null = null;
  importHistory: ImportLog[] = [];
  showHistory = false;
  dragOver = false;

  // Progress tracking
  validationProgress = {
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
      'Preparando importación...',
      'Procesando registros...',
      'Validando datos...',
      'Guardando en base de datos...',
      'Finalizando proceso...'
    ],
    currentStepIndex: 0,
    processedRows: 0,
    totalRows: 0,
    estimatedTimeRemaining: 0
  };

  constructor(
    private importService: ContractImportService,
    private externalImport: ExternalLotImportService,
    public theme: ThemeService
  ) {
    this.loadImportHistory();
  }

  // External sales import state
  salesStartDate: string | null = null;
  salesEndDate: string | null = null;
  salesPreview: any[] = [];
  salesLoading = false;
  salesImporting = false;
  salesError: string | null = null;
  salesImportProcessId: number | null = null;
  salesImportProgress: number = 0;
  salesImportStatus: string | null = null;
  salesSuccessMessage: string | null = null;
  salesImportProcessedRows: number = 0;
  salesImportTotalRows: number = 0;
  salesTotalClients: number = 0;
  salesTotalDocuments: number = 0;
  private salesImportPollSub: Subscription | null = null;

  fetchSalesPreview(forceRefresh: boolean = false) {
    this.salesPreview = [];
    this.salesError = null;
    this.salesSuccessMessage = null;
    this.salesLoading = true;
    this.salesTotalClients = 0;
    this.salesTotalDocuments = 0;
    this.externalImport.getSales(this.salesStartDate || undefined, this.salesEndDate || undefined, forceRefresh)
      .pipe(finalize(() => this.salesLoading = false))
      .subscribe({
        next: (res: any) => {
          // expected shape: { success, data: { items: [...] } } or direct array
          if (res?.data?.items) {
            this.salesPreview = res.data.items;
            this.salesTotalClients = res?.data?.total_clients || res?.data?.total || 0;
            this.salesTotalDocuments = res?.data?.total_documents || 0;
          }
          else if (Array.isArray(res)) this.salesPreview = res;
          else if (res?.data) this.salesPreview = res.data;
          else this.salesPreview = [];
        },
        error: (err: any) => {
          console.error('Error fetching sales preview', err);
          this.salesError = err?.error?.message || err.message || 'Error al obtener ventas';
        }
      });
  }

  importSalesFromExternal(forceRefresh: boolean = false) {
    this.salesImporting = true;
    this.salesError = null;
    this.salesSuccessMessage = null;
    this.salesImportProgress = 0;
    this.salesImportProcessId = null;
    this.salesImportStatus = 'pending';
    this.salesImportProcessedRows = 0;
    this.salesImportTotalRows = 0;
    if (this.salesImportPollSub) {
      this.salesImportPollSub.unsubscribe();
      this.salesImportPollSub = null;
    }
    
    // Reset sales preview para indicar que está procesando
    const previousPreview = [...this.salesPreview];
    
    this.externalImport.importSales(this.salesStartDate || undefined, this.salesEndDate || undefined, forceRefresh, true)
      .subscribe({
        next: (res: any) => {
          if (!res?.success) {
            this.salesImporting = false;
            this.salesError = res?.message || 'Importación no completada';
            this.salesPreview = previousPreview;
            return;
          }

          const processId = res?.data?.process_id;
          if (!processId) {
            this.salesImporting = false;
            this.salesError = null;
            this.salesImportStatus = 'completed';
            this.salesSuccessMessage = res?.message || 'Importación completada';
            this.importCompleted.emit();
            this.salesPreview = [];
            return;
          }

          this.salesImportProcessId = processId;

          this.salesImportPollSub = interval(2500)
            .pipe(
              switchMap(() => this.externalImport.getSalesImportStatus(processId)),
              takeWhile((s: any) => {
                const status = s?.data?.status;
                return status !== 'completed' && status !== 'failed';
              }, true),
              finalize(() => {
                this.salesImporting = false;
              })
            )
            .subscribe({
              next: (statusRes: any) => {
                const progress = statusRes?.data?.progress_percentage;
                const parsedProgress = typeof progress === 'number' ? progress : parseFloat(progress);
                this.salesImportProgress = Number.isFinite(parsedProgress) ? parsedProgress : 0;
                this.salesImportProcessedRows = statusRes?.data?.processed_rows || 0;
                this.salesImportTotalRows = statusRes?.data?.total_rows || 0;

                const status = statusRes?.data?.status;
                this.salesImportStatus = status || this.salesImportStatus;
                if (status === 'completed') {
                  this.salesError = null;
                  this.salesSuccessMessage = statusRes?.data?.summary?.message || 'Importación completada';
                  this.importCompleted.emit();
                  this.salesPreview = [];
                }
                if (status === 'failed') {
                  const msg = statusRes?.data?.errors?.message || 'Importación fallida';
                  this.salesError = `Error al importar: ${msg}`;
                  this.salesPreview = previousPreview;
                }
              },
              error: (err: any) => {
                console.error('Error importing sales (status poll)', err);
                const errorMsg = err?.error?.message || err?.message || 'Error al consultar estado';
                this.salesError = `Error al importar: ${errorMsg}`;
                this.salesSuccessMessage = null;
                this.salesImporting = false;
                this.salesPreview = previousPreview;
              }
            });
        },
        error: (err: any) => {
          console.error('Error importing sales', err);
          const errorMsg = err?.error?.message || err?.message || 'Error al importar ventas';
          this.salesError = `Error al importar: ${errorMsg}`;
          this.salesSuccessMessage = null;
          this.salesPreview = previousPreview; // Restaurar preview
          this.salesImporting = false;
        }
      });
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
    this.importProgress.totalRows = Math.floor(this.selectedFile.size / 100); // Rough estimate

    // Simulate step-by-step import progress
    this.simulateImportProgress();

    const importMethod = async ? 
      this.importService.importAsync(this.selectedFile) : 
      this.importService.importSync(this.selectedFile);

    importMethod
      .pipe(finalize(() => {
        this.isUploading = false;
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
            message: 'Error al importar el archivo'
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
        link.download = 'plantilla_importacion_contratos.xlsx';
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
        this.importHistory = response.data;
      },
      error: (error) => {
        console.error('Error loading import history:', error);
      }
    });
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }

  closeModal() {
    this.modalClosed.emit();
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  }

  private resetValidationProgress() {
    this.validationProgress = {
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
  }

  private resetImportProgress() {
    this.importProgress = {
      percentage: 0,
      currentStep: '',
      steps: [
        'Preparando importación...',
        'Procesando registros...',
        'Validando datos...',
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
    const stepDuration = 800; // milliseconds per step
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
    const stepDuration = 1200; // milliseconds per step
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
      if (this.importProgress.currentStepIndex >= 1) { // After "Preparando importación..."
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
}
