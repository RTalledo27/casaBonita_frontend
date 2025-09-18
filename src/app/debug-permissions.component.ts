import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-debug-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Debug de Permisos</h2>
      <div class="mb-4">
        <h3 class="font-semibold">Usuario Actual:</h3>
        <pre>{{ userInfo | json }}</pre>
      </div>
      <div class="mb-4">
        <h3 class="font-semibold">Permisos:</h3>
        <ul class="list-disc pl-5">
          <li *ngFor="let permission of userPermissions">{{ permission }}</li>
        </ul>
      </div>
      <div class="mb-4">
        <h3 class="font-semibold">¿Tiene permiso sales.contracts.view?</h3>
        <p>{{ hasSalesContractsPermission ? 'SÍ' : 'NO' }}</p>
      </div>
    </div>
  `
})
export class DebugPermissionsComponent implements OnInit {
  userInfo: any = null;
  userPermissions: string[] = [];
  hasSalesContractsPermission = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.userSubject.value;
    this.userInfo = user;
    this.userPermissions = user?.permissions || [];
    this.hasSalesContractsPermission = this.authService.hasPermission('sales.contracts.view');
    
    console.log('Debug Permissions Component loaded');
    console.log('User:', user);
    console.log('Permissions:', this.userPermissions);
    console.log('Has sales.contracts.view:', this.hasSalesContractsPermission);
  }
}