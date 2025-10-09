import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '../../../models/client';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClientsService } from '../../../services/clients.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ChevronDown,
  ChevronUp,
  Home,
  Landmark,
  LucideAngularModule,
  Mail,
  User,
  X,
} from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../../../core/services/modal.service';
import { clientValidators } from '../../../validators/client.validators';
import { ClientType, DocType, MaritalStatus } from '../../../models/enum';

@Component({
  selector: 'app-client-form',
  imports: [
    LucideAngularModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent implements OnInit {
  @Input() serverErrors: Record<string, string[]> = {};
  @Output() submitForm = new EventEmitter<{ data: any; isEdit: boolean }>();
  @Output() modalClosed = new EventEmitter<boolean>();

  form: FormGroup;
  isEditMode = false;
  editingId?: number;

  maritalStatuses = Object.values(MaritalStatus);
  docTypes = Object.values(DocType);
  clientTypes = Object.values(ClientType);
  sections = [
    { title: 'general', icon: User, key: 'general', expanded: true },
    { title: 'contact', icon: Mail, key: 'contact', expanded: false },
    { title: 'family', icon: Home, key: 'family', expanded: false },
    { title: 'other', icon: Landmark, key: 'other', expanded: false },
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private clientsService: ClientsService,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {
    this.form = this.fb.group({
      first_name: ['', clientValidators.first_name],
      last_name: ['', clientValidators.last_name],
      doc_type: ['', clientValidators.doc_type],
      doc_number: ['', clientValidators.doc_number],
      marital_status: ['', clientValidators.marital_status],
      type: ['', clientValidators.type],
      primary_phone: ['', clientValidators.primary_phone],
      secondary_phone: ['', clientValidators.secondary_phone],
      email: ['', clientValidators.email],
      address: ['', clientValidators.address],
      date: ['', clientValidators.date],
      occupation: ['', clientValidators.occupation],
      salary: ['', clientValidators.salary],
      family_members: this.fb.array([]),
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.clientsService.get(+id).subscribe((client) => {
        this.form.patchValue({
          first_name: client.first_name,
          last_name: client.last_name,
          doc_type: client.doc_type,
          doc_number: client.doc_number,
          marital_status: client.marital_status,
          type: client.type,
          primary_phone: client.primary_phone,
          secondary_phone: client.secondary_phone,
          email: client.email,
          address: client.addresses?.[0]?.line1 || '',
          date: client.date ? client.date.substring(0, 10) : '',
          occupation: client.occupation,
          salary: client.salary,
        });
        client.family_members?.forEach((m) =>
          this.addFamilyMember({
            first_name: m.first_name,
            last_name: m.last_name,
            dni: m.dni,
            relation: m.relation,
          })
        );
      });
    } else {
      this.addFamilyMember();
    }
  }

  toggleSection(i: number) {
    this.sections.forEach((s, idx) => (s.expanded = idx === i));
  }

  next() {
    const idx = this.sections.findIndex((s) => s.expanded);
    if (!this.isSectionValid(this.sections[idx].key)) return;
    if (idx + 1 < this.sections.length) {
      this.sections[idx].expanded = false;
      this.sections[idx + 1].expanded = true;
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
        return [
          'first_name',
          'last_name',
          'doc_type',
          'doc_number',
          'marital_status',
          'type',
        ];
      case 'contact':
        return ['primary_phone', 'secondary_phone', 'email', 'address'];
      case 'family':
        return ['family_members']; // o simplemente deja []
      case 'other':
        return ['date', 'occupation', 'salary'];
      default:
        return [];
    }
  }

  fc(name: string) {
    return this.form.get(name)!;
  }

  /* Getter correcto */
  get familyMembers(): FormArray {
    return this.form.get('family_members') as FormArray;
  }

  /* Usar el getter donde corresponda */
  addFamilyMember(member?: any) {
    console.log('Adding family member:', member);
    this.familyMembers.push(
      this.fb.group({
        first_name: [member?.first_name || '', Validators.required],
        last_name: [member?.last_name || '', Validators.required],
        dni: [member?.dni || '', Validators.required], // ✅
        relation: [member?.relation || '', Validators.required], // ✅
      })
    );
  }

  removeFamilyMember(idx: number) {
    this.familyMembers.removeAt(idx);
  }

  submit() {
    if (this.form.invalid) {
      this.toast.show('Please check required fields', 'error');
      return;
    }

    const formData = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (key === 'family_members') {
        (value as any[]).forEach((member, idx) => {
          Object.entries(member).forEach(([k, v]) => {
            formData.append(`family_members[${idx}][${k}]`, String(v));
          });
        });
      } else {
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
        if (this.isEditMode) {
          this.toast.show('Client updated successfully', 'success');
        }
        this.submitForm.emit({ data: res, isEdit: this.isEditMode });
        this.closeModal();
      },
      error: (err) => {
        this.serverErrors = err.error?.errors || {};
      },
    });
  }

  onCancel() {
    this.modalClosed.emit(false);
    this.closeModal();
  }

  private closeModal() {
    this.modalService.close(this.route);
  }

  get currentStep(): number {
    return this.sections.findIndex((s) => s.expanded) + 1;
  }
}
