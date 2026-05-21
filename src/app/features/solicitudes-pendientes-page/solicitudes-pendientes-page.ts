import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService, SolicitudAfiliacion } from '../../core/services/solicitud.service';
import { NotificationService } from '../../core/services/notification.service';
import { Button } from '../../shared/components/button/button';
import { InputField } from '../../shared/components/input-field/input-field';
import { Modal } from '../../shared/components/modal/modal';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { Map } from '../../shared/components/map/map';

@Component({
  selector: 'app-solicitudes-pendientes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner, Map],
  templateUrl: './solicitudes-pendientes-page.html',
  styleUrls: ['./solicitudes-pendientes-page.scss']
})
export class SolicitudesPendientesPage implements OnInit {
  solicitudes: SolicitudAfiliacion[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;

  showDetailModal = false;
  selectedSolicitud: SolicitudAfiliacion | null = null;
  comentarioRevision: string = '';
  procesando = false;

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
    this.solicitudService.listarPendientes(this.skip, this.limit).subscribe({
      next: (res) => {
        this.solicitudes = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
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

  openDetail(solicitud: SolicitudAfiliacion) {
    this.selectedSolicitud = solicitud;
    this.comentarioRevision = '';
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedSolicitud = null;
    this.comentarioRevision = '';
    this.cdr.detectChanges();
  }

  aprobar() {
    this.procesar('aprobada');
  }

  rechazar() {
    this.procesar('rechazada');
  }

  getLat(ubicacion: string): number {
    const parts = ubicacion.split(',');
    return parts.length === 2 ? parseFloat(parts[0]) : -17.3895;
  }

  getLng(ubicacion: string): number {
    const parts = ubicacion.split(',');
    return parts.length === 2 ? parseFloat(parts[1]) : -66.1568;
  }

  private procesar(estado: string) {
    if (!this.selectedSolicitud) return;
    this.procesando = true;
    this.solicitudService.actualizarEstado(this.selectedSolicitud.id, estado, this.comentarioRevision || undefined).subscribe({
      next: () => {
        this.procesando = false;
        this.notificationService.showSuccess(`Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} correctamente`);
        this.closeModal();
        this.loadSolicitudes(); // recargar lista (la solicitud desaparece)
      },
      error: (err) => {
        this.procesando = false;
        this.notificationService.showError(err.error?.detail || 'Error al procesar la solicitud');
      }
    });
  }
}