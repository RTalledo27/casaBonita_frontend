import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, DollarSign, Calendar, Filter, Search, Eye, CheckCircle, XCircle, Clock, TrendingUp, Plus, Edit, Trash2, FileText } from 'lucide-angular';
import { CommissionService } from '../../services/commission.service';
import { Commission } from '../../models/commission';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-commission-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './commission-list.component.html',
  styleUrls: ['./commission-list.component.scss']
})
export class CommissionListComponent implements OnInit {
  private commissionService = inject(CommissionService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  commissions = signal<Commission[]>([]);
  loading = signal<boolean>(false);
  processing = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalCommissions = signal<number>(0);

  // Iconos de Lucide
  DollarSign = DollarSign;
  Calendar = Calendar;
  Filter = Filter;
  Search = Search;
  Eye = Eye;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  TrendingUp = TrendingUp;
  Plus = Plus;
  Edit = Edit;
  Trash2 = Trash2;
  FileText = FileText;

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'pagado', label: 'Pagada' },
    { value: 'cancelado', label: 'Cancelada' }
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

  // Computed para comisiones filtradas
  filteredCommissions = computed(() => {
    const commissions = this.commissions();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();

    return commissions.filter(commission => {
      const matchesSearch = !search || 
        commission.employee?.user?.first_name?.toLowerCase().includes(search) ||
        commission.employee?.user?.last_name?.toLowerCase().includes(search) ||
        commission.employee?.employee_code?.toLowerCase().includes(search);

      const matchesStatus = !status || commission.payment_status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // Computed para estadísticas
  totalAmount = computed(() => {
    return this.filteredCommissions().reduce((sum, commission) => sum + (commission.commission_amount || 0), 0);
  });

  paidAmount = computed(() => {
    return this.filteredCommissions()
      .filter(c => c.payment_status === 'pagado')
      .reduce((sum, commission) => sum + (commission.commission_amount || 0), 0);
  });

  pendingAmount = computed(() => {
    const filtered = this.filteredCommissions();
    const pending = filtered.filter(c => c.payment_status === 'pendiente');
    
    return pending.reduce((sum, commission) => {
      const amount = commission.commission_amount;
      // Convertir a número de forma segura
      let numericAmount = 0;
      if (typeof amount === 'string') {
        numericAmount = parseFloat(amount) || 0;
      } else if (typeof amount === 'number') {
        numericAmount = amount;
      }
      return sum + numericAmount;
    }, 0);
  });

  ngOnInit() {
    this.loadCommissions();
  }

  async loadCommissions() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.commissionService.getCommissions({
        period_month: this.selectedMonth(),
        period_year: this.selectedYear(),
        payment_status: this.selectedStatus(),
        search: this.searchTerm(),
        page: this.currentPage(),
        per_page: 20
      }).toPromise();
      
      if (response) {
        console.log('=== COMMISSION DATA FROM API ===');
        console.log('Total commissions received:', response.data.length);
        
        // Check pending commissions specifically
        const pendingFromAPI = response.data.filter(c => c.payment_status === 'pendiente');
        console.log('Pending commissions from API:', pendingFromAPI.length);
        
        let apiPendingTotal = 0;
        pendingFromAPI.forEach(c => {
          const amount = typeof c.commission_amount === 'string' ? parseFloat(c.commission_amount) : (c.commission_amount || 0);
          apiPendingTotal += amount;
          console.log(`API Commission ${c.commission_id}: ${c.commission_amount} (${typeof c.commission_amount}) -> ${amount}`);
        });
        
        console.log('API Pending Total:', apiPendingTotal);
        console.log('=== END API DATA ===');
        
        this.commissions.set(response.data);
        this.totalPages.set(response.meta?.last_page || 1);
        this.totalCommissions.set(response.meta?.total || 0);
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
      this.error.set('Error al cargar las comisiones');
      this.toastService.error('Error al cargar las comisiones');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadCommissions();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadCommissions();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadCommissions();
  }

  createCommission() {
    this.router.navigate(['/hr/commissions/create']);
  }

  viewSalesDetail() {
    this.router.navigate(['/hr/commissions/sales-detail']);
  }

  editCommission(commission: Commission) {
    this.router.navigate(['/hr/commissions/edit', commission.commission_id]);
  }

  viewCommissionDetail(commission: Commission) {
    this.router.navigate(['/hr/commissions/view', commission.commission_id]);
  }

  async deleteCommission(commission: Commission) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la comisión de ${commission.employee?.user?.first_name} ${commission.employee?.user?.last_name}?`)) {
      return;
    }

    try {
      await this.commissionService.deleteCommission(commission.commission_id).toPromise();
      this.toastService.success('Comisión eliminada exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error deleting commission:', error);
      this.toastService.error('Error al eliminar la comisión');
    }
  }

  async processCommissions() {
    if (!confirm('¿Estás seguro de que deseas procesar las comisiones para este período?')) {
      return;
    }

    this.processing.set(true);
    try {
      await this.commissionService.processCommissionsForPeriod(
        this.selectedYear(),
        this.selectedMonth()
      ).toPromise();
      
      this.toastService.success('Comisiones procesadas exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error processing commissions:', error);
      this.toastService.error('Error al procesar las comisiones');
    } finally {
      this.processing.set(false);
    }
  }

  canPayCommission(commission: Commission): boolean {
    return commission.payment_status === 'pendiente';
  }

  canEditCommission(commission: Commission): boolean {
    return commission.payment_status !== 'pagado';
  }

  canDeleteCommission(commission: Commission): boolean {
    return commission.payment_status !== 'pagado';
  }

  async payCommission(commission: Commission) {
    if (!confirm(`¿Confirmar el pago de la comisión de ${commission.employee?.user?.first_name} ${commission.employee?.user?.last_name}?`)) {
      return;
    }

    try {
      await this.commissionService.payCommissions([commission.commission_id]).toPromise();
      this.toastService.success('Comisión pagada exitosamente');
      this.loadCommissions();
    } catch (error) {
      console.error('Error paying commission:', error);
      this.toastService.error('Error al pagar la comisión');
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'pagado':
        return CheckCircle;
      case 'pendiente':
        return Clock;
      case 'cancelado':
        return XCircle;
      default:
        return Clock;
    }
  }

  getCommissionTypeLabel(type: string | undefined): string {
    if (!type) return 'No especificado';
    
    switch (type) {
      case 'sale': return 'Venta';
      case 'bonus': return 'Bono';
      case 'incentive': return 'Incentivo';
      default: return type;
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
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByCommissionId(index: number, commission: Commission): number {
    return commission.commission_id;
  }
}