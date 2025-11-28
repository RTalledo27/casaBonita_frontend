import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../users/models/user';
import { API_ROUTES } from '../../../core/constants/api.routes';

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient) { }

  private base = API_ROUTES.SECURITY.USERS;

  list(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<User>>(this.base, { params });
  }
  get(id: number): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(fd: FormData): Observable<User> {
    return this.http.post<User>(this.base, fd);
  }
  update(id: number, fd: FormData): Observable<User> {
    console.log('update', fd);
    return this.http.post<User>(`${this.base}/${id}`, fd);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  resetPassword(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/reset-password`, {});
  }

  toggleStatus(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/toggle-status`, {});
  }
}
