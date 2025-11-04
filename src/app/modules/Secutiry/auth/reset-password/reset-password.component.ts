import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LangSwitcherComponent } from '../../../../shared/components/lang-switcher/lang-switcher.component';
import { ThemeSwitcherComponent } from '../../../../shared/components/theme-switcher/theme-switcher.component';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LangSwitcherComponent,
    ThemeSwitcherComponent,
    TranslateModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  currentYear = new Date().getFullYear();
  token: string = '';
  email: string = '';
  verifyingToken = true;
  tokenValid = false;

  // Validaciones visuales
  hasMinLength = false;
  hasUpperCase = false;
  hasLowerCase = false;
  hasNumber = false;
  hasSpecialChar = false;
  passwordsMatch = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public theme: ThemeService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required]],
      password_confirmation: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Obtener token y email de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.verifyingToken = false;
        this.tokenValid = false;
        this.errorMsg = 'Link inválido. Por favor solicita un nuevo enlace de recuperación.';
        return;
      }

      // Verificar si el token es válido
      this.authService.verifyResetToken(this.token, this.email).subscribe({
        next: (response) => {
          this.verifyingToken = false;
          this.tokenValid = response.valid;
          if (!response.valid) {
            this.errorMsg = response.message || 'El token es inválido o ha expirado.';
          }
        },
        error: (err) => {
          this.verifyingToken = false;
          this.tokenValid = false;
          this.errorMsg = 'Error al verificar el token. Por favor intenta de nuevo.';
        }
      });
    });

    // Escuchar cambios en los campos
    this.resetForm.get('password')?.valueChanges.subscribe(value => {
      this.validatePassword(value);
    });

    this.resetForm.get('password_confirmation')?.valueChanges.subscribe(value => {
      this.checkPasswordsMatch();
    });
  }

  validatePassword(password: string): void {
    this.hasMinLength = password.length >= 8;
    this.hasUpperCase = /[A-Z]/.test(password);
    this.hasLowerCase = /[a-z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);
    this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    this.checkPasswordsMatch();
  }

  checkPasswordsMatch(): void {
    const password = this.resetForm.get('password')?.value;
    const confirmation = this.resetForm.get('password_confirmation')?.value;
    this.passwordsMatch = password === confirmation && password.length > 0;
  }

  get isFormValid(): boolean {
    return this.hasMinLength && 
           this.hasUpperCase && 
           this.hasLowerCase && 
           this.hasNumber && 
           this.hasSpecialChar && 
           this.passwordsMatch;
  }

  onSubmit(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMsg = null;
    this.successMsg = null;

    const { password, password_confirmation } = this.resetForm.value;

    this.authService.resetPassword(this.token, this.email, password, password_confirmation).subscribe({
      next: (response) => {
        this.successMsg = response.message || 'Tu contraseña ha sido restablecida exitosamente.';
        this.loading = false;
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al restablecer la contraseña. Por favor intenta de nuevo.';
        this.loading = false;
      }
    });
  }
}
