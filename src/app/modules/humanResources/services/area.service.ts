import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Area } from '../models/area';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AreaService {
    private http = inject(HttpClient);

    getAreas(): Observable<ApiResponse<Area[]>> {
        return this.http.get<ApiResponse<Area[]>>(API_ROUTES.HR.AREAS);
    }

    getArea(id: number): Observable<ApiResponse<Area>> {
        return this.http.get<ApiResponse<Area>>(`${API_ROUTES.HR.AREAS}/${id}`);
    }

    createArea(area: Partial<Area>): Observable<ApiResponse<Area>> {
        return this.http.post<ApiResponse<Area>>(API_ROUTES.HR.AREAS, area);
    }

    updateArea(id: number, area: Partial<Area>): Observable<ApiResponse<Area>> {
        return this.http.put<ApiResponse<Area>>(`${API_ROUTES.HR.AREAS}/${id}`, area);
    }

    deleteArea(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.AREAS}/${id}`);
    }
}
