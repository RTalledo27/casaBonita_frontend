import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { Permission } from '../../../types/permissions';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  
  private subscription?: Subscription;
  private currentPermissions: Permission[] = [];
  private requireAll = false;

  @Input() set hasPermission(permissions: Permission | Permission[]) {
    this.currentPermissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  @Input() set hasPermissionRequireAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
  }

  ngOnInit() {
    // Suscribirse a cambios en los permisos del usuario
    this.subscription = this.authService.permissions().subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateView() {
    const hasPermission = this.checkPermissions();
    
    if (hasPermission) {
      // Mostrar el elemento
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      // Ocultar el elemento
      this.viewContainer.clear();
    }
  }

  private checkPermissions(): boolean {
    if (this.currentPermissions.length === 0) {
      return true; // Si no hay permisos especificados, mostrar por defecto
    }

    const hasAnyPermission = this.authService.hasAnyPermission();
    const hasAllPermissions = this.authService.hasAllPermissions();

    if (this.requireAll) {
      return hasAllPermissions(this.currentPermissions);
    } else {
      return hasAnyPermission(this.currentPermissions);
    }
  }
}