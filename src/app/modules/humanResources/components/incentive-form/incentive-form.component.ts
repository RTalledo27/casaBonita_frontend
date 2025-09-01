import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IncentiveService } from '../../services/incentive.service';
import { EmployeeService } from '../../services/employee.service';
import { Incentive } from '../../models/incentive';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-incentive-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incentive-form.component.html',
  styleUrls: ['./incentive-form.component.scss']
})
export class IncentiveFormComponent implements OnInit {
  incentiveForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  incentiveId: number | null = null;
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  constructor(
    private fb: FormBuilder,
    private incentiveService: IncentiveService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.incentiveForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkEditMode();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      employee_id: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      deadline: [''],
      status: ['activo', [Validators.required]],
      notes: ['', [Validators.maxLength(1000)]]
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Load employees
      const employeesResponse = await this.employeeService.getAllEmployees().toPromise();
      this.employees = employeesResponse?.data || [];
      this.filteredEmployees = this.employees.filter(emp => emp.status === 'active');

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.error = 'Error al cargar los datos iniciales';
    } finally {
      this.isLoading = false;
    }
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.incentiveId = parseInt(id, 10);
      this.isEditMode = true;
      this.loadIncentive();
    }
  }

  private async loadIncentive(): Promise<void> {
    if (!this.incentiveId) return;

    try {
      this.isLoading = true;
      this.error = null;

      const incentive = await this.incentiveService.getById(this.incentiveId).toPromise();
      if (incentive) {
        this.populateForm(incentive);
      }
    } catch (error) {
      console.error('Error loading incentive:', error);
      this.error = 'Error al cargar el incentivo';
    } finally {
      this.isLoading = false;
    }
  }

  private populateForm(incentive: Incentive): void {
    this.incentiveForm.patchValue({
      employee_id: incentive.employee_id,
      description: incentive.description,
      amount: incentive.amount,
      deadline: incentive.deadline,
      status: incentive.status,
      notes: incentive.notes || ''
    });
  }

  async onSubmit(): Promise<void> {
    if (this.incentiveForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isSaving = true;
      this.error = null;

      const formData = this.incentiveForm.value;
      let response;

      if (this.isEditMode && this.incentiveId) {
        response = await this.incentiveService.update(this.incentiveId, formData).toPromise();
      } else {
        response = await this.incentiveService.create(formData).toPromise();
      }

      if ((response as any)?.success) {
        this.router.navigate(['/hr/incentives']);
      } else {
        this.error = (response as any)?.message || 'Error al guardar el incentivo';
      }
    } catch (error) {
      console.error('Error saving incentive:', error);
      this.error = 'Error al guardar el incentivo';
    } finally {
      this.isSaving = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/hr/incentives']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.incentiveForm.controls).forEach(key => {
      const control = this.incentiveForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.incentiveForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.incentiveForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return 'El monto debe ser mayor a 0';
      }
    }
    return '';
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(emp => emp.employee_id === employeeId);
    if (employee?.user) {
      return `${employee.user.first_name} ${employee.user.last_name}`;
    }
    return '';
  }

  get statusOptions() {
    return [
      { value: 'activo', label: 'Activo' },
      { value: 'completado', label: 'Completado' },
      { value: 'pagado', label: 'Pagado' },
      { value: 'cancelado', label: 'Cancelado' }
    ];
  }
}
