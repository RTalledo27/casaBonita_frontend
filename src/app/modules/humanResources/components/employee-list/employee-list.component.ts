import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX, Upload, UserPlus, Grid, List, Download, Phone, Mail, Calendar, Briefcase, DollarSign } from 'lucide-angular';
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
  allEmployees = signal<Employee[]>([]); // TODOS los empleados cargados una sola vez
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedType = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10); // Empleados por página
  viewMode = signal<'table' | 'cards'>('cards'); // Vista por defecto: cards

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
  Grid = Grid;
  List = List;
  Download = Download;
  Phone = Phone;
  Mail = Mail;
  Calendar = Calendar;
  Briefcase = Briefcase;
  DollarSign = DollarSign;

  // Math para usar en template
  Math = Math;

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

  // Computed para empleados filtrados (todos, sin paginar)
  filteredEmployees = computed(() => {
    const employees = this.allEmployees();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const type = this.selectedType();

    return employees.filter((employee: Employee) => {
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

  // Computed para empleados paginados (solo los de la página actual)
  paginatedEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return filtered.slice(start, end);
  });

  // Computed para total de empleados filtrados
  totalEmployees = computed(() => {
    return this.filteredEmployees().length;
  });

  // Computed para total de páginas
  totalPages = computed(() => {
    const total = this.totalEmployees();
    const perPage = this.itemsPerPage();
    return Math.ceil(total / perPage);
  });

  // Computed properties for employee counts (usan TODOS los filtrados, no solo la página)
  activeEmployeesCount = computed(() => {
    return this.filteredEmployees().filter((e: Employee) => e.employment_status === 'activo').length;
  });

  inactiveEmployeesCount = computed(() => {
    return this.filteredEmployees().filter((e: Employee) => e.employment_status === 'inactivo').length;
  });

  advisorsCount = computed(() => {
    return this.filteredEmployees().filter((e: Employee) => e.employee_type === 'asesor_inmobiliario').length;
  });

  // Opciones para items por página
  itemsPerPageOptions = [5, 10, 20, 50, 100];

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Cargar TODOS los empleados sin paginación
      const filters: EmployeeFilters = {
        per_page: 9999 // Cargar todos
      };

      const response = await this.employeeService.getEmployees(filters).toPromise();
      
      if (response?.data) {
        this.allEmployees.set(response.data); // Guardar TODOS en memoria
        console.log(`✅ Cargados ${response.data.length} empleados en memoria`);
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
    this.currentPage.set(1); // Resetear a página 1 al buscar
  }

  onFilterChange() {
    this.currentPage.set(1); // Resetear a página 1 al filtrar
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // NO llamar a loadEmployees() - paginar en cliente
    }
  }

  onItemsPerPageChange(perPage: number) {
    this.itemsPerPage.set(perPage);
    this.currentPage.set(1); // Resetear a página 1 al cambiar items por página
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

  // Obtener gradiente según tipo de empleado (estilo empresarial pastel)
  getCardGradient(employee: Employee): string {
    switch (employee.employee_type) {
      case 'asesor_inmobiliario':
        // Azul lavanda suave - coincide con el tema del ERP
        return 'from-blue-200/80 via-indigo-200/70 to-purple-200/80 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500';
      case 'vendedor':
        // Rosa pastel suave - profesional y distinguido
        return 'from-pink-200/80 via-rose-200/70 to-red-200/80 dark:from-pink-500 dark:via-rose-500 dark:to-red-500';
      case 'administrativo':
        // Melocotón/durazno suave - cálido pero profesional
        return 'from-orange-200/80 via-amber-200/70 to-yellow-200/80 dark:from-orange-500 dark:via-amber-500 dark:to-yellow-500';
      case 'gerente':
        // Verde menta suave - como el badge "Activo" del sistema
        return 'from-emerald-200/80 via-teal-200/70 to-cyan-200/80 dark:from-emerald-500 dark:via-teal-500 dark:to-cyan-500';
      case 'supervisor':
        // Lila suave - elegante y con autoridad
        return 'from-violet-200/80 via-purple-200/70 to-fuchsia-200/80 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500';
      default:
        // Gris perla suave - neutral y profesional
        return 'from-gray-200/80 via-slate-200/70 to-zinc-200/80 dark:from-gray-500 dark:via-slate-500 dark:to-zinc-500';
    }
  }

  // Toggle entre vista de tabla y cards
  toggleView(mode: 'table' | 'cards') {
    this.viewMode.set(mode);
  }

  // Exportar a Excel
  exportToExcel() {
    const employees = this.filteredEmployees(); // Exportar solo los filtrados
    
    if (employees.length === 0) {
      this.toastService.show('No hay empleados para exportar', 'info');
      return;
    }

    // Preparar datos para Excel con todos los campos (incluyendo sistema pensionario)
    const data = employees.map(emp => ({
      'Código': emp.employee_code,
      'Nombre': `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim(),
      'Email': emp.user?.email || '',
      'Teléfono': emp.phone || '',
      'Tipo': this.getTypeLabel(emp.employee_type),
      'Estado': this.getStatusLabel(emp.employment_status),
      'Fecha Ingreso': emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('es-PE') : '',
      'Salario Base': emp.base_salary || 0,
      'Sistema Pensionario': emp.pension_system || 'N/A',
      'AFP': emp.afp_provider || 'N/A',
      'CUSPP': emp.cuspp || 'N/A',
      'Asignación Familiar': emp.has_family_allowance ? 'Sí' : 'No',
      'N° Hijos': emp.number_of_children || 0,
      'Departamento': emp.department || '',
      'Posición': emp.position || ''
    }));

    // Crear CSV
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escapar valores que contienen comas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(','))
    ].join('\n');

    // Crear blob y descargar con BOM para Excel
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `empleados_completo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.show(`${employees.length} empleados exportados exitosamente`, 'success');
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