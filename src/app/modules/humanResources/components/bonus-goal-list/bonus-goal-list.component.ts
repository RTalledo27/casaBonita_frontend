import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Search, Filter, Edit, Trash2, Target, Calendar, Users, TrendingUp, AlertCircle, ChevronDown, Building2 } from 'lucide-angular';

import { BonusGoal } from '../../models/bonus-goal';
import { BonusGoalService, BonusGoalResponse } from '../../services/bonus-goal.service';
import { BonusGoalModalComponent } from '../bonus-goal-modal/bonus-goal-modal.component';

@Component({
  selector: 'app-bonus-goal-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BonusGoalModalComponent],
  templateUrl: './bonus-goal-list.component.html',
  styleUrls: ['./bonus-goal-list.component.scss']
})
export class BonusGoalListComponent implements OnInit {
  // Icons
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Target = Target;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly TrendingUp = TrendingUp;
  readonly AlertCircle = AlertCircle;
  readonly ChevronDown = ChevronDown;
  readonly Building2 = Building2;

  // State
  bonusGoals = signal<BonusGoal[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Modal state
  isModalOpen = signal(false);

  // Filters
  searchTerm = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Computed for loading state
  isLoading = computed(() => this.loading());

  // Computed
  filteredBonusGoals = computed(() => {
    let goals = this.bonusGoals();
    
    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      goals = goals.filter(goal => 
        goal.goal_name.toLowerCase().includes(term) ||
        (goal.description && goal.description.toLowerCase().includes(term)) ||
        goal.bonus_type?.type_name?.toLowerCase().includes(term) ||
        goal.team?.team_name?.toLowerCase().includes(term) ||
        goal.employee_type?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      goals = goals.filter(goal => goal.is_active === isActive);
    }

    return goals;
  });

  constructor(
    private bonusGoalService: BonusGoalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBonusGoals();
  }

  loadBonusGoals(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bonusGoalService.getBonusGoals().subscribe({
      next: (response: BonusGoalResponse) => {
        this.bonusGoals.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.error.set('Error al cargar las metas de bonos');
        this.loading.set(false);
        console.error('Error loading bonus goals:', error);
      }
    });
  }

  onSearch(): void {
    // The search is handled by the computed filteredBonusGoals
  }

  onFilterChange(): void {
    // The filter is handled by the computed filteredBonusGoals
  }

  onNewBonusGoal(): void {
    this.isModalOpen.set(true);
  }
  
  onModalClose(): void {
    this.isModalOpen.set(false);
  }
  
  onGoalCreated(goal: BonusGoal): void {
    // Refresh the list after creating a new goal
    this.loadBonusGoals();
    this.isModalOpen.set(false);
  }

  onEditBonusGoal(goal: BonusGoal): void {
    this.router.navigate(['/hr/bonus-goals/edit', goal.bonus_goal_id]);
  }

  onToggleStatus(goal: BonusGoal): void {
    this.bonusGoalService.toggleStatus(goal.bonus_goal_id).subscribe({
      next: (updatedGoal) => {
        const goals = this.bonusGoals();
        const index = goals.findIndex(g => g.bonus_goal_id === goal.bonus_goal_id);
        if (index !== -1) {
          goals[index] = updatedGoal;
          this.bonusGoals.set([...goals]);
        }
      },
      error: (error) => {
        this.error.set('Error al cambiar el estado de la meta');
        console.error('Error toggling bonus goal status:', error);
      }
    });
  }

  onDeleteBonusGoal(goal: BonusGoal): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la meta "${goal.goal_name}"?`)) {
      this.bonusGoalService.deleteBonusGoal(goal.bonus_goal_id).subscribe({
        next: () => {
          const goals = this.bonusGoals().filter(g => g.bonus_goal_id !== goal.bonus_goal_id);
          this.bonusGoals.set(goals);
        },
        error: (error: any) => {
          this.error.set('Error al eliminar la meta');
          console.error('Error deleting bonus goal:', error);
        }
      });
    }
  }

  // Utility methods
  getAchievementPercentage(goal: BonusGoal): number {
    // Para metas de bonos, no tenemos progreso actual, así que retornamos 0
    // Este método podría ser útil si se implementa tracking de progreso en el futuro
    return 0;
  }

  getAchievementStatus(goal: BonusGoal): 'low' | 'medium' | 'high' | 'complete' {
    // Para metas de bonos, el estado se basa en si está activa y vigente
    if (!goal.is_active) return 'low';
    
    const now = new Date();
    const validFrom = new Date(goal.valid_from);
    const validUntil = goal.valid_until ? new Date(goal.valid_until) : null;
    
    if (now < validFrom) return 'medium'; // Futura
    if (validUntil && now > validUntil) return 'low'; // Expirada
    return 'high'; // Activa y vigente
  }

  getStatusBadgeClass(goal: BonusGoal): string {
    return goal.is_active 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getAchievementBadgeClass(status: string): string {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    return new Date(date).toLocaleDateString('es-CO');
  }
}
