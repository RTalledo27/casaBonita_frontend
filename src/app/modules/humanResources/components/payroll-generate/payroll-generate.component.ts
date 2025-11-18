import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, Users, DollarSign, FileText, ArrowLeft, Send, Save, Calculator, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Info, TrendingUp, Percent } from 'lucide-angular';
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

  payrollForm: FormGroup;
  employees: Employee[] = [];
  selectedEmployees: number[] = [];
  selectedEmployeesInfo = signal<Map<number, { id: number; name: string; salary: number }>>(new Map());
  isLoading = false;
  isGenerating = false;
  
  // Tax parameters
  taxParameters = signal<TaxParameter | null>(null);
  loadingTaxParams = signal<boolean>(false);
  taxParamsError = signal<string | null>(null);
  
  // Confirmation modal
  showConfirmModal = signal<boolean>(false);

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
  
  // Computed for selected count
  selectedCount = computed(() => this.selectedEmployeesInfo().size);
  
  // Computed for estimated total
  estimatedTotal = computed(() => {
    return Array.from(this.selectedEmployeesInfo().values()).reduce((total, employeeInfo) => {
      return total + employeeInfo.salary;
    }, 0);
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
    
    // Listen to year changes to reload tax parameters
    this.payrollForm.get('period_year')?.valueChanges.subscribe(() => {
      this.loadTaxParameters();
    });
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
      error: (err) => {
        console.error('Error loading tax parameters:', err);
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
    const currentMap = new Map(this.selectedEmployeesInfo());
    
    if (index > -1) {
      // Deseleccionar: remover de ambas estructuras
      this.selectedEmployees.splice(index, 1);
      currentMap.delete(employeeId);
    } else {
      // Seleccionar: agregar a ambas estructuras
      this.selectedEmployees.push(employeeId);
      const employee = this.employees.find(emp => emp.employee_id === employeeId);
      if (employee) {
        currentMap.set(employeeId, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: employee.base_salary || 0
        });
      }
    }
    
    // Update signal with new Map
    this.selectedEmployeesInfo.set(currentMap);
  }

  selectAllEmployees(): void {
    // Seleccionar todos los empleados de la página actual
    const currentMap = new Map(this.selectedEmployeesInfo());
    
    this.employees.forEach(employee => {
      if (!this.selectedEmployees.includes(employee.employee_id)) {
        this.selectedEmployees.push(employee.employee_id);
        currentMap.set(employee.employee_id, {
          id: employee.employee_id,
          name: employee.user?.name || 'Sin nombre',
          salary: employee.base_salary || 0
        });
      }
    });
    
    this.selectedEmployeesInfo.set(currentMap);
  }

  selectAllEmployeesGlobal(): void {
    // Cargar todos los empleados para seleccionarlos
    this.employeeService.getAllEmployees({ employment_status: 'activo' }).subscribe({
      next: (response) => {
        // Limpiar selecciones previas
        this.selectedEmployees = [];
        const newMap = new Map<number, { id: number; name: string; salary: number }>();
        
        // Agregar todos los empleados
        response.data?.forEach(employee => {
          this.selectedEmployees.push(employee.employee_id);
          newMap.set(employee.employee_id, {
            id: employee.employee_id,
            name: employee.user?.name || 'Sin nombre',
            salary: employee.base_salary || 0
          });
        });
        
        this.selectedEmployeesInfo.set(newMap);
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
    this.selectedEmployeesInfo.set(new Map());
  }

  isEmployeeSelected(employeeId: number): boolean {
    return this.selectedEmployees.includes(employeeId);
  }

  getSelectedEmployeesCount(): number {
    return this.selectedEmployees.length;
  }

  // Métodos adicionales para el template
  getTotalSelectedEmployees(): number {
    return this.selectedCount();
  }

  getEstimatedTotal(): number {
    return this.estimatedTotal();
  }
  
  getSelectedInCurrentPage(): number {
    return this.employees.filter(emp => this.isEmployeeSelected(emp.employee_id)).length;
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
    // Validar campos críticos
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
    
    // Todo ok, mostrar modal de confirmación
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

    // Si hay empleados seleccionados, generar solo para ellos
    if (this.selectedEmployees.length > 0) {
      this.generateForSelectedEmployees(request);
    } else {
      // Generar para todos los empleados
      this.generateForAllEmployees(request);
    }
  }

  private generateForSelectedEmployees(baseRequest: PayrollGenerateRequest): void {
    // ✅ NUEVA IMPLEMENTACIÓN: UNA SOLA LLAMADA AL API CON TODOS LOS IDs
    const batchRequest: PayrollGenerateRequest = {
      ...baseRequest,
      employee_ids: Array.from(this.selectedEmployeesInfo().keys()) // Usar los IDs del Map
    };

    this.payrollService.generatePayrollBatch(batchRequest).subscribe({
      next: (response) => {
        this.isGenerating = false;
        this.showConfirmModal.set(false);

        const { successful, failed, errors } = response.data;

        if (successful > 0) {
          this.toastService.success(
            `✅ ${successful} nómina(s) generada(s) exitosamente` +
            (failed > 0 ? ` | ⚠️ ${failed} fallaron` : '')
          );

          // Mostrar errores específicos si los hay
          if (errors && errors.length > 0) {
            errors.forEach(err => {
              this.toastService.error(
                `⚠️ ${err.employee_name || 'Empleado ' + err.employee_id}: ${err.error}`
              );
            });
          }

          // Navegar a la lista de nóminas
          this.router.navigate(['/hr/payroll']);
        } else {
          this.toastService.error('❌ No se pudo generar ninguna nómina');
          
          // Mostrar errores
          if (errors && errors.length > 0) {
            errors.forEach(err => {
              this.toastService.error(
                `${err.employee_name || 'Empleado ' + err.employee_id}: ${err.error}`
              );
            });
          }
        }
      },
      error: (error) => {
        console.error('Error generating payroll batch:', error);
        this.toastService.error('Error al generar nóminas: ' + (error.error?.message || error.message));
        this.isGenerating = false;
        this.showConfirmModal.set(false);
      }
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