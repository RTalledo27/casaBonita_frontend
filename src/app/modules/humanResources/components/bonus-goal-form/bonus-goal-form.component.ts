import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, Target, Calendar, Users, TrendingUp, AlertCircle } from 'lucide-angular';

import { BonusGoal } from '../../models/bonus-goal';
import { BonusType } from '../../models/bonus-type';
import { Team } from '../../models/team';
import { BonusGoalService } from '../../services/bonus-goal.service';
import { BonusTypeService } from '../../services/bonus-type.service';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-bonus-goal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './bonus-goal-form.component.html',
  styleUrls: ['./bonus-goal-form.component.scss']
})
export class BonusGoalFormComponent implements OnInit {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Save = Save;
  readonly Target = Target;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly TrendingUp = TrendingUp;

  AlertCircle = AlertCircle;

  // Form
  bonusGoalForm: FormGroup;

  // State
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  bonusGoalId = signal<number | null>(null);

  // Data
  bonusTypes = signal<BonusType[]>([]);
  teams = signal<Team[]>([]);

  // Computed
  isEditMode = computed(() => this.bonusGoalId() !== null);

  constructor(
    private fb: FormBuilder,
    private bonusGoalService: BonusGoalService,
    private bonusTypeService: BonusTypeService,
    private teamService: TeamService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bonusGoalForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkEditMode();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      goal_name: ['', [Validators.required, Validators.maxLength(100)]],
      bonus_type_id: ['', Validators.required],
      team_id: [''],
      employee_type: [''],
      description: [''],
      target_value: ['', [Validators.required, Validators.min(0)]],
      achievement_percentage_100: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      achievement_percentage_150: ['', [Validators.min(0), Validators.max(100)]],
      bonus_amount: ['', [Validators.min(0)]],
      bonus_percentage: ['', [Validators.min(0), Validators.max(100)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      valid_from: ['', Validators.required],
      valid_until: [''],
      is_active: [true]
    });
  }

  private loadInitialData(): void {
    this.loading.set(true);

    // Load bonus types and teams in parallel
    Promise.all([
      this.bonusTypeService.getActiveBonusTypes().toPromise(),
      this.teamService.getTeams().toPromise()
    ]).then(([bonusTypes, teamsResponse]) => {
      this.bonusTypes.set(bonusTypes || []);
      console.log(this.bonusTypes())
      this.teams.set(teamsResponse?.data || []);
      this.loading.set(false);
    }).catch(error => {
      this.error.set('Error al cargar los datos iniciales');
      this.loading.set(false);
      console.error('Error loading initial data:', error);
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bonusGoalId.set(parseInt(id, 10));
      this.loadBonusGoal(parseInt(id, 10));
    }
  }

  private loadBonusGoal(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.bonusGoalService.getBonusGoal(id).subscribe({
      next: (goal) => {
        this.populateForm(goal);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.error.set('Error al cargar la meta de bono');
        this.loading.set(false);
        console.error('Error loading bonus goal:', error);
      }
    });
  }

  private populateForm(goal: BonusGoal): void {
    this.bonusGoalForm.patchValue({
      goal_name: goal.goal_name,
      bonus_type_id: goal.bonus_type_id,
      team_id: goal.team_id,
      employee_type: goal.employee_type,
      description: goal.description || '',
      target_value: goal.target_value || '',
      achievement_percentage_100: goal.min_achievement,
      achievement_percentage_150: goal.max_achievement,
      bonus_amount: goal.bonus_amount,
      bonus_percentage: goal.bonus_percentage,
      start_date: goal.valid_from,
      end_date: goal.valid_until,
      valid_from: goal.valid_from,
      valid_until: goal.valid_until,
      is_active: goal.is_active
    });
  }

  onSubmit(): void {
    if (this.bonusGoalForm.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formData = this.bonusGoalForm.value;
      
      // Sync date fields
      formData.valid_from = formData.start_date;
      formData.valid_until = formData.end_date;
      
      // Convert empty team_id to null
      if (!formData.team_id) {
        formData.team_id = null;
      }

      // Convert empty achievement_percentage_150 to null
      if (!formData.achievement_percentage_150) {
        formData.achievement_percentage_150 = null;
      }
      
      // Map form fields to API fields
      formData.min_achievement = formData.achievement_percentage_100;
      formData.max_achievement = formData.achievement_percentage_150;

      // Convert empty valid_until to null
      if (!formData.valid_until) {
        formData.valid_until = null;
      }

      const operation = this.isEditMode()
        ? this.bonusGoalService.updateBonusGoal(this.bonusGoalId()!, formData)
        : this.bonusGoalService.createBonusGoal(formData);

      operation.subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/hr/bonus-goals']);
        },
        error: (error: any) => {
          this.saving.set(false);
          this.error.set(
            this.isEditMode() 
              ? 'Error al actualizar la meta de bono' 
              : 'Error al crear la meta de bono'
          );
          console.error('Error saving bonus goal:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/hr/bonus-goals']);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.bonusGoalForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.bonusGoalForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `El valor máximo es ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bonusGoalForm.controls).forEach(key => {
      const control = this.bonusGoalForm.get(key);
      control?.markAsTouched();
    });
  }

  // Validation for date range
  validateDateRange(): boolean {
    const startDate = this.bonusGoalForm.get('start_date')?.value;
    const endDate = this.bonusGoalForm.get('end_date')?.value;
    
    if (startDate && endDate) {
      return new Date(startDate) < new Date(endDate);
    }
    return true;
  }

  // Validation for achievement range
  validateAchievementRange(): boolean {
    const minAchievement = this.bonusGoalForm.get('achievement_percentage_100')?.value;
    const maxAchievement = this.bonusGoalForm.get('achievement_percentage_150')?.value;
    
    if (minAchievement && maxAchievement) {
      return minAchievement <= maxAchievement;
    }
    return true;
  }

  // Get filtered bonus types (only active ones)
  getActiveBonusTypes(): BonusType[] {
    return this.bonusTypes().filter(type => type.is_active);
  }

  // Get filtered teams (only active ones)
  getActiveTeams(): Team[] {
    return this.teams().filter(team => team.status === 'active');
  }
}
