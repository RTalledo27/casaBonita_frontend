import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationsService } from '../../../services/reservations.service';
import { ActivatedRoute } from '@angular/router';
import { ModalService } from '../../../../../core/services/modal.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
})
export class ReservationFormComponent {
  form: FormGroup;
  isEditMode = false;
  editingId?: number;

  @Output() submitForm = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationsService,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {
    this.form = this.fb.group({
      client_name: ['', Validators.required],
      lot_name: ['', Validators.required],
      date: ['', Validators.required],
      status: ['pending'],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.reservationService
        .get(this.editingId)
        .subscribe((r) => this.form.patchValue(r));
    }
  }

  submit() {
    if (this.form.invalid) return;
    const fd = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v));
    });
    if (this.isEditMode) fd.append('_method', 'PATCH');
    const req$ =
      this.isEditMode && this.editingId
        ? this.reservationService.update(this.editingId, fd)
        : this.reservationService.create(fd);
    req$.subscribe(() => {
      this.submitForm.emit();
    });
  }

  cancel() {
    this.modalClosed.emit();
    this.modalService.close(this.route);
  }
}
