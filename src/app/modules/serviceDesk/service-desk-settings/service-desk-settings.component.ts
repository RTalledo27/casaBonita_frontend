import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ToastService } from '../../../core/services/toast.service';

interface SlaConfig {
    id: number;
    priority: string;
    response_hours: number;
    resolution_hours: number;
    is_active: boolean;
}

@Component({
    selector: 'app-service-desk-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './service-desk-settings.component.html',
    styleUrl: './service-desk-settings.component.scss',
})
export class ServiceDeskSettingsComponent implements OnInit {
    slaConfigs: SlaConfig[] = [];
    loading = false;
    saving = false;

    // Priority labels
    priorityLabels: { [key: string]: string } = {
        critica: 'Crítica',
        alta: 'Alta',
        media: 'Media',
        baja: 'Baja',
    };

    // Priority colors
    priorityColors: { [key: string]: string } = {
        critica: 'text-pink-500',
        alta: 'text-red-500',
        media: 'text-yellow-500',
        baja: 'text-cyan-500',
    };

    constructor(
        private serviceDeskService: ServiceDeskTicketsService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.loadSlaConfigs();
    }

    loadSlaConfigs(): void {
        this.loading = true;
        this.serviceDeskService.getSlaConfigs().subscribe({
            next: (response: any) => {
                this.slaConfigs = response.data || [];
                this.loading = false;
            },
            error: (err) => {
                this.toast.error('Error al cargar configuración SLA');
                this.loading = false;
            },
        });
    }

    saveSlaConfigs(): void {
        this.saving = true;
        const configs = this.slaConfigs.map((c) => ({
            id: c.id,
            response_hours: c.response_hours,
            resolution_hours: c.resolution_hours,
        }));

        this.serviceDeskService.updateSlaConfigs(configs).subscribe({
            next: () => {
                this.toast.success('Configuración SLA guardada correctamente');
                this.saving = false;
            },
            error: (err) => {
                this.toast.error('Error al guardar configuración SLA');
                this.saving = false;
            },
        });
    }

    formatHours(hours: number): string {
        if (hours < 24) {
            return `${hours}h`;
        } else if (hours < 168) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
        } else {
            const weeks = Math.floor(hours / 168);
            return `${weeks} sem`;
        }
    }
}
