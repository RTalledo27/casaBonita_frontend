import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  
  // Manejar tanto 'permission' (singular) como 'permissions' (plural)
  const perm = route.data['permission'] as string;
  const perms = route.data['permissions'] as string[];
  
  let hasAccess = false;
  
  if (perm) {
    hasAccess = auth.hasPermission(perm);
  } else if (perms && perms.length > 0) {
    // Si hay múltiples permisos, verificar que tenga al menos uno
    hasAccess = perms.some(p => auth.hasPermission(p));
  }
  
  if (hasAccess) {
    return true;
  }
  
  toast.show('No tienes permisos para ver este módulo.', 'error');
  router.navigate(['/unauthorized']);
  return false;
};
