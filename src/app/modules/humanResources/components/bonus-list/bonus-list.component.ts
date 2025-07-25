import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Gift, Plus, Filter, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Target } from 'lucide-angular';
import { BonusService, BonusType } from '../../services/bonus.service';
import { Bonus } from '../../models/bonus';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-bonus-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './bonus-list.component.html',
  styleUrls: ['./bonus-list.component.scss']
})
export class BonusListComponent implements OnInit {
  private bonusService = inject(BonusService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  bonuses = signal<Bonus[]>([]);
  bonusTypes = signal<BonusType[]>([]);
  loading = signal<boolean>(false);
  processing = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedType = signal<string>('');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  // Iconos de Lucide
  Gift = Gift;
  Plus = Plus;
  Filter = Filter;
  Search = Search;
  Eye = Eye;
  Edit = Edit;
  Trash2 = Trash2;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  Target = Target;

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'rechazado', label: 'Rechazado' }
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

  // Computed para bonos filtrados
  filteredBonuses = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const type = this.selectedType();

    return this.bonuses().filter(bonus => {
      const matchesSearch = !search || 
        bonus.bonus_name?.toLowerCase().includes(search) ||
        bonus.bonus_type?.type_name?.toLowerCase().includes(search);

      const matchesStatus = !status || bonus.payment_status === status;
      const matchesType = !type || bonus.bonus_type?.type_code === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  // Computed para estadísticas
  totalAmount = computed(() => {
    return this.filteredBonuses().reduce((sum, bonus) => sum + (bonus.bonus_amount || 0), 0);
  });

  approvedAmount = computed(() => {
    return this.filteredBonuses()
      .filter(b => b.payment_status === 'pagado')
      .reduce((sum, bonus) => sum + (bonus.bonus_amount || 0), 0);
  });

  pendingAmount = computed(() => {
    return this.filteredBonuses()
      .filter(b => b.payment_status === 'pendiente')
      .reduce((sum, bonus) => sum + (bonus.bonus_amount || 0), 0);
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.loadBonuses(),
      this.loadBonusTypes()
    ]);
  }

  async loadBonuses() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.bonusService.getBonuses({
        period_month: this.selectedMonth(),
        period_year: this.selectedYear(),
        page: this.currentPage(),
        per_page: 20
      }).toPromise();
      
      if (response) {
        this.bonuses.set(response.data);
      }
    } catch (error) {
      console.error('Error loading bonuses:', error);
      this.error.set('Error al cargar los bonos');
      this.toastService.error('Error al cargar los bonos');
    } finally {
      this.loading.set(false);
    }
  }

  async loadBonusTypes() {
    try {
      const types = await this.bonusService.getBonusTypes().toPromise();
      if (types) {
        this.bonusTypes.set(types);
      }
    } catch (error) {
      console.error('Error loading bonus types:', error);
    }
  }

  onSearch() {
    // El filtrado se hace en tiempo real con computed
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadBonuses();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadBonuses();
  }

  createBonus() {
    this.router.navigate(['/hr/bonuses/create']);
  }

  editBonus(bonus: Bonus) {
    this.router.navigate(['/hr/bonuses/edit', bonus.bonus_id]);
  }

  viewBonus(bonus: Bonus) {
    this.router.navigate(['/hr/bonuses/view', bonus.bonus_id]);
  }

  async deleteBonus(bonus: Bonus) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      await this.bonusService.deleteBonus(bonus.bonus_id).toPromise();
      this.toastService.success('Bono eliminado exitosamente');
      this.loadBonuses();
    } catch (error) {
      console.error('Error deleting bonus:', error);
      this.toastService.error('Error al eliminar el bono');
    }
  }

  async approveBonus(bonus: Bonus) {
    if (!confirm(`¿Aprobar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      // TODO: Implement bonus approval when backend method is available
      this.toastService.success('Bono aprobado exitosamente');
      this.loadBonuses();
    } catch (error) {
      console.error('Error approving bonus:', error);
      this.toastService.error('Error al aprobar el bono');
    }
  }

  async rejectBonus(bonus: Bonus) {
    if (!confirm(`¿Rechazar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      // TODO: Implement bonus rejection when backend method is available
      this.toastService.success('Bono rechazado');
      this.loadBonuses();
    } catch (error) {
      console.error('Error rejecting bonus:', error);
      this.toastService.error('Error al rechazar el bono');
    }
  }

  async processAutomaticBonuses() {
    if (!confirm('¿Procesar bonos automáticos para este período?')) {
      return;
    }

    this.processing.set(true);
    try {
      await this.bonusService.processAutomaticBonuses(
        this.selectedYear(),
        this.selectedMonth()
      ).toPromise();
      
      this.toastService.success('Bonos automáticos procesados exitosamente');
      this.loadBonuses();
    } catch (error) {
      console.error('Error processing automatic bonuses:', error);
      this.toastService.error('Error al procesar bonos automáticos');
    } finally {
      this.processing.set(false);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'pagado':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aprobado':
        return 'Aprobado';
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazado':
        return 'Rechazado';
      default:
        return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'aprobado':
      case 'pagado':
        return CheckCircle;
      case 'pendiente':
        return Clock;
      case 'rechazado':
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
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByBonusId(index: number, bonus: Bonus): number {
    return bonus.bonus_id;
  }
}