import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, FileText, Plus, Filter, Search, Eye, Download, CheckCircle, XCircle, Clock, Calculator, DollarSign, Calendar, Edit, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-angular';
import { ToastService } from '../../../../core/services/toast.service';
import { PayrollService } from '../../services/payroll.service';
import { Payroll, PayrollSearchFilters } from '../../models/payroll';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payroll-list.component.html',
  styleUrls: ['./payroll-list.component.scss']
})
export class PayrollListComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private payrollService = inject(PayrollService);

  // Señales para el estado del componente
  payrolls = signal<Payroll[]>([]);
  loading = signal<boolean>(false);
  processing = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  itemsPerPage = signal<number>(10);
  
  // Signals para totales globales
  totalGrossGlobal = signal<number>(0);
  totalNetGlobal = signal<number>(0);
  totalDeductionsGlobal = signal<number>(0);
  
  // Opciones para elementos por página
  itemsPerPageOptions = [10, 25, 50, 100];

  // Iconos de Lucide
  FileText = FileText;
  Plus = Plus;
  Filter = Filter;
  Search = Search;
  Eye = Eye;
  Download = Download;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  Calculator = Calculator;
  DollarSign = DollarSign;
  Calendar = Calendar;
  Edit = Edit;
  ChevronLeft = ChevronLeft;
  ChevronRight = ChevronRight;
  ChevronFirst = ChevronFirst;
  ChevronLast = ChevronLast;

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'procesado', label: 'Procesado' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  monthOptions = [
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

  yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year, label: year.toString() };
  });

  // Computed para nóminas (ya filtradas desde el backend)
  filteredPayrolls = computed(() => {
    return this.payrolls();
  });

  // Computed para estadísticas (usando totales globales)
  totalGross = computed(() => {
    return this.totalGrossGlobal();
  });

  totalNet = computed(() => {
    return this.totalNetGlobal();
  });

  totalDeductions = computed(() => {
    return this.totalDeductionsGlobal();
  });

  ngOnInit() {
    this.loadPayrolls();
  }

  loadPayrolls() {
    this.loading.set(true);
    this.error.set(null);

    const filters: PayrollSearchFilters = {
      status: this.selectedStatus() || undefined,
      period: this.selectedMonth() && this.selectedYear() 
        ? `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}` 
        : undefined,
      page: this.currentPage(),
      per_page: this.itemsPerPage(),
      search: this.searchTerm() || undefined
    };

    this.payrollService.getPayrolls(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Manejar respuesta paginada
          this.payrolls.set(response.data);
          
          // Configurar metadatos de paginación
          if (response.meta) {
            this.totalItems.set(response.meta.total || 0);
            this.totalPages.set(response.meta.last_page || 1);
          } else {
            this.totalItems.set(response.data.length);
            this.totalPages.set(1);
          }
          
          // Usar totales globales del backend
          if (response.totals) {
            this.totalGrossGlobal.set(response.totals.total_gross || 0);
            this.totalNetGlobal.set(response.totals.total_net || 0);
            this.totalDeductionsGlobal.set(response.totals.total_deductions || 0);
          } else {
            // Fallback: calcular con datos actuales si no hay totales del backend
            this.calculateGlobalTotals(response.data);
          }
        } else {
          throw new Error(response.message || 'Error al cargar las nóminas');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading payrolls:', error);
        this.error.set('Error al cargar las nóminas');
        this.toastService.error('Error al cargar las nóminas');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayrolls();
    }
  }

  onItemsPerPageChange() {
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  goToFirstPage() {
    this.onPageChange(1);
  }

  goToLastPage() {
    this.onPageChange(this.totalPages());
  }

  getPageNumbers(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    if (total <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (current <= 4) {
        // Mostrar primeras páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Elipsis
        pages.push(total);
      } else if (current >= total - 3) {
        // Mostrar últimas páginas
        pages.push(1);
        pages.push(-1); // Elipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas del medio
        pages.push(1);
        pages.push(-1); // Elipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Elipsis
        pages.push(total);
      }
    }
    
    return pages;
  }

  getPaginationInfo(): string {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems());
    const total = this.totalItems();
    
    if (total === 0) {
      return 'No hay registros';
    }
    
    return `Mostrando ${start}-${end} de ${total} registros`;
  }

  generatePayroll() {
    // Implementar navegación al formulario de generación
    this.router.navigate(['/hr/payroll/generate']);
  }

  viewPayroll(payroll: Payroll) {
    this.router.navigate(['/hr/payroll/view', payroll.payroll_id]);
  }

  downloadPayroll(payroll: Payroll) {
    // Implementar descarga de PDF de nómina
    const employeeName = payroll.employee?.full_name || payroll.employee?.employee_code || 'empleado';
    const period = payroll.payroll_period;
    
    this.toastService.info(`Generando PDF de nómina para ${employeeName} - ${period}`);
    
    // TODO: Implementar endpoint para generar PDF
    // this.payrollService.downloadPayrollPDF(payroll.payroll_id).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = `nomina_${employeeName}_${period}.pdf`;
    //     link.click();
    //     window.URL.revokeObjectURL(url);
    //     this.toastService.success('Nómina descargada exitosamente');
    //   },
    //   error: (error) => {
    //     console.error('Error downloading payroll:', error);
    //     this.toastService.error('Error al descargar la nómina');
    //   }
    // });
  }

  processIndividualPayroll(payroll: Payroll) {
    const employeeName = payroll.employee?.full_name || payroll.employee?.employee_code || 'empleado';
    if (!confirm(`¿Procesar la nómina de ${employeeName}?`)) {
      return;
    }

    this.payrollService.processPayroll(payroll.payroll_id).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Nómina procesada exitosamente');
          this.loadPayrolls();
        } else {
          this.toastService.error('Error al procesar la nómina');
        }
      },
      error: (error) => {
        console.error('Error processing payroll:', error);
        this.toastService.error('Error al procesar la nómina');
      }
    });
  }

  approvePayroll(payroll: Payroll) {
    const employeeName = payroll.employee?.full_name || payroll.employee?.employee_code || 'empleado';
    if (!confirm(`¿Aprobar la nómina de ${employeeName}?`)) {
      return;
    }

    this.payrollService.approvePayroll(payroll.payroll_id).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Nómina aprobada exitosamente');
          this.loadPayrolls();
        } else {
          this.toastService.error('Error al aprobar la nómina');
        }
      },
      error: (error) => {
        console.error('Error approving payroll:', error);
        this.toastService.error('Error al aprobar la nómina');
      }
    });
  }

  async processPayroll() {
    const period = this.selectedMonth() && this.selectedYear() 
      ? `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}` 
      : null;

    if (!period) {
      this.toastService.error('Debe seleccionar un período válido para procesar las nóminas');
      return;
    }

    const statusFilter = this.selectedStatus() || 'borrador';
    const confirmMessage = `¿Procesar todas las nóminas en estado "${this.getStatusLabel(statusFilter)}" para el período ${period}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.processing.set(true);
    try {
      const result = await this.payrollService.processBulkPayrolls(period, statusFilter).toPromise();
      
      if (result && result.processed_count > 0) {
        this.toastService.success(`Se procesaron ${result.processed_count} nóminas exitosamente`);
        this.loadPayrolls();
      } else {
        this.toastService.info('No se encontraron nóminas para procesar en el período seleccionado');
      }
    } catch (error: any) {
      console.error('Error processing payrolls:', error);
      const errorMessage = error?.error?.message || error?.message || 'Error al procesar las nóminas';
      this.toastService.error(errorMessage);
    } finally {
      this.processing.set(false);
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'aprobado':
        return 'bg-blue-100 text-blue-800';
      case 'procesado':
        return 'bg-purple-100 text-purple-800';
      case 'pendiente':
        return 'bg-orange-100 text-orange-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'Pagado';
      case 'aprobado':
        return 'Aprobado';
      case 'procesado':
        return 'Procesado';
      case 'pendiente':
        return 'Pendiente';
      case 'borrador':
        return 'Borrador';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status || 'Pendiente';
    }
  }

  getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
      case 'pagado':
      case 'aprobado':
        return CheckCircle;
      case 'procesado':
      case 'pendiente':
      case 'borrador':
        return Clock;
      case 'cancelado':
        return XCircle;
      default:
        return Clock;
    }
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
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByPayrollId(index: number, payroll: Payroll): number {
    return payroll.payroll_id;
  }

  trackByPageNumber(index: number, page: number): number {
    return page;
  }

  private calculateGlobalTotals(payrolls: Payroll[]) {
    const totalGross = payrolls.reduce((sum, payroll) => sum + (payroll.gross_salary || 0), 0);
    const totalNet = payrolls.reduce((sum, payroll) => sum + (payroll.net_salary || 0), 0);
    const totalDeductions = payrolls.reduce((sum, payroll) => sum + (payroll.total_deductions || 0), 0);
    
    this.totalGrossGlobal.set(totalGross);
    this.totalNetGlobal.set(totalNet);
    this.totalDeductionsGlobal.set(totalDeductions);
  }

  // Métodos de utilidad para verificar acciones disponibles
  canProcess(payroll: Payroll): boolean {
    return payroll.status === 'borrador' || payroll.status === 'pendiente';
  }

  canApprove(payroll: Payroll): boolean {
    return payroll.status === 'procesado';
  }

  canDownload(payroll: Payroll): boolean {
    return payroll.status === 'aprobado' || payroll.status === 'pagado';
  }

  canEdit(payroll: Payroll): boolean {
    return payroll.status === 'borrador';
  }

  // Método para obtener estadísticas del período actual
  getPeriodStats() {
    const currentPayrolls = this.filteredPayrolls();
    return {
      total: currentPayrolls.length,
      borrador: currentPayrolls.filter(p => p.status === 'borrador').length,
      procesado: currentPayrolls.filter(p => p.status === 'procesado').length,
      aprobado: currentPayrolls.filter(p => p.status === 'aprobado').length,
      pagado: currentPayrolls.filter(p => p.status === 'pagado').length,
      totalAmount: currentPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0)
    };
  }

  editPayroll(payroll: Payroll) {
    this.router.navigate(['/hr/payroll/edit', payroll.payroll_id]);
  }
}