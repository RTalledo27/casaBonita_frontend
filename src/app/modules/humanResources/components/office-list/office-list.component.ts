import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Building2, MapPin, X, Check } from 'lucide-angular';
import { OfficeService } from '../../services/office.service';
import { Office } from '../../models/office';

@Component({
    selector: 'app-office-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './office-list.component.html',
    styleUrl: './office-list.component.scss'
})
export class OfficeListComponent implements OnInit {
    private officeService = inject(OfficeService);

    // Icons
    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Search = Search;
    readonly Building2 = Building2;
    readonly MapPin = MapPin;
    readonly X = X;
    readonly Check = Check;

    // Signals
    offices = signal<Office[]>([]);
    filteredOffices = signal<Office[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Modal state
    showModal = signal(false);
    editingOffice = signal<Office | null>(null);
    formData = signal({ name: '', code: '', address: '', city: '', is_active: true });
    saving = signal(false);

    // Filters
    searchTerm = signal('');
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');

    ngOnInit() {
        this.loadOffices();
    }

    loadOffices() {
        this.loading.set(true);
        this.error.set(null);

        this.officeService.getOffices().subscribe({
            next: (response) => {
                const safeData = Array.isArray(response.data) ? response.data : [];
                this.offices.set(safeData);
                this.applyFilters();
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar las oficinas');
                this.loading.set(false);
                console.error('Error loading offices:', err);
            }
        });
    }

    applyFilters() {
        let filtered = this.offices();

        if (this.searchTerm()) {
            const term = this.searchTerm().toLowerCase();
            filtered = filtered.filter(office =>
                office.name.toLowerCase().includes(term) ||
                office.city?.toLowerCase().includes(term)
            );
        }

        if (this.statusFilter() !== 'all') {
            const isActive = this.statusFilter() === 'active';
            filtered = filtered.filter(office => office.is_active === isActive);
        }

        this.filteredOffices.set(filtered);
    }

    onSearchChange(term: string): void {
        this.searchTerm.set(term);
        this.applyFilters();
    }

    onStatusFilterChange(status: string | null) {
        const validStatus = status as 'all' | 'active' | 'inactive';
        this.statusFilter.set(validStatus || 'all');
        this.applyFilters();
    }

    openCreateModal() {
        this.editingOffice.set(null);
        this.formData.set({ name: '', code: '', address: '', city: '', is_active: true });
        this.showModal.set(true);
    }

    openEditModal(office: Office) {
        this.editingOffice.set(office);
        this.formData.set({
            name: office.name,
            code: office.code || '',
            address: office.address || '',
            city: office.city || '',
            is_active: office.is_active
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingOffice.set(null);
    }

    saveOffice() {
        if (!this.formData().name.trim()) {
            return;
        }

        this.saving.set(true);
        const data = this.formData();
        const editing = this.editingOffice();

        if (editing) {
            this.officeService.updateOffice(editing.office_id, data).subscribe({
                next: (response) => {
                    const offices = this.offices().map(o =>
                        o.office_id === editing.office_id ? response.data : o
                    );
                    this.offices.set(offices);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al actualizar la oficina');
                    this.saving.set(false);
                }
            });
        } else {
            this.officeService.createOffice(data).subscribe({
                next: (response) => {
                    this.offices.set([...this.offices(), response.data]);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al crear la oficina');
                    this.saving.set(false);
                }
            });
        }
    }

    deleteOffice(office: Office) {
        if (confirm(`¿Está seguro de eliminar la oficina "${office.name}"?`)) {
            this.officeService.deleteOffice(office.office_id).subscribe({
                next: () => {
                    const offices = this.offices().filter(o => o.office_id !== office.office_id);
                    this.offices.set(offices);
                    this.applyFilters();
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al eliminar la oficina');
                }
            });
        }
    }

    // Helper methods for form data updates (Angular templates don't support spread operator)
    updateFormName(value: string) {
        const current = this.formData();
        this.formData.set({ ...current, name: value });
    }

    updateFormCode(value: string) {
        const current = this.formData();
        this.formData.set({ ...current, code: value });
    }

    updateFormAddress(value: string) {
        const current = this.formData();
        this.formData.set({ ...current, address: value });
    }

    updateFormCity(value: string) {
        const current = this.formData();
        this.formData.set({ ...current, city: value });
    }

    updateFormIsActive(value: boolean) {
        const current = this.formData();
        this.formData.set({ ...current, is_active: value });
    }

    getStatusClass(isActive: boolean): string {
        return isActive ? 'text-green-600' : 'text-red-600';
    }

    getStatusLabel(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }
}
