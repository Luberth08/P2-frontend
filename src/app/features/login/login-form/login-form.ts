import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField, Button],
  templateUrl: './login-form.html',
  styleUrls: ['./login-form.scss']
})
export class LoginForm {
  @Output() submitLogin = new EventEmitter<{ email: string; password: string }>();
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';

  email: string = '';
  password: string = '';

  onSubmit() {
    if (!this.email || !this.password) {
      return;
    }
    this.submitLogin.emit({ email: this.email, password: this.password });
  }
}