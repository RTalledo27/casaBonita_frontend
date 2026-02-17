import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, Users, DollarSign, FileText, ArrowLeft, Send, Save, Calculator, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Info, TrendingUp, Percent, Search, ChevronDown, ChevronUp } from 'lucide-angular';
import { ToastService } from '../../../../core/services/toast.service';
import { PayrollService, PayrollGenerateRequest, PayrollBatchResponse } from '../../services/payroll.service';
import { EmployeeService } from '../../services/employee.service';
import { TaxParameterService } from '../../services/tax-parameter.service';
import { Employee } from '../../models/employee';
import { Payroll } from '../../models/payroll';
import { TaxParameter } from '../../models/tax-parameter';

@Component({
  selector: 'app-payroll-generate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
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
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly Info = Info;
  readonly TrendingUp = TrendingUp;
  readonly Percent = Percent;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  payrollForm: FormGroup;
  employees = signal<Employee[]>([]);
  selectedEmployeesInfo = signal<Map<number, { id: number; name: string; salary: number }>>(new Map());
  isLoading = false;
  isGenerating = false;
  
  // Tax parameters
  taxParameters = signal<TaxParameter | null>(null);
  loadingTaxParams = signal<boolean>(false);
  taxParamsError = signal<string | null>(null);
  showTaxDetails = signal<boolean>(false);
  
  // Confirmation modal
  showConfirmModal = signal<boolean>(false);

  // Generation result state
  generationComplete = signal<boolean>(false);
  generationResult = signal<{ successful: number; failed: number; errors: Array<{ employee_id: number; employee_name?: string; error: string }> } | null>(null);

  // Search filter
  searchTerm = signal<string>('');

  // Pagination variables
  currentPage = signal(1);
  totalPages = signal(1);
  totalEmployees = signal(0);
  perPage = 12;

  // Computed properties for pagination
  paginationInfo = computed(() => {
    const totalEmps = this.totalEmployees();
    const start = totalEmps > 0 ? (this.currentPage() - 1) * this.perPage + 1 : 0;
    const end = Math.min(this.currentPage() * this.perPage, totalEmps);
    return { start, end, total: totalEmps };
  });
  
  // Computed for selected count
  selectedCount = computed(() => this.selectedEmployeesInfo().size);
  
  // Computed for estimated total
  estimatedTotal = computed(() => {
    return Array.from(this.selectedEmployeesInfo().values()).reduce((sum, emp) => sum + emp.salary, 0);
  });

  // Filtered employees based on search
  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.employees();
    return this.employees().filter(emp => {
      const fullName = `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.toLowerCase();
      const code = (emp.employee_code || '').toLowerCase();
      return fullName.includes(term) || code.includes(term);
    });
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private taxParameterService: TaxParameterService
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
    this.loadTaxParameters();
    
    this.payrollForm.get('period_year')?.valueChanges.subscribe(() => {
      this.loadTaxParameters();
    });
  }

  toggleTaxDetails(): void {
    this.showTaxDetails.update(v => !v);
  }

  private loadTaxParameters(): void {
    const year = this.payrollForm.get('period_year')?.value || new Date().getFullYear();
    this.loadingTaxParams.set(true);
    this.taxParamsError.set(null);
    
    this.taxParameterService.getByYear(year).subscribe({
      next: (response) => {
        if (response.success && !Array.isArray(response.data)) {
          this.taxParameters.set(response.data);
        } else {
          this.taxParamsError.set(`No existen parámetros tributarios para el año ${year}`);
        }
        this.loadingTaxParams.set(false);
      },
      error: () => {
        this.taxParamsError.set(`Error al cargar parámetros tributarios para ${year}`);
        this.loadingTaxParams.set(false);
      }
    });
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
        this.employees.set(response.data || []);
        if (response.meta) {
          this.totalPages.set(response.meta.last_page);
          this.totalEmployees.set(response.meta.total);
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar empleados');
        this.isLoading = false;
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  toggleEmployeeSelection(employeeId: number): void {
    const currentMap = new Map(this.selectedEmployeesInfo());
    
    if (currentMap.has(employeeId)) {
      currentMap.delete(employeeId);
    } else {
      const employee = this.employees().find(emp => emp.employee_id === employeeId);
      if (employee) {
        currentMap.set(employeeId, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: parseFloat(String(employee.base_salary)) || 0
        });
      }
    }
    
    this.selectedEmployeesInfo.set(currentMap);
  }

  selectAllEmployees(): void {
    const currentMap = new Map(this.selectedEmployeesInfo());
    
    this.employees().forEach(employee => {
      if (!currentMap.has(employee.employee_id)) {
        currentMap.set(employee.employee_id, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: parseFloat(String(employee.base_salary)) || 0
        });
      }
    });
    
    this.selectedEmployeesInfo.set(currentMap);
  }

  selectAllEmployeesGlobal(): void {
    this.employeeService.getAllEmployees({ employment_status: 'activo' }).subscribe({
      next: (response) => {
        const newMap = new Map<number, { id: number; name: string; salary: number }>();
        
        response.data?.forEach(employee => {
          newMap.set(employee.employee_id, {
            id: employee.employee_id,
            name: employee.user?.name || 'Sin nombre',
            salary: parseFloat(String(employee.base_salary)) || 0
          });
        });
        
        this.selectedEmployeesInfo.set(newMap);
        this.toastService.success(`${newMap.size} empleados seleccionados`);
      },
      error: () => {
        this.toastService.error('Error al cargar todos los empleados');
      }
    });
  }

  clearSelection(): void {
    this.selectedEmployeesInfo.set(new Map());
  }

  isEmployeeSelected(employeeId: number): boolean {
    return this.selectedEmployeesInfo().has(employeeId);
  }

  getSelectedInCurrentPage(): number {
    return this.employees().filter(emp => this.selectedEmployeesInfo().has(emp.employee_id)).length;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.searchTerm.set('');
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

  onSubmit(): void {
    if (this.selectedCount() === 0) {
      this.toastService.error('Debes seleccionar al menos un empleado');
      return;
    }
    
    if (!this.payrollForm.get('pay_date')?.value) {
      this.toastService.error('Debes ingresar la fecha de pago');
      return;
    }
    
    if (!this.payrollForm.get('period_month')?.value || !this.payrollForm.get('period_year')?.value) {
      this.toastService.error('Debes seleccionar el período (mes y año)');
      return;
    }
    
    this.showConfirmModal.set(true);
  }
  
  confirmGeneration(): void {
    this.showConfirmModal.set(false);
    this.generatePayroll();
  }
  
  cancelConfirmation(): void {
    this.showConfirmModal.set(false);
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

    if (this.selectedCount() > 0) {
      this.generateForSelectedEmployees(request);
    } else {
      this.generateForAllEmployees(request);
    }
  }

  private generateForSelectedEmployees(baseRequest: PayrollGenerateRequest): void {
    const batchRequest: PayrollGenerateRequest = {
      ...baseRequest,
      employee_ids: Array.from(this.selectedEmployeesInfo().keys())
    };

    this.payrollService.generatePayrollBatch(batchRequest).subscribe({
      next: (response) => {
        this.isGenerating = false;

        const { successful, failed, errors } = response.data;

        this.generationResult.set({ successful, failed, errors: errors || [] });
        this.generationComplete.set(true);

        if (successful > 0) {
          this.toastService.success(
            `${successful} nómina(s) generada(s) exitosamente` +
            (failed > 0 ? ` | ${failed} fallaron` : '')
          );
        } else {
          this.toastService.error('No se pudo generar ninguna nómina');
        }

        if (errors && errors.length > 0) {
          errors.forEach(err => {
            this.toastService.error(
              `${err.employee_name || 'Empleado ' + err.employee_id}: ${err.error}`
            );
          });
        }
      },
      error: (error) => {
        this.toastService.error('Error al generar nóminas: ' + (error.error?.message || error.message));
        this.isGenerating = false;
      }
    });
  }

  private generateForAllEmployees(request: PayrollGenerateRequest): void {
    this.payrollService.generatePayroll(request).subscribe({
      next: (result) => {
        const payrolls = Array.isArray(result) ? result : [result];
        this.generationResult.set({ successful: payrolls.length, failed: 0, errors: [] });
        this.generationComplete.set(true);
        this.toastService.success(`${payrolls.length} nómina(s) generada(s) exitosamente`);
        this.isGenerating = false;
      },
      error: (error) => {
        this.toastService.error('Error al generar nóminas: ' + (error.error?.message || error.message));
        this.isGenerating = false;
      }
    });
  }

  resetForNewGeneration(): void {
    this.generationComplete.set(false);
    this.generationResult.set(null);
    this.selectedEmployeesInfo.set(new Map());
    this.currentPage.set(1);
    this.loadEmployees();
  }

  goToPayrollList(): void {
    this.router.navigate(['/hr/payroll']);
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
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!num || isNaN(num) || !isFinite(num)) {
      return 'S/ 0';
    }
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(num);
  }
}