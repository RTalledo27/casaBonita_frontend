import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Gift, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, Target, Edit, Trash2 } from 'lucide-angular';
import { BonusService } from '../../services/bonus.service';
import { Bonus } from '../../models/bonus';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-bonus-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './bonus-detail.component.html',
  styleUrls: ['./bonus-detail.component.scss']
})
export class BonusDetailComponent implements OnInit {
  private bonusService = inject(BonusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Señales para el estado del componente
  bonus = signal<Bonus | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Iconos
  ArrowLeft = ArrowLeft;
  Gift = Gift;
  User = User;
  Calendar = Calendar;
  DollarSign = DollarSign;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  Target = Target;
  Edit = Edit;
  Trash2 = Trash2;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBonus(parseInt(id));
    }
  }

  async loadBonus(id: number) {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const bonus = await this.bonusService.getBonus(id).toPromise();
      this.bonus.set(bonus || null);
    } catch (error) {
      console.error('Error loading bonus:', error);
      this.error.set('Error al cargar el bono');
      this.toastService.error('Error al cargar el bono');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/hr/bonuses']);
  }

  editBonus() {
    const bonus = this.bonus();
    if (bonus) {
      this.router.navigate(['/hr/bonuses/edit', bonus.bonus_id]);
    }
  }

  async deleteBonus() {
    const bonus = this.bonus();
    if (!bonus) return;

    if (!confirm(`¿Estás seguro de que deseas eliminar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      await this.bonusService.deleteBonus(bonus.bonus_id).toPromise();
      this.toastService.success('Bono eliminado exitosamente');
      this.router.navigate(['/hr/bonuses']);
    } catch (error) {
      console.error('Error deleting bonus:', error);
      this.toastService.error('Error al eliminar el bono');
    }
  }

  async approveBonus() {
    const bonus = this.bonus();
    if (!bonus) return;

    if (!confirm(`¿Aprobar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      // TODO: Implement bonus approval when backend method is available
      this.toastService.success('Bono aprobado exitosamente');
      this.loadBonus(bonus.bonus_id);
    } catch (error) {
      console.error('Error approving bonus:', error);
      this.toastService.error('Error al aprobar el bono');
    }
  }

  async rejectBonus() {
    const bonus = this.bonus();
    if (!bonus) return;

    if (!confirm(`¿Rechazar el bono "${bonus.bonus_name}"?`)) {
      return;
    }

    try {
      // TODO: Implement bonus rejection when backend method is available
      this.toastService.success('Bono rechazado');
      this.loadBonus(bonus.bonus_id);
    } catch (error) {
      console.error('Error rejecting bonus:', error);
      this.toastService.error('Error al rechazar el bono');
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'aprobado':
        return CheckCircle;
      case 'rechazado':
        return XCircle;
      case 'pendiente':
        return Clock;
      default:
        return Clock;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aprobado':
        return 'status-approved';
      case 'rechazado':
        return 'status-rejected';
      case 'pendiente':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'No disponible';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount);
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonthName(month: number | undefined): string {
    if (!month) return '';
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  }

  canEdit(): boolean {
    const bonus = this.bonus();
    return bonus?.payment_status === 'pendiente';
  }

  canApprove(): boolean {
    const bonus = this.bonus();
    return bonus?.payment_status === 'pendiente';
  }

  canReject(): boolean {
    const bonus = this.bonus();
    return bonus?.payment_status === 'pendiente';
  }

  canDelete(): boolean {
    const bonus = this.bonus();
    return bonus?.payment_status === 'pendiente';
  }
}