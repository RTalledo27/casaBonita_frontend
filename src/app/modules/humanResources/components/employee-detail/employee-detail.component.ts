import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, DollarSign, Building, Users, MapPin, AlertTriangle, FileText } from 'lucide-angular';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  employee = signal<Employee | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  employeeId = signal<number | null>(null);

  // Iconos de Lucide
  ArrowLeft = ArrowLeft;
  Edit = Edit;
  Trash2 = Trash2;
  User = User;
  Mail = Mail;
  Phone = Phone;
  Calendar = Calendar;
  DollarSign = DollarSign;
  Building = Building;
  Users = Users;
  MapPin = MapPin;
  AlertTriangle = AlertTriangle;
  FileText = FileText;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(parseInt(id));
      this.loadEmployee(parseInt(id));
    } else {
      this.router.navigate(['/hr/employees']);
    }
  }

  private async loadEmployee(id: number) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const employee = await this.employeeService.getEmployee(id).toPromise();
      if (employee) {
        this.employee.set(employee);
      } else {
        this.error.set('Empleado no encontrado');
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      this.error.set('Error al cargar el empleado');
      this.toastService.error('Error al cargar el empleado');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/hr/employees']);
  }

  editEmployee() {
    if (this.employeeId()) {
      this.router.navigate(['/hr/employees/edit', this.employeeId()]);
    }
  }

  viewDashboard() {
    if (this.employeeId()) {
      this.router.navigate(['/hr/employees/dashboard', this.employeeId()]);
    }
  }

  async deleteEmployee() {
    const employee = this.employee();
    if (!employee) return;

    const confirmMessage = `¿Estás seguro de que deseas eliminar al empleado ${employee.user?.first_name} ${employee.user?.last_name}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await this.employeeService.deleteEmployee(employee.employee_id).toPromise();
      this.toastService.success('Empleado eliminado exitosamente');
      this.router.navigate(['/hr/employees']);
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

  calculateYearsOfService(): number {
    const employee = this.employee();
    if (!employee?.hire_date) return 0;
    
    const hireDate = new Date(employee.hire_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    
    return diffYears;
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}