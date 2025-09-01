import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, User, Calendar, DollarSign, FileText, TrendingUp, Download, Filter, Search, ChevronDown } from 'lucide-angular';

import { CommissionService, SalesDetailResponse, SaleDetail } from '../../services/commission.service';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-sales-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './sales-detail.component.html',
  styleUrls: ['./sales-detail.component.scss']
})
export class SalesDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private commissionService = inject(CommissionService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  // Iconos
  ArrowLeft = ArrowLeft;
  User = User;
  Calendar = Calendar;
  DollarSign = DollarSign;
  FileText = FileText;
  TrendingUp = TrendingUp;
  Download = Download;
  Filter = Filter;
  Search = Search;
  ChevronDown = ChevronDown;

  // Señales para el estado del componente
  salesDetail = signal<SalesDetailResponse | null>(null);
  employees = signal<Employee[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filtros
  selectedEmployeeId = signal<number | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  searchTerm = signal('');

  // Datos computados
  filteredSales = computed(() => {
    const detail = this.salesDetail();
    const search = this.searchTerm().toLowerCase();
    
    if (!detail || !search) {
      return detail?.data.sales || [];
    }

    return detail.data.sales.filter(sale => 
      sale.contract_number.toLowerCase().includes(search) ||
      sale.client_name.toLowerCase().includes(search)
    );
  });

  // Opciones para los selectores
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  ngOnInit(): void {
    this.loadEmployees();
    
    // Verificar si hay parámetros en la URL
    this.route.queryParams.subscribe(params => {
      if (params['employee_id']) {
        this.selectedEmployeeId.set(+params['employee_id']);
      }
      if (params['month']) {
        this.selectedMonth.set(+params['month']);
      }
      if (params['year']) {
        this.selectedYear.set(+params['year']);
      }
      
      // Si hay parámetros, cargar automáticamente
      if (this.selectedEmployeeId()) {
        this.loadSalesDetail();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAdvisors().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('Error al cargar empleados');
      }
    });
  }

  loadSalesDetail(): void {
    const employeeId = this.selectedEmployeeId();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    if (!employeeId) {
      this.toastService.info('Por favor selecciona un empleado');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.commissionService.getSalesDetail(employeeId, month, year).subscribe({
      next: (response) => {
        if (response.success) {
          this.salesDetail.set(response);
          console.log(this.salesDetail())
        } else {
          this.error.set(response.message || 'Error al cargar detalle de ventas');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sales detail:', error);
        this.error.set('Error al cargar detalle de ventas');
        this.loading.set(false);
        this.toastService.error('Error al cargar detalle de ventas');
      }
    });
  }

  onFilterChange(): void {
    this.loadSalesDetail();
  }

  goBack(): void {
    this.router.navigate(['/human-resources/commissions']);
  }

  exportToExcel(): void {
    // TODO: Implementar exportación a Excel
    this.toastService.info('Funcionalidad de exportación próximamente');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`;
  }

  getTermLabel(months: number): string {
    return months > 36 ? 'Largo plazo (>36 meses)' : 'Corto plazo (≤36 meses)';
  }

  getSplitTypeLabel(splitType: string): string {
    switch (splitType) {
      case '50/50':
        return '50% - 50%';
      case '70/30':
        return '70% - 30%';
      default:
        return splitType;
    }
  }

  trackBySale(index: number, sale: SaleDetail): string {
    return sale.contract_number;
  }
}