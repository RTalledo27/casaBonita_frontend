import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Database, RefreshCw, Search, Filter, Download, AlertCircle, CheckCircle, Clock, User, Home } from 'lucide-angular';
import { FullStockResponse, LogicwareUnit } from '../../services/logicware.service';

@Component({
  selector: 'app-logicware-full-stock-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './logicware-full-stock-modal.component.html',
  styleUrls: ['./logicware-full-stock-modal.component.scss']
})
export class LogicwareFullStockModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() stockData: FullStockResponse | null = null;
  @Input() loading = false;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  // Icons
  X = X;
  Database = Database;
  RefreshCw = RefreshCw;
  Search = Search;
  Filter = Filter;
  Download = Download;
  AlertCircle = AlertCircle;
  CheckCircle = CheckCircle;
  Clock = Clock;
  User = User;
  Home = Home;

  // Filter and search
  searchTerm = '';
  filterStatus: 'all' | 'disponible' | 'reservado' | 'vendido' = 'all';
  filterAdvisor: 'all' | 'with' | 'without' = 'all';
  filterReservation: 'all' | 'with' | 'without' = 'all';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stockData']) {
      console.log('🔍 [MODAL] stockData changed:', this.stockData);
      console.log('🔍 [MODAL] stockData?.data type:', typeof this.stockData?.data);
      console.log('🔍 [MODAL] stockData?.data is Array?:', Array.isArray(this.stockData?.data));
      console.log('🔍 [MODAL] stockData?.data length:', this.stockData?.data?.length);
      console.log('🔍 [MODAL] First unit:', this.stockData?.data?.[0]);
    }
  }

  get filteredUnits(): LogicwareUnit[] {
    console.log('🔍 [MODAL] filteredUnits getter called');
    console.log('🔍 [MODAL] this.stockData:', this.stockData);
    console.log('🔍 [MODAL] this.stockData?.data:', this.stockData?.data);
    if (!this.stockData?.data) {
      console.log('⚠️ [MODAL] No stockData or data property!');
      return [];
    }

    let units = this.stockData.data;

    // Filter by search term (code, name, block, lot, client name, advisor name)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      units = units.filter(unit =>
        unit.code?.toLowerCase().includes(term) ||
        unit.name?.toLowerCase().includes(term) ||
        unit.block?.toLowerCase().includes(term) ||
        unit.lot?.toLowerCase().includes(term) ||
        unit.client?.name?.toLowerCase().includes(term) ||
        unit.advisor?.name?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus !== 'all') {
      units = units.filter(unit => unit.status === this.filterStatus);
    }

    // Filter by advisor
    if (this.filterAdvisor === 'with') {
      units = units.filter(unit => unit.advisor && unit.advisor.name);
    } else if (this.filterAdvisor === 'without') {
      units = units.filter(unit => !unit.advisor || !unit.advisor.name);
    }

    // Filter by reservation
    if (this.filterReservation === 'with') {
      units = units.filter(unit => unit.reservation);
    } else if (this.filterReservation === 'without') {
      units = units.filter(unit => !unit.reservation);
    }

    return units;
  }

  get paginatedUnits(): LogicwareUnit[] {
    const filtered = this.filteredUnits;
    if (!Array.isArray(filtered)) return [];
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return filtered.slice(start, end);
  }

  get totalPages(): number {
    const filtered = this.filteredUnits;
    if (!Array.isArray(filtered)) return 0;
    return Math.ceil(filtered.length / this.pageSize);
  }

  get totalFiltered(): number {
    const filtered = this.filteredUnits;
    if (!Array.isArray(filtered)) return 0;
    return filtered.length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reservado':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'vendido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Reservado';
      case 'vendido': return 'Vendido';
      default: return status;
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return 'S/ 0.00';
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  formatArea(area: number | undefined): string {
    if (!area) return '-';
    return `${area.toFixed(2)} m²`;
  }

  getAdvisorName(unit: LogicwareUnit): string {
    return unit.advisor?.name || 'Sin asignar';
  }

  getClientName(unit: LogicwareUnit): string {
    return unit.client?.name || '-';
  }

  hasReservation(unit: LogicwareUnit): boolean {
    return !!unit.reservation;
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.filterAdvisor = 'all';
    this.filterReservation = 'all';
    this.currentPage = 1;
  }

  canRefresh(): boolean {
    if (!this.stockData?.api_info) return false;
    return this.stockData.api_info.has_available_requests && !this.loading;
  }

  getRefreshTooltip(): string {
    if (this.loading) return 'Cargando...';
    if (!this.canRefresh()) {
      return `Límite de consultas alcanzado (${this.stockData?.api_info?.daily_requests_used || 0}/${this.stockData?.api_info?.daily_requests_limit || 4})`;
    }
    return 'Actualizar datos desde Logicware';
  }

  hasRateLimitError(): boolean {
    return this.stockData?.success === false && 
           this.stockData?.api_info?.daily_requests_used >= this.stockData?.api_info?.daily_requests_limit;
  }
}
