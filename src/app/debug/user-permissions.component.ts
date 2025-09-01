import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Debug: Permisos de Usuario</h2>
      
      <div class="space-y-6">
        <!-- Información del Usuario -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-blue-800">Información del Usuario</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>ID:</strong> {{ user?.id || 'N/A' }}
            </div>
            <div>
              <strong>Nombre:</strong> {{ user?.name || 'N/A' }}
            </div>
            <div>
              <strong>Email:</strong> {{ user?.email || 'N/A' }}
            </div>
            <div>
              <strong>Debe cambiar contraseña:</strong> {{ user?.must_change_password ? 'Sí' : 'No' }}
            </div>
          </div>
        </div>

        <!-- Roles -->
        <div class="bg-green-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-green-800">Roles</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let role of user?.roles" 
                  class="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
              {{ role }}
            </span>
            <span *ngIf="!user?.roles || user?.roles.length === 0" 
                  class="text-gray-500 italic">No hay roles asignados</span>
          </div>
        </div>

        <!-- Permisos -->
        <div class="bg-yellow-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-yellow-800">Permisos ({{ user?.permissions?.length || 0 }} total)</h3>
          <div class="max-h-60 overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <span *ngFor="let permission of user?.permissions" 
                    class="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                {{ permission }}
              </span>
            </div>
            <div *ngIf="!user?.permissions || user?.permissions.length === 0" 
                 class="text-gray-500 italic">No hay permisos asignados</div>
          </div>
        </div>

        <!-- Verificación de Permisos Collections -->
        <div class="bg-red-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-red-800">Verificación de Permisos Collections</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span>collections.access:</span>
              <span [class]="hasCollectionsAccess ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ hasCollectionsAccess ? '✓ Permitido' : '✗ Denegado' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>collections.accounts-receivable.view:</span>
              <span [class]="hasAccountsReceivableView ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ hasAccountsReceivableView ? '✓ Permitido' : '✗ Denegado' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>collections.reports.view:</span>
              <span [class]="hasReportsView ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ hasReportsView ? '✓ Permitido' : '✗ Denegado' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>collections.customer-payments.view:</span>
              <span [class]="hasCustomerPaymentsView ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ hasCustomerPaymentsView ? '✓ Permitido' : '✗ Denegado' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Estado de Autenticación -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Estado de Autenticación</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span>Está logueado:</span>
              <span [class]="authService.isLoggedIn ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ authService.isLoggedIn ? '✓ Sí' : '✗ No' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>Tiene token:</span>
              <span [class]="authService.token ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ authService.token ? '✓ Sí' : '✗ No' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>Es admin:</span>
              <span [class]="authService.isAdmin() ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                {{ authService.isAdmin() ? '✓ Sí' : '✗ No' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserPermissionsComponent implements OnInit {
  authService = inject(AuthService);
  user: any = null;
  
  hasCollectionsAccess = false;
  hasAccountsReceivableView = false;
  hasReportsView = false;
  hasCustomerPaymentsView = false;

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.checkPermissions();
    });
  }

  private checkPermissions() {
    this.hasCollectionsAccess = this.authService.hasPermission('collections.access');
    this.hasAccountsReceivableView = this.authService.hasPermission('collections.accounts-receivable.view');
    this.hasReportsView = this.authService.hasPermission('collections.reports.view');
    this.hasCustomerPaymentsView = this.authService.hasPermission('collections.customer-payments.view');
  }
}