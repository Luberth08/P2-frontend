import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-field.html',
  styleUrls: ['./input-field.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputField),
      multi: true
    }
  ]
})
export class InputField implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() icon: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() maxLength: number | null = null;
  @Input() minLength: number | null = null;
  @Input() pattern: string | null = null;
  @Input() inputMode: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'none' = 'text';
  @Input() errorMessage: string = '';

  value: any = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;
    
    // Validación en tiempo real (opcional)
    this.errorMessage = '';
    if (this.maxLength && newValue.length > this.maxLength) {
      this.errorMessage = `Máximo ${this.maxLength} caracteres.`;
      newValue = newValue.slice(0, this.maxLength);
      input.value = newValue;
    }
    if (this.minLength && newValue.length < this.minLength && newValue.length > 0) {
      this.errorMessage = `Mínimo ${this.minLength} caracteres.`;
    }
    if (this.pattern) {
      const regex = new RegExp(this.pattern);
      if (newValue && !regex.test(newValue)) {
        this.errorMessage = 'Formato inválido.';
      }
    }
    // Para campos numéricos, puedes forzar solo dígitos (pero mejor usar type="number")
    if (this.type === 'number' && newValue && !/^\d+$/.test(newValue)) {
      this.errorMessage = 'Solo se permiten números.';
      newValue = newValue.replace(/\D/g, '');
      input.value = newValue;
    }
    this.value = newValue;
    this.onChange(this.value);
    this.onTouched();
  }
}