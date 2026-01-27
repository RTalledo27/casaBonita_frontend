import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Circle } from 'lucide-angular';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-change-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  loading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Lock = Lock;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly Circle = Circle;

  // Reglas de validación de contraseña
  passwordRules = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Escuchar cambios en el campo newPassword
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe((password: string) => {
      this.validatePasswordRules(password || '');
    });

    // Escuchar cambios en el campo confirmPassword
    this.changePasswordForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      const newPassword = this.changePasswordForm.get('newPassword')?.value || '';
      const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value || '';
      this.passwordRules.passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
    });
  }

  validatePasswordRules(password: string) {
    this.passwordRules.minLength = password.length >= 8;
    this.passwordRules.hasUpperCase = /[A-Z]/.test(password);
    this.passwordRules.hasLowerCase = /[a-z]/.test(password);
    this.passwordRules.hasNumber = /[0-9]/.test(password);
    this.passwordRules.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Actualizar también la validación de contraseñas coincidentes
    const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value || '';
    this.passwordRules.passwordsMatch = password.length > 0 && password === confirmPassword;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        toast.success('Contraseña cambiada exitosamente');
        
        // Update user's must_change_password status in localStorage
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          currentUser.must_change_password = false;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        // Navigate to dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.message || 'Error al cambiar la contraseña';
        toast.error(errorMessage);
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.changePasswordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return null;
  }
}
