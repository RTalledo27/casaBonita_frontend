import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { ToastService } from '../../../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]"></div>

      <div class="relative p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <div class="mb-6">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-center gap-4">
                <button routerLink="/billing/dashboard" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600 transition-all shadow-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/>
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {{ isCreditNote ? 'Nota de Crédito' : (type === 'factura' ? 'Nueva Factura' : 'Nueva Boleta') }}
                    </h1>
                    <span class="px-2.5 py-0.5 text-xs font-bold rounded-full" [ngClass]="{
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300': type === 'boleta',
                      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300': type === 'factura'
                    }">
                      {{ type === 'factura' ? 'FACTURA' : 'BOLETA' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete los datos del comprobante electrónico</p>
                </div>
              </div>
              <button type="button" (click)="openPaymentModal()" class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                Vincular Pago
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ PAGO VINCULADO BADGE ═══ -->
        <div *ngIf="linkedPayment" class="mb-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 px-5 py-3.5 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Pago vinculado:</span>
            <span class="text-sm text-emerald-700 dark:text-emerald-400 ml-1">{{ linkedPayment.description }}</span>
            <span class="text-sm font-bold text-emerald-900 dark:text-emerald-200 ml-2">{{ linkedPayment.amount | currency:'PEN' }}</span>
          </div>
          <button type="button" (click)="unlinkPayment()" class="text-emerald-500 hover:text-red-500 transition-colors p-1" title="Desvincular">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- ═══ SECCIÓN 1: CLIENTE ═══ -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 mb-4 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Datos del Cliente</h3>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
                <!-- Documento -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    {{ type === 'factura' ? 'RUC' : 'DNI / RUC' }} <span class="text-red-500">*</span>
                  </label>
                  <div class="flex">
                    <input
                      type="text"
                      formControlName="client_document_number"
                      class="block w-full rounded-l-xl border border-gray-200/80 dark:border-gray-600/50 bg-white dark:bg-gray-700/40 dark:text-white text-sm py-2.5 px-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      [class.border-red-400]="isFieldInvalid('client_document_number')"
                      [class.focus:ring-red-500]="isFieldInvalid('client_document_number')"
                      [placeholder]="type === 'factura' ? '20XXXXXXXXX' : 'Ingrese DNI o RUC'"
                    >
                    <button type="button" (click)="searchClient()" [disabled]="searchingClient" class="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-r-xl transition-all flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 whitespace-nowrap shadow-sm">
                      <svg *ngIf="!searchingClient" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      <svg *ngIf="searchingClient" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Buscar
                    </button>
                  </div>
                  <p *ngIf="isFieldInvalid('client_document_number')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    {{ type === 'factura' ? 'RUC de 11 dígitos requerido' : 'Documento requerido' }}
                  </p>
                </div>

                <!-- Nombre -->
                <div class="md:col-span-8">
                  <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Razón Social / Nombre <span class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="client_name"
                    class="block w-full rounded-xl border border-gray-200/80 dark:border-gray-600/50 bg-white dark:bg-gray-700/40 dark:text-white text-sm py-2.5 px-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    [class.border-red-400]="isFieldInvalid('client_name')"
                    placeholder="Nombre completo o razón social">
                  <p *ngIf="isFieldInvalid('client_name')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Nombre o razón social requerido
                  </p>
                </div>

                <!-- Dirección -->
                <div class="md:col-span-12">
                  <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Dirección Fiscal
                    <span *ngIf="type === 'factura'" class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="client_address"
                    class="block w-full rounded-xl border border-gray-200/80 dark:border-gray-600/50 bg-white dark:bg-gray-700/40 dark:text-white text-sm py-2.5 px-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    [class.border-red-400]="isFieldInvalid('client_address')"
                    placeholder="Av. / Jr. / Calle...">
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ SECCIÓN 2: DETALLE ═══ -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 mb-4 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                  <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Detalle del Comprobante</h3>
              </div>
              <button type="button" (click)="addItem()" class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Agregar Ítem
              </button>
            </div>

            <!-- Tabla de Items -->
            <div class="overflow-x-auto" formArrayName="items">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50/80 dark:bg-gray-900/30">
                    <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[38%]">Descripción</th>
                    <th class="py-3 px-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[8%]">Cant.</th>
                    <th class="py-3 px-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[14%]">Unidad</th>
                    <th class="py-3 px-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[16%]">P. Unit. (Inc. IGV)</th>
                    <th class="py-3 px-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[16%]">Total</th>
                    <th class="py-3 px-2 text-center w-[8%]"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of items.controls; let i=index" [formGroupName]="i"
                      class="border-b border-gray-100 dark:border-gray-700/40 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                    <td class="py-3 px-4">
                      <input type="text" formControlName="description"
                        class="w-full rounded-lg border border-gray-200/60 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/30 text-sm text-gray-800 dark:text-gray-200 py-2 px-3 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                        [class.border-red-400]="item.get('description')?.invalid && item.get('description')?.touched"
                        placeholder="Descripción del producto o servicio">
                    </td>
                    <td class="py-3 px-3">
                      <input type="number" formControlName="quantity" (input)="calculateTotal(i)"
                        class="w-full rounded-lg border border-gray-200/60 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/30 text-sm text-center text-gray-800 dark:text-gray-200 py-2 px-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        min="0.001" step="1">
                    </td>
                    <td class="py-3 px-3">
                      <select formControlName="unit_code"
                        class="w-full rounded-lg border border-gray-200/60 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/30 text-sm text-center text-gray-800 dark:text-gray-200 py-2 px-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer appearance-none">
                        <option value="NIU">Unidad</option>
                        <option value="ZZ">Servicio</option>
                      </select>
                    </td>
                    <td class="py-3 px-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">S/</span>
                        <input type="number" formControlName="unit_price_with_igv" (input)="calculateTotal(i)"
                          class="w-24 rounded-lg border border-gray-200/60 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/30 text-sm text-right text-gray-800 dark:text-gray-200 font-medium py-2 px-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          min="0" step="0.01">
                      </div>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <span class="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        S/ {{ (item.get('total')?.value || 0) | number:'1.2-2' }}
                      </span>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <button type="button" (click)="removeItem(i)" *ngIf="items.length > 1"
                        class="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center mx-auto">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Empty State -->
              <div *ngIf="items.length === 0" class="text-center py-12 text-gray-400">
                <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <p class="font-semibold">Sin ítems agregados</p>
                <p class="text-sm mt-1">Haz clic en "Agregar Ítem" para comenzar</p>
              </div>
            </div>

            <!-- ═══ RESUMEN DE TOTALES ═══ -->
            <div class="px-6 py-5 bg-gray-50/60 dark:bg-gray-900/20 border-t border-gray-200/50 dark:border-gray-700/50">
              <div class="flex justify-end">
                <div class="w-full sm:w-72">
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Op. Gravada</span>
                      <span class="tabular-nums">S/ {{ calculateSubtotal() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span>IGV (18%)</span>
                      <span class="tabular-nums">S/ {{ calculateIgv() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1">
                      <span class="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">Importe Total</span>
                      <span class="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                        S/ {{ calculateGrandTotal() | number:'1.2-2' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ ACCIONES ═══ -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 flex items-center justify-between">
            <p class="text-xs text-gray-400 dark:text-gray-500 hidden sm:flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              El comprobante será enviado a SUNAT automáticamente
            </p>
            <div class="flex items-center gap-3 ml-auto">
              <button type="button" routerLink="/billing/dashboard" class="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="loading"
                class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                <svg *ngIf="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <svg *ngIf="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ loading ? 'Emitiendo...' : 'Emitir Comprobante' }}
              </button>
            </div>
          </div>

        </form>

        <!-- ═══ MODAL DE PAGOS PENDIENTES ═══ -->
        <div *ngIf="showPaymentModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" (click)="closePaymentModal()">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200/50 dark:border-gray-700/50 overflow-hidden" (click)="$event.stopPropagation()">

            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">Vincular Pago</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Seleccione un pago para autocompletar el comprobante</p>
                </div>
              </div>
              <button (click)="closePaymentModal()" class="w-8 h-8 rounded-lg hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Modal Search -->
            <div class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  #searchInput
                  type="text"
                  placeholder="Buscar por nombre, DNI o referencia..."
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  (keyup.enter)="loadPendingPayments(searchInput.value)"
                >
              </div>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-4">
              <!-- Loading -->
              <div *ngIf="loadingPayments" class="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg class="w-8 h-8 animate-spin mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <p class="text-sm font-medium">Buscando pagos...</p>
              </div>

              <!-- Empty -->
              <div *ngIf="!loadingPayments && pendingPayments.length === 0" class="text-center py-16">
                <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400 font-semibold">Sin resultados</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Intente buscar con otro término</p>
              </div>

              <!-- Payment Cards -->
              <div *ngFor="let payment of pendingPayments" (click)="selectPayment(payment)"
                class="group flex items-center gap-4 p-4 mb-2 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 cursor-pointer transition-all">
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-sm text-gray-900 dark:text-white truncate">{{ payment.client_name }}</div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">{{ payment.client_document }}</span>
                    <span class="text-xs text-gray-400">{{ payment.payment_date | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{{ payment.description }}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{{ payment.amount | currency:'PEN' }}</div>
                  <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    SELECCIONAR
                  </span>
                </div>
              </div>
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
  searchingClient = false;
  type: 'boleta' | 'factura' = 'boleta';
  isCreditNote = false;
  linkedPayment: any = null;

  // Modal Pagos
  showPaymentModal = false;
  loadingPayments = false;
  pendingPayments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      payment_id: [null],
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
    this.addItem();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
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
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateTotal(index: number) {
    const item = this.items.at(index);
    const qty = item.get('quantity')?.value || 0;
    const price = item.get('unit_price_with_igv')?.value || 0;
    item.patchValue({ total: qty * price }, { emitEvent: false });
  }

  calculateGrandTotal(): number {
    return this.items.controls.reduce((acc: number, curr: any) => {
      const qty = curr.get('quantity')?.value || 0;
      const price = curr.get('unit_price_with_igv')?.value || 0;
      return acc + (qty * price);
    }, 0);
  }

  calculateSubtotal(): number {
    return this.calculateGrandTotal() / 1.18;
  }

  calculateIgv(): number {
    return this.calculateGrandTotal() - this.calculateSubtotal();
  }

  searchClient() {
    const doc = this.form.get('client_document_number')?.value;
    if (!doc) {
      this.toast.error('Ingrese un número de documento');
      return;
    }

    this.searchingClient = true;
    this.billingService.searchClient(doc).subscribe({
      next: (res) => {
        if (res.found) {
          this.form.patchValue({
            client_name: res.client.name,
            client_address: res.client.address
          });
          this.toast.success('Cliente encontrado');
        } else {
          this.toast.error('Cliente no encontrado en SUNAT/RENIEC');
        }
        this.searchingClient = false;
      },
      error: () => {
        this.searchingClient = false;
        this.toast.error('Error al buscar el cliente');
      }
    });
  }

  // --- Modal de Pagos ---
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
        this.toast.error('Error al cargar pagos');
      }
    });
  }

  selectPayment(payment: any) {
    if (payment.client_document) {
      this.form.patchValue({
        payment_id: payment.payment_id,
        client_document_number: payment.client_document,
        client_name: payment.client_name,
        client_address: payment.client_address
      });
    }

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

    this.linkedPayment = payment;
    this.closePaymentModal();
    this.toast.success('Pago vinculado correctamente');
  }

  unlinkPayment() {
    this.linkedPayment = null;
    this.form.patchValue({ payment_id: null });
    this.toast.info('Pago desvinculado');
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Complete todos los campos obligatorios');
      return;
    }

    if (this.calculateGrandTotal() <= 0) {
      this.toast.error('El importe total debe ser mayor a 0');
      return;
    }

    // Confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Emitir comprobante?',
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.8">
          <strong>Tipo:</strong> ${this.type === 'factura' ? 'Factura' : 'Boleta de Venta'}<br>
          <strong>Cliente:</strong> ${this.form.get('client_name')?.value}<br>
          <strong>Total:</strong> <span style="font-size:18px; font-weight:700; color:#2563eb">S/ ${this.calculateGrandTotal().toFixed(2)}</span>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, emitir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    this.loading = true;
    const formData = this.form.getRawValue();

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
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: '¡Comprobante emitido!',
          text: `${this.type === 'factura' ? 'Factura' : 'Boleta'} enviada a SUNAT correctamente`,
          confirmButtonColor: '#2563eb',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          this.router.navigate(['/billing/dashboard']);
        });
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error al emitir',
          text: err.error?.message || err.message || 'Ocurrió un error inesperado',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }
}
