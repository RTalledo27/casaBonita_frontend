import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Save, ArrowLeft, Calculator, User, Calendar, DollarSign } from 'lucide-angular';

import { CommissionService } from '../../services/commission.service';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Commission, CreateCommissionRequest, UpdateCommissionRequest } from '../../models/commission';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-commission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './commission-form.component.html',
  styleUrls: ['./commission-form.component.scss']
})
export class CommissionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private commissionService = inject(CommissionService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  // Icons
  Save = Save;
  ArrowLeft = ArrowLeft;
  Calculator = Calculator;
  User = User;
  Calendar = Calendar;
  DollarSign = DollarSign;

  // Signals
  loading = signal(false);
  employees = signal<Employee[]>([]);
  isEditMode = signal(false);
  commissionId = signal<number | null>(null);

  commissionForm: FormGroup;

  // Options
  monthOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  statusOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  commissionTypeOptions = [
    { value: 'venta', label: 'Venta' },
    { value: 'referido', label: 'Referido' },
    { value: 'meta', label: 'Meta' },
    { value: 'especial', label: 'Especial' }
  ];

  constructor() {
    this.commissionForm = this.fb.group({
      employee_id: ['', [Validators.required]],
      contract_id: [''],
      commission_type: ['venta', [Validators.required]],
      sale_amount: ['', [Validators.min(0)]],
      installment_plan: ['', [Validators.min(1)]],
      commission_percentage: ['', [Validators.min(0), Validators.max(100)]],
      commission_amount: ['', [Validators.required, Validators.min(0)]],
      payment_status: ['pendiente', [Validators.required]],
      payment_date: [''],
      period_month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      period_year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.checkEditMode();
    this.setupFormCalculations();
  }

  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.commissionId.set(+id);
      this.loadCommission(+id);
    }
  }

  private loadEmployees() {
    this.employeeService.getAllEmployees().subscribe({
      next: (response) => {
        if (response.success) {
          this.employees.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('Error al cargar empleados');
      }
    });
  }

  private loadCommission(id: number) {
    this.loading.set(true);
    this.commissionService.getCommission(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading commission:', error);
        this.toastService.error('Error al cargar la comisión');
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  private populateForm(commission: Commission) {
    this.commissionForm.patchValue({
      employee_id: commission.employee_id,
      contract_id: commission.contract_id,
      commission_type: commission.commission_type || 'venta',
      sale_amount: commission.sale_amount,
      installment_plan: commission.installment_plan,
      commission_percentage: commission.commission_percentage,
      commission_amount: commission.commission_amount,
      payment_status: commission.payment_status,
      payment_date: commission.payment_date ? commission.payment_date.split('T')[0] : '',
      period_month: commission.period_month,
      period_year: commission.period_year,
      notes: commission.notes
    });
  }

  private setupFormCalculations() {
    // Auto-calculate commission amount when sale amount and percentage change
    this.commissionForm.get('sale_amount')?.valueChanges.subscribe(() => {
      this.calculateCommissionAmount();
    });

    this.commissionForm.get('commission_percentage')?.valueChanges.subscribe(() => {
      this.calculateCommissionAmount();
    });
  }

  private calculateCommissionAmount() {
    const saleAmount = this.commissionForm.get('sale_amount')?.value;
    const percentage = this.commissionForm.get('commission_percentage')?.value;

    if (saleAmount && percentage) {
      const commissionAmount = (saleAmount * percentage) / 100;
      this.commissionForm.get('commission_amount')?.setValue(commissionAmount, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.commissionForm.valid) {
      this.loading.set(true);
      const formData = this.commissionForm.value;

      if (this.isEditMode()) {
        this.updateCommission(formData);
      } else {
        this.createCommission(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.toastService.error('Por favor, complete todos los campos requeridos');
    }
  }

  private createCommission(data: CreateCommissionRequest) {
    this.commissionService.createCommission(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Comisión creada exitosamente');
          this.router.navigate(['/human-resources/commissions']);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating commission:', error);
        this.toastService.error('Error al crear la comisión');
        this.loading.set(false);
      }
    });
  }

  private updateCommission(data: UpdateCommissionRequest) {
    const id = this.commissionId();
    if (id) {
      data.commission_id = id;
      this.commissionService.updateCommission(id, data).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Comisión actualizada exitosamente');
            this.router.navigate(['/human-resources/commissions']);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating commission:', error);
          this.toastService.error('Error al actualizar la comisión');
          this.loading.set(false);
        }
      });
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.commissionForm.controls).forEach(key => {
      const control = this.commissionForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack() {
    this.router.navigate(['/human-resources/commissions']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.commissionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.commissionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }
}