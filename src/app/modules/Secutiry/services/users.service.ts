import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../users/models/user';
import { API_ROUTES } from '../../../core/constants/api.routes';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient) {}

  private base = API_ROUTES.SECURITY.USERS;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
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
}
