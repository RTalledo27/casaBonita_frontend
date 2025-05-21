import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateChildFn = (route, state) => {

  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    return true;
  }
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
}
