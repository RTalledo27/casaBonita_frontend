import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No mostrar toasts para errores de autenticación (401)
      // Estos son manejados por el sistema de autenticación
      if (error.status === 401) {
        return throwError(() => error);
      }

      let messages: string[] = [];
      if (error.error?.errors) {
        messages = (Object.values(error.error.errors) as string[]).flat();
      } else {
        let msg = error.error?.message || `${error.status} ${error.statusText}`;
        if (typeof msg === 'string') {
          if (msg.includes('SQLSTATE[22007]')) {
            msg = 'Formato de fecha inválido';
          } else if (msg.includes('SQLSTATE')) {
            msg = 'Error en la base de datos';
          }
        }
        messages = [msg];
      }
      messages.forEach((m) => toast.show(m, 'error'));
      return throwError(() => error);
    })
  );
};
