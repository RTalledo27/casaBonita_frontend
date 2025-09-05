import { Injectable, computed, signal } from '@angular/core';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface PaginationConfig {
  initialPage?: number;
  initialItemsPerPage?: number;
  maxItemsPerPage?: number;
  minItemsPerPage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  // Signals para estado reactivo
  private _currentPage = signal(1);
  private _itemsPerPage = signal(15);
  private _totalItems = signal(0);
  
  // Computed values
  public readonly currentPage = this._currentPage.asReadonly();
  public readonly itemsPerPage = this._itemsPerPage.asReadonly();
  public readonly totalItems = this._totalItems.asReadonly();
  
  public readonly totalPages = computed(() => {
    const total = this._totalItems();
    const perPage = this._itemsPerPage();
    return total > 0 && perPage > 0 ? Math.ceil(total / perPage) : 0;
  });
  
  public readonly from = computed(() => {
    const current = this._currentPage();
    const perPage = this._itemsPerPage();
    const total = this._totalItems();
    return total > 0 ? (current - 1) * perPage + 1 : 0;
  });
  
  public readonly to = computed(() => {
    const current = this._currentPage();
    const perPage = this._itemsPerPage();
    const total = this._totalItems();
    return total > 0 ? Math.min(current * perPage, total) : 0;
  });
  
  public readonly state = computed((): PaginationState => ({
    currentPage: this._currentPage(),
    itemsPerPage: this._itemsPerPage(),
    totalItems: this._totalItems(),
    totalPages: this.totalPages(),
    from: this.from(),
    to: this.to()
  }));
  
  public readonly isFirstPage = computed(() => this._currentPage() <= 1);
  public readonly isLastPage = computed(() => this._currentPage() >= this.totalPages());
  public readonly hasPages = computed(() => this.totalPages() > 1);
  
  constructor() {}
  
  /**
   * Inicializa la paginación con configuración específica
   */
  initialize(config: PaginationConfig = {}): void {
    const {
      initialPage = 1,
      initialItemsPerPage = 15,
    } = config;
    
    this._currentPage.set(Math.max(1, initialPage));
    this._itemsPerPage.set(Math.max(1, initialItemsPerPage));
    this._totalItems.set(0);
  }
  
  /**
   * Actualiza el total de elementos
   */
  setTotalItems(total: number): void {
    const validTotal = Math.max(0, total);
    this._totalItems.set(validTotal);
    
    // Ajustar página actual si es necesario
    const maxPage = this.totalPages();
    if (maxPage > 0 && this._currentPage() > maxPage) {
      this._currentPage.set(maxPage);
    }
  }
  
  /**
   * Cambia a una página específica
   */
  goToPage(page: number): boolean {
    const targetPage = Math.max(1, Math.min(page, this.totalPages()));
    
    if (targetPage !== this._currentPage() && targetPage >= 1 && targetPage <= this.totalPages()) {
      this._currentPage.set(targetPage);
      return true;
    }
    
    return false;
  }
  
  /**
   * Va a la página anterior
   */
  previousPage(): boolean {
    return this.goToPage(this._currentPage() - 1);
  }
  
  /**
   * Va a la página siguiente
   */
  nextPage(): boolean {
    return this.goToPage(this._currentPage() + 1);
  }
  
  /**
   * Va a la primera página
   */
  firstPage(): boolean {
    return this.goToPage(1);
  }
  
  /**
   * Va a la última página
   */
  lastPage(): boolean {
    return this.goToPage(this.totalPages());
  }
  
  /**
   * Cambia el número de elementos por página
   */
  setItemsPerPage(itemsPerPage: number): void {
    const validItemsPerPage = Math.max(1, Math.min(itemsPerPage, 100));
    
    if (validItemsPerPage !== this._itemsPerPage()) {
      // Calcular qué elemento estaba viendo el usuario
      const currentFirstItem = this.from();
      
      this._itemsPerPage.set(validItemsPerPage);
      
      // Ajustar página para mantener contexto similar
      if (currentFirstItem > 0) {
        const newPage = Math.ceil(currentFirstItem / validItemsPerPage);
        this._currentPage.set(Math.max(1, newPage));
      }
    }
  }
  
  /**
   * Resetea la paginación
   */
  reset(): void {
    this._currentPage.set(1);
    this._totalItems.set(0);
  }
  
  /**
   * Genera números de página para mostrar en la UI
   */
  getPageNumbers(maxVisible: number = 7): number[] {
    const total = this.totalPages();
    const current = this._currentPage();
    const pages: number[] = [];
    
    if (total <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas con elipsis
      const halfVisible = Math.floor(maxVisible / 2);
      
      if (current <= halfVisible + 1) {
        // Cerca del inicio
        for (let i = 1; i <= maxVisible - 2; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(total);
      } else if (current >= total - halfVisible) {
        // Cerca del final
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = total - (maxVisible - 3); i <= total; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(total);
      }
    }
    
    return pages;
  }
  
  /**
   * Obtiene información de paginación como string
   */
  getPaginationInfo(): string {
    const state = this.state();
    
    if (state.totalItems === 0) {
      return 'No hay registros';
    }
    
    return `Mostrando ${state.from}-${state.to} de ${state.totalItems} registros`;
  }
  
  /**
   * Obtiene los filtros para la API
   */
  getApiFilters(): { page: number; per_page: number } {
    return {
      page: this._currentPage(),
      per_page: this._itemsPerPage()
    };
  }
}