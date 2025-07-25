import { Component } from '@angular/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { BehaviorSubject } from 'rxjs';
import { Payment } from '../models/payment';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { PaymentsService } from '../services/payments.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, SharedTableComponent, TranslateModule, RouterOutlet, LucideAngularModule ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();

  columns: ColumnDef[] = [
    { field: 'payment_id', header: 'ID' },
    { field: 'amount', header: 'Amount', align: 'right' },
    { field: 'payment_date', header: 'Date' },
    { field: 'status', header: 'Status' },
  ];
  idField = 'payment_id';
  plus = Plus;
  isModalOpen = false;

  constructor(
    private paymentService: PaymentsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.paymentService
      .list()
      .subscribe((data: any) => this.paymentsSubject.next(data));
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
    if (component instanceof PaymentFormComponent) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadPayments();
      });
      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadPayments();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
