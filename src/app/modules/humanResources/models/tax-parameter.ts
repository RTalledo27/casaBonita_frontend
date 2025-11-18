/**
 * Modelo de Parámetros Tributarios (Tax Parameters)
 * Valores dinámicos configurables por año para cálculo de planillas
 */
export interface TaxParameter {
  parameter_id?: number;
  year: number;
  
  // Valores base
  uit_amount: number;              // Unidad Impositiva Tributaria
  family_allowance: number;        // Asignación Familiar (10% RMV)
  minimum_wage: number;            // Remuneración Mínima Vital (RMV)
  
  // AFP (Administradora de Fondos de Pensiones)
  afp_contribution_rate: number;   // Aporte AFP (10%)
  afp_insurance_rate: number;      // Seguro AFP (0.99%)
  afp_prima_commission: number;    // Comisión AFP Prima
  afp_integra_commission: number;  // Comisión AFP Integra
  afp_profuturo_commission: number; // Comisión AFP Profuturo
  afp_habitat_commission: number;  // Comisión AFP Habitat
  
  // ONP y EsSalud
  onp_rate: number;                // Tasa ONP (13%)
  essalud_rate: number;            // Tasa EsSalud (9%)
  
  // Impuesto a la Renta (5ta categoría)
  rent_tax_deduction_uit: number;  // Deducción en UIT (7 UIT)
  rent_tax_tramo1_uit: number;     // Hasta X UIT
  rent_tax_tramo1_rate: number;    // Tasa % tramo 1
  rent_tax_tramo2_uit: number;     // Hasta X UIT
  rent_tax_tramo2_rate: number;    // Tasa % tramo 2
  rent_tax_tramo3_uit: number;     // Hasta X UIT
  rent_tax_tramo3_rate: number;    // Tasa % tramo 3
  rent_tax_tramo4_uit: number;     // Hasta X UIT
  rent_tax_tramo4_rate: number;    // Tasa % tramo 4
  rent_tax_tramo5_rate: number;    // Tasa % tramo 5 (sin límite)
  
  // Metadatos
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * DTO para crear nuevos parámetros tributarios
 */
export interface CreateTaxParameterDto {
  year: number;
  uit_amount: number;
  family_allowance: number;
  minimum_wage: number;
  afp_contribution_rate: number;
  afp_insurance_rate: number;
  afp_prima_commission: number;
  afp_integra_commission: number;
  afp_profuturo_commission: number;
  afp_habitat_commission: number;
  onp_rate: number;
  essalud_rate: number;
  rent_tax_deduction_uit: number;
  rent_tax_tramo1_uit: number;
  rent_tax_tramo1_rate: number;
  rent_tax_tramo2_uit: number;
  rent_tax_tramo2_rate: number;
  rent_tax_tramo3_uit: number;
  rent_tax_tramo3_rate: number;
  rent_tax_tramo4_uit: number;
  rent_tax_tramo4_rate: number;
  rent_tax_tramo5_rate: number;
}

/**
 * DTO para actualizar parámetros existentes
 */
export interface UpdateTaxParameterDto extends Partial<CreateTaxParameterDto> {}

/**
 * DTO para copiar parámetros de un año a otro
 */
export interface CopyYearDto {
  from_year: number;
  to_year: number;
}

/**
 * DTO para calcular asignación familiar
 */
export interface CalculateFamilyAllowanceDto {
  minimum_wage: number;
}

/**
 * Respuesta de cálculo de asignación familiar
 */
export interface FamilyAllowanceResponse {
  minimum_wage: number;
  family_allowance: number;
}

/**
 * Respuesta estándar de la API
 */
export interface TaxParameterApiResponse {
  success: boolean;
  data: TaxParameter | TaxParameter[];
  message?: string;
}
