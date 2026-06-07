import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CotizacionService, TallerQuoteRequest } from '../../../core/services/cotizacion.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResponderCotizacionModalComponent } from './responder-cotizacion-modal.component';

@Component({
  selector: 'app-cotizaciones-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cotizaciones-page.html',
  styleUrls: ['./cotizaciones-page.scss']
})
export class CotizacionesPageComponent implements OnInit {
  @Input() tallerId: number | null = null;
  solicitudes: TallerQuoteRequest[] = [];
  loading = true;
  error: string | null = null;
  total = 0;
  skip = 0;
  limit = 10;

  constructor(
    private cotizacionService: CotizacionService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Cargando solicitudes con tallerId:', this.tallerId);
    
    this.cotizacionService.getSolicitudesPendientes(this.skip, this.limit).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.solicitudes = response.items;
        this.total = response.total;
        this.loading = false;
        console.log('Solicitudes cargadas:', this.solicitudes.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.error = 'Error al cargar solicitudes de cotización';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalle(solicitud: TallerQuoteRequest): void {
    // Abrir modal con el detalle
    this.dialog.open(ResponderCotizacionModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: solicitud
    }).afterClosed().subscribe(() => {
      // Recargar solicitudes después de cerrar el modal
      this.loadSolicitudes();
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return '#F59E0B';
      case 'con_respuesta':
        return '#3B82F6';
      case 'aceptada':
        return '#10B981';
      case 'rechazada':
        return '#EF4444';
      case 'expirada':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'con_respuesta':
        return 'Con Respuesta';
      case 'aceptada':
        return 'Aceptada';
      case 'rechazada':
        return 'Rechazada';
      case 'expirada':
        return 'Expirada';
      default:
        return estado;
    }
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}
