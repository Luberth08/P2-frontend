import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TallerService, TallerDetail, TallerUpdate } from '../../../core/services/taller.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Map } from '../../../shared/components/map/map';

@Component({
  selector: 'app-perfil-taller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner, Map],
  templateUrl: './perfil-taller-page.html',
  styleUrls: ['./perfil-taller-page.scss']
})
export class PerfilTallerPage implements OnInit, OnChanges {
  @Input() tallerId: number = 0;

  taller: TallerDetail | null = null;
  isLoading = false;
  isSuperAdmin = false;

  // Modal de edición
  showEditModal = false;
  formData: TallerUpdate = {};
  isSaving = false;
  showMapInModal = false; // Flag para controlar la renderización del mapa

  // Ubicación para el mapa
  mapLat: number = -17.78629;
  mapLng: number = -63.18117;

  constructor(
    private tallerService: TallerService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    if (this.tallerId) {
      this.loadTaller();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tallerId && changes['tallerId']) {
      this.loadTaller();
    }
  }

  checkUserRole() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.isSuperAdmin = payload.roles?.includes('super_admin_taller') || false;
      } catch (e) {
        console.error('Error al decodificar token:', e);
      }
    }
  }

  loadTaller() {
    this.isLoading = true;
    this.tallerService.getDetail(this.tallerId).subscribe({
      next: (taller) => {
        this.taller = taller;
        // Parsear ubicación si existe
        if (taller.ubicacion) {
          const [lat, lng] = taller.ubicacion.split(',').map(s => parseFloat(s.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            this.mapLat = lat;
            this.mapLng = lng;
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar información del taller');
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal() {
    if (!this.taller) return;
    this.formData = {
      nombre: this.taller.nombre,
      telefono: this.taller.telefono,
      email: this.taller.email,
      ubicacion: this.taller.ubicacion,
      hora_inicio: this.taller.hora_inicio,
      hora_fin: this.taller.hora_fin,
      url_web: this.taller.url_web
    };
    // Parsear ubicación para el mapa
    if (this.taller.ubicacion) {
      const [lat, lng] = this.taller.ubicacion.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        this.mapLat = lat;
        this.mapLng = lng;
      }
    }
    this.showEditModal = true;
    this.showMapInModal = false;
    this.cdr.detectChanges();
    // Esperar a que el modal se renderice completamente antes de mostrar el mapa
    setTimeout(() => {
      this.showMapInModal = true;
      this.cdr.detectChanges();
    }, 300);
  }

  closeEditModal() {
    this.showEditModal = false;
    this.showMapInModal = false;
    this.isSaving = false;
    this.cdr.detectChanges();
  }

  onLocationSelected(location: { lat: number; lng: number }) {
    this.mapLat = location.lat;
    this.mapLng = location.lng;
    this.formData.ubicacion = `${location.lat},${location.lng}`;
    this.cdr.detectChanges();
  }

  saveTaller() {
    if (!this.formData.nombre || !this.formData.nombre.trim()) {
      this.notificationService.showError('El nombre es obligatorio');
      return;
    }
    if (!this.formData.telefono || !this.formData.telefono.trim()) {
      this.notificationService.showError('El teléfono es obligatorio');
      return;
    }
    if (!this.formData.email || !this.formData.email.trim()) {
      this.notificationService.showError('El email es obligatorio');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    this.tallerService.update(this.tallerId, this.formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Taller actualizado correctamente');
        this.isSaving = false;
        this.closeEditModal();
        this.loadTaller();
      },
      error: (err) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        const msg = err.error?.detail || 'Error al actualizar taller';
        this.notificationService.showError(msg);
      }
    });
  }

  getUbicacionDisplay(): string {
    if (!this.taller?.ubicacion) return 'No especificada';
    const [lat, lng] = this.taller.ubicacion.split(',');
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
  }
}
