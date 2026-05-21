import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField, Button],
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.scss']
})
export class VerifyOtp {
  @Input() email: string = '';
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  @Output() verify = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();

  code: string = '';

  onVerify() {
    if (!this.code || this.code.length !== 6) {
      this.errorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }
    this.verify.emit(this.code);
  }

  onResend() {
    this.resend.emit();
  }
}