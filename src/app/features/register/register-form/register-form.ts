import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField, Button],
  templateUrl: './register-form.html',
  styleUrls: ['./register-form.scss']
})
export class RegisterForm {
  @Output() submitForm = new EventEmitter<any>();
  @Input() isLoading: boolean = false;  // ← recibido del padre
  @Input() errorMessage: string = '';   // opcional: para mostrar errores del padre

  // Campos obligatorios
  email: string = '';
  username: string = '';
  password: string = '';

  // Campos opcionales (persona)
  nombre: string = '';
  apellido_p: string = '';
  apellido_m: string = '';
  direccion: string = '';
  telefono: string = '';
  ci: string = '';
  complemento: string = '';

  // Validación simple
  onSubmit() {
    if (!this.email || !this.username || !this.password) {
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }
    const data = {
      email: this.email,
      username: this.username,
      password: this.password,
      nombre: this.nombre || null,
      apellido_p: this.apellido_p || null,
      apellido_m: this.apellido_m || null,
      direccion: this.direccion || null,
      telefono: this.telefono || null,
      ci: this.ci || null,
      complemento: this.complemento || null
    };
    this.submitForm.emit(data);
  }
}