import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX, Upload, UserPlus } from 'lucide-angular';
import { EmployeeService, EmployeeFilters } from '../../services/employee.service';
import { Employee } from '../../models/employee';
import { ToastService } from '../../../../core/services/toast.service';
import { GenerateUserModalComponent } from '../generate-user-modal/generate-user-modal.component';
import { EmployeeImportModalComponent } from '../employee-import-modal/employee-import-modal.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, GenerateUserModalComponent, EmployeeImportModalComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  employees = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedType = signal<string>('');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalEmployees = signal<number>(0);

  // Iconos de Lucide
  Plus = Plus;
  Search = Search;
  Filter = Filter;
  Edit = Edit;
  Trash2 = Trash2;
  Eye = Eye;
  Users = Users;
  UserCheck = UserCheck;
  UserX = UserX;
  Upload = Upload;
  UserPlus = UserPlus;

  // Estado para el modal de generar usuario
  showGenerateUserModal = signal<boolean>(false);
  selectedEmployeeForUser = signal<Employee | null>(null);
  showImportModal = signal<boolean>(false);

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' }
  ];

  typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'asesor_inmobiliario', label: 'Asesor Inmobiliario' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  // Computed para empleados filtrados
  filteredEmployees = computed(() => {
    const employees = this.employees();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const type = this.selectedType();

    return employees.filter(employee => {
      const matchesSearch = !search || 
        employee.user?.first_name?.toLowerCase().includes(search) ||
        employee.user?.last_name?.toLowerCase().includes(search) ||
        employee.user?.email?.toLowerCase().includes(search) ||
        employee.employee_code?.toLowerCase().includes(search);

      const matchesStatus = !status || employee.employment_status === status;
      const matchesType = !type || employee.employee_type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  // Computed properties for employee counts
  activeEmployeesCount = computed(() => {
    return this.filteredEmployees().filter(e => e.employment_status === 'activo').length;
  });

  inactiveEmployeesCount = computed(() => {
    return this.filteredEmployees().filter(e => e.employment_status === 'inactivo').length;
  });

  advisorsCount = computed(() => {
    return this.filteredEmployees().filter(e => e.employee_type === 'asesor_inmobiliario').length;
  });

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const filters: EmployeeFilters = {
        page: this.currentPage(),
        per_page: 20
      };

      if (this.searchTerm()) {
        filters.search = this.searchTerm();
      }
      if (this.selectedStatus()) {
        filters.employment_status = this.selectedStatus();
      }
      if (this.selectedType()) {
        filters.employee_type = this.selectedType();
      }

      const response = await this.employeeService.getEmployees(filters).toPromise();
      
      if (response?.data) {
        this.employees.set(response.data);
        this.totalEmployees.set(response.meta?.total || 0);
        this.totalPages.set(response.meta?.last_page || 1);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      this.error.set('Error al cargar los empleados');
      this.toastService.error('Error al cargar los empleados');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadEmployees();
  }

  createEmployee() {
    this.router.navigate(['/hr/employees/create']);
  }

  editEmployee(employee: Employee) {
    this.router.navigate(['/hr/employees/edit', employee.employee_id]);
  }

  viewEmployee(employee: Employee) {
    this.router.navigate(['/hr/employees/view', employee.employee_id]);
  }

  viewDashboard(employee: Employee) {
    this.router.navigate(['/hr/employees/dashboard', employee.employee_id]);
  }

  async deleteEmployee(employee: Employee) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al empleado ${employee.user?.first_name} ${employee.user?.last_name}?`)) {
      return;
    }

    try {
      await this.employeeService.deleteEmployee(employee.employee_id).toPromise();
      this.toastService.success('Empleado eliminado exitosamente');
      this.loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      this.toastService.error('Error al eliminar el empleado');
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800';
      case 'suspendido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'inactivo':
        return 'Inactivo';
      case 'suspendido':
        return 'Suspendido';
      default:
        return status;
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'asesor_inmobiliario':
        return 'bg-blue-100 text-blue-800';
      case 'vendedor':
        return 'bg-purple-100 text-purple-800';
      case 'administrativo':
        return 'bg-yellow-100 text-yellow-800';
      case 'gerente':
        return 'bg-green-100 text-green-800';
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'asesor_inmobiliario':
        return 'Asesor Inmobiliario';
      case 'vendedor':
        return 'Vendedor';
      case 'administrativo':
        return 'Administrativo';
      case 'gerente':
        return 'Gerente';
      case 'supervisor':
        return 'Supervisor';
      default:
        return type;
    }
  }

  trackByEmployeeId(index: number, employee: Employee): number {
    return employee.employee_id;
  }

  // Métodos para importación
  importEmployees() {
    this.showImportModal.set(true);
  }

  closeImportModal() {
    this.showImportModal.set(false);
  }

  onImportSuccess() {
    this.loadEmployees(); // Recargar la lista de empleados
    this.showImportModal.set(false);
  }

  // Métodos para generación de usuarios
  openGenerateUserModal(employee: Employee) {
    this.selectedEmployeeForUser.set(employee);
    this.showGenerateUserModal.set(true);
  }

  closeGenerateUserModal() {
    this.showGenerateUserModal.set(false);
    this.selectedEmployeeForUser.set(null);
  }

  onUserGenerated() {
    this.loadEmployees(); // Recargar la lista para mostrar el usuario generado
  }

  hasUser(employee: Employee): boolean {
    return !!employee.user_id;
  }
}