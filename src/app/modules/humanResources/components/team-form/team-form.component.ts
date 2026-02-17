import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Save, ArrowLeft, Crown, Users, Hash, FileText, Target, Building2 } from 'lucide-angular';
import { TeamService } from '../../services/team.service';
import { EmployeeService } from '../../services/employee.service';
import { OfficeService } from '../../services/office.service';
import { Team } from '../../models/team';
import { Employee } from '../../models/employee';
import { Office } from '../../models/office';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss'
})
export class TeamFormComponent implements OnInit {
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private officeService = inject(OfficeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  readonly Save = Save;
  readonly ArrowLeft = ArrowLeft;
  readonly Crown = Crown;
  readonly Users = Users;
  readonly Hash = Hash;
  readonly FileText = FileText;
  readonly Target = Target;
  readonly Building2 = Building2;

  // Signals
  team = signal<Team | null>(null);
  employees = signal<Employee[]>([]);
  offices = signal<Office[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);

  // Form
  teamForm: FormGroup;

  constructor() {
    this.teamForm = this.fb.group({
      team_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      team_code: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(1000)]],
      monthly_goal: [null, [Validators.min(0)]],
      office_id: [null],
      team_leader_id: [null],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadOffices();
    
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.isEditMode.set(true);
      this.loadTeam(+teamId);
    }
  }

  loadEmployees() {
    this.employeeService.getAllEmployees({ employment_status: 'activo' }).subscribe({
      next: (response) => {
        const safeData = Array.isArray(response.data) ? response.data : [];
        const activeEmployees = safeData.filter(emp => emp.employment_status === 'activo');
        this.employees.set(activeEmployees);
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.error.set('Error al cargar la lista de empleados');
      }
    });
  }

  loadOffices() {
    this.officeService.getOffices().subscribe({
      next: (response) => {
        const safeData = Array.isArray(response.data) ? response.data : [];
        this.offices.set(safeData.filter(o => o.is_active));
      },
      error: (err) => {
        console.error('Error loading offices:', err);
      }
    });
  }

  loadTeam(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.teamService.getTeam(id).subscribe({
      next: (response) => {
        this.team.set(response.data);
        this.populateForm(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el equipo');
        this.loading.set(false);
        console.error('Error loading team:', err);
      }
    });
  }

  populateForm(team: Team) {
    this.teamForm.patchValue({
      team_name: team.team_name,
      team_code: team.team_code,
      description: team.description,
      monthly_goal: team.monthly_goal,
      office_id: team.office_id,
      team_leader_id: team.team_leader_id,
      status: team.status
    });
  }

  onSubmit() {
    if (this.teamForm.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formData = this.teamForm.value;
      
      // Convert empty strings to null for optional fields
      if (formData.team_leader_id === '') {
        formData.team_leader_id = null;
      }
      if (formData.monthly_goal === '') {
        formData.monthly_goal = null;
      }
      if (formData.office_id === '' || formData.office_id === null) {
        formData.office_id = null;
      }

      const operation = this.isEditMode() 
        ? this.teamService.updateTeam(this.team()!.team_id, formData)
        : this.teamService.createTeam(formData);

      operation.subscribe({
        next: (response) => {
          this.saving.set(false);
          this.router.navigate(['/hr/teams']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.isEditMode() ? 'Error al actualizar el equipo' : 'Error al crear el equipo');
          console.error('Error saving team:', err);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.teamForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/hr/teams']);
  }

  getEmployeeName(employee: Employee): string {
    // Priorizar el nombre completo si está disponible
    if (employee.full_name) {
      return `${employee.full_name} - ${employee.employee_type}`;
    }
    
    // Si hay información del usuario, usarla
    if (employee.user && employee.user.first_name && employee.user.last_name) {
      return `${employee.user.first_name} ${employee.user.last_name} - ${employee.employee_type}`;
    }
    
    // Si hay first_name y last_name directamente en employee
    if (employee.first_name && employee.last_name) {
      return `${employee.first_name} ${employee.last_name} - ${employee.employee_type}`;
    }
    
    // Fallback con código de empleado
    return `${employee.employee_code} - ${employee.employee_type}`;
  }
}