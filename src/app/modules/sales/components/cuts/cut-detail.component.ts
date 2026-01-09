import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SalesCutService } from '../../services/sales-cut.service';
import { SalesCut, SalesCutItem } from '../../models/sales-cut.model';

@Component({
  selector: 'app-cut-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      @if (isLoading() && !cut()) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (error()) {
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-600 font-medium mb-4">{{ error() }}</p>
          <button (click)="goBack()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Volver
          </button>
        </div>
      } @else if (cut()) {
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <button
                  (click)="goBack()"
                  class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                </button>
                <h1 class="text-3xl font-bold text-gray-900">Corte #{{ cut()!.cut_id }}</h1>
                <span class="px-3 py-1 rounded-full text-sm font-semibold {{ cutService.getStatusClass(cut()!.status) }}">
                  {{ cutService.getStatusLabel(cut()!.status) }}
                </span>
              </div>
              <p class="text-gray-600 ml-14">{{ formatDate(cut()!.cut_date) }}</p>
            </div>
            <div class="flex gap-3">
              @if (cut()!.status === 'open') {
                <button
                  (click)="closeCut()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Cerrar Corte
                </button>
              } @else if (cut()!.status === 'closed') {
                <button
                  (click)="reviewCut()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  Marcar como Revisado
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Metrics Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p class="text-sm font-medium text-gray-600 mb-2">Ventas</p>
            <p class="text-3xl font-bold text-gray-900">{{ cut()!.total_sales_count }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ cutService.formatCurrency(cut()!.total_revenue) }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p class="text-sm font-medium text-gray-600 mb-2">Pagos</p>
            <p class="text-3xl font-bold text-gray-900">{{ cut()!.total_payments_count }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ cutService.formatCurrency(cut()!.total_payments_received) }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p class="text-sm font-medium text-gray-600 mb-2">Comisiones</p>
            <p class="text-3xl font-bold text-gray-900">{{ cutService.formatCurrency(cut()!.total_commissions) }}</p>
            <p class="text-sm text-gray-500 mt-1">3% de ventas</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p class="text-sm font-medium text-gray-600 mb-2">Balance Total</p>
            <p class="text-3xl font-bold text-gray-900">{{ cutService.formatCurrency(cut()!.cash_balance + cut()!.bank_balance) }}</p>
            <div class="flex justify-between text-xs mt-2">
              <span class="text-gray-500">Efectivo: {{ cutService.formatCurrency(cut()!.cash_balance) }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Tab Headers -->
          <div class="border-b border-gray-200">
            <div class="flex">
              <button
                (click)="activeTab.set('sales')"
                class="px-6 py-4 font-semibold transition-colors {{ activeTab() === 'sales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900' }}">
                Ventas ({{ salesItems().length }})
              </button>
              <button
                (click)="activeTab.set('payments')"
                class="px-6 py-4 font-semibold transition-colors {{ activeTab() === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900' }}">
                Pagos ({{ paymentItems().length }})
              </button>
              <button
                (click)="activeTab.set('commissions')"
                class="px-6 py-4 font-semibold transition-colors {{ activeTab() === 'commissions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900' }}">
                Comisiones ({{ commissionItems().length }})
              </button>
              <button
                (click)="activeTab.set('notes')"
                class="px-6 py-4 font-semibold transition-colors {{ activeTab() === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900' }}">
                Notas
              </button>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Sales Tab -->
            @if (activeTab() === 'sales') {
              @if (salesItems().length === 0) {
                <div class="text-center py-12">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  <p class="text-gray-600">No hay ventas en este corte</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (item of salesItems(); track item.item_id) {
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div class="flex-1">
                        <p class="font-semibold text-gray-900">
                          {{ item.contract?.client ? (item.contract.client.first_name + ' ' + item.contract.client.last_name) : 'Cliente' }}
                        </p>
                        <p class="text-sm text-gray-600">
                          Contrato: {{ item.contract?.contract_number || 'N/A' }} • 
                          Lote: {{ item.contract?.lot?.num_lot || 'N/A' }}
                          @if (item.employee?.user) {
                            • Asesor: {{ item.employee.user.first_name }} {{ item.employee.user.last_name }}
                          }
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-gray-900">{{ cutService.formatCurrency(item.amount) }}</p>
                        @if (item.commission) {
                          <p class="text-xs text-purple-600">Com: {{ cutService.formatCurrency(item.commission) }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            }

            <!-- Payments Tab -->
            @if (activeTab() === 'payments') {
              @if (paymentItems().length === 0) {
                <div class="text-center py-12">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p class="text-gray-600">No hay pagos en este corte</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (item of paymentItems(); track item.item_id) {
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div class="flex-1">
                        <p class="font-semibold text-gray-900">
                          {{ item.contract?.client ? (item.contract.client.first_name + ' ' + item.contract.client.last_name) : 'Cliente' }}
                        </p>
                        <p class="text-sm text-gray-600">
                          Contrato: {{ item.contract?.contract_number || 'N/A' }}
                          @if (item.payment_schedule) {
                            • Cuota #{{ item.payment_schedule.installment_number }} ({{ item.payment_schedule.type }})
                          }
                          @if (item.payment_method) {
                            • {{ cutService.getPaymentMethodLabel(item.payment_method) }}
                          }
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-green-600">{{ cutService.formatCurrency(item.amount) }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            <!-- Commissions Tab -->
            @if (activeTab() === 'commissions') {
              @if (commissionItems().length === 0) {
                <div class="text-center py-12">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-gray-600">No hay comisiones en este corte</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (item of commissionItems(); track item.item_id) {
                    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                      <div class="flex-1">
                        <p class="font-semibold text-gray-900">
                          {{ item.employee?.user ? (item.employee.user.first_name + ' ' + item.employee.user.last_name) : 'Asesor' }}
                        </p>
                        <p class="text-sm text-gray-600">
                          Contrato: {{ item.contract?.contract_number || 'N/A' }}
                          @if (item.description) {
                            • {{ item.description }}
                          }
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-purple-600">{{ cutService.formatCurrency(item.amount) }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            <!-- Notes Tab -->
            @if (activeTab() === 'notes') {
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Notas del Corte</label>
                  <textarea
                    [(ngModel)]="notes"
                    rows="6"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Agrega notas o comentarios sobre este corte..."></textarea>
                </div>
                <button
                  (click)="saveNotes()"
                  [disabled]="isSavingNotes()"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {{ isSavingNotes() ? 'Guardando...' : 'Guardar Notas' }}
                </button>

                <!-- Audit Info -->
                @if (cut()!.closed_by_user || cut()!.reviewed_by_user) {
                  <div class="mt-8 pt-6 border-t border-gray-200">
                    <h4 class="font-semibold text-gray-900 mb-4">Historial de Auditoría</h4>
                    <div class="space-y-3">
                      @if (cut()!.closed_by_user) {
                        <div class="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <div>
                            <p class="text-sm font-medium text-gray-900">Cerrado por {{ cut()!.closed_by_user.first_name }} {{ cut()!.closed_by_user.last_name }}</p>
                            <p class="text-xs text-gray-600">{{ cut()!.closed_at | date: 'medium' }}</p>
                          </div>
                        </div>
                      }
                      @if (cut()!.reviewed_by_user) {
                        <div class="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                          <svg class="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                          </svg>
                          <div>
                            <p class="text-sm font-medium text-gray-900">Revisado por {{ cut()!.reviewed_by_user.first_name }} {{ cut()!.reviewed_by_user.last_name }}</p>
                            <p class="text-xs text-gray-600">{{ cut()!.reviewed_at | date: 'medium' }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class CutDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  cutService = inject(SalesCutService);

  cut = signal<SalesCut | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'sales' | 'payments' | 'commissions' | 'notes'>('sales');
  isSavingNotes = signal(false);
  notes = '';

  salesItems = signal<SalesCutItem[]>([]);
  paymentItems = signal<SalesCutItem[]>([]);
  commissionItems = signal<SalesCutItem[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const cutId = +params['id'];
      if (cutId) {
        this.loadCutDetail(cutId);
      }
    });
  }

  loadCutDetail(cutId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.cutService.getCutById(cutId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cut.set(response.data);
          this.notes = response.data.notes || '';
          
          // Filter items by type
          if (response.data.items) {
            this.salesItems.set(response.data.items.filter(item => item.item_type === 'sale'));
            this.paymentItems.set(response.data.items.filter(item => item.item_type === 'payment'));
            this.commissionItems.set(response.data.items.filter(item => item.item_type === 'commission'));
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el detalle del corte.');
        this.isLoading.set(false);
        console.error('Error loading cut detail:', err);
      }
    });
  }

  closeCut() {
    if (!this.cut()) return;

    if (confirm('¿Estás seguro de cerrar este corte? Esta acción no se puede deshacer.')) {
      this.cutService.closeCut(this.cut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte cerrado exitosamente');
            this.loadCutDetail(this.cut()!.cut_id);
          }
        },
        error: (err) => {
          alert('❌ Error al cerrar el corte');
          console.error('Error closing cut:', err);
        }
      });
    }
  }

  reviewCut() {
    if (!this.cut()) return;

    if (confirm('¿Marcar este corte como revisado?')) {
      this.cutService.reviewCut(this.cut()!.cut_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Corte marcado como revisado');
            this.loadCutDetail(this.cut()!.cut_id);
          }
        },
        error: (err) => {
          alert('❌ Error al revisar el corte');
          console.error('Error reviewing cut:', err);
        }
      });
    }
  }

  saveNotes() {
    if (!this.cut()) return;

    this.isSavingNotes.set(true);
    this.cutService.updateNotes(this.cut()!.cut_id, { notes: this.notes }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Notas guardadas exitosamente');
          this.cut.set(response.data);
        }
        this.isSavingNotes.set(false);
      },
      error: (err) => {
        alert('❌ Error al guardar notas');
        this.isSavingNotes.set(false);
        console.error('Error saving notes:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/sales/cuts']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
