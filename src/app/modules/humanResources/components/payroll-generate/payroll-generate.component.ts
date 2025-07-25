import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Calendar, Users, DollarSign, FileText, ArrowLeft, Send, Save, Calculator } from 'lucide-angular';
import { ToastService } from '../../../../core/services/toast.service';
import { PayrollService, PayrollGenerateRequest } from '../../services/payroll.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';
import { Payroll } from '../../models/payroll';

@Component({
  selector: 'app-payroll-generate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './payroll-generate.component.html',
  styleUrl: './payroll-generate.component.scss'
})
export class PayrollGenerateComponent implements OnInit {
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly DollarSign = DollarSign;
  readonly FileText = FileText;
  readonly ArrowLeft = ArrowLeft;
  readonly Send = Send;
  readonly Save = Save;
  readonly Calculator = Calculator;

  payrollForm: FormGroup;
  employees: Employee[] = [];
  selectedEmployees: number[] = [];
  isLoading = false;
  isGenerating = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private payrollService: PayrollService,
    private employeeService: EmployeeService
  ) {
    this.payrollForm = this.fb.group({
      period_month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      period_year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      pay_date: ['', Validators.required],
      include_commissions: [true],
      include_bonuses: [true],
      include_overtime: [true],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setDefaultPayDate();
  }

  private setDefaultPayDate(): void {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.payrollForm.patchValue({
      pay_date: lastDayOfMonth.toISOString().split('T')[0]
    });
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees({ employment_status: 'activo' }).subscribe({
      next: (response) => {
        this.employees = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('Error al cargar empleados');
        this.isLoading = false;
      }
    });
  }

  toggleEmployeeSelection(employeeId: number): void {
    const index = this.selectedEmployees.indexOf(employeeId);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    } else {
      this.selectedEmployees.push(employeeId);
    }
  }

  selectAllEmployees(): void {
    this.selectedEmployees = this.employees.map(emp => emp.employee_id);
  }

  clearSelection(): void {
    this.selectedEmployees = [];
  }

  isEmployeeSelected(employeeId: number): boolean {
    return this.selectedEmployees.includes(employeeId);
  }

  getSelectedEmployeesCount(): number {
    return this.selectedEmployees.length;
  }

  // Métodos adicionales para el template
  getTotalSelectedEmployees(): number {
    return this.getSelectedEmployeesCount();
  }

  getEstimatedTotal(): number {
    return this.selectedEmployees.reduce((total, employeeId) => {
      const employee = this.employees.find(emp => emp.employee_id === employeeId);
      return total + (employee?.base_salary || 0);
    }, 0);
  }

  onEmployeeToggle(employeeId: number): void {
    this.toggleEmployeeSelection(employeeId);
  }

  onSubmit(): void {
    if (this.payrollForm.valid) {
      this.generatePayroll();
    } else {
      this.toastService.error('Por favor, complete todos los campos requeridos');
    }
  }

  private generatePayroll(): void {
    this.isGenerating = true;
    const formValue = this.payrollForm.value;
    
    const request: PayrollGenerateRequest = {
      month: formValue.period_month,
      year: formValue.period_year,
      pay_date: formValue.pay_date,
      include_commissions: formValue.include_commissions,
      include_bonuses: formValue.include_bonuses,
      include_overtime: formValue.include_overtime,
      notes: formValue.notes
    };

    // Si hay empleados seleccionados, generar solo para ellos
    if (this.selectedEmployees.length > 0) {
      this.generateForSelectedEmployees(request);
    } else {
      // Generar para todos los empleados
      this.generateForAllEmployees(request);
    }
  }

  private generateForSelectedEmployees(baseRequest: PayrollGenerateRequest): void {
    const requests = this.selectedEmployees.map(employeeId => ({
      ...baseRequest,
      employee_id: employeeId
    }));

    // Generar nóminas individualmente para cada empleado seleccionado
    let completed = 0;
    const total = requests.length;
    const results: Payroll[] = [];

    requests.forEach(request => {
      this.payrollService.generatePayroll(request).subscribe({
        next: (result) => {
          if (Array.isArray(result)) {
            results.push(...result);
          } else {
            results.push(result);
          }
          completed++;
          
          if (completed === total) {
            this.handleGenerationSuccess(results);
          }
        },
        error: (error) => {
          console.error('Error generating payroll:', error);
          completed++;
          
          if (completed === total) {
            this.handleGenerationComplete(results);
          }
        }
      });
    });
  }

  private generateForAllEmployees(request: PayrollGenerateRequest): void {
    this.payrollService.generatePayroll(request).subscribe({
      next: (result) => {
        const payrolls = Array.isArray(result) ? result : [result];
        this.handleGenerationSuccess(payrolls);
      },
      error: (error) => {
        console.error('Error generating payroll:', error);
        this.toastService.error('Error al generar nóminas: ' + (error.error?.message || error.message));
        this.isGenerating = false;
      }
    });
  }

  private handleGenerationSuccess(payrolls: Payroll[]): void {
    this.toastService.success(`${payrolls.length} nómina(s) generada(s) exitosamente`);
    this.router.navigate(['/hr/payroll']);
    this.isGenerating = false;
  }

  private handleGenerationComplete(results: Payroll[]): void {
    if (results.length > 0) {
      this.handleGenerationSuccess(results);
    } else {
      this.toastService.error('No se pudieron generar las nóminas');
      this.isGenerating = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/hr/payroll']);
  }

  getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  }

  formatCurrency(amount: number | string): string {
    // Convertir a número de forma segura
    let numericAmount: number;
    
    if (typeof amount === 'string') {
      // Si es string, intentar extraer solo el primer número válido
      const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
      const firstNumber = cleanAmount.split('.')[0] + '.' + (cleanAmount.split('.')[1] || '0');
      numericAmount = parseFloat(firstNumber) || 0;
    } else {
      numericAmount = amount || 0;
    }
    
    // Validar que sea un número válido
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      numericAmount = 0;
    }
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(numericAmount);
  }


}