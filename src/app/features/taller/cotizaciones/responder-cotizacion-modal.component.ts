import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CotizacionService, QuoteItemCreate, TallerQuoteRequest } from '../../../core/services/cotizacion.service';

@Component({
  selector: 'app-responder-cotizacion-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './responder-cotizacion-modal.component.html',
  styleUrls: ['./responder-cotizacion-modal.component.scss']
})
export class ResponderCotizacionModalComponent {
  solicitud: TallerQuoteRequest;
  form: FormGroup;
  items: FormGroup[] = [];
  submitting = false;
  error: string | null = null;

  // Getter para evitar errores de TypeScript en templates
  getFormControl(item: FormGroup, controlName: string): FormControl {
    return item.get(controlName) as FormControl;
  }

  constructor(
    private dialogRef: MatDialogRef<ResponderCotizacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: TallerQuoteRequest,
    private fb: FormBuilder,
    private cotizacionService: CotizacionService
  ) {
    this.solicitud = data;
    this.form = this.fb.group({});
    
    // Agregar items por defecto
    this.agregarItem('Servicio');
    this.agregarItem('Viaje');
  }

  agregarItem(tituloDefault: string = ''): void {
    const itemGroup = this.fb.group({
      titulo: [tituloDefault, Validators.required],
      precio: [0, [Validators.required, Validators.min(0), this.maxTwoDecimals()]]
    });
    this.items.push(itemGroup);
  }

  maxTwoDecimals() {
    return (control: FormControl) => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const decimalPart = value.toString().split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        return { maxTwoDecimals: true };
      }
      return null;
    };
  }

  eliminarItem(index: number): void {
    if (this.items.length > 2) { // Mantener al menos 2 items
      this.items.splice(index, 1);
    }
  }

  calcularTotal(): number {
    return this.items.reduce((total, item) => {
      const precio = item.get('precio')?.value || 0;
      return total + precio;
    }, 0);
  }

  onSubmit(): void {
    if (this.items.length === 0) {
      this.error = 'Debes agregar al menos un item';
      return;
    }

    // Validar todos los items
    for (let item of this.items) {
      if (item.invalid) {
        item.markAllAsTouched();
        this.error = 'Por favor completa todos los campos correctamente';
        return;
      }
    }

    this.submitting = true;
    this.error = null;

    const itemsData: QuoteItemCreate[] = this.items.map(item => ({
      titulo: item.get('titulo')?.value,
      precio: item.get('precio')?.value
    }));

    this.cotizacionService.responderCotizacion(this.solicitud.id, { items: itemsData }).subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Error al enviar la cotización: ' + (err.message || 'Error desconocido');
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
