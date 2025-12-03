import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientVerificationService } from '../services/client-verification.service';

@Component({
  selector: 'app-client-contact-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="space-y-3" (ngSubmit)="submit()" aria-live="polite">
      <div>
        <label class="block text-sm font-bold mb-1">Correo</label>
        <input type="email" formControlName="email" aria-label="Correo" class="w-full px-3 py-2 border rounded" />
        <div class="text-xs" [class]="form.controls['email'].invalid && form.controls['email'].touched ? 'text-red-600' : 'sr-only'">
          Ingresa un correo válido
        </div>
      </div>
      <div>
        <label class="block text-sm font-bold mb-1">Teléfono</label>
        <input type="tel" formControlName="phone" aria-label="Teléfono" class="w-full px-3 py-2 border rounded" />
      </div>

      <div class="flex gap-2">
        <button type="button" (click)="request('email')" [disabled]="!form.controls['email'].valid" class="px-3 py-2 rounded bg-blue-600 text-white">Verificar correo</button>
        <button type="button" (click)="request('phone')" [disabled]="!form.controls['phone'].value" class="px-3 py-2 rounded bg-indigo-600 text-white">Verificar teléfono</button>
      </div>

      <div *ngIf="verificationId()" class="space-y-2">
        <label class="block text-sm font-bold">Código</label>
        <input type="text" [value]="code()" (input)="code.set($any($event.target).value)" maxlength="6" aria-label="Código de verificación" class="w-full px-3 py-2 border rounded" />
        <div class="flex gap-2">
          <button type="button" (click)="confirm()" [disabled]="!code() || isConfirming()" class="px-3 py-2 rounded bg-emerald-600 text-white">Confirmar</button>
          <button type="button" (click)="resend()" class="px-3 py-2 rounded bg-gray-200">Reenviar código</button>
        </div>
      </div>

      <div *ngIf="message()" class="text-sm" [class]="error() ? 'text-red-600' : 'text-green-700'">{{ message() }}</div>
    </form>
  `
})
export class ClientContactEditorComponent {
  private readonly svc = inject(ClientVerificationService);
  private readonly fb = inject(FormBuilder);

  @Input() clientId!: number;
  @Input() initialEmail = '';
  @Input() initialPhone = '';
  @Output() verified = new EventEmitter<{ type: 'email'|'phone'; value: string }>();

  verificationId = signal<number | null>(null);
  code = signal('');
  isConfirming = signal(false);
  message = signal<string | null>(null);
  error = signal(false);

  form = this.fb.group({
    email: [this.initialEmail, [Validators.email]],
    phone: [this.initialPhone]
  });

  request(type: 'email'|'phone') {
    const value = type === 'email' ? this.form.value.email || '' : this.form.value.phone || '';
    this.message.set(null);
    this.error.set(false);
    this.svc.request(this.clientId, { type, value }).subscribe({
      next: (res) => {
        this.verificationId.set(res.data.verification_id);
        this.message.set('Código enviado');
      },
      error: (err) => {
        this.error.set(true);
        this.message.set(err?.error?.message || 'Error solicitando verificación');
      }
    });
  }

  confirm() {
    if (!this.verificationId()) return;
    this.isConfirming.set(true);
    this.svc.confirm(this.clientId, this.verificationId()!, this.code()).subscribe({
      next: (res) => {
        this.isConfirming.set(false);
        this.message.set('Verificación exitosa');
        this.error.set(false);
        this.verified.emit({ type: res.data.type, value: res.data.value });
      },
      error: (err) => {
        this.isConfirming.set(false);
        this.error.set(true);
        this.message.set(err?.error?.message || 'Código inválido');
      }
    });
  }

  resend() {
    if (!this.verificationId()) return;
    this.svc.resend(this.clientId, this.verificationId()!).subscribe({
      next: () => this.message.set('Código reenviado'),
      error: () => { this.error.set(true); this.message.set('Error reenviando código'); }
    });
  }

  submit() { /* bloquea guardado hasta confirmar */ }
}
