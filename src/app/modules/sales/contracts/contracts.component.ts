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
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { BehaviorSubject } from 'rxjs';
import { Contract } from '../models/contract';

@Component({
  selector: 'app-contracts',
  imports: [
    CommonModule,
    RouterOutlet,
    SharedTableComponent,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    ContractImportComponent,
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
})
export class ContractsComponent {
  private contractsSubject = new BehaviorSubject<Contract[]>([]);
  contracts$ = this.contractsSubject.asObservable();

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

  constructor(
    private contractService: ContractsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    this.contractService
      .list()
      .subscribe((data) => this.contractsSubject.next(data));
  }

  onCreate() {
    this.modalService.open(['create'], this.route);
    this.isModalOpen = true;
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
}
