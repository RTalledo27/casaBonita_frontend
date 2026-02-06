import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Historial de Comprobantes</h2>
      <p>Lista completa próximamente...</p>
    </div>
  `
})
export class InvoiceListComponent { }
