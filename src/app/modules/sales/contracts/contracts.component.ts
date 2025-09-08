import { Component } from '@angular/core';
import { ContractsService } from '../services/contracts.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Plus, Upload } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ContractFormComponent } from './components/contract-form/contract-form.component';
import { ContractImportComponent } from './components/contract-import/contract-import.component';
import { ContractCreationModalComponent } from './contract-creation-modal/contract-creation-modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { BehaviorSubject } from 'rxjs';
import { Contract } from '../models/contract';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-contracts',
  standalone:true,
  imports: [
    CommonModule,
    RouterOutlet,
    SharedTableComponent,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    ContractImportComponent,
    ContractCreationModalComponent,
    PaginationComponent,
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
})
export class ContractsComponent {
  private contractsSubject = new BehaviorSubject<Contract[]>([]);
  contracts$ = this.contractsSubject.asObservable();
  
  pagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  };

  loading = false;
  createEnabled = true;
  importEnabled = true;

  columns: ColumnDef[] = [
    { field: 'contract_number', header: 'sales.contracts.contractNumber' },
    { field: 'reservation_id', header: 'sales.contracts.reservation' },
    { field: 'sign_date', header: 'sales.contracts.signDate' },
    {
      field: 'total_price',
      header: 'sales.contracts.totalPrice',
      align: 'right',
    },
    {
      field: 'down_payment',
      header: 'sales.contracts.downPayment',
      align: 'right',
    },
    {
      field: 'financing_amount',
      header: 'sales.contracts.financingAmount',
      align: 'right',
    },
    {
      field: 'bpp',
      header: 'sales.contracts.bpp',
      align: 'right',
    },
    {
      field: 'bfh',
      header: 'sales.contracts.bfh',
      align: 'right',
    },
    { field: 'currency', header: 'sales.contracts.currency' },
    { field: 'status', header: 'sales.contracts.status' },
  ];
  idField = 'contract_id';
  plus = Plus;
  upload = Upload;
  isModalOpen = false;
  isImportModalOpen = false;
  isCreationModalOpen = false;

  constructor(
    private contractService: ContractsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService,
    public theme: ThemeService
  ) {}

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    const params = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };
    
    this.contractService
      .list(params)
      .subscribe((response) => {
        this.contractsSubject.next(response.data);
        this.pagination = {
          current_page: response.meta.current_page,
          per_page: response.meta.per_page,
          total: response.meta.total,
          last_page: response.meta.last_page
        };
      });
  }
  
  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadContracts();
  }

  onCreate() {
    this.isCreationModalOpen = true;
  }

  onEdit(id: number) {
    this.modalService.open([id.toString(), 'edit'], this.route);
    this.isModalOpen = true;
  }

  onModalActivate(component: any) {
    if (component instanceof ContractFormComponent) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadContracts();
      });
      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadContracts();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }

  onImport() {
    this.isImportModalOpen = true;
  }

  onImportModalClose() {
    this.isImportModalOpen = false;
  }

  onImportCompleted() {
    this.loadContracts();
    this.isImportModalOpen = false;
  }

  onCreationModalClose() {
    this.isCreationModalOpen = false;
  }

  onContractCreated() {
    this.loadContracts();
    this.onCreationModalClose();
  }
}
