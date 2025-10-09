import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Plus, Upload } from 'lucide-angular';
import { ContractsService } from '../services/contracts.service';
import { Contract } from '../models/contract';
import { SharedTableComponent, ColumnDef } from '../../../shared/components/shared-table/shared-table.component';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ContractImportComponent } from './components/contract-import/contract-import.component';
import { ContractCreationModalComponent } from './contract-creation-modal/contract-creation-modal.component';
import { ContractDetailsModalComponent } from './components/contract-details-modal/contract-details-modal.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    ContractImportComponent,
    ContractCreationModalComponent,
    ContractDetailsModalComponent,
    // PaginationComponent,
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  searchTerm = '';
  pagination: any = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  };
  
  createEnabled = true;
  importEnabled = true;

  columns: ColumnDef[] = [
    { field: 'contract_number', header: 'Número de Contrato' },
    { field: 'client_name', header: 'Cliente' },
    { field: 'lot_name', header: 'Lote' },
    { field: 'advisor', header: 'Asesor', tpl: 'advisor' },
    { field: 'sign_date', header: 'Fecha de Firma', tpl: 'signDate' },
    { field: 'total_price', header: 'Precio Total', align: 'right' },
    { field: 'status', header: 'Estado' }
  ];
  idField = 'contract_id';
  plus = Plus;
  upload = Upload;
  isModalOpen = false;
  isImportModalOpen = false;
  isCreationModalOpen = false;
  isDetailsModalOpen = false;
  selectedContractId: number | null = null;

  constructor(
    private contractsService: ContractsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🚀 ContractsComponent constructor called');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Router URL:', this.router.url);
  }

  ngOnInit(): void {
    console.log('ContractsComponent ngOnInit called');
    console.log('Auth service permissions check:', {
      hasViewPermission: this.authService.hasPermission('sales.contracts.view'),
      userPermissions: this.authService.userSubject.value?.permissions || []
    });
    const user = this.authService.userSubject.value;
    console.log('Current user:', user);
    console.log('User permissions:', user?.permissions);
    console.log('Has sales.contracts.view permission:', this.authService.hasPermission('sales.contracts.view'));
    
    // Verificar si el usuario está autenticado
    if (!user) {
      console.log('No user found, redirecting to login');
      return;
    }
    
    // Verificar permisos específicos
    if (!this.authService.hasPermission('sales.contracts.view')) {
      console.log('User does not have sales.contracts.view permission');
      console.log('Available permissions:', user.permissions);
      return;
    }
    
    this.loadContracts();
  }

  getAdvisorName(contract: any): string {
    return contract.advisor?.full_name || 'Sin asesor';
  }

  getAdvisorInitials(contract: any): string {
    const name = this.getAdvisorName(contract);
    if (name === 'Sin asesor') return 'SA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatSignDate(date: string): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-ES');
  }

  getRelativeDate(date: string): string {
    if (!date) return '';
    const now = new Date();
    const signDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - signDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  loadContracts(): void {
    this.loading = true;
    console.log('Loading contracts with params:', {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm
    });
    
    this.contractsService.list({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm
    })
      .subscribe((response: any) => {
        console.log('Full API response:', response);
        console.log('Response data:', response.data);
        console.log('Response meta:', response.meta);
        
        // Manejar tanto el formato con meta como el formato directo
        if (response.data) {
          this.contracts = response.data;
          this.totalItems = response.meta?.total || response.data.length;
          this.pagination = response.meta || {
            current_page: 1,
            last_page: 1,
            total: response.data.length,
            per_page: this.pageSize
          };
        } else if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          this.contracts = response;
          this.totalItems = response.length;
          this.pagination = {
            current_page: 1,
            last_page: 1,
            total: response.length,
            per_page: this.pageSize
          };
        } else {
          this.contracts = [];
          this.totalItems = 0;
        }
        
        this.loading = false;
        
        console.log('Contracts assigned:', this.contracts);
        console.log('Total items:', this.totalItems);
        console.log('Pagination:', this.pagination);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
      }, error => {
        console.error('Error loading contracts:', error);
        console.error('Error details:', error.error);
        this.loading = false;
      });
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContracts();
  }

  openEditModal(id: number): void {
    // Implementar lógica para abrir modal de edición
    console.log('Edit contract:', id);
  }

  deleteContract(id: number): void {
    // Implementar lógica para eliminar contrato
    console.log('Delete contract:', id);
  }

  openViewModal(contractId: number) {
    console.log('=== MODAL DEBUG START ===');
    console.log('openViewModal called with contractId:', contractId);
    console.log('Before - isDetailsModalOpen:', this.isDetailsModalOpen);
    console.log('Before - selectedContractId:', this.selectedContractId);
    
    this.selectedContractId = contractId;
    this.isDetailsModalOpen = true;
    
    console.log('After - isDetailsModalOpen:', this.isDetailsModalOpen);
    console.log('After - selectedContractId:', this.selectedContractId);
    
    // Force change detection multiple times
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    console.log('Change detection triggered');
    
    // Check DOM after a delay
    setTimeout(() => {
      console.log('=== DOM CHECK ===');
      const modalElement = document.querySelector('app-contract-details-modal');
      console.log('Modal element found in DOM:', !!modalElement);
      console.log('Modal element:', modalElement);
      
      if (modalElement) {
        console.log('Modal innerHTML length:', modalElement.innerHTML.length);
        const modalBackdrop = modalElement.querySelector('div[class*="fixed"]');
        console.log('Modal backdrop found:', !!modalBackdrop);
        
        if (modalBackdrop) {
          const computedStyle = window.getComputedStyle(modalBackdrop);
          console.log('Modal styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex
          });
        } else {
          console.log('No backdrop div found, modal content:', modalElement.innerHTML.substring(0, 200));
        }
      }
      console.log('=== MODAL DEBUG END ===');
    }, 200);
  }

  onCreate(): void {
    // Implementar lógica para crear contrato
    console.log('Create contract');
    this.isCreationModalOpen = true;
  }

  onImport(): void {
    // Implementar lógica para importar contratos
    console.log('Import contracts');
    this.isImportModalOpen = true;
  }

  onImportModalClose(): void {
    this.isImportModalOpen = false;
  }

  onImportCompleted(): void {
    this.isImportModalOpen = false;
    this.loadContracts();
  }

  onCreationModalClose(): void {
    this.isCreationModalOpen = false;
  }

  onContractCreated(): void {
    this.isCreationModalOpen = false;
    this.loadContracts();
  }

  onDetailsModalClose(): void {
    this.isDetailsModalOpen = false;
    this.selectedContractId = null;
  }

}
