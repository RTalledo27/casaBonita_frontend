import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateChildFn = (route, state) => {

  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Verificar si el usuario está logueado
  if (!auth.isLoggedIn) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  // Verificar si debe cambiar la contraseña
  if (auth.mustChangePassword) {
    // Permitir acceso solo a la ruta de cambio de contraseña
    if (state.url !== '/auth/change-password') {
      router.navigate(['/auth/change-password']);
      return false;
    }
  }
  
  return true;
}
