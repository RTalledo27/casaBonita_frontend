import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Permission } from '../users/models/permission';

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
export class PermissionsService {
  constructor(private http: HttpClient) {}

  private base = API_ROUTES.SECURITY.PERMISSIONS;

  list(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<Permission>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Permission>>(this.base, { params }).pipe(
      map((resp) => {
        console.log('INSIDE MAP:', resp); // <--- Esto debe salir en consola
        return resp;
      })
    );
  }

  // Método para obtener TODOS los permisos sin paginación
  listAll(): Observable<PaginatedResponse<Permission>> {
    let params = new HttpParams()
      .set('page', '1')
      .set('per_page', '500'); // Suficiente para todos los permisos

    return this.http.get<PaginatedResponse<Permission>>(this.base, { params }).pipe(
      map((resp) => {
        console.log('ALL PERMISSIONS LOADED:', resp.data.length);
        return resp;
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
