import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, ChevronDown, ChevronUp, Home, Landmark, Mail, User, X } from 'lucide-angular';
import { ClientsService } from '../../../services/clients.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ModalService } from '../../../../../core/services/modal.service';
import { clientValidators } from '../../../validators/client.validators';
import { ClientType, DocType, MaritalStatus } from '../../../models/enum';
import { ClientVerificationService } from '../../../services/client-verification.service';
import { ClientContactEditorComponent } from '../../../components/client-contact-editor.component';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, ClientContactEditorComponent],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
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

  // Verification state
  emailVerified = false;
  phoneVerified = false;
  emailVerificationId: number | null = null;
  phoneVerificationId: number | null = null;
  codeEmail = '';
  codePhone = '';
  isVerifyingEmail = false;
  isVerifyingPhone = false;
  private lastVerifiedEmail?: string;
  private lastVerifiedPhone?: string;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private clientsService: ClientsService,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private verificationService: ClientVerificationService
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
        // Inicializar verificación desde backend si existe
        if ((client as any).email_verified) {
          this.emailVerified = true;
          this.lastVerifiedEmail = client.email || undefined;
        }
        if ((client as any).phone_verified) {
          this.phoneVerified = true;
          this.lastVerifiedPhone = client.primary_phone || undefined;
        }
        client.family_members?.forEach((m) =>
          this.addFamilyMember({ first_name: m.first_name, last_name: m.last_name, dni: m.dni, relation: m.relation })
        );
      });
    } else {
      this.addFamilyMember();
    }

    this.setupDocValidators();
    this.setupContactValidators();

    // Reactivar verificación si el valor cambia respecto al último verificado
    this.fc('email').valueChanges.subscribe((val: string) => {
      const v = (val || '').trim();
      if (this.lastVerifiedEmail && v !== this.lastVerifiedEmail) {
        this.emailVerified = false;
        this.emailVerificationId = null;
        this.codeEmail = '';
      } else if (this.lastVerifiedEmail && v === this.lastVerifiedEmail) {
        this.emailVerified = true;
      }
    });
    this.fc('primary_phone').valueChanges.subscribe((val: string) => {
      const v = (val || '').trim();
      if (this.lastVerifiedPhone && v !== this.lastVerifiedPhone) {
        this.phoneVerified = false;
        this.phoneVerificationId = null;
        this.codePhone = '';
      } else if (this.lastVerifiedPhone && v === this.lastVerifiedPhone) {
        this.phoneVerified = true;
      }
    });
  }

  toggleSection(i: number) {
    this.sections.forEach((s, idx) => (s.expanded = idx === i));
  }

  next() {
    const idx = this.sections.findIndex((s) => s.expanded);
    const currentKey = this.sections[idx].key;
    if (!this.isSectionValid(currentKey)) return;
    if (currentKey === 'general' && !this.isEditMode) {
      const formData = new FormData();
      ['first_name','last_name','doc_type','doc_number','marital_status','type'].forEach((k)=>{
        const v = this.form.get(k)?.value; if (v !== undefined && v !== null) formData.append(k, String(v));
      });
      this.clientsService.create(formData).subscribe({
        next: (res:any) => {
          this.isEditMode = true;
          this.editingId = res?.client_id;
          this.sections[idx].expanded = false;
          if (idx + 1 < this.sections.length) this.sections[idx + 1].expanded = true;
        },
        error: () => { this.toast.show('No se pudo crear el borrador del cliente', 'error'); }
      });
      return;
    }
    if (idx + 1 < this.sections.length) {
      this.sections[idx].expanded = false;
      this.sections[idx + 1].expanded = true;
    }
  }

  isSectionValid(key: string): boolean {
    const baseValid = this.controlsFor(key).every((field) => this.fc(field).valid || this.fc(field).disabled);
    if (key === 'contact') {
      return baseValid && this.emailVerified && this.phoneVerified;
    }
    return baseValid;
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'general':
        return ['first_name', 'last_name', 'doc_type', 'doc_number', 'marital_status', 'type'];
      case 'contact':
        return ['primary_phone', 'secondary_phone', 'email', 'address'];
      case 'family':
        return ['family_members'];
      case 'other':
        return ['date', 'occupation', 'salary'];
      default:
        return [];
    }
  }

  fc(name: string) {
    return this.form.get(name)!;
  }

  get familyMembers(): FormArray {
    return this.form.get('family_members') as FormArray;
  }

  addFamilyMember(member?: any) {
    this.familyMembers.push(
      this.fb.group({
        first_name: [member?.first_name || '', Validators.required],
        last_name: [member?.last_name || '', Validators.required],
        dni: [member?.dni || '', Validators.required],
        relation: [member?.relation || '', Validators.required],
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
    const request$ = this.isEditMode ? this.clientsService.update(this.editingId!, formData) : this.clientsService.create(formData);
    request$.subscribe({
      next: (res) => {
        if (this.isEditMode) {
          this.toast.show('Cliente actualizado correctamente', 'success');
          this.submitForm.emit({ data: res, isEdit: true });
          this.modalClosed.emit(false);
          this.closeModal();
          return;
        }
        this.toast.show('Cliente creado correctamente', 'success');
        this.isEditMode = true;
        this.editingId = (res as any).client_id || this.editingId;
        this.sections.forEach((s) => (s.expanded = s.key === 'contact'));
        const email = this.form.value.email as string;
        const phone = this.form.value.primary_phone as string;
        if (email) {
          this.verificationService.request(this.editingId!, { type: 'email', value: email }).subscribe({
            next: (r) => { this.toast.show('Enviamos código de verificación al correo', 'success'); this.emailVerificationId = r.data.verification_id; },
            error: () => this.toast.show('No se pudo enviar verificación al correo', 'error')
          });
        }
        if (phone) {
          this.verificationService.request(this.editingId!, { type: 'phone', value: phone }).subscribe({
            next: (r) => { this.toast.show('Enviamos código de verificación para teléfono', 'success'); this.phoneVerificationId = r.data.verification_id; },
            error: () => this.toast.show('No se pudo enviar verificación de teléfono', 'error')
          });
        }
        this.submitForm.emit({ data: res, isEdit: false });
      },
      error: (err) => {
        this.serverErrors = err.error?.errors || {};
      },
    });
  }

  requestEmailVerification() {
    const email = this.form.value.email as string;
    if (!email) { this.toast.show('Ingresa un correo válido', 'error'); return; }
    // Mostrar el campo de código inmediatamente
    this.emailVerificationId = this.emailVerificationId ?? -1;
    if (!this.editingId) {
      this.verificationService.requestAnon({ type: 'email', value: email }).subscribe({
        next: (r) => { this.emailVerificationId = r.data.verification_id; this.toast.show('Código enviado al correo', 'success'); },
        error: () => this.toast.show('No se pudo enviar verificación al correo', 'error')
      });
    } else {
      this.verificationService.request(this.editingId, { type: 'email', value: email }).subscribe({
        next: (r) => { this.emailVerificationId = r.data.verification_id; this.toast.show('Código enviado al correo', 'success'); },
        error: () => this.toast.show('No se pudo enviar verificación al correo', 'error')
      });
    }
  }

  confirmEmailVerification() {
    if (!this.emailVerificationId || !this.codeEmail) return;
    this.isVerifyingEmail = true;
    if (!this.editingId || this.emailVerificationId === -1) {
      this.verificationService.confirmAnon(this.emailVerificationId!, this.codeEmail).subscribe({
      next: (resp) => { this.emailVerified = true; this.codeEmail = ''; this.emailVerificationId = null; this.isVerifyingEmail = false; this.form.patchValue({ email: resp.data.value }); this.toast.show('Correo verificado', 'success'); },
        error: (err) => { this.isVerifyingEmail = false; this.toast.show(err?.error?.message || 'Código inválido', 'error'); }
      });
    } else {
      this.verificationService.confirm(this.editingId, this.emailVerificationId, this.codeEmail).subscribe({
      next: () => { this.emailVerified = true; this.lastVerifiedEmail = this.form.value.email; this.codeEmail = ''; this.emailVerificationId = null; this.isVerifyingEmail = false; this.toast.show('Correo verificado', 'success'); },
        error: (err) => { this.isVerifyingEmail = false; this.toast.show(err?.error?.message || 'Código inválido', 'error'); }
      });
    }
  }

  requestPhoneVerification() {
    const phone = this.form.value.primary_phone as string;
    if (!phone) { this.toast.show('Ingresa un teléfono válido', 'error'); return; }
    // Mostrar el campo de código inmediatamente
    this.phoneVerificationId = this.phoneVerificationId ?? -1;
    const relayEmail = this.form.value.email as string | undefined;
    if (!this.editingId) {
      this.verificationService.requestAnon({ type: 'phone', value: phone, relay_email: relayEmail }).subscribe({
        next: (r) => { this.phoneVerificationId = r.data.verification_id; this.toast.show('Código enviado para teléfono', 'success'); },
        error: () => this.toast.show('No se pudo enviar verificación de teléfono', 'error')
      });
    } else {
      this.verificationService.request(this.editingId, { type: 'phone', value: phone }).subscribe({
        next: (r) => { this.phoneVerificationId = r.data.verification_id; this.toast.show('Código enviado para teléfono', 'success'); },
        error: () => this.toast.show('No se pudo enviar verificación de teléfono', 'error')
      });
    }
  }

  private setupDocValidators() {
    const typeCtrl = this.form.get('doc_type')!;
    const numCtrl = this.form.get('doc_number')!;
    typeCtrl.valueChanges.subscribe((dt) => {
      const validators = [Validators.required];
      if (dt === 'DNI') {
        validators.push(Validators.pattern(/^\d{8}$/));
      }
      numCtrl.setValidators(validators);
      numCtrl.updateValueAndValidity();
    });
  }

  private setupContactValidators() {
    const phoneCtrl = this.form.get('primary_phone')!;
    phoneCtrl.setValidators([Validators.required, Validators.pattern(/^\d{9}$/)]);
    phoneCtrl.updateValueAndValidity();
  }

  confirmPhoneVerification() {
    if (!this.phoneVerificationId || !this.codePhone) return;
    this.isVerifyingPhone = true;
    if (!this.editingId || this.phoneVerificationId === -1) {
      this.verificationService.confirmAnon(this.phoneVerificationId!, this.codePhone).subscribe({
        next: (resp) => { this.phoneVerified = true; this.lastVerifiedPhone = resp.data.value; this.codePhone = ''; this.phoneVerificationId = null; this.isVerifyingPhone = false; this.form.patchValue({ primary_phone: resp.data.value }); this.toast.show('Teléfono verificado', 'success'); },
        error: (err) => { this.isVerifyingPhone = false; this.toast.show(err?.error?.message || 'Código inválido', 'error'); }
      });
    } else {
      this.verificationService.confirm(this.editingId, this.phoneVerificationId, this.codePhone).subscribe({
      next: () => { this.phoneVerified = true; this.lastVerifiedPhone = this.form.value.primary_phone; this.codePhone = ''; this.phoneVerificationId = null; this.isVerifyingPhone = false; this.toast.show('Teléfono verificado', 'success'); },
        error: (err) => { this.isVerifyingPhone = false; this.toast.show(err?.error?.message || 'Código inválido', 'error'); }
      });
    }
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
