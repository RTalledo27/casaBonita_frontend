

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Employee } from '../models/employee';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { User } from '../../Secutiry/users/models/user';
import { Team } from '../models/team';
import { AdvisorDashboard } from '../components/advisor-dashboard/advisor-dashboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { tokenInterceptor } from '../../../core/interceptors/token.interceptor';

export interface EmployeeFilters {
  search?: string;
  employee_type?: string;
  employment_status?: string;
  team_id?: number;
  page?: number;
  per_page?: number;
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface TopPerformer {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  total_commissions: number;
  total_bonuses: number;
  total_earnings: number;
}
@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(private http: HttpClient,private authService: AuthService) {}


  
  getEmployees(filters: EmployeeFilters = {}): Observable<EmployeeResponse> {
    let params = new HttpParams();
    // Add pagination by default
    params = params.set('paginate', 'true');

    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof EmployeeFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<EmployeeResponse>(API_ROUTES.HR.EMPLOYEES, { params });
  }

  // Método específico para obtener todos los empleados sin paginación
  getAllEmployees(filters: Omit<EmployeeFilters, 'page' | 'per_page'> = {}): Observable<EmployeeResponse> {
    let params = new HttpParams();
    // Desactivar paginación para obtener todos los empleados
    params = params.set('paginate', 'false');

    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<EmployeeResponse>(API_ROUTES.HR.EMPLOYEES, { params });
  }

  getEmployee(id: number): Observable<Employee> {
    return this.http
      .get<ApiResponse<Employee>>(`${API_ROUTES.HR.EMPLOYEES}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Método para obtener empleado por user_id
  getEmployeeByUserId(userId: number): Observable<Employee | null> {
    return this.getAllEmployees().pipe(
      map(response => {
        const employee = response.data.find(emp => emp.user_id === userId);
        return employee || null;
      })
    );
  }

  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http
      .post<ApiResponse<Employee>>(API_ROUTES.HR.EMPLOYEES, employee)
      .pipe(map((response) => response.data));
  }

  updateEmployee(
    id: number,
    employee: Partial<Employee>
  ): Observable<Employee> {
    return this.http
      .put<ApiResponse<Employee>>(`${API_ROUTES.HR.EMPLOYEES}/${id}`, employee)
      .pipe(map((response) => response.data));
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_ROUTES.HR.EMPLOYEES}/${id}`)
      .pipe(map(() => void 0));
  }

  getUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(API_ROUTES.SECURITY.USERS)
      .pipe(map((response) => response.data));
  }

  getTeams(): Observable<Team[]> {
    return this.http
      .get<ApiResponse<Team[]>>(API_ROUTES.HR.TEAMS)
      .pipe(map((response) => response.data));
  }

  getAdvisors(): Observable<Employee[]> {
    return this.http
      .get<ApiResponse<Employee[]>>(API_ROUTES.HR.EMPLOYEES_ADVISORS)
      .pipe(map((response) => response.data));
  }

  // Dashboard específico para asesores individuales
  getAdvisorDashboard(
    id: number,
    month?: number,
    year?: number
  ): Observable<AdvisorDashboard> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());

    return this.http
      .get<ApiResponse<AdvisorDashboard>>(
        API_ROUTES.HR.EMPLOYEE_DASHBOARD(id),
        { params }
      )
      .pipe(map((response) => response.data));
  }

  getAdminDashboard(month?: number, year?: number): Observable<any> {
    let params = new HttpParams();
   
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
  
    console.log('getAdminDashboard - URL:', API_ROUTES.HR.EMPLOYEES_ADMIN_DASHBOARD);
    console.log('getAdminDashboard - Params:', params.toString());
    
    return this.http
      .get<ApiResponse<any>>(API_ROUTES.HR.EMPLOYEES_ADMIN_DASHBOARD, { params })
      .pipe(map(response => {
        console.log('getAdminDashboard - Raw API response:', response);
        console.log('getAdminDashboard - Response data:', response.data);
        return response.data;
      }));
  }

  getTopPerformers(
    month?: number,
    year?: number,
    limit = 10
  ): Observable<TopPerformer[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());

    return this.http
      .get<ApiResponse<TopPerformer[]>>(
        `${API_ROUTES.HR.EMPLOYEES}/top-performers`,
        { params }
      )
      .pipe(map((response) => response.data));
  }
}
