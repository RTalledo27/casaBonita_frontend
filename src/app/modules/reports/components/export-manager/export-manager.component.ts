import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExportService } from '../../services';
import { ExportFormat, ExportResponse } from '../../models';

@Component({
  selector: 'app-export-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Gestor de Exportaciones</h1>
            <p class="text-gray-600">Administra y descarga reportes exportados</p>
          </div>
        </div>
      </div>

      <!-- Export History -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Historial de Exportaciones</h2>
        </div>
        <div class="p-6">
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No hay exportaciones</h3>
            <p class="mt-1 text-sm text-gray-500">Comienza exportando un reporte desde cualquier módulo.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ExportManagerComponent implements OnInit {
  exportHistory: ExportResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadExportHistory();
  }

  private loadExportHistory(): void {
    // Load export history from service
    // This would typically fetch from an API endpoint
    console.log('Loading export history...');
  }
}