import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const perm = route.data['permission'] as string;
  if (auth.hasPermission(perm)) {
    return true;
  }
  toast.show('No tienes permisos para ver este módulo.', 'error');
  router.navigate(['/unauthorized']);
  return false;
};
