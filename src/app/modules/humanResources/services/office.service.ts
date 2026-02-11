import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Office } from '../models/office';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class OfficeService {
    private http = inject(HttpClient);

    getOffices(): Observable<ApiResponse<Office[]>> {
        return this.http.get<ApiResponse<Office[]>>(API_ROUTES.HR.OFFICES);
    }

    getOffice(id: number): Observable<ApiResponse<Office>> {
        return this.http.get<ApiResponse<Office>>(`${API_ROUTES.HR.OFFICES}/${id}`);
    }

    createOffice(office: Partial<Office>): Observable<ApiResponse<Office>> {
        return this.http.post<ApiResponse<Office>>(API_ROUTES.HR.OFFICES, office);
    }

    updateOffice(id: number, office: Partial<Office>): Observable<ApiResponse<Office>> {
        return this.http.put<ApiResponse<Office>>(`${API_ROUTES.HR.OFFICES}/${id}`, office);
    }

    deleteOffice(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.OFFICES}/${id}`);
    }
}
