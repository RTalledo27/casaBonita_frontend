import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StreetType } from '../models/street-type';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root',
})
export class StreetTypeService {

  private base =  API_ROUTES.INVENTORY.STREET_TYPES

  constructor(private http: HttpClient) {}

  list(): Observable<StreetType[]> {
    return this.http
      .get<{ data: StreetType[] }>(this.base)
      .pipe(map((res) => res.data));
  }
}
