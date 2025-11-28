import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';
import { LucideAngularModule, Search, UserPlus, Link } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { UsersService } from '../../../Secutiry/services/users.service';
import { User } from '../../../Secutiry/users/models/user';

interface GenerateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-generate-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-slate-200 dark:border-slate-700">
        
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <lucide-angular [img]="mode() === 'create' ? icons.UserPlus : icons.Link" class="w-6 h-6 text-blue-600 dark:text-blue-400"></lucide-angular>
            {{ mode() === 'create' ? 'Generar Nuevo Usuario' : 'Vincular Usuario Existente' }}
          </h3>
          <button (click)="close()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Tabs -->
        <!-- Tabs -->
        <div class="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            (click)="setMode('create')"
            [ngClass]="{
              'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400': mode() === 'create',
              'text-slate-500 border-transparent dark:text-slate-400': mode() !== 'create'
            }"
            class="flex-1 py-3 text-sm font-medium border-b-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Crear Nuevo
          </button>
          <button 
            (click)="setMode('link')"
            [ngClass]="{
              'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400': mode() === 'link',
              'text-slate-500 border-transparent dark:text-slate-400': mode() !== 'link'
            }"
            class="flex-1 py-3 text-sm font-medium border-b-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Vincular Existente
          </button>
        </div>

        <div class="p-6">
          <!-- Employee Info -->
          <div *ngIf="employee" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
            <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm uppercase tracking-wider">Empleado Seleccionado</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-blue-600 dark:text-blue-400 block text-xs">Nombre</span>
                <span class="text-slate-700 dark:text-slate-300 font-medium">{{ employee.first_name }} {{ employee.last_name }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400 block text-xs">Código</span>
                <span class="text-slate-700 dark:text-slate-300 font-medium">{{ employee.employee_code }}</span>
              </div>
            </div>
          </div>

          <!-- CREATE MODE -->
          <form *ngIf="mode() === 'create'" (ngSubmit)="onSubmit()" #userForm="ngForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de usuario *</label>
              <input type="text" name="username" [(ngModel)]="form.username" required minlength="3" class="input-field" placeholder="Ej: juan.perez">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electrónico *</label>
              <input type="email" name="email" [(ngModel)]="form.email" required email class="input-field" placeholder="usuario@empresa.com">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña *</label>
                <input type="password" name="password" [(ngModel)]="form.password" required minlength="8" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar *</label>
                <input type="password" name="confirmPassword" [(ngModel)]="form.confirmPassword" required class="input-field">
              </div>
            </div>
            <p *ngIf="form.password && form.confirmPassword && form.password !== form.confirmPassword" class="text-xs text-red-500">Las contraseñas no coinciden</p>
            
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" (click)="close()" class="btn-secondary">Cancelar</button>
              <button type="submit" [disabled]="!userForm.valid || form.password !== form.confirmPassword || isLoading()" class="btn-primary">
                {{ isLoading() ? 'Generando...' : 'Crear Usuario' }}
              </button>
            </div>
          </form>

          <!-- LINK MODE -->
          <div *ngIf="mode() === 'link'" class="space-y-4">
            <div class="relative">
              <lucide-angular [img]="icons.Search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></lucide-angular>
              <input 
                type="text" 
                [ngModel]="searchTerm()"
                (ngModelChange)="onSearch($event)"
                placeholder="Buscar usuario por nombre o correo..." 
                class="input-field pl-10"
              >
            </div>

            <div class="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              <div *ngIf="users().length === 0 && !isSearching()" class="p-4 text-center text-slate-500 text-sm">
                {{ searchTerm() ? 'No se encontraron usuarios' : 'Escribe para buscar...' }}
              </div>
              
              <button *ngFor="let user of users()" (click)="selectUser(user)" [class.bg-blue-50]="selectedUser()?.id === user.id" class="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {{ user.first_name.charAt(0) }}{{ user.last_name.charAt(0) }}
                </div>
                <div>
                  <div class="font-medium text-slate-900 dark:text-white text-sm">{{ user.first_name }} {{ user.last_name }}</div>
                  <div class="text-xs text-slate-500">{{ user.email }}</div>
                </div>
                <div *ngIf="selectedUser()?.id === user.id" class="ml-auto text-blue-600 dark:text-blue-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </button>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button type="button" (click)="close()" class="btn-secondary">Cancelar</button>
              <button 
                type="button" 
                (click)="onLinkUser()" 
                [disabled]="!selectedUser() || isLoading()" 
                class="btn-primary"
              >
                {{ isLoading() ? 'Vinculando...' : 'Vincular Usuario' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <style>
      .input-field {
        @apply w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all;
      }
      .btn-primary {
        @apply px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20;
      }
      .btn-secondary {
        @apply px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors;
      }
    </style>
  `
})
export class GenerateUserModalComponent {
  @Input() isOpen = false;
  @Input() employee: Employee | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() userGenerated = new EventEmitter<void>();

  private employeeService = inject(EmployeeService);
  private usersService = inject(UsersService);

  mode = signal<'create' | 'link'>('create');
  isLoading = signal(false);

  // Create Mode State
  form: GenerateUserForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Link Mode State
  searchTerm = signal('');
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  isSearching = signal(false);
  private searchSubject = new Subject<string>();

  icons = { Search, UserPlus, Link };

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching.set(true);
        // Usamos el servicio de usuarios para buscar. Asumimos que list soporta filtros o traemos todos y filtramos en cliente si no hay endpoint de búsqueda específico.
        // Para optimizar, idealmente el backend soportaría ?search=term
        return this.usersService.list(1, 20); // Traemos primeros 20 para filtrar en cliente por ahora si no hay search param
      })
    ).subscribe({
      next: (res: any) => {
        const term = this.searchTerm().toLowerCase();
        const filtered = res.data.filter((u: User) =>
          u.first_name.toLowerCase().includes(term) ||
          u.last_name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
        );
        this.users.set(filtered);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false)
    });
  }

  ngOnChanges(): void {
    if (this.isOpen && this.employee) {
      this.resetForm();
      this.generateSuggestedData();
      this.mode.set('create');
      this.searchTerm.set('');
      this.selectedUser.set(null);
      this.users.set([]);
    }
  }

  setMode(mode: 'create' | 'link') {
    this.mode.set(mode);
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
    if (term.length > 2) {
      this.searchSubject.next(term);
    } else {
      this.users.set([]);
    }
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
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
    if (this.employee.employee_code) {
      this.form.username = this.employee.employee_code.toLowerCase();
      this.form.email = `${this.employee.employee_code.toLowerCase()}@empresa.com`;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.employee || !this.isFormValid()) return;

    this.isLoading.set(true);
    try {
      await this.employeeService.generateUser(this.employee.employee_id, {
        username: this.form.username,
        email: this.form.email,
        password: this.form.password
      });

      toast.success('Usuario generado exitosamente');
      this.userGenerated.emit();
      this.close();
    } catch (error: any) {
      toast.error(error.error?.message || 'Error al generar el usuario');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onLinkUser(): Promise<void> {
    const user = this.selectedUser();
    if (!this.employee || !user) return;

    this.isLoading.set(true);
    try {
      await this.employeeService.linkUser(this.employee.employee_id, user.id);
      toast.success('Usuario vinculado exitosamente');
      this.userGenerated.emit();
      this.close();
    } catch (error: any) {
      toast.error(error.error?.message || 'Error al vincular el usuario');
    } finally {
      this.isLoading.set(false);
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