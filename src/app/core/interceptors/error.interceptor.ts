import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const messages = error.error?.errors
        ? (Object.values(error.error.errors) as string[]).flat()
        : [error.message];
      messages.forEach((m) => toast.show(m, 'error'));
      return throwError(() => error);
    })
  );};
