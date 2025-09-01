import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Save, ArrowLeft, User, Mail, Phone, Calendar, DollarSign, Building, Users } from 'lucide-angular';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';
import { User as UserModel } from '../../../Secutiry/users/models/user';
import { Team } from '../../models/team';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  employeeId = signal<number | null>(null);
  users = signal<UserModel[]>([]);
  teams = signal<Team[]>([]);

  // Iconos de Lucide
  Save = Save;
  ArrowLeft = ArrowLeft;
  User = User;
  Mail = Mail;
  Phone = Phone;
  Calendar = Calendar;
  DollarSign = DollarSign;
  Building = Building;
  Users = Users;

  // Formulario reactivo
  employeeForm: FormGroup;

  // Opciones para selects
  employeeTypes = [
    { value: 'asesor_inmobiliario', label: 'Asesor Inmobiliario' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  employmentStatuses = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' }
  ];

  constructor() {
    this.employeeForm = this.fb.group({
      user_id: ['', [Validators.required]],
      employee_code: ['', [Validators.required, Validators.minLength(3)]],
      employee_type: ['', [Validators.required]],
      employment_status: ['activo', [Validators.required]],
      hire_date: ['', [Validators.required]],
      base_salary: ['', [Validators.required, Validators.min(0)]],
      commission_percentage: [0, [Validators.min(0), Validators.max(100)]],
      team_id: [''],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      emergency_contact_relationship: [''],
      bank_account: [''],
      bank_name: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadInitialData();
    this.checkEditMode();
  }

  private async loadInitialData() {
    this.loading.set(true);
    try {
      // Cargar usuarios y equipos en paralelo
      const [users, teams] = await Promise.all([
        this.employeeService.getUsers().toPromise(),
        this.employeeService.getTeams().toPromise()
      ]);

      this.users.set(users || []);
      this.teams.set(teams || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.error.set('Error al cargar los datos iniciales');
    } finally {
      this.loading.set(false);
    }
  }

  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(parseInt(id));
      this.loadEmployee(parseInt(id));
    }
  }

  private async loadEmployee(id: number) {
    this.loading.set(true);
    try {
      const employee = await this.employeeService.getEmployee(id).toPromise();
      if (employee) {
        this.populateForm(employee);
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      this.error.set('Error al cargar el empleado');
      this.toastService.error('Error al cargar el empleado');
    } finally {
      this.loading.set(false);
    }
  }

  private populateForm(employee: Employee) {
    this.employeeForm.patchValue({
      user_id: employee.user_id,
      employee_code: employee.employee_code,
      employee_type: employee.employee_type,
      employment_status: employee.employment_status,
      hire_date: employee.hire_date,
      base_salary: employee.base_salary,
      commission_percentage: employee.commission_percentage || 0,
      team_id: employee.team_id || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      emergency_contact_relationship: employee.emergency_contact_relationship || '',
      bank_account: employee.bank_account || '',
      bank_name: employee.bank_name || '',
      notes: employee.notes || ''
    });
  }

  async onSubmit() {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const formData = this.employeeForm.value;
      
      // Convertir valores vacíos a null para campos opcionales
      Object.keys(formData).forEach(key => {
        if (formData[key] === '') {
          formData[key] = null;
        }
      });

      if (this.isEditMode()) {
        await this.employeeService.updateEmployee(this.employeeId()!, formData).toPromise();
        this.toastService.success('Empleado actualizado exitosamente');
      } else {
        await this.employeeService.createEmployee(formData).toPromise();
        this.toastService.success('Empleado creado exitosamente');
      }

      this.router.navigate(['/hr/employees']);
    } catch (error: any) {
      console.error('Error saving employee:', error);
      this.error.set(error.error?.message || 'Error al guardar el empleado');
      this.toastService.error('Error al guardar el empleado');
    } finally {
      this.saving.set(false);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['/hr/employees']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `El valor máximo es ${field.errors['max'].max}`;
      }
      if (field.errors['email']) {
        return 'Formato de email inválido';
      }
    }
    return '';
  }

  // Filtrar usuarios que no son empleados (opcional)
  getAvailableUsers() {
    return this.users().filter(user => 
      // Aquí podrías filtrar usuarios que ya son empleados si es necesario
      true
    );
  }

  onUserChange() {
    const userId = this.employeeForm.get('user_id')?.value;
    if (userId) {
      const selectedUser = this.users().find(user => user.id === Number(userId));
      if (selectedUser && !this.employeeForm.get('employee_code')?.value) {
        // Auto-generar código de empleado basado en el usuario
        const code = `EMP${selectedUser.id.toString().padStart(4, '0')}`;
        this.employeeForm.patchValue({ employee_code: code });
      }
    }
  }
}