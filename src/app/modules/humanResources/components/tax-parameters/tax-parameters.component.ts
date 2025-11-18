import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxParameterService } from '../../services/tax-parameter.service';
import { TaxParameter } from '../../models/tax-parameter';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, Save, Copy, Calculator, Calendar, TrendingUp, Percent, DollarSign, AlertCircle, CheckCircle, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-tax-parameters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './tax-parameters.component.html',
  styleUrls: ['./tax-parameters.component.scss']
})
export class TaxParametersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taxParameterService = inject(TaxParameterService);
  private toastService = inject(ToastService);

  // Señales para el estado
  form!: FormGroup;
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  availableYears = signal<number[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());
  currentParameters = signal<TaxParameter | null>(null);
  isNewYear = signal<boolean>(false);

  // Iconos
  Save = Save;
  Copy = Copy;
  Calculator = Calculator;
  Calendar = Calendar;
  TrendingUp = TrendingUp;
  Percent = Percent;
  DollarSign = DollarSign;
  AlertCircle = AlertCircle;
  CheckCircle = CheckCircle;
  RefreshCw = RefreshCw;

  // Math para template
  Math = Math;

  // Signals para validar el formulario
  isFormValid = signal<boolean>(false);
  hasChanges = signal<boolean>(false);

  ngOnInit() {
    this.createForm();
    this.loadAvailableYears();
    this.loadCurrentYear();
  }

  /**
   * Crear formulario reactivo
   */
  createForm() {
    this.form = this.fb.group({
      year: [this.selectedYear(), [Validators.required, Validators.min(2000)]],
      
      // Valores base
      uit_amount: [5350.00, [Validators.required, Validators.min(0)]],
      family_allowance: [113.00, [Validators.required, Validators.min(0)]],
      minimum_wage: [1130.00, [Validators.required, Validators.min(0)]],
      
      // AFP
      afp_contribution_rate: [10.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      afp_insurance_rate: [0.99, [Validators.required, Validators.min(0), Validators.max(100)]],
      afp_prima_commission: [1.47, [Validators.required, Validators.min(0), Validators.max(100)]],
      afp_integra_commission: [1.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      afp_profuturo_commission: [1.20, [Validators.required, Validators.min(0), Validators.max(100)]],
      afp_habitat_commission: [1.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      
      // ONP y EsSalud
      onp_rate: [13.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      essalud_rate: [9.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      
      // Impuesto a la Renta
      rent_tax_deduction_uit: [7.00, [Validators.required, Validators.min(0)]],
      rent_tax_tramo1_uit: [5.00, [Validators.required, Validators.min(0)]],
      rent_tax_tramo1_rate: [8.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      rent_tax_tramo2_uit: [20.00, [Validators.required, Validators.min(0)]],
      rent_tax_tramo2_rate: [14.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      rent_tax_tramo3_uit: [35.00, [Validators.required, Validators.min(0)]],
      rent_tax_tramo3_rate: [17.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      rent_tax_tramo4_uit: [45.00, [Validators.required, Validators.min(0)]],
      rent_tax_tramo4_rate: [20.00, [Validators.required, Validators.min(0), Validators.max(100)]],
      rent_tax_tramo5_rate: [30.00, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    // Suscribirse a cambios en RMV para calcular asignación familiar
    this.form.get('minimum_wage')?.valueChanges.subscribe(rmv => {
      if (rmv && rmv > 0) {
        const familyAllowance = rmv * 0.10;
        this.form.patchValue({ family_allowance: parseFloat(familyAllowance.toFixed(2)) }, { emitEvent: false });
      }
    });

    // Listener para detectar cambios en el formulario
    this.form.valueChanges.subscribe(() => {
      this.hasChanges.set(this.form.dirty);
      this.isFormValid.set(this.form.valid);
    });

    // Listener para cambios en el estado del formulario
    this.form.statusChanges.subscribe(() => {
      this.isFormValid.set(this.form.valid);
    });
  }

  /**
   * Cargar años disponibles
   */
  loadAvailableYears() {
    this.taxParameterService.getAvailableYears().subscribe({
      next: (years) => {
        this.availableYears.set(years);
        
        // Si no hay años, agregar el actual
        if (years.length === 0) {
          const currentYear = new Date().getFullYear();
          this.availableYears.set([currentYear]);
        }
      },
      error: (err) => {
        console.error('Error cargando años:', err);
        const currentYear = new Date().getFullYear();
        this.availableYears.set([currentYear]);
      }
    });
  }

  /**
   * Cargar parámetros del año actual
   */
  loadCurrentYear() {
    this.loading.set(true);
    const year = this.selectedYear();

    this.taxParameterService.getByYear(year).subscribe({
      next: (response) => {
        if (response.success && !Array.isArray(response.data)) {
          this.currentParameters.set(response.data);
          this.form.patchValue(response.data);
          this.isNewYear.set(false);
          this.form.markAsPristine();
          this.hasChanges.set(false);
          this.isFormValid.set(this.form.valid);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando parámetros:', err);
        this.isNewYear.set(true);
        this.toastService.info(`No existen parámetros para ${year}. Puedes crearlos o copiarlos desde otro año.`);
        this.loading.set(false);
      }
    });
  }

  /**
   * Cambiar año seleccionado
   */
  changeYear(year: number) {
    if (this.hasChanges()) {
      const confirm = window.confirm('Tienes cambios sin guardar. ¿Deseas continuar?');
      if (!confirm) return;
    }

    this.selectedYear.set(year);
    this.form.patchValue({ year });
    this.loadCurrentYear();
  }

  /**
   * Guardar cambios
   */
  save() {
    if (!this.form.valid) {
      this.toastService.error('Por favor completa todos los campos correctamente');
      return;
    }

    this.saving.set(true);
    const year = this.selectedYear();
    const data = this.form.value;

    const request = this.isNewYear() 
      ? this.taxParameterService.create(data)
      : this.taxParameterService.update(year, data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Parámetros guardados exitosamente');
          this.form.markAsPristine();
          this.hasChanges.set(false);
          this.isNewYear.set(false);
          
          // Recargar años disponibles si es nuevo
          if (this.isNewYear()) {
            this.loadAvailableYears();
          }
        }
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error guardando parámetros:', err);
        this.toastService.error('Error al guardar los parámetros');
        this.saving.set(false);
      }
    });
  }

  /**
   * Copiar desde año anterior
   */
  copyFromPreviousYear() {
    const currentYear = this.selectedYear();
    const previousYear = currentYear - 1;

    const confirm = window.confirm(`¿Deseas copiar los parámetros de ${previousYear} a ${currentYear}?`);
    if (!confirm) return;

    this.loading.set(true);

    this.taxParameterService.copyYear(previousYear, currentYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`Parámetros copiados de ${previousYear} exitosamente`);
          this.loadCurrentYear();
          this.loadAvailableYears();
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error copiando parámetros:', err);
        this.toastService.error(`Error al copiar parámetros de ${previousYear}`);
        this.loading.set(false);
      }
    });
  }

  /**
   * Crear nuevo año
   */
  createNewYear() {
    const currentYear = new Date().getFullYear();
    const nextYear = Math.max(...this.availableYears(), currentYear) + 1;

    this.selectedYear.set(nextYear);
    this.form.patchValue({ year: nextYear });
    this.isNewYear.set(true);
    this.form.markAsDirty();
  }

  /**
   * Calcular asignación familiar (10% RMV)
   */
  calculateFamilyAllowance() {
    const rmv = this.form.get('minimum_wage')?.value;
    if (rmv && rmv > 0) {
      const familyAllowance = rmv * 0.10;
      this.form.patchValue({ family_allowance: parseFloat(familyAllowance.toFixed(2)) });
      this.toastService.success(`Asignación familiar calculada: S/ ${familyAllowance.toFixed(2)}`);
    }
  }

  /**
   * Resetear formulario
   */
  resetForm() {
    if (!this.hasChanges()) return;

    const confirm = window.confirm('¿Deseas descartar los cambios?');
    if (!confirm) return;

    if (this.currentParameters()) {
      this.form.patchValue(this.currentParameters()!);
    } else {
      this.form.reset();
    }
    this.form.markAsPristine();
    this.hasChanges.set(false);
  }

  /**
   * Obtener clase de badge según el estado
   */
  getYearBadgeClass(year: number): string {
    const current = new Date().getFullYear();
    if (year === current) return 'badge-current';
    if (year > current) return 'badge-future';
    return 'badge-past';
  }

  /**
   * Obtener texto de badge según el estado
   */
  getYearBadgeText(year: number): string {
    const current = new Date().getFullYear();
    if (year === current) return 'Actual';
    if (year > current) return 'Futuro';
    return 'Histórico';
  }
}
