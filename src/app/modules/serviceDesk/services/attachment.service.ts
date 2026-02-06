import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, Subject, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TicketAttachment {
    attachment_id: number;
    ticket_id: number;
    uploaded_by: number;
    original_name: string;
    stored_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    updated_at: string;
    download_url: string;
    is_image: boolean;
    human_size: string;
    uploader?: {
        user_id: number;
        first_name: string;
        last_name: string;
    };
}

export interface UploadProgress {
    progress: number;
    state: 'pending' | 'uploading' | 'done' | 'error';
    attachment?: TicketAttachment;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AttachmentService {
    private baseUrl = `${environment.URL_BACKEND}/v1/servicedesk`;

    constructor(private http: HttpClient) { }

    /**
     * Get all attachments for a ticket
     */
    getAttachments(ticketId: number): Observable<TicketAttachment[]> {
        return this.http.get<{ data: TicketAttachment[], count: number }>(
            `${this.baseUrl}/requests/${ticketId}/attachments`
        ).pipe(map(response => response.data));
    }

    /**
     * Upload a file to a ticket with progress tracking
     */
    uploadFile(ticketId: number, file: File): Observable<UploadProgress> {
        const formData = new FormData();
        formData.append('file', file);

        const req = new HttpRequest('POST',
            `${this.baseUrl}/requests/${ticketId}/attachments`,
            formData,
            { reportProgress: true }
        );

        const subject = new Subject<UploadProgress>();

        this.http.request<any>(req).subscribe({
            next: (event: HttpEvent<any>) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const progress = event.total
                        ? Math.round(100 * event.loaded / event.total)
                        : 0;
                    subject.next({ progress, state: 'uploading' });
                } else if (event.type === HttpEventType.Response) {
                    subject.next({
                        progress: 100,
                        state: 'done',
                        attachment: event.body?.data
                    });
                    subject.complete();
                }
            },
            error: (error) => {
                subject.next({
                    progress: 0,
                    state: 'error',
                    error: error.error?.message || 'Error al subir el archivo'
                });
                subject.complete();
            }
        });

        return subject.asObservable();
    }

    /**
     * Download an attachment
     */
    downloadAttachment(attachmentId: number): void {
        const url = `${this.baseUrl}/attachments/${attachmentId}/download`;
        window.open(url, '_blank');
    }

    /**
     * Get preview URL for an image attachment
     */
    getPreviewUrl(attachmentId: number): string {
        return `${this.baseUrl}/attachments/${attachmentId}/preview`;
    }

    /**
     * Delete an attachment
     */
    deleteAttachment(attachmentId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.baseUrl}/attachments/${attachmentId}`
        );
    }

    /**
     * Get human-readable file type from mime type
     */
    getFileTypeLabel(mimeType: string): string {
        const types: Record<string, string> = {
            'image/jpeg': 'Imagen JPEG',
            'image/png': 'Imagen PNG',
            'image/gif': 'Imagen GIF',
            'image/webp': 'Imagen WebP',
            'application/pdf': 'Documento PDF',
            'application/msword': 'Documento Word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
            'application/vnd.ms-excel': 'Hoja de cálculo Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de cálculo Excel',
            'text/plain': 'Archivo de texto',
            'text/csv': 'Archivo CSV',
        };
        return types[mimeType] || 'Archivo';
    }

    /**
     * Get icon name based on mime type
     */
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'file-text';
        if (mimeType.includes('word')) return 'file-text';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table';
        if (mimeType.startsWith('text/')) return 'file-text';
        return 'file';
    }

    /**
     * Check if file type is allowed
     */
    isAllowedFileType(file: File): boolean {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];
        return allowedTypes.includes(file.type);
    }

    /**
     * Check if file size is within limit (10MB)
     */
    isAllowedFileSize(file: File): boolean {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
    }

    /**
     * Get allowed file types as accept string
     */
    getAllowedTypesString(): string {
        return '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
    }
}
