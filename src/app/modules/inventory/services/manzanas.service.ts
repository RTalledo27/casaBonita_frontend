import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Manzana } from '../models/manzana';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root'
})
export class ManzanasService {

  constructor(
    private http: HttpClient
  ) { }

  private base = API_ROUTES.INVENTORY.MANZANAS

   list(): Observable<Manzana[]> {
      return this.http
        .get<{ data: Manzana[] }>(this.base)
        .pipe(map((res) => res.data));
    }
}
