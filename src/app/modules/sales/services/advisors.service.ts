import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';

export type AdvisorOption = { id: number; name: string };

@Injectable({
  providedIn: 'root',
})
export class AdvisorsService {
  constructor(private http: HttpClient) {}

  list(): Observable<any> {
    return this.http.get<any>(API_ROUTES.HR.EMPLOYEES_ADVISORS);
  }
}

