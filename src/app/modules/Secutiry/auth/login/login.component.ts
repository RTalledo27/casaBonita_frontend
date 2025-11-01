import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, LoginResponse } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  returnUrl: string;
  showPassword = false;
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
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    const { username, password, remember } = this.loginForm.value;
    this.auth.login({ username: username, password }).subscribe({
      next: (res: LoginResponse) => {
        // aquí podrías usar `remember` para storage
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
}
