import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';
import { FamilyMembersService } from '../../../../services/family-members.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-family-member-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './family-member-form.component.html',
  styleUrl: './family-member-form.component.scss',
})
export class FamilyMemberFormComponent {
  @Output() modalClosed = new EventEmitter<boolean>();

  form: any;

  X = X;
  clientId: number;
  editingId?: number;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: FamilyMembersService
  ) {
    this.clientId = +this.route.parent?.snapshot.paramMap.get('id')!;
    const memberId = this.route.snapshot.paramMap.get('memberId');
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      dni: ['', Validators.required],
      relation: ['', Validators.required],
    });
    if (memberId) {
      this.isEditMode = true;
      this.editingId = +memberId;
      this.service.get(this.editingId).subscribe((res) => {
        this.form.patchValue(res);
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const payload = this.form.value as any;
    const request$ = this.isEditMode
      ? this.service.update(this.editingId!, payload)
      : this.service.create(this.clientId, payload);
    request$.subscribe(() => this.close());
  }

  close() {
    this.modalClosed.emit(false);
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent,
    });
  }
}
