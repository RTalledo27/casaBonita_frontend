import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Permission } from '../users/models/permission';

interface ApiResponse<T> {
  data: T;
}


interface Paginated<T> {
  data: T[];
  meta: any;
  links: any;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  constructor(private http: HttpClient) {}

  private base = API_ROUTES.SECURITY.PERMISSIONS;

  list(): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(this.base).pipe(
      map((resp) => {
        console.log('INSIDE MAP:', resp); // <--- Esto debe salir en consola
        return resp.data;
      })
    );
  }

  get(id: number): Observable<Permission> {
    return this.http
      .get<ApiResponse<Permission>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(fd: FormData): Observable<Permission> {
    return this.http.post<Permission>(this.base, fd);
  }
  update(id: number, fd: FormData): Observable<Permission> {
    console.log('update', fd);
    return this.http.post<Permission>(`${this.base}/${id}`, fd);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
