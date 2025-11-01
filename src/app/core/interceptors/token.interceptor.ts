import { HttpHandler, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  
  const auth = inject(AuthService);
  // Get token directly from localStorage to avoid timing issues
  const token = localStorage.getItem('token');
  
  // Also check if token is expired
  const expiry = localStorage.getItem('tokenExpiry');
  const now = new Date().getTime();
  const isTokenValid = token && expiry && now < parseInt(expiry, 10);
  
  const authReq = isTokenValid
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq);
};
