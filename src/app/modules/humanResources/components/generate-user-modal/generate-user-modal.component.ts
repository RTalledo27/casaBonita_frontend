import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';

interface GenerateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-generate-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Generar Usuario para Empleado
            </h3>
            <button 
              (click)="close()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Información del empleado -->
          <div *ngIf="employee" class="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 class="font-medium text-gray-900 mb-2">Información del Empleado</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <p><strong>Código:</strong> {{ employee.employee_code }}</p>
              <p><strong>Tipo:</strong> {{ employee.employee_type_label || employee.employee_type }}</p>
              <p><strong>Equipo:</strong> {{ employee.team?.team_name || 'Sin equipo' }}</p>
            </div>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onSubmit()" #userForm="ngForm">
            <div class="space-y-4">
              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  [(ngModel)]="form.username"
                  required
                  minlength="3"
                  maxlength="50"
                  pattern="[a-zA-Z0-9._-]+"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: juan.perez"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Solo letras, números, puntos, guiones y guiones bajos
                </p>
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="form.email"
                  required
                  email
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="usuario@empresa.com"
                >
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  [(ngModel)]="form.password"
                  required
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 8 caracteres"
                >
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  [(ngModel)]="form.confirmPassword"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirma la contraseña"
                >
                <p *ngIf="form.password && form.confirmPassword && form.password !== form.confirmPassword" 
                   class="text-xs text-red-500 mt-1">
                  Las contraseñas no coinciden
                </p>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                (click)="close()"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="!userForm.valid || form.password !== form.confirmPassword || isLoading"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {{ isLoading ? 'Generando...' : 'Generar Usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class GenerateUserModalComponent {
  @Input() isOpen = false;
  @Input() employee: Employee | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() userGenerated = new EventEmitter<void>();

  private employeeService = inject(EmployeeService);

  isLoading = false;
  form: GenerateUserForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  ngOnChanges(): void {
    if (this.isOpen && this.employee) {
      this.resetForm();
      this.generateSuggestedData();
    }
  }

  private resetForm(): void {
    this.form = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }

  private generateSuggestedData(): void {
    if (!this.employee) return;

    // Generar username sugerido basado en el código del empleado
    if (this.employee.employee_code) {
      this.form.username = this.employee.employee_code.toLowerCase();
    }

    // Si hay información de usuario (nombre), generar email sugerido
    // Nota: Según la conversación, el nombre está en la tabla users, no employees
    // Por ahora usamos el código del empleado para el email
    if (this.employee.employee_code) {
      this.form.email = `${this.employee.employee_code.toLowerCase()}@empresa.com`;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.employee || !this.isFormValid()) {
      return;
    }

    this.isLoading = true;

    try {
      const userData = {
        username: this.form.username,
        email: this.form.email,
        password: this.form.password
      };

      await this.employeeService.generateUser(this.employee.employee_id, userData);
      
      toast.success('Usuario generado exitosamente');
      this.userGenerated.emit();
      this.close();
    } catch (error: any) {
      console.error('Error generating user:', error);
      toast.error(error.error?.message || 'Error al generar el usuario');
    } finally {
      this.isLoading = false;
    }
  }

  private isFormValid(): boolean {
    return (
      this.form.username.length >= 3 &&
      this.form.email.includes('@') &&
      this.form.password.length >= 8 &&
      this.form.password === this.form.confirmPassword
    );
  }

  close(): void {
    this.closeModal.emit();
    this.resetForm();
  }
}