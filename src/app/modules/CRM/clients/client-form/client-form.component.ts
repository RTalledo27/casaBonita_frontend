import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '../../models/client';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsService } from '../../services/clients.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChevronDown, ChevronUp, Home, Landmark, Mail, User, X } from 'lucide-angular';

@Component({
  selector: 'app-client-form',
  imports: [],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent {
  @Input() serverErrors: Record<string, string[]> = {};
  @Output() submitForm = new EventEmitter<{ data: any; isEdit: boolean }>();
  @Output() modalClosed = new EventEmitter<boolean>();

  form: FormGroup;
  isEditMode = false;
  editingId?: number;

  sections = [
    { title: 'general', icon: User, key: 'general', expanded: true },
    { title: 'address', icon: Home, key: 'address', expanded: false },
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private clientsService: ClientsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      document_number: ['', [Validators.required, Validators.minLength(8)]],
      phone: [''],
      email: [''],
      address: [''],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.clientsService.get(+id).subscribe((client) => {
        this.form.patchValue(client);
      });
    }
  }

  toggleSection(i: number) {
    this.sections.forEach((s, idx) => (s.expanded = idx === i));
  }

  next() {
    const idx = this.sections.findIndex((s) => s.expanded);
    if (!this.isSectionValid(this.sections[idx].key)) return;
    if (idx + 1 < this.sections.length) {
      this.sections[idx].expanded = true;
      this.sections[idx - 1].expanded = false;
    }
  }

  isSectionValid(key: string): boolean {
    return this.controlsFor(key).every(
      (field) => this.fc(field).valid || this.fc(field).disabled
    );
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'general':
        return ['first_name', 'last_name', 'document_number'];
      case 'address':
        return ['phone', 'email', 'address'];
      default:
        return [];
    }
  }

  fc(name: string) {
    return this.form.get(name)!;
  }

  submit() {
    if (this.form.invalid) {
      this.toast.show('Please check required fields', 'error');
      return;
    }

    const formData = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (this.isEditMode) {
      formData.append('_method', 'PATCH');
    }

    const request$ = this.isEditMode
      ? this.clientsService.update(this.editingId!, formData)
      : this.clientsService.create(formData);

    request$.subscribe({
      next: (res) => {
        this.toast.show(
          `Client ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'success'
        );
        this.submitForm.emit({ data: res, isEdit: this.isEditMode });
        this.closeModal();
      },
      error: (err) => {
        this.serverErrors = err.error?.errors || {};
        Object.values(this.serverErrors)
          .flat()
          .forEach((msg) => this.toast.show(msg, 'error', 5000));
      },
    });
  }

  onCancel() {
    this.modalClosed.emit(false);
    this.closeModal();
  }

  private closeModal() {
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent,
    });
  }

  get currentStep(): number {
    return this.sections.findIndex((s) => s.expanded) + 1;
  }
}
