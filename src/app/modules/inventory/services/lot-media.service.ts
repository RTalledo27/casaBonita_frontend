import { Injectable } from '@angular/core';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { LotMedia } from '../models/lot-media';

@Injectable({
  providedIn: 'root',
})
export class LotMediaService {
  private base = API_ROUTES.INVENTORY.LOT_MEDIA;

  constructor(private http: HttpClient) {}

  uploadMedia(
    lotId: number,
    items: { file: File; type: string }[]
  ): Observable<LotMedia[]> {
    const requests = items.map((item) => {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('type', item.type);
      fd.append('lot_id', lotId.toString());
      return this.http.post<LotMedia>(this.base, fd);
    });
    return forkJoin(requests);
  }

  deleteMedia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
