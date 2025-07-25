import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Filter, ToggleLeft, ToggleRight, Gift, AlertCircle } from 'lucide-angular';
import { BonusTypeService } from '../../services/bonus-type.service';
import { BonusType } from '../../models/bonus-type';

@Component({
  selector: 'app-bonus-type-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './bonus-type-list.component.html',
  styleUrl: './bonus-type-list.component.scss'
})
export class BonusTypeListComponent implements OnInit {
  private bonusTypeService = inject(BonusTypeService);
  private router = inject(Router);

  // Icons
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ToggleLeft = ToggleLeft;
  readonly ToggleRight = ToggleRight;

  Gift = Gift;
  AlertCircle = AlertCircle;


  // Signals
  bonusTypes = signal<BonusType[]>([]);
  filteredBonusTypes = signal<BonusType[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  ngOnInit() {
    this.loadBonusTypes();
  }

  onNewBonusType(): void {
    this.router.navigate(['/hr/bonus-types/create']);
  }

  onEditBonusType(bonusType: BonusType): void {
    this.router.navigate(['/hr/bonus-types', bonusType.bonus_type_id, 'edit']);
  }

  loadBonusTypes() {
    this.loading.set(true);
    this.error.set(null);

    this.bonusTypeService.getBonusTypes().subscribe({
      next: (response) => {
        this.bonusTypes.set(response.data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los tipos de bonos');
        this.loading.set(false);
        console.error('Error loading bonus types:', err);
      }
    });
  }

  applyFilters() {
    let filtered = this.bonusTypes();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(type => 
        type.type_name.toLowerCase().includes(term) ||
        type.type_code.toLowerCase().includes(term) ||
        type.description?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      filtered = filtered.filter(type => type.is_active === isActive);
    }

    this.filteredBonusTypes.set(filtered);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onStatusFilterChange(status: string | null) {
    const validStatus = status as 'all' | 'active' | 'inactive';
    this.statusFilter.set(validStatus || 'all');
    this.applyFilters();
  }

  toggleStatus(bonusType: BonusType) {
    this.bonusTypeService.toggleStatus(bonusType.bonus_type_id).subscribe({
      next: (updatedType) => {
        const types = this.bonusTypes();
        const index = types.findIndex(t => t.bonus_type_id === updatedType.bonus_type_id);
        if (index !== -1) {
          types[index] = updatedType;
          this.bonusTypes.set([...types]);
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        this.error.set('Error al cambiar el estado del tipo de bono');
      }
    });
  }

  deleteBonusType(bonusType: BonusType) {
    if (confirm(`¿Está seguro de eliminar el tipo de bono "${bonusType.type_name}"?`)) {
      this.bonusTypeService.deleteBonusType(bonusType.bonus_type_id).subscribe({
        next: () => {
          const types = this.bonusTypes().filter(t => t.bonus_type_id !== bonusType.bonus_type_id);
          this.bonusTypes.set(types);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting bonus type:', err);
          this.error.set('Error al eliminar el tipo de bono');
        }
      });
    }
  }

  getCalculationMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'percentage_of_goal': 'Porcentaje de Meta',
      'fixed_amount': 'Monto Fijo',
      'sales_count': 'Cantidad de Ventas',
      'collection_amount': 'Monto de Cobranza',
      'attendance_rate': 'Tasa de Asistencia',
      'custom': 'Personalizado'
    };
    return labels[method] || 'Desconocido';
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'biweekly': 'Quincenal',
      'annual': 'Anual',
      'one_time': 'Una vez'
    };
    return labels[frequency] || 'Desconocido';
  }
}
