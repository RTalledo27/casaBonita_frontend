import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExportService } from '../../services';
import { ExportFormat } from '../../models';
import { LucideAngularModule, FileSpreadsheet, FileText, Download, Calendar, Filter, RefreshCw, Clock } from 'lucide-angular';

@Component({
  selector: 'app-export-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestor de Exportaciones</h1>
        <p class="text-gray-600 dark:text-gray-400">Genera y descarga reportes en Excel desde un solo lugar</p>
      </div>

      <!-- Quick Export Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Monthly Income -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <lucide-angular [img]="icons.FileSpreadsheet" [size]="24" class="text-green-600 dark:text-green-400"></lucide-angular>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ingresos Mensuales</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Resumen de ingresos por asesor agrupado por mes</p>
          <div class="flex items-center gap-2 mb-3">
            <select [(ngModel)]="exportYear"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white">
              @for (y of availableYears; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
          <button (click)="exportMonthlyIncome()" [disabled]="isExporting()"
            class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium">
            <lucide-angular [img]="icons.Download" [size]="16"></lucide-angular>
            {{ isExporting() ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>

        <!-- Detailed Sales -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <lucide-angular [img]="icons.FileText" [size]="24" class="text-blue-600 dark:text-blue-400"></lucide-angular>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ventas Detalladas</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Detalle de cada venta con cronogramas de pago</p>
          <div class="flex items-center gap-2 mb-3">
            <select [(ngModel)]="detailedYear"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              @for (y of availableYears; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
            <select [(ngModel)]="detailedMonth"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <button (click)="exportDetailedSales()" [disabled]="isExporting()"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium">
            <lucide-angular [img]="icons.Download" [size]="16"></lucide-angular>
            {{ isExporting() ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>

        <!-- Client Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <lucide-angular [img]="icons.FileSpreadsheet" [size]="24" class="text-purple-600 dark:text-purple-400"></lucide-angular>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Detalles de Clientes</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Información completa de clientes y sus contratos</p>
          <div class="flex items-center gap-2 mb-3">
            <select [(ngModel)]="clientYear"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white">
              @for (y of availableYears; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
            <select [(ngModel)]="clientMonth"
              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white">
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <button (click)="exportClientDetails()" [disabled]="isExporting()"
            class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium">
            <lucide-angular [img]="icons.Download" [size]="16"></lucide-angular>
            {{ isExporting() ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>

      <!-- Export History -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <lucide-angular [img]="icons.Clock" [size]="20"></lucide-angular>
            Historial de Exportaciones
          </h2>
          <button (click)="loadExportHistory()" class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <lucide-angular [img]="icons.RefreshCw" [size]="14"></lucide-angular>
            Actualizar
          </button>
        </div>

        @if (exportHistory().length > 0) {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reporte</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Formato</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (item of exportHistory(); track item.id) {
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">{{ item.name }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {{ item.format | uppercase }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ item.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="px-6 py-4">
                  <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  @if (item.status === 'completed') {
                  <button (click)="downloadExport(item.id)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Descargar
                  </button>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        } @else {
        <div class="p-12 text-center">
          <lucide-angular [img]="icons.FileText" [size]="48" class="mx-auto text-gray-300 dark:text-gray-600 mb-4"></lucide-angular>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No hay exportaciones recientes</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Usa las tarjetas de arriba para generar un reporte.</p>
        </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ExportManagerComponent implements OnInit {
  readonly icons = { FileSpreadsheet, FileText, Download, Calendar, Filter, RefreshCw, Clock };

  isExporting = signal(false);
  exportHistory = signal<any[]>([]);
  exportMessage = signal('');

  // Year/month selectors
  availableYears = Array.from(
    { length: new Date().getFullYear() - 2024 + 2 },
    (_, i) => 2024 + i
  );
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  exportYear = new Date().getFullYear();
  detailedYear = new Date().getFullYear();
  detailedMonth = new Date().getMonth() + 1;
  clientYear = new Date().getFullYear();
  clientMonth = new Date().getMonth() + 1;

  constructor(
    private fb: FormBuilder,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadExportHistory();
  }

  loadExportHistory(): void {
    this.exportService.getReportsHistory(1, 20).subscribe({
      next: (response) => {
        if (response?.data) {
          this.exportHistory.set(response.data);
        }
      },
      error: () => {
        // No history available
        this.exportHistory.set([]);
      }
    });
  }

  exportMonthlyIncome(): void {
    this.isExporting.set(true);
    this.exportService.exportMonthlyIncome(this.exportYear).subscribe({
      next: (blob) => {
        this.exportService.downloadExcel(blob, `ingresos_mensuales_${this.exportYear}`);
        this.isExporting.set(false);
        this.loadExportHistory();
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }

  exportDetailedSales(): void {
    this.isExporting.set(true);
    const filters = { year: this.detailedYear, month: this.detailedMonth };
    this.exportService.exportDetailedSales(filters).subscribe({
      next: (blob) => {
        const period = `${this.detailedYear}-${String(this.detailedMonth).padStart(2, '0')}`;
        this.exportService.downloadExcel(blob, `ventas_detalladas_${period}`);
        this.isExporting.set(false);
        this.loadExportHistory();
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }

  exportClientDetails(): void {
    this.isExporting.set(true);
    const filters = { year: this.clientYear, month: this.clientMonth };
    this.exportService.exportClientDetails(filters).subscribe({
      next: (blob) => {
        const period = `${this.clientYear}-${String(this.clientMonth).padStart(2, '0')}`;
        this.exportService.downloadExcel(blob, `detalles_clientes_${period}`);
        this.isExporting.set(false);
        this.loadExportHistory();
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }

  downloadExport(exportId: string): void {
    this.exportService.downloadReport(exportId).subscribe({
      next: (blob) => {
        this.exportService.downloadExcel(blob, `reporte_${exportId}`);
      },
      error: () => { }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'processing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return map[status] || map['pending'];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'completed': 'Completado',
      'processing': 'Procesando',
      'failed': 'Error',
      'pending': 'Pendiente'
    };
    return map[status] || status;
  }
}