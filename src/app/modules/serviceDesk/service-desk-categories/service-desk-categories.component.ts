import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ToastService } from '../../../core/services/toast.service';
import Swal from 'sweetalert2';

interface ServiceCategory {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string;
    is_active: boolean;
}

@Component({
    selector: 'app-service-desk-categories',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './service-desk-categories.component.html',
    styleUrl: './service-desk-categories.component.scss',
})
export class ServiceDeskCategoriesComponent implements OnInit {
    categories: ServiceCategory[] = [];
    loading = false;
    saving = false;
    showModal = false;
    editingCategory: ServiceCategory | null = null;

    // Form fields
    categoryForm = {
        name: '',
        description: '',
        icon: 'help-circle',
        color: 'blue',
    };

    // Available icons for categories
    availableIcons = [
        'alert-triangle',
        'message-square',
        'refresh-cw',
        'shield',
        'wrench',
        'help-circle',
        'settings',
        'bell',
        'file-text',
        'check-circle',
    ];

    // Available colors
    availableColors = [
        { name: 'blue', class: 'bg-blue-500' },
        { name: 'red', class: 'bg-red-500' },
        { name: 'green', class: 'bg-green-500' },
        { name: 'yellow', class: 'bg-yellow-500' },
        { name: 'purple', class: 'bg-purple-500' },
        { name: 'pink', class: 'bg-pink-500' },
        { name: 'indigo', class: 'bg-indigo-500' },
        { name: 'cyan', class: 'bg-cyan-500' },
    ];

    constructor(
        private serviceDeskService: ServiceDeskTicketsService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.loading = true;
        this.serviceDeskService.getCategories().subscribe({
            next: (response: any) => {
                this.categories = response.data || [];
                this.loading = false;
            },
            error: () => {
                this.toast.error('Error al cargar categorías');
                this.loading = false;
            },
        });
    }

    openCreateModal(): void {
        this.editingCategory = null;
        this.categoryForm = {
            name: '',
            description: '',
            icon: 'help-circle',
            color: 'blue',
        };
        this.showModal = true;
    }

    openEditModal(category: ServiceCategory): void {
        this.editingCategory = category;
        this.categoryForm = {
            name: category.name,
            description: category.description || '',
            icon: category.icon || 'help-circle',
            color: category.color,
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.editingCategory = null;
    }

    saveCategory(): void {
        if (!this.categoryForm.name.trim()) {
            this.toast.error('El nombre es requerido');
            return;
        }

        this.saving = true;

        if (this.editingCategory) {
            // Update
            this.serviceDeskService.updateCategory(this.editingCategory.id, this.categoryForm).subscribe({
                next: () => {
                    this.toast.success('Categoría actualizada');
                    this.loadCategories();
                    this.closeModal();
                    this.saving = false;
                },
                error: () => {
                    this.toast.error('Error al actualizar categoría');
                    this.saving = false;
                },
            });
        } else {
            // Create
            this.serviceDeskService.createCategory(this.categoryForm).subscribe({
                next: () => {
                    this.toast.success('Categoría creada');
                    this.loadCategories();
                    this.closeModal();
                    this.saving = false;
                },
                error: () => {
                    this.toast.error('Error al crear categoría');
                    this.saving = false;
                },
            });
        }
    }

    toggleStatus(category: ServiceCategory): void {
        this.serviceDeskService.toggleCategoryStatus(category.id).subscribe({
            next: () => {
                category.is_active = !category.is_active;
                this.toast.success(category.is_active ? 'Categoría activada' : 'Categoría desactivada');
            },
            error: () => {
                this.toast.error('Error al cambiar estado');
            },
        });
    }

    deleteCategory(category: ServiceCategory): void {
        Swal.fire({
            title: '¿Eliminar categoría?',
            text: `Se eliminará "${category.name}" permanentemente`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'dark:bg-gray-800 dark:text-white',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                this.serviceDeskService.deleteCategory(category.id).subscribe({
                    next: () => {
                        this.toast.success('Categoría eliminada');
                        this.loadCategories();
                    },
                    error: (err) => {
                        this.toast.error(err.error?.message || 'Error al eliminar');
                    },
                });
            }
        });
    }

    getColorClass(color: string): string {
        return `bg-${color}-500`;
    }
}
