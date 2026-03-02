import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Briefcase, X, Check, Users } from 'lucide-angular';
import { PositionService } from '../../services/position.service';
import { Position } from '../../models/position';

@Component({
    selector: 'app-position-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
    templateUrl: './position-list.component.html',
    styleUrl: './position-list.component.scss'
})
export class PositionListComponent implements OnInit {
    private positionService = inject(PositionService);

    // Icons
    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Search = Search;
    readonly Briefcase = Briefcase;
    readonly X = X;
    readonly Check = Check;
    readonly Users = Users;

    // Signals
    positions = signal<Position[]>([]);
    filteredPositions = signal<Position[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Modal state
    showModal = signal(false);
    editingPosition = signal<Position | null>(null);
    formData = signal({
        name: '',
        category: 'admin' as Position['category'],
        is_commission_eligible: false,
        is_bonus_eligible: false,
        is_active: true
    });
    saving = signal(false);

    // Filters
    searchTerm = signal('');
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    categoryFilter = signal<string>('all');

    categories = [
        { value: 'ventas', label: 'Ventas', color: 'emerald' },
        { value: 'admin', label: 'Administrativo', color: 'blue' },
        { value: 'tech', label: 'Tecnología', color: 'purple' },
        { value: 'gerencia', label: 'Gerencia', color: 'amber' },
        { value: 'operaciones', label: 'Operaciones', color: 'rose' },
    ];

    ngOnInit() {
        this.loadPositions();
    }

    loadPositions() {
        this.loading.set(true);
        this.error.set(null);

        this.positionService.getPositions().subscribe({
            next: (response) => {
                const safeData = Array.isArray(response.data) ? response.data : [];
                this.positions.set(safeData);
                this.applyFilters();
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar los cargos');
                this.loading.set(false);
                console.error('Error loading positions:', err);
            }
        });
    }

    applyFilters() {
        let filtered = this.positions();

        if (this.searchTerm()) {
            const term = this.searchTerm().toLowerCase();
            filtered = filtered.filter(pos =>
                pos.name.toLowerCase().includes(term)
            );
        }

        if (this.statusFilter() !== 'all') {
            const isActive = this.statusFilter() === 'active';
            filtered = filtered.filter(pos => pos.is_active === isActive);
        }

        if (this.categoryFilter() !== 'all') {
            filtered = filtered.filter(pos => pos.category === this.categoryFilter());
        }

        this.filteredPositions.set(filtered);
    }

    onSearchChange(term: string): void {
        this.searchTerm.set(term);
        this.applyFilters();
    }

    onStatusFilterChange(status: string) {
        this.statusFilter.set(status as 'all' | 'active' | 'inactive');
        this.applyFilters();
    }

    onCategoryFilterChange(category: string) {
        this.categoryFilter.set(category);
        this.applyFilters();
    }

    openCreateModal() {
        this.editingPosition.set(null);
        this.formData.set({
            name: '',
            category: 'admin',
            is_commission_eligible: false,
            is_bonus_eligible: false,
            is_active: true
        });
        this.showModal.set(true);
    }

    openEditModal(position: Position) {
        this.editingPosition.set(position);
        this.formData.set({
            name: position.name,
            category: position.category,
            is_commission_eligible: position.is_commission_eligible,
            is_bonus_eligible: position.is_bonus_eligible,
            is_active: position.is_active
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingPosition.set(null);
    }

    savePosition() {
        if (!this.formData().name.trim()) return;

        this.saving.set(true);
        const data = this.formData();
        const editing = this.editingPosition();

        if (editing) {
            this.positionService.updatePosition(editing.position_id, data).subscribe({
                next: (response) => {
                    const positions = this.positions().map(p =>
                        p.position_id === editing.position_id ? response.data : p
                    );
                    this.positions.set(positions);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al actualizar el cargo');
                    this.saving.set(false);
                }
            });
        } else {
            this.positionService.createPosition(data).subscribe({
                next: (response) => {
                    this.positions.set([...this.positions(), response.data]);
                    this.applyFilters();
                    this.closeModal();
                    this.saving.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al crear el cargo');
                    this.saving.set(false);
                }
            });
        }
    }

    deletePosition(position: Position) {
        if (confirm(`¿Está seguro de eliminar el cargo "${position.name}"?`)) {
            this.positionService.deletePosition(position.position_id).subscribe({
                next: () => {
                    const positions = this.positions().filter(p => p.position_id !== position.position_id);
                    this.positions.set(positions);
                    this.applyFilters();
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Error al eliminar el cargo');
                }
            });
        }
    }

    // Form update helpers
    updateFormName(value: string) {
        this.formData.set({ ...this.formData(), name: value });
    }

    updateFormCategory(value: string) {
        this.formData.set({ ...this.formData(), category: value as Position['category'] });
    }

    updateFormCommissionEligible(value: boolean) {
        this.formData.set({ ...this.formData(), is_commission_eligible: value });
    }

    updateFormBonusEligible(value: boolean) {
        this.formData.set({ ...this.formData(), is_bonus_eligible: value });
    }

    updateFormIsActive(value: boolean) {
        this.formData.set({ ...this.formData(), is_active: value });
    }

    getCategoryLabel(category: string): string {
        return this.categories.find(c => c.value === category)?.label || category;
    }

    getCategoryClass(category: string): string {
        const colors: Record<string, string> = {
            ventas: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40',
            admin: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40',
            tech: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40',
            gerencia: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40',
            operaciones: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40',
        };
        return colors[category] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/40';
    }

    getStatusClass(isActive: boolean): string {
        return isActive
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200/60 dark:border-green-800/40'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200/60 dark:border-gray-600/40';
    }

    getStatusLabel(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }
}
