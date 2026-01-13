import { Component } from '@angular/core';
import { ReservationsService } from '../services/reservations.service';
import { CommonModule } from '@angular/common';
import { ReservationFormComponent } from './components/reservation-form/reservation-form.component';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { BehaviorSubject } from 'rxjs';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-reservations',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    LucideAngularModule,
    SharedTableComponent,
    PaginationComponent,
    RouterOutlet,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent {
  private reservationsSubject = new BehaviorSubject<any[]>([]);
  reservations$ = this.reservationsSubject.asObservable();
  loading = false;

  searchTerm = '';
  statusFilter = '';

  pagination = {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 15,
  };

  columns: ColumnDef[] = [
    { field: 'reservation_id', header: 'ID' },
    {
      value: (r) => r.client.first_name + ' ' + r.client.last_name,
      header: 'sales.reservations.client',
    },
    { value: (r) => r.lot.num_lot, header: 'sales.reservations.lot' },
    { field: 'reservation_date', header: 'sales.reservations.date' },
    { field: 'status', header: 'sales.reservations.status' },
  ];
  idField = 'reservation_id';
  plus = Plus;
  isModalOpen = false;

  constructor(
    private reservationService: ReservationsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations(page: number = 1) {
    this.loading = true;
    this.reservationService
      .list({
        page,
        per_page: this.pagination.perPage,
        search: this.searchTerm?.trim() || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.reservationsSubject.next(res.data ?? []);
          this.pagination = {
            currentPage: res.meta?.current_page || page,
            totalPages: res.meta?.last_page || 1,
            total: res.meta?.total || 0,
            perPage: res.meta?.per_page || this.pagination.perPage,
          };
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.reservationsSubject.next([]);
          this.pagination = { ...this.pagination, currentPage: 1, totalPages: 1, total: 0 };
        },
      });
  }

  onSearchChange(): void {
    this.pagination.currentPage = 1;
    this.loadReservations(1);
  }

  onStatusChange(): void {
    this.pagination.currentPage = 1;
    this.loadReservations(1);
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.loadReservations(page);
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
    console.log('🟢 onModalActivate called with component:', component);
    if (component instanceof ReservationFormComponent) {
      console.log('🟢 Component is ReservationFormComponent, setting up subscriptions');
      component.modalClosed.subscribe(() => {
        console.log('🟢 modalClosed event received in parent component');
        this.isModalOpen = false;
        console.log('🟢 isModalOpen set to false');
        this.modalService.close(this.route);
        console.log('🟢 modalService.close called from parent');
        this.loadReservations();
        console.log('🟢 loadReservations called');
      });
      component.submitForm.subscribe(() => {
        console.log('🟢 submitForm event received in parent component');
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadReservations();
      });
    } else {
      console.log('🟢 Component is NOT ReservationFormComponent:', typeof component);
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
