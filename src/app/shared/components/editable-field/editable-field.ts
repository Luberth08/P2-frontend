import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../input-field/input-field';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField],
  templateUrl: './editable-field.html',
  styleUrls: ['./editable-field.scss']
})
export class EditableField {
  @Input() label: string = '';
  @Input() value: any = '';
  @Input() type: string = 'text';
  @Input() icon: string = '';
  @Input() required: boolean = false;
  @Input() maxLength: number | null = null;
  @Input() minLength: number | null = null;
  @Input() pattern: string | null = null;
  @Input() inputMode: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'none' = 'text';
  @Input() disabled: boolean = false;
  @Output() save = new EventEmitter<any>();

  editing: boolean = false;
  editValue: any = '';

  startEdit() {
    this.editValue = this.value;
    this.editing = true;
  }

  cancelEdit() {
    this.editing = false;
  }

  confirmEdit() {
    if (this.editValue !== this.value) {
      this.save.emit(this.editValue);
    }
    this.editing = false;
  }
}