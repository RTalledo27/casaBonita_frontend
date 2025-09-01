import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Search, Filter, Edit, Trash2, Gift, Calendar, User, DollarSign, CheckCircle } from 'lucide-angular';

import { Incentive } from '../../models/incentive';
import { IncentiveService } from '../../services/incentive.service';

@Component({
  selector: 'app-incentive-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './incentive-list.component.html',
  styleUrls: ['./incentive-list.component.scss']
})
export class IncentiveListComponent implements OnInit {
  // Icons
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Gift = Gift;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly DollarSign = DollarSign;
  readonly CheckCircle = CheckCircle;

  // State
  incentives = signal<Incentive[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal<string>('');
  statusFilter = signal<'all' | 'activo' | 'completado' | 'pagado' | 'cancelado'>('all');

  // Computed
  filteredIncentives = computed(() => {
    let incentives = this.incentives();
    
    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      incentives = incentives.filter(incentive =>
        incentive.description?.toLowerCase().includes(term) ||
        incentive.employee?.user?.first_name?.toLowerCase().includes(term) ||
        incentive.employee?.user?.last_name?.toLowerCase().includes(term) ||
        incentive.employee?.employee_code?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter() !== 'all') {
      incentives = incentives.filter(incentive => incentive.status === this.statusFilter());
    }

    return incentives;
  });

  constructor(
    private incentiveService: IncentiveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIncentives();
  }

  loadIncentives(): void {
    this.loading.set(true);
    this.error.set(null);

    this.incentiveService.getAll().subscribe({
      next: (incentives) => {
        this.incentives.set(incentives);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.error.set('Error al cargar los incentivos');
        this.loading.set(false);
        console.error('Error loading incentives:', error);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onStatusFilterChange(status: string | null): void {
    const validStatus = status as 'all' | 'activo' | 'completado' | 'pagado' | 'cancelado';
    this.statusFilter.set(validStatus || 'all');
  }

  onNewIncentive(): void {
    this.router.navigate(['/hr/incentives/new']);
  }

  onEditIncentive(incentive: Incentive): void {
    this.router.navigate(['/hr/incentives/edit', incentive.incentive_id]);
  }

  onMarkAsCompleted(incentive: Incentive): void {
    if (confirm(`¿Marcar el incentivo como completado?`)) {
      this.incentiveService.markAsCompleted(incentive.incentive_id).subscribe({
        next: (updatedIncentive) => {
          const incentives = this.incentives();
          const index = incentives.findIndex(i => i.incentive_id === incentive.incentive_id);
          if (index !== -1) {
            incentives[index] = updatedIncentive;
            this.incentives.set([...incentives]);
          }
        },
        error: (error: any) => {
          this.error.set('Error al marcar el incentivo como completado');
          console.error('Error marking incentive as completed:', error);
        }
      });
    }
  }

  onMarkAsPaid(incentive: Incentive): void {
    if (confirm(`¿Marcar el incentivo como pagado?`)) {
      this.incentiveService.markAsPaid(incentive.incentive_id).subscribe({
        next: (updatedIncentive) => {
          const incentives = this.incentives();
          const index = incentives.findIndex(i => i.incentive_id === incentive.incentive_id);
          if (index !== -1) {
            incentives[index] = updatedIncentive;
            this.incentives.set([...incentives]);
          }
        },
        error: (error: any) => {
          this.error.set('Error al marcar el incentivo como pagado');
          console.error('Error marking incentive as paid:', error);
        }
      });
    }
  }

  onDeleteIncentive(incentive: Incentive): void {
    if (confirm(`¿Estás seguro de que deseas eliminar este incentivo?`)) {
      this.incentiveService.delete(incentive.incentive_id).subscribe({
        next: () => {
          const incentives = this.incentives().filter(i => i.incentive_id !== incentive.incentive_id);
          this.incentives.set(incentives);
        },
        error: (error: any) => {
          this.error.set('Error al eliminar el incentivo');
          console.error('Error deleting incentive:', error);
        }
      });
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'activo': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-blue-100 text-blue-800',
      'pagado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'activo': 'Activo',
      'completado': 'Completado',
      'pagado': 'Pagado',
      'cancelado': 'Cancelado'
    };
    return statusLabels[status] || status;
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO');
  }

  // Helper methods for counting incentives by status
  getPendingCount(): number {
    return this.incentives()?.filter(i => i.status === 'activo').length || 0;
  }

  getCompletedCount(): number {
    return this.incentives()?.filter(i => i.status === 'completado').length || 0;
  }

  getPaidCount(): number {
    return this.incentives()?.filter(i => i.status === 'pagado').length || 0;
  }

  getEmployeeFullName(incentive: Incentive): string {
    if (incentive.employee?.user) {
      return `${incentive.employee.user.first_name} ${incentive.employee.user.last_name}`;
    }
    return 'N/A';
  }

  isPending(incentive: Incentive): boolean {
    return incentive.status === 'activo';
  }

  isCompleted(incentive: Incentive): boolean {
    return incentive.status === 'completado';
  }

  canMarkAsCompleted(incentive: Incentive): boolean {
    return incentive.status === 'activo';
  }

  canMarkAsPaid(incentive: Incentive): boolean {
    return incentive.status === 'completado';
  }

  canEdit(incentive: Incentive): boolean {
    return incentive.status === 'activo';
  }

  canDelete(incentive: Incentive): boolean {
    return incentive.status === 'activo';
  }
}
