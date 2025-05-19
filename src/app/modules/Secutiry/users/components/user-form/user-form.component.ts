import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent {

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  roles: string[] = ['admin', 'editor', 'viewer']; // reemplazar con datos reales

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      status: ['active', Validators.required],
      roles: [[], Validators.required],
    });
  }

  submit(): void {
    if (this.form.valid && this.form.value.password === this.form.value.confirmPassword) {
      this.submitForm.emit(this.form.value);
    }
  }

  cancelForm(): void {
    this.cancel.emit();
  }

}
