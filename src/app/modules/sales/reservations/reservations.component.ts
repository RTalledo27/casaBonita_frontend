import { Component } from '@angular/core';
import { ReservationsService } from '../services/reservations.service';
import { CommonModule } from '@angular/common';
import { ReservationFormComponent } from './components/reservation-form/reservation-form.component';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { BehaviorSubject } from 'rxjs';
import { Reservation } from '../models/reservation';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reservations',
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    SharedTableComponent,
    RouterOutlet,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent {
  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  reservations$ = this.reservationsSubject.asObservable();

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

  loadReservations() {
    this.reservationService
      .list()
      .subscribe((data) => this.reservationsSubject.next(data));
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
    if (component instanceof ReservationFormComponent) {
      component.modalClosed.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadReservations();
      });
      component.submitForm.subscribe(() => {
        this.isModalOpen = false;
        this.modalService.close(this.route);
        this.loadReservations();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.modalService.close(this.route);
  }
}
