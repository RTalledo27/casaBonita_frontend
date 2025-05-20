import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../users/models/user';
import { API_ROUTES } from '../../../core/constants/api.routes';

@Injectable({
  providedIn: 'root'
})
export class UsersService {


  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    console.log('Fetching users from API, URL:', API_ROUTES.SECURITY.USERS);
    return this.http.get<User[]>(API_ROUTES.SECURITY.USERS);
  }

  
}
