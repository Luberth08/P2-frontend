import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonBack } from '../../shared/components/button-back/button-back';
import { LoginForm } from './login-form/login-form';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ButtonBack, LoginForm],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss']
})
export class LoginPage {
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onLogin(credentials: { email: string; password: string }) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notificationService.showSuccess('¡Bienvenido de nuevo!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Credenciales incorrectas. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}