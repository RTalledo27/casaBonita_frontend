import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 tracking-tight">
              {{ isCreditNote ? 'Emitir Nota de Crédito' : (type === 'factura' ? 'Nueva Factura' : 'Nueva Boleta') }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete los datos para generar el comprobante</p>
          </div>
          <button routerLink="/billing/dashboard" class="group flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md">
            <span class="bg-gray-100 dark:bg-slate-700 p-1 rounded-full mr-2 group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </span>
            Cancelar
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-slate-700/60 overflow-hidden">
          
          <!-- Cliente Section -->
          <div class="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700/60">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Datos del Cliente</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div class="md:col-span-4">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {{ type === 'factura' ? 'RUC' : 'DNI / RUC' }}
                </label>
                <div class="flex shadow-sm rounded-xl">
                  <input 
                    type="text" 
                    formControlName="client_document_number"
                    class="block w-full rounded-l-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5"
                    [placeholder]="type === 'factura' ? '20...' : 'Ingrese documento'"
                  >
                  <button type="button" (click)="searchClient()" class="px-4 bg-gray-50 dark:bg-slate-700 border-y border-r border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors" title="Buscar en SUNAT/RENIEC">
                    <i class="fas fa-search"></i>
                  </button>
                  <button type="button" (click)="openPaymentModal()" class="px-4 bg-blue-50 dark:bg-blue-900/20 border-y border-r border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-r-xl transition-colors font-medium border-l border-l-transparent" title="Vincular Pago">
                     <i class="fas fa-link mr-1"></i> Vincular Pago
                  </button>
                </div>
              </div>

              <div class="md:col-span-8">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Razón Social / Nombre</label>
                <input type="text" formControlName="client_name" class="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5 shadow-sm">
              </div>

              <div class="md:col-span-12">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Dirección Fiscal</label>
                <input type="text" formControlName="client_address" class="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5 shadow-sm">
              </div>
            </div>
          </div>

          <!-- Items Section -->
          <div class="p-6 md:p-8 bg-gray-50/50 dark:bg-slate-800/30">
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center">
                 <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Detalle del Comprobante</h3>
              </div>
              <button type="button" (click)="addItem()" class="text-sm px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                + Agregar Ítem
              </button>
            </div>

            <div formArrayName="items" class="space-y-3">
              <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i" class="flex flex-wrap md:flex-nowrap gap-4 items-start bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700/80 group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                <div class="w-full md:flex-1">
                  <label class="block text-[10px] font-bold uppercase text-gray-400 mb-1">Descripción</label>
                  <input type="text" formControlName="description" class="block w-full rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div class="w-24">
                  <label class="block text-[10px] font-bold uppercase text-gray-400 mb-1">Cant.</label>
                  <input type="number" formControlName="quantity" (change)="calculateTotal(i)" class="block w-full rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm text-center">
                </div>
                <div class="w-28">
                  <label class="block text-[10px] font-bold uppercase text-gray-400 mb-1">Unidad</label>
                  <select formControlName="unit_code" class="block w-full rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <option value="NIU">Unidad (NIU)</option>
                    <option value="ZZ">Servicio (ZZ)</option>
                  </select>
                </div>
                <div class="w-32">
                  <label class="block text-[10px] font-bold uppercase text-gray-400 mb-1">P. Unit (Inc. IGV)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-gray-400 text-xs">S/</span>
                    <input type="number" formControlName="unit_price_with_igv" (change)="calculateTotal(i)" class="block w-full pl-8 rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm text-right font-medium">
                  </div>
                </div>
                <div class="w-32">
                  <label class="block text-[10px] font-bold uppercase text-gray-400 mb-1">Total</label>
                  <div class="w-full py-2 px-3 text-right text-sm font-bold bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                    {{ item.get('total')?.value | number:'1.2-2' }}
                  </div>
                </div>
                <button type="button" (click)="removeItem(i)" class="mt-6 p-2 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar Ítem">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>

            <!-- Totales Card -->
            <div class="mt-8 flex justify-end">
              <div class="w-full md:w-80 bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/60">
                <div class="space-y-3">
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Op. Gravada</span>
                    <span>{{ calculateSubtotal() | currency:'PEN' }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-100 dark:border-slate-700">
                    <span>IGV (18%)</span>
                    <span>{{ calculateIgv() | currency:'PEN' }}</span>
                  </div>
                  <div class="flex justify-between items-center pt-2">
                    <span class="text-base font-bold text-gray-800 dark:text-white">Importe Total</span>
                    <span class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      {{ calculateGrandTotal() | currency:'PEN' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-8 py-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/60 flex justify-end gap-4">
            <button type="button" routerLink="/billing/dashboard" class="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="form.invalid || loading" class="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="loading" class="mr-2"><i class="fas fa-spinner fa-spin"></i></span>
              Emitir Comprobante
            </button>
          </div>
        </form>

        <!-- Modal de Pagos Pendientes -->
        <div *ngIf="showPaymentModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 dark:border-slate-700 animate-fadeIn">
            <div class="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 class="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <span class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3 text-sm">
                  <i class="fas fa-money-bill-wave"></i>
                </span>
                Vincular Pago Existente
              </h3>
              <button (click)="closePaymentModal()" class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="p-5 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30">
              <label class="block text-xs font-semibold uppercase text-gray-500 mb-2">Buscar Pago</label>
              <div class="relative">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre de cliente, DNI o referencia..." 
                  class="w-full pl-10 rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500 py-2.5"
                  (keyup.enter)="loadPendingPayments($any($event.target).value)"
                >
              </div>
            </div>

            <div class="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div *ngIf="loadingPayments" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="fas fa-spinner fa-spin text-3xl mb-3 text-blue-500"></i>
                <p>Buscando pagos...</p>
              </div>
              
              <div *ngIf="!loadingPayments && pendingPayments.length === 0" class="text-center py-12">
                 <div class="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                   <i class="fas fa-search text-2xl"></i>
                 </div>
                 <p class="text-gray-500 dark:text-gray-400 font-medium">No se encontraron pagos pendientes.</p>
                 <p class="text-xs text-gray-400 mt-1">Intenta con otros términos de búsqueda.</p>
              </div>

              <div *ngFor="let payment of pendingPayments" class="group border border-gray-100 dark:border-slate-700 rounded-xl p-4 mb-3 hover:border-green-400 dark:hover:border-green-500/50 hover:bg-green-50/50 dark:hover:bg-green-900/10 cursor-pointer transition-all shadow-sm hover:shadow-md" (click)="selectPayment(payment)">
                <div class="flex justify-between items-start">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mt-1">
                      <i class="fas fa-user"></i>
                    </div>
                    <div>
                      <div class="font-bold text-gray-800 dark:text-white text-base">{{ payment.client_name }}</div>
                      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block mb-1">{{ payment.client_document }}</div>
                      <div class="text-sm text-gray-600 dark:text-gray-300">{{ payment.description }}</div>
                      <div class="text-xs text-gray-400 mt-1 flex items-center">
                        <i class="fas fa-hashtag mr-1"></i> Ref: <span class="font-mono text-gray-500">{{ payment.reference }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xl font-extrabold text-green-600 dark:text-green-400">{{ payment.amount | currency:'PEN' }}</div>
                    <div class="text-xs text-gray-400 mt-1">{{ payment.payment_date | date:'mediumDate' }}</div>
                    <button class="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/60 text-center text-xs text-gray-400">
              Al seleccionar un pago, los datos del cliente y montos se cargarán automáticamente.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InvoiceFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  type: 'boleta' | 'factura' = 'boleta';
  isCreditNote = false;

  // Modal Pagos
  showPaymentModal = false;
  loadingPayments = false;
  pendingPayments: any[] = [];


  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      payment_id: [null], // ID del pago vinculado
      client_document_number: ['', [Validators.required]],
      client_name: ['', Validators.required],
      client_address: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['type']) {
        this.type = params['type'] as any;
        if (this.type === 'factura') {
          this.form.get('client_document_number')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);
          this.form.get('client_address')?.setValidators([Validators.required]);
        }
      }
    });

    // Agregar un item por defecto
    this.addItem();
  }

  get items() {
    return this.form.get('items') as any;
  }

  addItem() {
    const item = this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit_code: ['NIU', Validators.required],
      unit_price_with_igv: [0, [Validators.required, Validators.min(0)]],
      total: [{ value: 0, disabled: true }]
    });
    this.items.push(item);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  calculateTotal(index: number) {
    const item = this.items.at(index);
    const qty = item.get('quantity')?.value || 0;
    const price = item.get('unit_price_with_igv')?.value || 0;
    const total = qty * price;
    item.patchValue({ total: total }, { emitEvent: false });
  }

  calculateGrandTotal() {
    return this.items.controls.reduce((acc: number, curr: any) => {
      const qty = curr.get('quantity')?.value || 0;
      const price = curr.get('unit_price_with_igv')?.value || 0;
      return acc + (qty * price);
    }, 0);
  }

  calculateSubtotal() {
    return this.calculateGrandTotal() / 1.18;
  }

  calculateIgv() {
    return this.calculateGrandTotal() - this.calculateSubtotal();
  }

  searchClient() {
    const doc = this.form.get('client_document_number')?.value;
    if (!doc) return;

    this.loading = true;
    this.billingService.searchClient(doc).subscribe({
      next: (res) => {
        if (res.found) {
          this.form.patchValue({
            client_name: res.client.name,
            client_address: res.client.address
          });
        } else {
          alert('Cliente no encontrado');
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al buscar cliente');
      }
    });
  }

  // --- Lógica del Modal de Pagos ---
  openPaymentModal() {
    this.showPaymentModal = true;
    this.loadPendingPayments();
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  loadPendingPayments(search?: string) {
    this.loadingPayments = true;
    this.billingService.getPendingPayments(search).subscribe({
      next: (data) => {
        this.pendingPayments = data;
        this.loadingPayments = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingPayments = false;
      }
    });
  }

  selectPayment(payment: any) {
    // 1. Llenar datos del cliente
    if (payment.client_document) {
      this.form.patchValue({
        payment_id: payment.payment_id,
        client_document_number: payment.client_document,
        client_name: payment.client_name,
        client_address: payment.client_address
      });
    }

    // 2. Limpiar items actuales y agregar uno nuevo con el pago
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    const item = this.fb.group({
      description: [payment.description, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit_code: ['NIU', Validators.required],
      unit_price_with_igv: [payment.amount, [Validators.required, Validators.min(0)]],
      total: [{ value: payment.amount, disabled: true }]
    });

    this.items.push(item);

    // 3. Cerrar modal y notificar
    this.closePaymentModal();
    // alert('Datos cargados desde el pago seleccionado');
  }


  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.form.getRawValue();

    // Preparar items
    formData.items = formData.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unit_code: item.unit_code,
      unit_price_with_igv: item.unit_price_with_igv
    }));

    const request = this.type === 'factura'
      ? this.billingService.emitFactura(formData)
      : this.billingService.emitBoleta(formData);

    request.subscribe({
      next: (res) => {
        alert('Comprobante emitido correctamente');
        this.router.navigate(['/billing/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('Error al emitir comprobante: ' + (err.error?.message || err.message));
      }
    });
  }
}
