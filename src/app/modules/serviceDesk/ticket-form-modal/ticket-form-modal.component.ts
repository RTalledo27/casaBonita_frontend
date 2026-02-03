import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import {
    AlertTriangle,
    CheckCircle,
    HelpCircle,
    LucideAngularModule,
    MessageSquare,
    RefreshCw,
    Shield,
    Wrench,
    X,
} from 'lucide-angular';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-ticket-form-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './ticket-form-modal.component.html',
    styleUrl: './ticket-form-modal.component.scss',
})
export class TicketFormModalComponent implements OnInit {
    @Input() isOpen = false;
    @Input() ticket: ServiceDeskTicket | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<ServiceDeskTicket>();

    form!: FormGroup;
    loading = false;
    isEditMode = false;

    // Icons
    xIcon = X;

    ticketTypes = [
        { value: 'incidente', label: 'Incidente', icon: 'alert-triangle', color: 'cyan' },
        { value: 'solicitud', label: 'Solicitud', icon: 'message-square', color: 'green' },
        { value: 'cambio', label: 'Cambio', icon: 'refresh-cw', color: 'yellow' },
        { value: 'garantia', label: 'Garantía', icon: 'shield', color: 'purple' },
        { value: 'mantenimiento', label: 'Mantenimiento', icon: 'wrench', color: 'indigo' },
        { value: 'otro', label: 'Otro', icon: 'help-circle', color: 'gray' },
    ];

    priorities = [
        { value: 'baja', label: 'Baja', color: 'cyan', description: 'Sin impacto crítico' },
        { value: 'media', label: 'Media', color: 'yellow', description: 'Impacto moderado' },
        { value: 'alta', label: 'Alta', color: 'red', description: 'Impacto significativo' },
        { value: 'critica', label: 'Crítica', color: 'pink', description: 'Requiere atención urgente' },
    ];

    constructor(
        private fb: FormBuilder,
        private ticketService: ServiceDeskTicketsService,
        private toast: ToastService
    ) {
        // Initialize form in constructor for immediate availability
        this.initForm();
    }

    ngOnInit(): void {
        // Form already initialized in constructor
    }

    ngOnChanges(): void {
        if (this.ticket && this.form) {
            this.isEditMode = true;
            this.form.patchValue({
                ticket_type: this.ticket.ticket_type,
                priority: this.ticket.priority,
                description: this.ticket.description,
                contract_id: this.ticket.contract_id,
            });
        } else if (this.form) {
            this.isEditMode = false;
            this.form.reset({
                ticket_type: 'incidente',
                priority: 'media',
            });
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            ticket_type: ['incidente', Validators.required],
            priority: ['media', Validators.required],
            description: ['', [Validators.required, Validators.minLength(10)]],
            contract_id: [null],
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formData = this.form.value;

        const request$ = this.isEditMode && this.ticket
            ? this.ticketService.update(this.ticket.ticket_id, formData)
            : this.ticketService.create(formData);

        request$.subscribe({
            next: (result) => {
                this.loading = false;
                this.toast.success(
                    this.isEditMode ? 'Ticket actualizado correctamente' : 'Ticket creado correctamente'
                );
                this.saved.emit(result);
                this.onClose();
            },
            error: (err) => {
                this.loading = false;
                this.toast.error('Error al guardar el ticket');
                console.error(err);
            },
        });
    }

    onClose(): void {
        this.form.reset({
            ticket_type: 'incidente',
            priority: 'media',
        });
        this.close.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.onClose();
        }
    }

    selectType(type: string): void {
        this.form.patchValue({ ticket_type: type });
    }

    selectPriority(priority: string): void {
        this.form.patchValue({ priority: priority });
    }

    get f() {
        return this.form.controls;
    }
}
