import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Attendance } from '../models/attendance';
import { API_ROUTES } from '../../../core/constants/api.routes';

export interface AttendanceFilters {
  employee_id?: number;
  date?: string;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface AttendanceResponse {
  success: boolean;
  data: Attendance[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);

  getAttendances(filters: AttendanceFilters = {}): Observable<AttendanceResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof AttendanceFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AttendanceResponse>(API_ROUTES.HR.ATTENDANCE, { params });
  }

  getAttendanceById(id: number): Observable<Attendance> {
    return this.http.get<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${id}`)
      .pipe(map(response => response.data));
  }

  getAttendanceByEmployee(employeeId: number, filters: AttendanceFilters = {}): Observable<AttendanceResponse> {
    let params = new HttpParams().set('employee_id', employeeId.toString());
    
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof AttendanceFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AttendanceResponse>(API_ROUTES.HR.ATTENDANCE, { params });
  }

  getAttendanceByDate(date: string): Observable<AttendanceResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AttendanceResponse>(API_ROUTES.HR.ATTENDANCE, { params });
  }

  getAttendanceByMonth(month: number, year: number): Observable<AttendanceResponse> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());
    return this.http.get<AttendanceResponse>(API_ROUTES.HR.ATTENDANCE, { params });
  }

  createAttendance(attendance: Partial<Attendance>): Observable<Attendance> {
    return this.http.post<ApiResponse<Attendance>>(API_ROUTES.HR.ATTENDANCE, attendance)
      .pipe(map(response => response.data));
  }

  updateAttendance(id: number, attendance: Partial<Attendance>): Observable<Attendance> {
    return this.http.put<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${id}`, attendance)
      .pipe(map(response => response.data));
  }

  deleteAttendance(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.ATTENDANCE}/${id}`)
      .pipe(map(() => void 0));
  }

  checkIn(employeeId: number, data: { attendance_date: string; check_in_time: string; notes?: string }): Observable<Attendance> {
    return this.http.post<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/check-in`, { employee_id: employeeId, ...data })
      .pipe(map(response => response.data));
  }

  checkOut(attendanceId: number, data: { check_out_time: string; notes?: string }): Observable<Attendance> {
    return this.http.put<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${attendanceId}/check-out`, data)
      .pipe(map(response => response.data));
  }

  startBreak(attendanceId: number, data: { break_start_time: string; notes?: string }): Observable<Attendance> {
    return this.http.put<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${attendanceId}/start-break`, data)
      .pipe(map(response => response.data));
  }

  endBreak(attendanceId: number, data: { break_end_time: string; notes?: string }): Observable<Attendance> {
    return this.http.put<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${attendanceId}/end-break`, data)
      .pipe(map(response => response.data));
  }

  approveAttendance(attendanceId: number): Observable<Attendance> {
    return this.http.put<ApiResponse<Attendance>>(`${API_ROUTES.HR.ATTENDANCE}/${attendanceId}/approve`, {})
      .pipe(map(response => response.data));
  }
}