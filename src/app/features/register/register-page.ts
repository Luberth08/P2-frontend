import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonBack } from '../../shared/components/button-back/button-back';
import { RegisterForm } from './register-form/register-form';
import { VerifyOtp } from './verify-otp/verify-otp';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ButtonBack, RegisterForm, VerifyOtp],
  templateUrl: './register-page.html',
  styleUrls: ['./register-page.scss']
})
export class RegisterPage {
  step: 'form' | 'otp' = 'form';
  email: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  onFormSubmit(data: any) {
    this.isLoading = true;
    this.cdr.detectChanges();
    console.log('isLoading true');
    this.errorMessage = '';
    this.authService.registerInit(data).subscribe({
      next: () => {
        this.isLoading = false;
        console.log('isLoading false (next)');
        this.email = data.email;
        this.step = 'otp';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.log('isLoading false (error)');
        this.errorMessage = err.error?.detail || 'Error al iniciar el registro.';
        this.cdr.detectChanges();
      }
    });
  }

  onOtpVerify(code: string) {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.authService.registerComplete(this.email, code).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('¡Registro exitoso! Bienvenido.');
        this.router.navigate(['/dashboard']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Código inválido o expirado.';
        this.cdr.detectChanges();
      }
    });
  }

  onResendOtp() {
    // Si tu backend tiene un endpoint para reenviar OTP, llámalo aquí.
    // Por ahora, mostramos un mensaje informativo.
    this.notificationService.showInfo('Funcionalidad de reenvío en desarrollo.');
    // Si tuvieras el endpoint, harías:
    // this.authService.resendOtp(this.email).subscribe(...)
  }

  goBack() {
    if (this.step === 'otp') {
      this.step = 'form';
    } else {
      this.router.navigate(['/']);
    }
  }
}