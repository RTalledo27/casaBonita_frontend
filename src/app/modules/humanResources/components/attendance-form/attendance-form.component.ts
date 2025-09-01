import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee.service';
import { Attendance } from '../../models/attendance';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './attendance-form.component.html',
  styleUrls: ['./attendance-form.component.scss']
})
export class AttendanceFormComponent implements OnInit {
  attendanceForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  attendanceId: number | null = null;
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.attendanceForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkEditMode();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      employee_id: ['', [Validators.required]],
      attendance_date: ['', [Validators.required]],
      check_in_time: [''],
      check_out_time: [''],
      break_start_time: [''],
      break_end_time: [''],
      status: ['present', [Validators.required]],
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
      this.filteredEmployees = this.employees.filter(emp => emp.employment_status === 'activo');

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
      this.attendanceId = parseInt(id, 10);
      this.isEditMode = true;
      this.loadAttendance();
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      this.attendanceForm.patchValue({ attendance_date: today });
    }
  }

  private async loadAttendance(): Promise<void> {
    if (!this.attendanceId) return;

    try {
      this.isLoading = true;
      this.error = null;

      const attendance = await this.attendanceService.getAttendanceById(this.attendanceId).toPromise();
      if (attendance) {
        this.populateForm(attendance);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      this.error = 'Error al cargar el registro de asistencia';
    } finally {
      this.isLoading = false;
    }
  }

  private populateForm(attendance: Attendance): void {
    this.attendanceForm.patchValue({
      employee_id: attendance.employee_id,
      attendance_date: attendance.attendance_date,
      check_in_time: attendance.check_in_time || '',
      check_out_time: attendance.check_out_time || '',
      break_start_time: attendance.break_start_time || '',
      break_end_time: attendance.break_end_time || '',
      status: attendance.status,
      notes: attendance.notes || ''
    });
  }

  async onSubmit(): Promise<void> {
    if (this.attendanceForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Validate time logic
    if (!this.validateTimes()) {
      return;
    }

    try {
      this.isSaving = true;
      this.error = null;

      const formData = this.prepareFormData();
      let result;

      if (this.isEditMode && this.attendanceId) {
        result = await this.attendanceService.updateAttendance(this.attendanceId, formData).toPromise();
      } else {
        result = await this.attendanceService.createAttendance(formData).toPromise();
      }

      if (result) {
        this.router.navigate(['/hr/attendance']);
      } else {
        this.error = 'Error al guardar el registro de asistencia';
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      this.error = 'Error al guardar el registro de asistencia';
    } finally {
      this.isSaving = false;
    }
  }

  private prepareFormData(): any {
    const formData = { ...this.attendanceForm.value };
    
    // Remove empty time fields
    Object.keys(formData).forEach(key => {
      if (key.includes('time') && formData[key] === '') {
        formData[key] = null;
      }
    });

    return formData;
  }

  private validateTimes(): boolean {
    const formValue = this.attendanceForm.value;
    
    // Check if check-out is after check-in
    if (formValue.check_in_time && formValue.check_out_time) {
      if (formValue.check_out_time <= formValue.check_in_time) {
        this.error = 'La hora de salida debe ser posterior a la hora de entrada';
        return false;
      }
    }

    // Check if break times are within work hours
    if (formValue.break_start_time && formValue.check_in_time) {
      if (formValue.break_start_time < formValue.check_in_time) {
        this.error = 'El inicio del descanso debe ser posterior a la hora de entrada';
        return false;
      }
    }

    if (formValue.break_end_time && formValue.check_out_time) {
      if (formValue.break_end_time > formValue.check_out_time) {
        this.error = 'El fin del descanso debe ser anterior a la hora de salida';
        return false;
      }
    }

    // Check if break end is after break start
    if (formValue.break_start_time && formValue.break_end_time) {
      if (formValue.break_end_time <= formValue.break_start_time) {
        this.error = 'El fin del descanso debe ser posterior al inicio del descanso';
        return false;
      }
    }

    return true;
  }

  onCancel(): void {
    this.router.navigate(['/hr/attendance']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.attendanceForm.controls).forEach(key => {
      const control = this.attendanceForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.attendanceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.attendanceForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(emp => emp.employee_id === employeeId);
    return employee ? `${employee.user?.first_name} ${employee.user?.last_name}` : '';
  }

  get statusOptions() {
    return [
      { value: 'present', label: 'Presente' },
      { value: 'absent', label: 'Ausente' },
      { value: 'late', label: 'Tardanza' },
      { value: 'early_departure', label: 'Salida Temprana' },
      { value: 'on_break', label: 'En Descanso' },
      { value: 'approved', label: 'Aprobado' },
      { value: 'pending', label: 'Pendiente' }
    ];
  }

  // Quick action methods
  setCurrentTimeAsCheckIn(): void {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    this.attendanceForm.patchValue({ check_in_time: timeString });
  }

  setCurrentTimeAsCheckOut(): void {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    this.attendanceForm.patchValue({ check_out_time: timeString });
  }

  setCurrentTimeAsBreakStart(): void {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    this.attendanceForm.patchValue({ break_start_time: timeString });
  }

  setCurrentTimeAsBreakEnd(): void {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    this.attendanceForm.patchValue({ break_end_time: timeString });
  }
}
