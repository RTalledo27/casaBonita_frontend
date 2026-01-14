import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentsService } from '../../services/payments.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent {
  form: FormGroup;
  isEditMode = false;
  editingId?: number;

  @Output() submitForm = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentsService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      schedule_id: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      payment_date: ['', Validators.required],
      method: ['transferencia', Validators.required],
      reference: [''],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.paymentService
        .get(this.editingId)
        .subscribe((p) => this.form.patchValue(p));
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
        ? this.paymentService.update(this.editingId, fd)
        : this.paymentService.create(fd);
    req$.subscribe(() => {
      this.submitForm.emit();
    });
  }

  cancel() {
    this.modalClosed.emit();
  }
}
