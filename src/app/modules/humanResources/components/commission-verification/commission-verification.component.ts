import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Shield, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Settings, RefreshCw, Filter, Search, Calendar, DollarSign, FileText, Users, TrendingUp } from 'lucide-angular';

import { CommissionVerificationService } from '../../services/commission-verification.service';
import { CommissionService } from '../../services/commission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Commission, CommissionVerificationFilters, VerificationStats, CommissionVerificationStatus, VerificationSettings, AutoVerificationResult } from '../../models/commission';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-commission-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './commission-verification.component.html',
  styleUrls: ['./commission-verification.component.scss']
})
export class CommissionVerificationComponent implements OnInit {
  private verificationService = inject(CommissionVerificationService);
  private commissionService = inject(CommissionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Icons
  Shield = Shield;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  AlertTriangle = AlertTriangle;
  Eye = Eye;
  Settings = Settings;
  RefreshCw = RefreshCw;
  Filter = Filter;
  Search = Search;
  Calendar = Calendar;
  DollarSign = DollarSign;
  FileText = FileText;
  Users = Users;
  TrendingUp = TrendingUp;

  // State signals
  commissionsRequiringVerification = signal<Commission[]>([]);
  verificationStats = signal<VerificationStats | null>(null);
  isLoading = signal(false);
  isProcessingAutoVerifications = signal(false);
  selectedCommissions = signal<Set<number>>(new Set());
  showFilters = signal(false);
  showBulkActions = signal(false);

  // Filter signals
  filters = signal<CommissionVerificationFilters>({
    verification_status: undefined,
    payment_dependency_type: undefined,
    employee_id: undefined,
    contract_id: undefined,
    date_from: undefined,
    date_to: undefined,
    auto_verification_enabled: undefined,
    requires_manual_review: undefined
  });

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(20);

  // Computed properties
  filteredCommissions = computed(() => {
    const commissions = this.commissionsRequiringVerification();
    const search = this.searchTerm().toLowerCase();
    
    if (!search) return commissions;
    
    return commissions.filter(commission => 
      commission.employee?.first_name?.toLowerCase().includes(search) ||
      commission.employee?.last_name?.toLowerCase().includes(search) ||
      commission.contract_id?.toString().includes(search) ||
      commission.commission_id?.toString().includes(search)
    );
  });

  paginatedCommissions = computed(() => {
    const filtered = this.filteredCommissions();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.filteredCommissions().length;
    const perPage = this.itemsPerPage();
    return Math.ceil(total / perPage);
  });

  maxItemsShown = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCommissions().length);
  });

  hasSelectedCommissions = computed(() => {
    return this.selectedCommissions().size > 0;
  });
  
  areAllVisibleSelected = computed(() => {
    const visible = this.paginatedCommissions();
    const selected = this.selectedCommissions();
    return visible.length > 0 && visible.every(c => selected.has(c.commission_id!));
  });

  ngOnInit() {
    this.loadCommissionsRequiringVerification();
    this.loadVerificationStats();
  }

  /**
   * Carga comisiones que requieren verificación
   */
  loadCommissionsRequiringVerification() {
    this.isLoading.set(true);
    
    this.verificationService.getCommissionsRequiringVerification(this.filters()).subscribe({
      next: (response) => {
        this.commissionsRequiringVerification.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading commissions requiring verification:', error);
        this.toastService.error('Error al cargar comisiones pendientes de verificación');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Carga estadísticas de verificación
   */
  loadVerificationStats() {
    this.verificationService.getVerificationStats().subscribe({
      next: (stats) => {
        this.verificationStats.set(stats);
      },
      error: (error) => {
        console.error('Error loading verification stats:', error);
      }
    });
  }

  /**
   * Procesa verificaciones automáticas
   */
  processAutomaticVerifications() {
    this.isProcessingAutoVerifications.set(true);
    
    this.verificationService.processAutomaticVerifications().subscribe({
      next: (result) => {
        this.toastService.success(`Verificaciones automáticas procesadas: ${result.verified_count} verificadas de ${result.processed_count} comisiones`);
        this.loadCommissionsRequiringVerification();
        this.loadVerificationStats();
        this.isProcessingAutoVerifications.set(false);
      },
      error: (error) => {
        console.error('Error processing automatic verifications:', error);
        this.toastService.error('Error al procesar verificaciones automáticas');
        this.isProcessingAutoVerifications.set(false);
      }
    });
  }

  /**
   * Verifica manualmente una comisión específica
   */
  verifyCommission(commission: Commission) {
    this.verificationService.verifyCommissionPayments(commission.commission_id!).subscribe({
      next: (result) => {
        this.toastService.success('Comisión verificada exitosamente');
        this.loadCommissionsRequiringVerification();
        this.loadVerificationStats();
      },
      error: (error) => {
        console.error('Error verifying commission:', error);
        this.toastService.error('Error al verificar la comisión');
      }
    });
  }

  /**
   * Verifica múltiples comisiones seleccionadas
   */
  verifySelectedCommissions() {
    const selectedIds = Array.from(this.selectedCommissions());
    
    if (selectedIds.length === 0) {
      this.toastService.error('Selecciona al menos una comisión para verificar');
      return;
    }
    
    this.verificationService.verifyMultipleCommissions(selectedIds).subscribe({
      next: (result) => {
        this.toastService.success(`${result.verified_count} comisiones verificadas exitosamente`);
        this.selectedCommissions.set(new Set());
        this.loadCommissionsRequiringVerification();
        this.loadVerificationStats();
      },
      error: (error) => {
        console.error('Error verifying multiple commissions:', error);
        this.toastService.error('Error al verificar las comisiones seleccionadas');
      }
    });
  }

  /**
   * Obtiene el estado de verificación de una comisión
   */
  getVerificationStatus(commission: Commission) {
    if (!commission.commission_id) return;
    
    this.verificationService.getVerificationStatus(commission.commission_id).subscribe({
      next: (status) => {
        // Actualizar el estado en la comisión local
        const commissions = this.commissionsRequiringVerification();
        const index = commissions.findIndex(c => c.commission_id === commission.commission_id);
        if (index !== -1) {
          // Mapear el estado de verificación a los valores esperados
          let mappedStatus: 'pending' | 'verified' | 'partially_verified' | 'failed';
          switch (status.verification_status) {
            case 'pending_verification':
              mappedStatus = 'pending';
              break;
            case 'fully_verified':
              mappedStatus = 'verified';
              break;
            case 'first_payment_verified':
            case 'second_payment_verified':
              mappedStatus = 'partially_verified';
              break;
            case 'verification_failed':
              mappedStatus = 'failed';
              break;
            default:
              mappedStatus = 'pending';
          }
          commissions[index] = { ...commissions[index], payment_verification_status_new: mappedStatus };
          this.commissionsRequiringVerification.set([...commissions]);
        }
      },
      error: (error) => {
        console.error('Error getting verification status:', error);
      }
    });
  }

  /**
   * Navega al detalle de una comisión
   */
  viewCommissionDetail(commission: Commission) {
    this.router.navigate(['/human-resources/commissions', commission.commission_id]);
  }

  /**
   * Abre configuración de verificación para una comisión
   */
  openVerificationSettings(commission: Commission) {
    // TODO: Implementar modal de configuración de verificación
    console.log('Opening verification settings for commission:', commission.commission_id);
  }

  /**
   * Maneja la selección/deselección de comisiones
   */
  toggleCommissionSelection(commissionId: number) {
    const selected = new Set(this.selectedCommissions());
    
    if (selected.has(commissionId)) {
      selected.delete(commissionId);
    } else {
      selected.add(commissionId);
    }
    
    this.selectedCommissions.set(selected);
  }

  /**
   * Selecciona/deselecciona todas las comisiones visibles
   */
  toggleAllCommissions() {
    const visibleCommissions = this.paginatedCommissions();
    const selected = new Set(this.selectedCommissions());
    const allSelected = visibleCommissions.every(c => selected.has(c.commission_id));
    
    if (allSelected) {
      // Deseleccionar todas las visibles
      visibleCommissions.forEach(c => selected.delete(c.commission_id));
    } else {
      // Seleccionar todas las visibles
      visibleCommissions.forEach(c => selected.add(c.commission_id));
    }
    
    this.selectedCommissions.set(selected);
  }
  
  /**
   * Limpia todas las selecciones
   */
  clearSelection() {
    this.selectedCommissions.set(new Set());
  }

  /**
   * Aplica filtros y recarga datos
   */
  applyFilters() {
    this.currentPage.set(1);
    this.loadCommissionsRequiringVerification();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.filters.set({
      verification_status: undefined,
      payment_dependency_type: undefined,
      employee_id: undefined,
      contract_id: undefined,
      date_from: undefined,
      date_to: undefined,
      auto_verification_enabled: undefined,
      requires_manual_review: undefined
    });
    this.searchTerm.set('');
    this.applyFilters();
  }

  /**
   * Cambia de página
   */
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Refresca todos los datos
   */
  refreshData() {
    this.loadCommissionsRequiringVerification();
    this.loadVerificationStats();
  }

  /**
   * Obtiene la clase CSS para el estado de verificación
   */
  getVerificationStatusClass(status: string): string {
    switch (status) {
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'first_payment_verified':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'second_payment_verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fully_verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'verification_failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  /**
   * Obtiene el texto legible para el estado de verificación
   */
  getVerificationStatusText(status: string): string {
    switch (status) {
      case 'pending_verification':
        return 'Pendiente';
      case 'first_payment_verified':
        return 'Primera Cuota';
      case 'second_payment_verified':
        return 'Segunda Cuota';
      case 'fully_verified':
        return 'Completamente Verificada';
      case 'verification_failed':
        return 'Verificación Fallida';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el ícono para el estado de verificación
   */
  getVerificationStatusIcon(status: string) {
    switch (status) {
      case 'pending_verification':
        return Clock;
      case 'first_payment_verified':
      case 'second_payment_verified':
        return CheckCircle;
      case 'fully_verified':
        return CheckCircle;
      case 'verification_failed':
        return XCircle;
      default:
        return AlertTriangle;
    }
  }
}