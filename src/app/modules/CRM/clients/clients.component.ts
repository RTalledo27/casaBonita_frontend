import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { Client } from '../models/client';
import { ClientsService } from '../services/clients.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  allClients: Client[] = [];
  filteredClients: Client[] = [];
  loading = true;
  isModalOpen = false;

  // Filters
  searchTerm = '';
  typeFilter = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  readonly Math = Math;

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.navigate([{ outlets: { modal: null } }], { relativeTo: this.route }).finally(() => {
      this.loadClients();
    });
  }

  loadClients(): void {
    this.loading = true;
    this.clientsService.list().subscribe({
      next: (clients) => {
        this.allClients = clients;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    let result = [...this.allClients];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.first_name || '').toLowerCase().includes(term) ||
        (c.last_name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.primary_phone || '').includes(term) ||
        (c.doc_number || '').includes(term)
      );
    }
    if (this.typeFilter) {
      result = result.filter(c => c.type === this.typeFilter);
    }
    this.filteredClients = result;
    this.currentPage = 1;
  }

  get paginatedClients(): Client[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize));
  }

  get totalClients(): number { return this.filteredClients.length; }
  get clientCount(): number { return this.allClients.filter(c => c.type === 'client').length; }
  get leadCount(): number { return this.allClients.filter(c => c.type === 'lead').length; }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  isPageNumber(val: number | string): boolean { return typeof val === 'number'; }

  getInitials(c: Client): string {
    return ((c.first_name?.[0] || '') + (c.last_name?.[0] || '')).toUpperCase() || '?';
  }

  getTypeBadge(type: string): string {
    switch (type) {
      case 'client': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'lead': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'provider': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  }

  trackClient(_: number, c: Client): number { return c.client_id; }

  canCreate(): boolean { return true; }

  onCreate(): void {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], { relativeTo: this.route });
  }

  onEdit(id: number): void {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: ['edit', id] } }], { relativeTo: this.route });
  }

  onView(id: number): void {
    this.router.navigate([{ outlets: { modal: null } }], { relativeTo: this.route }).finally(() => {
      this.router.navigate(['/crm/clients', id]);
    });
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clientsService.delete(id).subscribe(() => {
        this.loadClients();
      });
    }
  }

  onModalActivate(component: any): void {
    this.isModalOpen = true;
    if (component && component.modalClosed) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.router.navigate([{ outlets: { modal: null } }], { relativeTo: this.route }).finally(() => {
          this.loadClients();
        });
      });
    }
  }

  onModalDeactivate(): void {
    this.isModalOpen = false;
    this.router.navigate([{ outlets: { modal: null } }], { relativeTo: this.route });
  }
}
