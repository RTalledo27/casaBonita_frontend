import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  TaxParameter, 
  CreateTaxParameterDto, 
  UpdateTaxParameterDto, 
  CopyYearDto,
  CalculateFamilyAllowanceDto,
  FamilyAllowanceResponse,
  TaxParameterApiResponse 
} from '../models/tax-parameter';

/**
 * Servicio para gestión de Parámetros Tributarios
 * Permite CRUD de parámetros dinámicos por año
 */
@Injectable({
  providedIn: 'root'
})
export class TaxParameterService {

  private readonly baseUrl = `${environment.URL_BACKEND}/v1/hr/tax-parameters`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener parámetros del año actual
   */
  getCurrent(): Observable<TaxParameterApiResponse> {
    return this.http.get<TaxParameterApiResponse>(`${this.baseUrl}/current`);
  }

  /**
   * Obtener parámetros de un año específico
   */
  getByYear(year: number): Observable<TaxParameterApiResponse> {
    return this.http.get<TaxParameterApiResponse>(`${this.baseUrl}/${year}`);
  }

  /**
   * Listar todos los años disponibles
   */
  getAll(): Observable<TaxParameterApiResponse> {
    return this.http.get<TaxParameterApiResponse>(this.baseUrl);
  }

  /**
   * Crear parámetros para un nuevo año
   */
  create(data: CreateTaxParameterDto): Observable<TaxParameterApiResponse> {
    return this.http.post<TaxParameterApiResponse>(this.baseUrl, data);
  }

  /**
   * Actualizar parámetros de un año existente
   */
  update(year: number, data: UpdateTaxParameterDto): Observable<TaxParameterApiResponse> {
    return this.http.put<TaxParameterApiResponse>(`${this.baseUrl}/${year}`, data);
  }

  /**
   * Copiar parámetros de un año a otro
   * Útil para preparar el siguiente año usando valores actuales como base
   */
  copyYear(fromYear: number, toYear: number): Observable<TaxParameterApiResponse> {
    const data: CopyYearDto = { from_year: fromYear, to_year: toYear };
    return this.http.post<TaxParameterApiResponse>(`${this.baseUrl}/copy-year`, data);
  }

  /**
   * Calcular asignación familiar automáticamente (10% del RMV)
   */
  calculateFamilyAllowance(minimumWage: number): Observable<{ success: boolean, data: FamilyAllowanceResponse }> {
    const data: CalculateFamilyAllowanceDto = { minimum_wage: minimumWage };
    return this.http.post<{ success: boolean, data: FamilyAllowanceResponse }>(
      `${this.baseUrl}/calculate-family-allowance`, 
      data
    );
  }

  /**
   * Validar si existe un año
   */
  yearExists(year: number): Observable<boolean> {
    return new Observable(observer => {
      this.getByYear(year).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtener lista de años disponibles (solo años)
   */
  getAvailableYears(): Observable<number[]> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const years = response.data.map(param => param.year).sort((a, b) => b - a);
            observer.next(years);
          } else {
            observer.next([]);
          }
          observer.complete();
        },
        error: () => {
          observer.next([]);
          observer.complete();
        }
      });
    });
  }
}
