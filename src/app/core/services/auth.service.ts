import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_ROUTES } from '../constants/api.routes';
import { User } from '../../modules/Secutiry/users/models/user';

export interface UserResource {
  id: number;
  name: string;
  email: string;
  permissions: string[];
  //POR EL MOMENTO ESOS DATOS
}

export interface LoginResponse {
  token: string;
  user: UserResource;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<UserResource | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('user');
    if (stored) this.userSubject.next(JSON.parse(stored));
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(API_ROUTES.AUTH.LOGIN, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.userSubject.value;
  }

  hasPermission(perm: string): boolean {
    const user = this.userSubject.value;
    return !!user && Array.isArray(user.permissions) && user.permissions.includes(perm);
  }
}