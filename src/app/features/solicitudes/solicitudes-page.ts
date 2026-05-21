import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService, SolicitudAfiliacion, SolicitudCreate } from '../../core/services/solicitud.service';
import { NotificationService } from '../../core/services/notification.service';
import { Button } from '../../shared/components/button/button';
import { InputField } from '../../shared/components/input-field/input-field';
import { Modal } from '../../shared/components/modal/modal';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { Map } from '../../shared/components/map/map';

@Component({
  selector: 'app-solicitudes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner, Map],
  templateUrl: './solicitudes-page.html',
  styleUrls: ['./solicitudes-page.scss'],
})
export class SolicitudesPage implements OnInit {
  solicitudes: SolicitudAfiliacion[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;
  selectedLocation: { lat: number; lng: number } | null = null;

  showModal = false;
  formData: SolicitudCreate = {
    nombre: '',
    ubicacion: '',
    telefono: '',
    email: '',
    comentario: ''
  };

  constructor(
    private solicitudService: SolicitudService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  loadSolicitudes() {
    this.isLoading = true;
    this.solicitudService.misSolicitudes(this.skip, this.limit).subscribe({
      next: (res) => {
        this.solicitudes = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar las solicitudes');
        this.cdr.detectChanges();
      }
    });
  }

  // Paginación
  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }
  get currentPage(): number {
    return Math.floor(this.skip / this.limit) + 1;
  }
  nextPage() {
    if (this.skip + this.limit < this.total) {
      this.skip += this.limit;
      this.loadSolicitudes();
    }
  }
  prevPage() {
    if (this.skip > 0) {
      this.skip -= this.limit;
      this.loadSolicitudes();
    }
  }

  openModal() {
    this.formData = {
      nombre: '',
      ubicacion: '',
      telefono: '',
      email: '',
      comentario: ''
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  submitSolicitud() {
    // Validación básica
    if (!this.formData.nombre || !this.selectedLocation || !this.formData.telefono || !this.formData.email) {
      this.notificationService.showError('Complete todos los campos obligatorios (incluya la ubicación en el mapa)');
      return;
    }
    this.formData.ubicacion = `${this.selectedLocation.lat},${this.selectedLocation.lng}`;
    // Validar formato de ubicación (lat,lon)
    const parts = this.formData.ubicacion.split(',');
    if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
      this.notificationService.showError('Ubicación inválida. Use formato "lat,lon" (ej: -17.3895,-66.1568)');
      return;
    }
    this.solicitudService.crear(this.formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Solicitud enviada correctamente');
        this.closeModal();
        // Reiniciar paginación a la primera página
        this.skip = 0;
        this.loadSolicitudes();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al enviar la solicitud';
        this.notificationService.showError(msg);
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'aprobada': return 'estado-aprobada';
      case 'rechazada': return 'estado-rechazada';
      default: return '';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      default: return estado;
    }
  }

  onLocationSelected(location: { lat: number; lng: number }) {
    this.selectedLocation = location;
    // Actualizar el campo de texto (opcional) para mostrar las coordenadas
    this.formData.ubicacion = `${location.lat},${location.lng}`;
  }
}