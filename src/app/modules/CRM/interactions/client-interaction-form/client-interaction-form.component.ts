import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { InteractionsService } from '../../services/interactions.service';

@Component({
  selector: 'app-client-interaction-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule
  ],
  templateUrl: './client-interaction-form.component.html',
  styleUrl: './client-interaction-form.component.scss',
})
export class ClientInteractionFormComponent {
  @Output() modalClosed = new EventEmitter<boolean>();

  form:any;

  channels = ['call', 'email', 'whatsapp', 'visit', 'other'];
  X = X;
  clientId: number;
  editingId?: number;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private interactionsService: InteractionsService
  ) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      channel: ['', Validators.required],
      notes: ['', Validators.required],
    });
    this.clientId = +this.route.parent?.snapshot.paramMap.get('id')!;
    const interactionId = this.route.snapshot.paramMap.get('interactionId');
    if (interactionId) {
      this.isEditMode = true;
      this.editingId = +interactionId;
      this.interactionsService.get(this.editingId).subscribe((res) => {
        this.form.patchValue({
          date: res.date.substring(0, 10),
          channel: res.channel,
          notes: res.notes,
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const payload = this.form.value as any;
    const request$ = this.isEditMode
      ? this.interactionsService.update(this.editingId!, payload)
      : this.interactionsService.create(this.clientId, payload);
    request$.subscribe(() => this.close());
  }

  close() {
    this.modalClosed.emit(false);
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent,
    });
  }
}
