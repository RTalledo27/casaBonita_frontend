import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { map, Observable } from 'rxjs';
import { Client } from '../models/client';

interface Paginated<T> {
  data: T[];
  meta: any;
  links: any;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  constructor(private http: HttpClient) {}

  private base = API_ROUTES.CRM.CLIENTS;

  list(): Observable<Client[]> {
    return this.http.get<Paginated<Client>>(this.base).pipe(
      map((resp) => resp.data)
    );
  }

  get(id: number): Observable<Client> {
    return this.http
      .get<ApiResponse<Client>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(fd: FormData): Observable<Client> {
    return this.http.post<Client>(this.base, fd);
  }

  update(id: number, fd: FormData): Observable<Client> {
    return this.http.post<Client>(`${this.base}/${id}`, fd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
