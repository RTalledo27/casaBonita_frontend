import { Employee } from "./employee";

export interface Payroll {
  payroll_id: number;
  employee_id: number;
  payroll_period: string; // yyyy-mm format
  pay_period_start: string; // formato ISO (ej. '2025-07-01')
  pay_period_end: string;
  pay_date: string;

  // Ingresos
  base_salary: number;
  family_allowance: number; // Asignación familiar S/ 102.50
  commissions_amount: number;
  bonuses_amount: number;
  overtime_amount: number;
  other_income: number;
  gross_salary: number;

  // Sistema Pensionario
  pension_system: 'AFP' | 'ONP' | 'NINGUNO';
  afp_provider?: 'PRIMA' | 'INTEGRA' | 'PROFUTURO' | 'HABITAT';
  afp_contribution: number; // 10%
  afp_commission: number; // 1.00% - 1.47% según proveedor
  afp_insurance: number; // 0.99%
  onp_contribution: number; // 13%
  total_pension: number; // Total AFP o ONP

  // Impuesto a la Renta
  rent_tax_5th: number; // Impuesto 5ta categoría

  // Seguro de Salud
  employee_essalud: number; // 9% descuento del empleado

  // Otros descuentos
  other_deductions: number;
  total_deductions: number;

  // Aportaciones del Empleador (informativo)
  employer_essalud: number; // 9% pagado por el empleador

  // Neto
  net_salary: number;

  currency: string;
  status: 'borrador' | 'pendiente' | 'procesado' | 'aprobado' | 'pagado' | 'cancelado';
  processed_by?: number;
  approved_by?: number;
  approved_at?: string;
  notes?: string;

  created_at?: string;
  updated_at?: string;

  // Relaciones expandidas del backend
  employee?: {
    employee_id: number;
    employee_code: string;
    full_name: string;
    employee_type: string;
  };
  processor?: {
    employee_id: number;
    full_name: string;
  };
  approver?: {
    employee_id: number;
    full_name: string;
  };
}

// Interfaz para la generación de nómina
export interface PayrollGenerationData {
  month: number;
  year: number;
  pay_date?: string;
  employee_ids?: number[];
  include_commissions?: boolean;
  include_bonuses?: boolean;
  include_overtime?: boolean;
  notes?: string;
}

// Interfaz para filtros de búsqueda
export interface PayrollSearchFilters {
  employee_id?: number;
  period?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
