import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../../../../shared/components/input-field/input-field';
import { Button } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField, Button],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.scss']
})
export class ChangePassword {
  @Input() email: string = '';
  @Output() requestOtp = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<{ email: string; code: string; newPassword: string }>();

  code: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  otpSent: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  sendOtp() {
    if (!this.email) return;
    this.requestOtp.emit();
    this.otpSent = true;
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    this.changePassword.emit({ email: this.email, code: this.code, newPassword: this.newPassword });
  }
}