import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee.service';
import { Attendance } from '../../models/attendance';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss']
})
export class AttendanceListComponent implements OnInit {
  // Make Math available in template
  Math = Math;
  
  attendances: Attendance[] = [];
  filteredAttendances: Attendance[] = [];
  employees: Employee[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Filters
  searchTerm = '';
  selectedEmployee = '';
  selectedDate = '';
  selectedMonth = '';
  statusFilter = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Load employees for filter
      const employeesResponse = await this.employeeService.getAllEmployees().toPromise();
      this.employees = employeesResponse?.data || [];

      // Load attendances
      await this.loadAttendances();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.error = 'Error al cargar los datos';
    } finally {
      this.isLoading = false;
    }
  }

  async loadAttendances(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      let response;
      
      if (this.selectedEmployee) {
        response = await this.attendanceService.getAttendanceByEmployee(parseInt(this.selectedEmployee)).toPromise();
      } else if (this.selectedDate) {
        response = await this.attendanceService.getAttendanceByDate(this.selectedDate).toPromise();
      } else if (this.selectedMonth) {
        const [year, month] = this.selectedMonth.split('-');
        response = await this.attendanceService.getAttendanceByMonth(parseInt(month), parseInt(year)).toPromise();
      } else {
        response = await this.attendanceService.getAttendances().toPromise();
      }

      if (response?.success) {
        this.attendances = response.data || [];
        this.applyFilters();
      } else {
        this.error = response?.message || 'Error al cargar las asistencias';
      }
    } catch (error) {
      console.error('Error loading attendances:', error);
      this.error = 'Error al cargar las asistencias';
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.attendances];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(attendance => {
        const employee = this.getEmployeeName(attendance.employee_id).toLowerCase();
        return employee.includes(term);
      });
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(attendance => attendance.status === this.statusFilter);
    }

    this.filteredAttendances = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onEmployeeChange(): void {
    this.loadAttendances();
  }

  onDateChange(): void {
    this.selectedMonth = '';
    this.loadAttendances();
  }

  onMonthChange(): void {
    this.selectedDate = '';
    this.loadAttendances();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedEmployee = '';
    this.selectedDate = '';
    this.selectedMonth = '';
    this.statusFilter = '';
    this.loadAttendances();
  }

  async onCheckIn(employeeId: number): Promise<void> {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];
      
      const response = await this.attendanceService.checkIn(employeeId, {
        attendance_date: currentDate,
        check_in_time: currentTime
      }).toPromise();
      
      if (response) {
        await this.loadAttendances();
      } else {
        this.error = 'Error al registrar entrada';
      }
    } catch (error) {
      console.error('Error checking in:', error);
      this.error = 'Error al registrar entrada';
    }
  }

  async onCheckOut(attendanceId: number): Promise<void> {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      const response = await this.attendanceService.checkOut(attendanceId, {
        check_out_time: currentTime
      }).toPromise();
      
      if (response) {
        await this.loadAttendances();
      } else {
        this.error = 'Error al registrar salida';
      }
    } catch (error) {
      console.error('Error checking out:', error);
      this.error = 'Error al registrar salida';
    }
  }

  async onStartBreak(attendanceId: number): Promise<void> {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      const response = await this.attendanceService.startBreak(attendanceId, {
        break_start_time: currentTime
      }).toPromise();
      
      if (response) {
        await this.loadAttendances();
      } else {
        this.error = 'Error al iniciar descanso';
      }
    } catch (error) {
      console.error('Error starting break:', error);
      this.error = 'Error al iniciar descanso';
    }
  }

  async onEndBreak(attendanceId: number): Promise<void> {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      const response = await this.attendanceService.endBreak(attendanceId, {
        break_end_time: currentTime
      }).toPromise();
      
      if (response) {
        await this.loadAttendances();
      } else {
        this.error = 'Error al finalizar descanso';
      }
    } catch (error) {
      console.error('Error ending break:', error);
      this.error = 'Error al finalizar descanso';
    }
  }

  async onApprove(attendanceId: number): Promise<void> {
    try {
      const response = await this.attendanceService.approveAttendance(attendanceId).toPromise();
      if (response) {
        await this.loadAttendances();
      } else {
        this.error = 'Error al aprobar asistencia';
      }
    } catch (error) {
      console.error('Error approving attendance:', error);
      this.error = 'Error al aprobar asistencia';
    }
  }

  onEdit(attendanceId: number): void {
    this.router.navigate(['/hr/attendance/edit', attendanceId]);
  }

  onNew(): void {
    this.router.navigate(['/hr/attendance/new']);
  }

  async onDelete(attendanceId: number): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de asistencia?')) {
      try {
        await this.attendanceService.deleteAttendance(attendanceId).toPromise();
        await this.loadAttendances();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        this.error = 'Error al eliminar el registro';
      }
    }
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(emp => emp.employee_id === employeeId);
    return employee && employee.user ? `${employee.user.name}` : 'N/A';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'present': 'Presente',
      'absent': 'Ausente',
      'late': 'Tardanza',
      'early_departure': 'Salida Temprana',
      'on_break': 'En Descanso',
      'approved': 'Aprobado',
      'pending': 'Pendiente'
    };
    return statusLabels[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'present': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'early_departure': 'bg-orange-100 text-orange-800',
      'on_break': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'pending': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatTime(time: string | null): string {
    if (!time) return '-';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }

  calculateWorkedHours(attendance: Attendance): string {
    if (!attendance.check_in_time || !attendance.check_out_time) {
      return '-';
    }

    const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`);
    const checkOut = new Date(`2000-01-01T${attendance.check_out_time}`);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return `${diffHours.toFixed(2)}h`;
  }

  get paginatedAttendances(): Attendance[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAttendances.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get statusOptions() {
    return [
      { value: '', label: 'Todos los estados' },
      { value: 'present', label: 'Presente' },
      { value: 'absent', label: 'Ausente' },
      { value: 'late', label: 'Tardanza' },
      { value: 'early_departure', label: 'Salida Temprana' },
      { value: 'on_break', label: 'En Descanso' },
      { value: 'approved', label: 'Aprobado' },
      { value: 'pending', label: 'Pendiente' }
    ];
  }
}
