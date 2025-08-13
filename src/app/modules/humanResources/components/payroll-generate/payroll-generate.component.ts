import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Calendar, Users, DollarSign, FileText, ArrowLeft, Send, Save, Calculator, ChevronLeft, ChevronRight } from 'lucide-angular';
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
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  payrollForm: FormGroup;
  employees: Employee[] = [];
  selectedEmployees: number[] = [];
  selectedEmployeesInfo = new Map<number, { id: number; name: string; salary: number }>(); // Información de empleados seleccionados de todas las páginas
  isLoading = false;
  isGenerating = false;

  // Pagination variables
  currentPage = signal(1);
  totalPages = signal(1);
  totalEmployees = signal(0);
  perPage = 12; // 12 empleados por página para mantener el grid de 3 columnas

  // Computed properties for pagination
  paginationInfo = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const totalEmps = this.totalEmployees();
    const start = (current - 1) * this.perPage + 1;
    const end = Math.min(current * this.perPage, totalEmps);
    return { start, end, total: totalEmps };
  });

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
    const filters = {
      employment_status: 'activo',
      page: this.currentPage(),
      per_page: this.perPage
    };

    this.employeeService.getEmployees(filters).subscribe({
      next: (response) => {
        this.employees = response.data || [];
        if (response.meta) {
          this.totalPages.set(response.meta.last_page);
          this.totalEmployees.set(response.meta.total);
        }
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
      // Deseleccionar: remover de ambas estructuras
      this.selectedEmployees.splice(index, 1);
      this.selectedEmployeesInfo.delete(employeeId);
    } else {
      // Seleccionar: agregar a ambas estructuras
      this.selectedEmployees.push(employeeId);
      const employee = this.employees.find(emp => emp.employee_id === employeeId);
      if (employee) {
        this.selectedEmployeesInfo.set(employeeId, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: employee.base_salary || 0
        });
      }
    }
  }

  selectAllEmployees(): void {
    // Seleccionar todos los empleados de la página actual
    this.employees.forEach(employee => {
      if (!this.selectedEmployees.includes(employee.employee_id)) {
        this.selectedEmployees.push(employee.employee_id);
        this.selectedEmployeesInfo.set(employee.employee_id, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: employee.base_salary || 0
        });
      }
    });
  }

  selectAllEmployeesGlobal(): void {
    // Cargar todos los empleados para seleccionarlos
    this.employeeService.getAllEmployees({ employment_status: 'activo' }).subscribe({
      next: (response) => {
        // Limpiar selecciones previas
        this.selectedEmployees = [];
        this.selectedEmployeesInfo.clear();
        
        // Agregar todos los empleados
        response.data?.forEach(employee => {
          this.selectedEmployees.push(employee.employee_id);
          this.selectedEmployeesInfo.set(employee.employee_id, {
            id: employee.employee_id,
            name: employee.user?.name || 'Sin nombre',
            salary: employee.base_salary || 0
          });
        });
        
        this.toastService.success(`${this.selectedEmployees.length} empleados seleccionados`);
      },
      error: (error) => {
        console.error('Error loading all employees:', error);
        this.toastService.error('Error al cargar todos los empleados');
      }
    });
  }

  clearSelection(): void {
    this.selectedEmployees = [];
    this.selectedEmployeesInfo.clear();
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
    return Array.from(this.selectedEmployeesInfo.values()).reduce((total, employeeInfo) => {
      return total + employeeInfo.salary;
    }, 0);
  }

  onEmployeeToggle(employeeId: number): void {
    this.toggleEmployeeSelection(employeeId);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEmployees();
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  getPaginationInfo() {
    const start = (this.currentPage() - 1) * this.perPage + 1;
    const end = Math.min(this.currentPage() * this.perPage, this.totalEmployees());
    const total = this.totalEmployees();
    
    return {
      start,
      end,
      total
    };
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