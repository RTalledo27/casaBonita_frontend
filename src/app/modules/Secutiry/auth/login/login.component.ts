import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, LoginResponse } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LangSwitcherComponent } from "../../../../shared/components/lang-switcher/lang-switcher.component";
import { TranslateModule } from '@ngx-translate/core';
import { ThemeSwitcherComponent } from '../../../../shared/components/theme-switcher/theme-switcher.component';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LangSwitcherComponent,
    ThemeSwitcherComponent,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  viewMode: 'login' | 'forgot' = 'login';
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  returnUrl: string;
  showPassword = false;
  successMsg: string | null = null;
  currentYear = new Date().getFullYear();
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public theme: ThemeService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  toggleView(mode: 'login' | 'forgot'): void {
    this.viewMode = mode;
    this.errorMsg = null;
    this.successMsg = null;
    this.loginForm.reset();
    this.forgotPasswordForm.reset();
    if (mode === 'login') {
      const savedUsername = localStorage.getItem('rememberedUsername');
      if (savedUsername) {
        this.loginForm.patchValue({ username: savedUsername, remember: true });
      }
    }
  }

  ngOnInit(): void {
    // Cargar credenciales guardadas si existen
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.loginForm.patchValue({
        username: savedUsername,
        remember: true
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    const { username, password, remember } = this.loginForm.value;

    this.auth.login({ username: username, password }).subscribe({
      next: (res: LoginResponse) => {
        // Guardar o eliminar username según "Recuérdame"
        if (remember) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        if ((res.user as any).must_change_password) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigateByUrl(this.returnUrl || '/dashboard');
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error de autenticación';
        this.loading = false;
      },
    });
  }

  onForgotSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.loading = true;
    this.errorMsg = null;
    this.successMsg = null;

    const { email } = this.forgotPasswordForm.value;

    this.auth.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMsg = 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña.';
        this.forgotPasswordForm.reset();

        setTimeout(() => {
          this.toggleView('login');
        }, 5000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error al enviar el correo de recuperación';
      }
    });
  }
}
