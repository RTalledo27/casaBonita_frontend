import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../users/models/role';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private http: HttpClient) { }
  getAllRoles(): Observable<Role[]> {
    // Ajusta la URL a tu endpoint real
    return this.http.get<Role[]>(API_ROUTES.SECURITY.ROLES);
  }

  getPermissionsForRoles(roleNames: string[]): Observable<string[]> {
    return this.getAllRoles().pipe(
      map(roles =>
        roles
          .filter(r => roleNames.includes(r.name))
          .flatMap(r => r.permissions.map(p => p.name))
      ),
      map(perms => Array.from(new Set(perms))) // quita duplicados
    );
  }

   
}
