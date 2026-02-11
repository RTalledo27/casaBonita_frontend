import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Layers, X, Check } from 'lucide-angular';
import { AreaService } from '../../services/area.service';
import { Area } from '../../models/area';

@Component({
    selector: 'app-area-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './area-list.component.html',
    styleUrl: './area-list.component.scss'
})
export class AreaListComponent implements OnInit {
    private areaService = inject(AreaService);

    // Icons
    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Search = Search;
    readonly Layers = Layers;
    readonly X = X;
    readonly Check = Check;

    // Signals
    areas = signal<Area[]>([]);
    filteredAreas = signal<Area[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Modal state
    showModal = signal(false);
    editingArea = signal<Area | null>(null);
    formData = signal({ name: '', code: '', description: '', is_active: true });
    saving = signal(false);

    // Filters
    searchTerm = signal('');
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');

    ngOnInit() {
        this.loadAreas();
    }

    loadAreas() {
        this.loading.set(true);
        this.error.set(null);

        this.areaService.getAreas().subscribe({
            next: (response) => {
                const safeData = Array.isArray(response.data) ? response.data : [];
                this.areas.set(safeData);
                this.applyFilters();
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar las áreas');
                this.loading.set(false);
                console.error('Error loading areas:', err);
            }
        });
    }

    applyFilters() {
        let filtered = this.areas();

        if (this.searchTerm()) {
            const term = this.searchTerm().toLowerCase();
            filtered = filtered.filter(area =>
                area.name.toLowerCase().includes(term) ||
                area.description?.toLowerCase().includes(term)
            );
        }

        if (this.statusFilter() !== 'all') {
            const isActive = this.statusFilter() === 'active';
            filtered = filtered.filter(area => area.is_active === isActive);
        }

        this.filteredAreas.set(filtered);
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
        this.editingArea.set(null);
        this.formData.set({ name: '', code: '', description: '', is_active: true });
        this.showModal.set(true);
    }

    openEditModal(area: Area) {
        this.editingArea.set(area);
        this.formData.set({
            name: area.name,
            code: area.code || '',
            description: area.description || '',
            is_active: area.is_active
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingArea.set(null);
    }

    saveArea() {
        if (!this.formData().name.trim()) {
            return;
        }

        this.saving.set(true);
        const data = this.formData();
        const editing = this.editingArea();

        if (editing) {
            this.areaService.updateArea(editing.area_id, data).subscribe({
                next: (response) => {
                    const areas = this.areas().map(a =>
                        a.area_id === editing.area_id ? response.data : a
                    );
                    this.areas.set(areas);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al actualizar el área');
                    this.saving.set(false);
                }
            });
        } else {
            this.areaService.createArea(data).subscribe({
                next: (response) => {
                    this.areas.set([...this.areas(), response.data]);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al crear el área');
                    this.saving.set(false);
                }
            });
        }
    }

    deleteArea(area: Area) {
        if (confirm(`¿Está seguro de eliminar el área "${area.name}"?`)) {
            this.areaService.deleteArea(area.area_id).subscribe({
                next: () => {
                    const areas = this.areas().filter(a => a.area_id !== area.area_id);
                    this.areas.set(areas);
                    this.applyFilters();
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al eliminar el área');
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

    updateFormDescription(value: string) {
        const current = this.formData();
        this.formData.set({ ...current, description: value });
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
