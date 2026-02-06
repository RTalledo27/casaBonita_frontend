import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, Trash2, Download, FileText, Image, Table, File, X, Loader2 } from 'lucide-angular';
import { AttachmentService, TicketAttachment, UploadProgress } from '../../services/attachment.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-ticket-attachments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Attachments Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <lucide-icon [img]="fileIcon" class="w-5 h-5 text-cyan-400"></lucide-icon>
        Archivos Adjuntos
        <span class="text-sm font-normal text-slate-400">({{ attachments.length }})</span>
      </h3>
      
      <label *ngIf="!readonly && ticketId" 
             class="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer transition-all border border-cyan-500/30">
        <lucide-icon [img]="uploadIcon" class="w-4 h-4"></lucide-icon>
        <span class="text-sm font-medium">Adjuntar</span>
        <input type="file" 
               class="hidden" 
               [accept]="attachmentService.getAllowedTypesString()"
               (change)="onFileSelected($event)"
               [disabled]="isUploading">
      </label>
    </div>

    <!-- Upload Progress -->
    <div *ngIf="uploadProgress" 
         class="mb-4 p-4 bg-slate-800/60 rounded-lg border border-slate-700/50">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-300">{{ uploadingFileName }}</span>
        <span class="text-xs text-cyan-400">{{ uploadProgress.progress }}%</span>
      </div>
      <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full bg-cyan-500 transition-all duration-300"
             [style.width.%]="uploadProgress.progress"></div>
      </div>
    </div>

    <!-- Attachments List -->
    <div *ngIf="attachments.length > 0" class="space-y-2">
      <div *ngFor="let file of attachments" 
           class="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-all group">
        
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <!-- File Icon based on type -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
               [ngClass]="{
                 'bg-cyan-500/20 text-cyan-400': file.is_image,
                 'bg-red-500/20 text-red-400': file.mime_type === 'application/pdf',
                 'bg-green-500/20 text-green-400': file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel'),
                 'bg-blue-500/20 text-blue-400': file.mime_type.includes('word'),
                 'bg-slate-500/20 text-slate-400': !file.is_image && !file.mime_type.includes('pdf') && !file.mime_type.includes('word') && !file.mime_type.includes('spreadsheet')
               }">
            <lucide-icon [img]="getIconForFile(file)" class="w-5 h-5"></lucide-icon>
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-200 truncate">{{ file.original_name }}</p>
            <p class="text-xs text-slate-400">
              {{ file.human_size }} • {{ attachmentService.getFileTypeLabel(file.mime_type) }}
            </p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Preview (for images) -->
          <button *ngIf="file.is_image"
                  (click)="previewImage(file)"
                  class="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-cyan-400 transition-all"
                  title="Vista previa">
            <lucide-icon [img]="imageIcon" class="w-4 h-4"></lucide-icon>
          </button>
          
          <!-- Download -->
          <button (click)="downloadFile(file)"
                  class="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-green-400 transition-all"
                  title="Descargar">
            <lucide-icon [img]="downloadIcon" class="w-4 h-4"></lucide-icon>
          </button>
          
          <!-- Delete -->
          <button *ngIf="!readonly && canDelete(file)"
                  (click)="deleteFile(file)"
                  class="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                  title="Eliminar">
            <lucide-icon [img]="deleteIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="attachments.length === 0 && !isLoading" 
         class="text-center py-8 text-slate-500">
      <lucide-icon [img]="fileIcon" class="w-12 h-12 mx-auto mb-3 opacity-50"></lucide-icon>
      <p>No hay archivos adjuntos</p>
      <p class="text-sm mt-1" *ngIf="!readonly && ticketId">Haz clic en "Adjuntar" para añadir archivos</p>
    </div>

    <!-- Loading -->
    <div *ngIf="isLoading" class="flex justify-center py-8">
      <lucide-icon [img]="loaderIcon" class="w-8 h-8 text-cyan-400 animate-spin"></lucide-icon>
    </div>

    <!-- Image Preview Modal -->
    <div *ngIf="previewUrl" 
         class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         (click)="closePreview()">
      <button (click)="closePreview()" 
              class="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
        <lucide-icon [img]="closeIcon" class="w-6 h-6"></lucide-icon>
      </button>
      <img [src]="previewUrl" alt="Preview" class="max-w-full max-h-full rounded-lg shadow-2xl">
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TicketAttachmentsComponent implements OnInit {
  @Input() ticketId!: number;
  @Input() readonly = false;
  @Input() currentUserId?: number;
  @Output() attachmentAdded = new EventEmitter<TicketAttachment>();
  @Output() attachmentDeleted = new EventEmitter<number>();

  attachments: TicketAttachment[] = [];
  isLoading = false;
  isUploading = false;
  uploadProgress: UploadProgress | null = null;
  uploadingFileName = '';
  previewUrl: string | null = null;

  // Icons
  uploadIcon = Upload;
  deleteIcon = Trash2;
  downloadIcon = Download;
  fileIcon = File;
  imageIcon = Image;
  tableIcon = Table;
  fileTextIcon = FileText;
  closeIcon = X;
  loaderIcon = Loader2;

  constructor(
    public attachmentService: AttachmentService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    if (this.ticketId) {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    this.isLoading = true;
    this.attachmentService.getAttachments(this.ticketId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Error al cargar los archivos adjuntos');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    if (!this.attachmentService.isAllowedFileType(file)) {
      this.toast.error('Tipo de archivo no permitido. Solo se aceptan imágenes, PDFs, Word y Excel.');
      return;
    }

    // Validate file size
    if (!this.attachmentService.isAllowedFileSize(file)) {
      this.toast.error('El archivo supera el tamaño máximo de 10MB.');
      return;
    }

    this.uploadFile(file);
    input.value = ''; // Reset input
  }

  uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadingFileName = file.name;
    this.uploadProgress = { progress: 0, state: 'pending' };

    this.attachmentService.uploadFile(this.ticketId, file).subscribe({
      next: (progress) => {
        this.uploadProgress = progress;

        if (progress.state === 'done' && progress.attachment) {
          this.attachments.unshift(progress.attachment);
          this.attachmentAdded.emit(progress.attachment);
          this.toast.success('Archivo adjuntado correctamente');
          this.resetUploadState();
        }

        if (progress.state === 'error') {
          this.toast.error(progress.error || 'Error al subir el archivo');
          this.resetUploadState();
        }
      },
      error: () => {
        this.toast.error('Error al subir el archivo');
        this.resetUploadState();
      }
    });
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.uploadProgress = null;
    this.uploadingFileName = '';
  }

  downloadFile(file: TicketAttachment): void {
    this.attachmentService.downloadAttachment(file.attachment_id);
  }

  previewImage(file: TicketAttachment): void {
    this.previewUrl = this.attachmentService.getPreviewUrl(file.attachment_id);
  }

  closePreview(): void {
    this.previewUrl = null;
  }

  canDelete(file: TicketAttachment): boolean {
    if (!this.currentUserId) return true; // Admin can delete all
    return file.uploaded_by === this.currentUserId;
  }

  deleteFile(file: TicketAttachment): void {
    if (!confirm(`¿Estás seguro de eliminar "${file.original_name}"?`)) return;

    this.attachmentService.deleteAttachment(file.attachment_id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.attachment_id !== file.attachment_id);
        this.attachmentDeleted.emit(file.attachment_id);
        this.toast.success('Archivo eliminado');
      },
      error: () => {
        this.toast.error('Error al eliminar el archivo');
      }
    });
  }

  getIconForFile(file: TicketAttachment): any {
    if (file.is_image) return this.imageIcon;
    if (file.mime_type === 'application/pdf') return this.fileTextIcon;
    if (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel')) return this.tableIcon;
    if (file.mime_type.includes('word')) return this.fileTextIcon;
    return this.fileIcon;
  }
}
