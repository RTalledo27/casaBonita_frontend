import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LotMedia } from '../models/lot-media';

@Injectable({
  providedIn: 'root',
})
export class LotMediaService {
  private base = API_ROUTES.INVENTORY.LOT_MEDIA;



  constructor(private http: HttpClient) {}

  uploadMedia(fd: FormData): Observable<LotMedia> {
    return this.http.post<LotMedia>(this.base, fd);
  }

  deleteMedia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
