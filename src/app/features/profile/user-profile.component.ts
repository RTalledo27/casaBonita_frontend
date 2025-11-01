import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, User, Mail, Phone, MapPin, Calendar, Lock, Bell, Shield, Activity, Settings } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileService, UserProfile as ProfileData, ActivityLog } from '../../core/services/profile.service';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
  avatar?: string;
  department?: string;
  position?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {{ getInitials() }}
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ userProfile()?.name || 'Cargando...' }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ userProfile()?.email }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ userProfile()?.role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8">
            <button
              *ngFor="let tab of tabs"
              (click)="activeTab.set(tab.id)"
              [class.border-blue-500]="activeTab() === tab.id"
              [class.text-blue-600]="activeTab() === tab.id"
              [class.dark:text-blue-400]="activeTab() === tab.id"
              [class.border-transparent]="activeTab() !== tab.id"
              [class.text-gray-500]="activeTab() !== tab.id"
              [class.dark:text-gray-400]="activeTab() !== tab.id"
              class="group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <lucide-icon 
                [img]="tab.icon" 
                class="mr-2 h-5 w-5"
              ></lucide-icon>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-6 pb-12">
          <!-- Información Personal -->
          <div *ngIf="activeTab() === 'info'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Información Personal
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Actualiza tu información de perfil y datos de contacto.
              </p>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="px-6 py-5 space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    formControlName="first_name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    formControlName="last_name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    [disabled]="true"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El correo no se puede modificar
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    formControlName="phone"
                    placeholder="+52 123 456 7890"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="mt-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  formControlName="address"
                  placeholder="Calle, Ciudad, Estado"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  (click)="cancelEdit()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="profileForm.invalid || isLoading()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isLoading() ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Seguridad -->
          <div *ngIf="activeTab() === 'security'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Seguridad
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Actualiza tu contraseña y gestiona la seguridad de tu cuenta.
              </p>
            </div>
            <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="px-6 py-5 space-y-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    formControlName="currentPassword"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    formControlName="newPassword"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mínimo 8 caracteres
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    formControlName="confirmPassword"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched" 
                     class="mt-1 text-xs text-red-600 dark:text-red-400">
                    Las contraseñas no coinciden
                  </p>
                </div>
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  (click)="cancelPasswordEdit()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="passwordForm.invalid || isLoading()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isLoading() ? 'Actualizando...' : 'Actualizar contraseña' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Notificaciones -->
          <div *ngIf="activeTab() === 'notifications'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Preferencias de Notificaciones
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configura cómo y cuándo deseas recibir notificaciones.
              </p>
            </div>
            <div class="px-6 py-5 space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between py-3">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Notificaciones por correo
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Recibe actualizaciones importantes por email
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="notificationPreferences.email"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Notificaciones push
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Recibe notificaciones en tiempo real en el navegador
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="notificationPreferences.push"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Alertas de sistema
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Recibe alertas sobre cambios importantes en el sistema
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="notificationPreferences.system"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Resumen semanal
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Recibe un resumen de actividad cada semana
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="notificationPreferences.weekly"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  (click)="saveNotificationPreferences()"
                  [disabled]="isLoading()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isLoading() ? 'Guardando...' : 'Guardar preferencias' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Actividad -->
          <div *ngIf="activeTab() === 'activity'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Historial de acciones realizadas en tu cuenta.
              </p>
            </div>
            <div class="px-6 py-5">
              <div class="flow-root">
                <ul class="-mb-8">
                  <li *ngFor="let activity of recentActivity; let last = last">
                    <div class="relative pb-8">
                      <span *ngIf="!last" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"></span>
                      <div class="relative flex space-x-3">
                        <div>
                          <span class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                            <lucide-icon [img]="Activity" class="h-4 w-4 text-white"></lucide-icon>
                          </span>
                        </div>
                        <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p class="text-sm text-gray-900 dark:text-white">
                              {{ activity.action }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                              {{ activity.details }}
                            </p>
                          </div>
                          <div class="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            {{ activity.timestamp }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UserProfileComponent implements OnInit {
  // Icons
  readonly User = User;
  readonly Lock = Lock;
  readonly Bell = Bell;
  readonly Activity = Activity;
  readonly Settings = Settings;

  // State
  userProfile = signal<UserProfile | null>(null);
  activeTab = signal<string>('info');
  isLoading = signal<boolean>(false);

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Notification preferences
  notificationPreferences = {
    email: true,
    push: true,
    system: true,
    weekly: false
  };

  // Tabs
  tabs = [
    { id: 'info', label: 'Información Personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'activity', label: 'Actividad', icon: Activity }
  ];

  // Recent activity (will be loaded from API)
  recentActivity: ActivityLog[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadActivity();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadUserProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const profile: UserProfile = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            address: response.data.address || '',
            role: response.data.role,
            created_at: response.data.created_at,
            department: response.data.department,
            position: response.data.position,
            avatar: response.data.avatar
          };
          
          // Separar nombre en first_name y last_name
          const nameParts = profile.name.trim().split(' ');
          const firstName = response.data.first_name || nameParts[0] || '';
          const lastName = response.data.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
          
          this.userProfile.set(profile);
          this.profileForm.patchValue({
            first_name: firstName,
            last_name: lastName,
            email: profile.email,
            phone: profile.phone,
            address: profile.address
          });
          
          // Cargar preferencias de notificaciones si existen
          this.loadNotificationPreferences();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastService.show('Error al cargar el perfil', 'error');
        this.isLoading.set(false);
      }
    });
  }

  loadNotificationPreferences(): void {
    this.profileService.getNotificationPreferences().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationPreferences = {
            email: response.data.email ?? true,
            push: response.data.push ?? true,
            system: response.data.system ?? true,
            weekly: response.data.weekly ?? false
          };
        }
      },
      error: (error) => {
        console.error('Error loading notification preferences:', error);
      }
    });
  }

  loadActivity(): void {
    this.profileService.getActivity(20).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentActivity = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading activity:', error);
      }
    });
  }

  getInitials(): string {
    const name = this.userProfile()?.name || '';
    if (!name) return 'U';
    
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    const formData = this.profileForm.getRawValue();

    this.profileService.updateProfile({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || undefined,
      address: formData.address || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.toastService.show('Perfil actualizado correctamente', 'success');
          
          // Actualizar el perfil local
          const profile: UserProfile = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            address: response.data.address || '',
            role: response.data.role,
            created_at: this.userProfile()?.created_at || new Date().toISOString(),
            department: response.data.department,
            position: response.data.position
          };
          this.userProfile.set(profile);
          
          // Recargar actividad para ver el cambio registrado
          this.loadActivity();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toastService.show(error.error?.message || 'Error al actualizar el perfil', 'error');
        this.isLoading.set(false);
      }
    });
  }

  cancelEdit(): void {
    this.profileForm.patchValue(this.userProfile()!);
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isLoading.set(true);
    const formData = this.passwordForm.value;
    
    this.profileService.changePassword({
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
      new_password_confirmation: formData.confirmPassword
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show('Contraseña actualizada correctamente', 'success');
          this.passwordForm.reset();
          
          // Recargar actividad para ver el cambio registrado
          this.loadActivity();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.toastService.show(error.error?.message || 'Error al actualizar la contraseña', 'error');
        this.isLoading.set(false);
      }
    });
  }

  cancelPasswordEdit(): void {
    this.passwordForm.reset();
  }

  saveNotificationPreferences(): void {
    this.isLoading.set(true);
    
    this.profileService.updateNotificationPreferences(this.notificationPreferences).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show('Preferencias guardadas correctamente', 'success');
          
          // Actualizar preferencias en el servicio de notificaciones en tiempo real
          this.notificationService.updatePreferences(this.notificationPreferences);
          
          // Recargar actividad para ver el cambio registrado
          this.loadActivity();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error saving preferences:', error);
        this.toastService.show(error.error?.message || 'Error al guardar preferencias', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
