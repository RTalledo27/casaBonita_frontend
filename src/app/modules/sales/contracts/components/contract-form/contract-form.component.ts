import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractsService } from '../../../services/contracts.service';
import { ActivatedRoute } from '@angular/router';
import { ModalService } from '../../../../../core/services/modal.service';

@Component({
  selector: 'app-contract-form',
  imports: [],
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss',
})
export class ContractFormComponent {
  form: FormGroup;
  isEditMode = false;
  editingId?: number;

  @Output() submitForm = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private contractService: ContractsService,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {
    this.form = this.fb.group({
      reservation_id: ['', Validators.required],
      sign_date: ['', Validators.required],
      total_price: ['', Validators.required],
      status: ['active'],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.contractService
        .get(this.editingId)
        .subscribe((c) => this.form.patchValue(c));
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
        ? this.contractService.update(this.editingId, fd)
        : this.contractService.create(fd);
    req$.subscribe(() => {
      this.submitForm.emit();
    });
  }

  cancel() {
    this.modalClosed.emit();
    this.modalService.close(this.route);
  }
}
