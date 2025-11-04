import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { LangSwitcherComponent } from '../../../../shared/components/lang-switcher/lang-switcher.component';
import { ThemeSwitcherComponent } from '../../../../shared/components/theme-switcher/theme-switcher.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    LangSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public theme: ThemeService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;
    
    this.loading = true;
    this.errorMsg = null;
    this.successMsg = null;
    
    const { email } = this.forgotPasswordForm.value;
    
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMsg = 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña.';
        this.forgotPasswordForm.reset();
        
        // Redirigir al login después de 5 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error al enviar el correo de recuperación';
      }
    });
  }
}
