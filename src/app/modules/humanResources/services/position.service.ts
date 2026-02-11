import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Position } from '../models/position';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class PositionService {
    private http = inject(HttpClient);

    getPositions(params?: { active?: boolean; category?: string }): Observable<ApiResponse<Position[]>> {
        let url = API_ROUTES.HR.POSITIONS;
        const queryParams: string[] = [];
        if (params?.active !== undefined) queryParams.push(`active=${params.active}`);
        if (params?.category) queryParams.push(`category=${params.category}`);
        if (queryParams.length) url += '?' + queryParams.join('&');
        return this.http.get<ApiResponse<Position[]>>(url);
    }

    getPosition(id: number): Observable<ApiResponse<Position>> {
        return this.http.get<ApiResponse<Position>>(`${API_ROUTES.HR.POSITIONS}/${id}`);
    }

    createPosition(position: Partial<Position>): Observable<ApiResponse<Position>> {
        return this.http.post<ApiResponse<Position>>(API_ROUTES.HR.POSITIONS, position);
    }

    updatePosition(id: number, position: Partial<Position>): Observable<ApiResponse<Position>> {
        return this.http.put<ApiResponse<Position>>(`${API_ROUTES.HR.POSITIONS}/${id}`, position);
    }

    deletePosition(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.POSITIONS}/${id}`);
    }
}
