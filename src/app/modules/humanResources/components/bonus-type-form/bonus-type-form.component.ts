import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Save, ArrowLeft, Settings, Users, Calendar, FileText, Hash, Calculator, Clock, ChevronDown, AlertCircle, Zap, Shield, ToggleRight, User } from 'lucide-angular';
import { BonusTypeService } from '../../services/bonus-type.service';
import { BonusType } from '../../models/bonus-type';

@Component({
  selector: 'app-bonus-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './bonus-type-form.component.html',
  styleUrl: './bonus-type-form.component.scss'
})
export class BonusTypeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bonusTypeService = inject(BonusTypeService);

  // Icons
  readonly Save = Save;
  readonly ArrowLeft = ArrowLeft;
  readonly Settings = Settings;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly Hash = Hash;
  readonly Calculator = Calculator;
  readonly Clock = Clock;
  readonly ChevronDown = ChevronDown;
  readonly AlertCircle = AlertCircle;
  readonly Zap = Zap;
  readonly Shield = Shield;
  readonly ToggleRight = ToggleRight;
  readonly User = User;

  // Signals
  bonusType = signal<BonusType | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);

  // Form
  bonusTypeForm: FormGroup;

  // Options
  calculationMethods = [
    { value: 'percentage_of_goal', label: 'Porcentaje de Meta' },
    { value: 'fixed_amount', label: 'Monto Fijo' },
    { value: 'sales_count', label: 'Cantidad de Ventas' },
    { value: 'collection_amount', label: 'Monto de Cobranza' },
    { value: 'attendance_rate', label: 'Tasa de Asistencia' },
    { value: 'custom', label: 'Personalizado' }
  ];

  frequencies = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'annual', label: 'Anual' },
    { value: 'one_time', label: 'Una vez' }
  ];

  employeeTypes = [
    { value: 'asesor_inmobiliario', label: 'Asesor Inmobiliario' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  constructor() {
    this.bonusTypeForm = this.fb.group({
      type_code: ['', [Validators.required, Validators.maxLength(20)]],
      type_name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      calculation_method: ['', Validators.required],
      is_automatic: [false],
      requires_approval: [false],
      applicable_employee_types: [[]],
      frequency: ['', Validators.required],
      is_active: [true]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.loadBonusType(parseInt(id));
    }
  }

  loadBonusType(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.bonusTypeService.getBonusType(id).subscribe({
      next: (bonusType) => {
        this.bonusType.set(bonusType);
        this.bonusTypeForm.patchValue(bonusType);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el tipo de bono');
        this.loading.set(false);
        console.error('Error loading bonus type:', err);
      }
    });
  }

  onSubmit() {
    if (this.bonusTypeForm.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formData = this.bonusTypeForm.value;

      const request = this.isEditMode() 
        ? this.bonusTypeService.updateBonusType(this.bonusType()!.bonus_type_id, formData)
        : this.bonusTypeService.createBonusType(formData);

      request.subscribe({
        next: () => {
          this.router.navigate(['/hr/bonus-types']);
        },
        error: (err) => {
          this.error.set('Error al guardar el tipo de bono');
          this.saving.set(false);
          console.error('Error saving bonus type:', err);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/hr/bonus-types']);
  }

  onEmployeeTypeChange(employeeType: string, checked: boolean) {
    const currentTypes = this.bonusTypeForm.get('applicable_employee_types')?.value || [];
    
    if (checked) {
      if (!currentTypes.includes(employeeType)) {
        this.bonusTypeForm.patchValue({
          applicable_employee_types: [...currentTypes, employeeType]
        });
      }
    } else {
      this.bonusTypeForm.patchValue({
        applicable_employee_types: currentTypes.filter((type: string) => type !== employeeType)
      });
    }
  }

  isEmployeeTypeSelected(employeeType: string): boolean {
    const selectedTypes = this.bonusTypeForm.get('applicable_employee_types')?.value || [];
    return selectedTypes.includes(employeeType);
  }

  private markFormGroupTouched() {
    Object.keys(this.bonusTypeForm.controls).forEach(key => {
      const control = this.bonusTypeForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bonusTypeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.bonusTypeForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['maxlength']) return `${fieldName} es demasiado largo`;
    }
    return '';
  }
}
