import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Role } from '../users/models/role';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';


interface Paginated<T> {
  data: T[],
  meta: any,
  links: any
}

interface ApiResponse<T> {
  data: T;
}

export type RolePayload = Pick<Role, 'name' | 'description'> & {
  permission_ids: number[];

};



@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private base = API_ROUTES.SECURITY.ROLES;

  constructor(private http: HttpClient) { }
  
  getAllRoles(): Observable<Role[]> {
    // Ajusta la URL a tu endpoint real
    return this.http.get<Paginated<Role>>(this.base).pipe(
      map((resp) => resp.data)
    );
  }

  getPermissionsForRoles(roleNames: string[]): Observable<string[]> {
    return this.getAllRoles().pipe(
      map((roles) =>
        roles
          .filter((r) => roleNames.includes(r.name))
          .flatMap((r) => r.permissions.map((p) => p.name))
      ),
      map((perms) => Array.from(new Set(perms))) // quita duplicados
    );
  }

  get(id: number): Observable<Role> {
      return this.http
        .get<ApiResponse<Role>>(`${this.base}/${id}`)
        .pipe(map((res) => res.data));
    }

  list = () => this.http.get<Role[]>(this.base);
  show = (id: number) => this.http.get<Role>(`${this.base}/${id}`);

   create(fd: FormData): Observable<Role> {
      return this.http.post<Role>(this.base, fd);
    }

  update(id: number, fd: FormData): Observable<Role> {
    console.log('update', fd);
    return this.http.post<Role>(`${this.base}/${id}`, fd);
  }
  
  delete = (id: number) => this.http.delete<void>(`${this.base}/${id}`);
}
