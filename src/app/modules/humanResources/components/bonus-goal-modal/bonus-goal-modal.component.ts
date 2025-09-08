import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target, X, Search, Check } from 'lucide-angular';
import { BonusGoal } from '../../models/bonus-goal';
import { Employee } from '../../models/employee';
import { BonusGoalService } from '../../services/bonus-goal.service';
import { EmployeeService, EmployeeResponse } from '../../services/employee.service';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

export interface BonusGoalCreationData {
  name: string;
  description?: string;
  goal_type: string;
  target_value: number;
  bonus_amount: number;
  min_achievement_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
  employee_ids: number[];
}

@Component({
  selector: 'app-bonus-goal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './bonus-goal-modal.component.html',
  styleUrls: ['./bonus-goal-modal.component.scss']
})
export class BonusGoalModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() goalCreated = new EventEmitter<BonusGoal>();

  // Lucide Icons
  Target = Target;
  X = X;
  Search = Search;
  Check = Check;

  bonusGoalForm!: FormGroup;
  
  // Signals para el estado reactivo
  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  selectedEmployees = signal<Employee[]>([]);
  
  // Estados de carga
  loadingEmployees = signal(false);
  creatingGoal = signal(false);
  
  // Estados de UI
  employeeSearchTerm = '';

  constructor(
    private fb: FormBuilder,
    private bonusGoalService: BonusGoalService,
    private employeeService: EmployeeService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadEmployees();
  }

  private initializeForm() {
    this.bonusGoalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      goal_type: ['', Validators.required],
      target_value: [0, [Validators.required, Validators.min(0.01)]],
      bonus_amount: [0, [Validators.required, Validators.min(0.01)]],
      min_achievement_percentage: [80, [Validators.required, Validators.min(1), Validators.max(100)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      status: ['active', Validators.required]
    });

    // Validación personalizada para fechas
    this.bonusGoalForm.get('end_date')?.valueChanges.subscribe(() => {
      this.validateDates();
    });
    
    this.bonusGoalForm.get('start_date')?.valueChanges.subscribe(() => {
      this.validateDates();
    });
  }

  private validateDates() {
    const startDate = this.bonusGoalForm.get('start_date')?.value;
    const endDate = this.bonusGoalForm.get('end_date')?.value;
    
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      this.bonusGoalForm.get('end_date')?.setErrors({ 'dateInvalid': true });
    } else {
      const endDateControl = this.bonusGoalForm.get('end_date');
      if (endDateControl?.errors?.['dateInvalid']) {
        delete endDateControl.errors['dateInvalid'];
        if (Object.keys(endDateControl.errors).length === 0) {
          endDateControl.setErrors(null);
        }
      }
    }
  }

  private loadEmployees() {
    this.loadingEmployees.set(true);
    
    this.employeeService.getEmployees().subscribe({
      next: (response: EmployeeResponse) => {
        this.employees.set(response.data);
        this.filteredEmployees.set(response.data);
        this.loadingEmployees.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.loadingEmployees.set(false);
      }
    });
  }

  searchEmployees(event: any) {
    const term = event.target.value.toLowerCase();
    this.employeeSearchTerm = term;
    
    if (!term.trim()) {
      this.filteredEmployees.set(this.employees());
      return;
    }

    const filtered = this.employees().filter(employee => 
      employee.full_name.toLowerCase().includes(term) ||
      (employee.email && employee.email.toLowerCase().includes(term))
    );
    
    this.filteredEmployees.set(filtered);
  }

  toggleEmployeeSelection(employee: Employee) {
    const currentSelected = this.selectedEmployees();
    const isSelected = currentSelected.some(emp => emp.employee_id === employee.employee_id);
    
    if (isSelected) {
      this.selectedEmployees.set(currentSelected.filter(emp => emp.employee_id !== employee.employee_id));
    } else {
      this.selectedEmployees.set([...currentSelected, employee]);
    }
  }

  isEmployeeSelected(employee: Employee): boolean {
    return this.selectedEmployees().some(emp => emp.employee_id === employee.employee_id);
  }

  removeEmployee(employee: Employee) {
    const currentSelected = this.selectedEmployees();
    this.selectedEmployees.set(currentSelected.filter(emp => emp.employee_id !== employee.employee_id));
  }

  onEmployeeSearch(event: any) {
    this.searchEmployees(event);
  }

  onSubmit() {
    if (!this.isFormValid) {
      this.markFormGroupTouched();
      return;
    }

    if (this.selectedEmployees().length === 0) {
      alert('Debe seleccionar al menos un empleado para la meta.');
      return;
    }

    this.creatingGoal.set(true);
    
    const formData = this.bonusGoalForm.value;
    const goalData: BonusGoalCreationData = {
      ...formData,
      employee_ids: this.selectedEmployees().map(emp => emp.employee_id)
    };

    this.bonusGoalService.createBonusGoal(goalData).subscribe({
      next: (createdGoal) => {
        this.goalCreated.emit(createdGoal);
        this.onClose();
        this.creatingGoal.set(false);
      },
      error: (error) => {
        console.error('Error creating bonus goal:', error);
        alert('Error al crear la meta de bonos. Por favor, intente nuevamente.');
        this.creatingGoal.set(false);
      }
    });
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }

  private resetForm() {
    this.bonusGoalForm.reset({
      name: '',
      description: '',
      goal_type: '',
      target_value: 0,
      bonus_amount: 0,
      min_achievement_percentage: 80,
      start_date: '',
      end_date: '',
      status: 'active'
    });
    
    this.selectedEmployees.set([]);
    this.employeeSearchTerm = '';
    this.filteredEmployees.set(this.employees());
  }

  private markFormGroupTouched() {
    Object.keys(this.bonusGoalForm.controls).forEach(key => {
      const control = this.bonusGoalForm.get(key);
      control?.markAsTouched();
    });
  }

  get isFormValid(): boolean {
    return this.bonusGoalForm.valid && this.selectedEmployees().length > 0;
  }
}