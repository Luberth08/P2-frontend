import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService, Configuracion, ConfiguracionCreate, ConfiguracionUpdate } from '../../../core/services/configuracion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './configuracion-page.html',
  styleUrls: ['./configuracion-page.scss']
})
export class ConfiguracionPage implements OnInit {
  configuraciones: Configuracion[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;

  // Modal crear/editar
  showFormModal = false;
  editing: Configuracion | null = null;
  formData: ConfiguracionCreate = { clave: '', valor: '' };
  isSaving = false;

  // Modal eliminar
  showDeleteModal = false;
  deleteId: number | null = null;
  deleteClave = '';
  isDeleting = false;

  constructor(
    private configuracionService: ConfiguracionService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadConfiguraciones();
  }

  loadConfiguraciones(showSpinner: boolean = true) {
    if (showSpinner) {
      this.isLoading = true;
    }
    this.configuracionService.list(this.skip, this.limit).subscribe({
      next: (res) => {
        this.configuraciones = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar configuraciones');
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
      this.loadConfiguraciones();
    }
  }
  prevPage() {
    if (this.skip > 0) {
      this.skip -= this.limit;
      this.loadConfiguraciones();
    }
  }

  // Modal crear
  openCreateModal() {
    this.editing = null;
    this.formData = { clave: '', valor: '' };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  // Modal editar
  openEditModal(config: Configuracion) {
    this.editing = config;
    this.formData = { clave: config.clave, valor: config.valor };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.editing = null;
    this.isSaving = false;
    this.cdr.detectChanges();
  }

  saveConfiguracion() {
    if (!this.formData.clave || !this.formData.clave.trim()) {
      this.notificationService.showError('La clave es obligatoria');
      return;
    }
    if (!this.formData.valor || !this.formData.valor.trim()) {
      this.notificationService.showError('El valor es obligatorio');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.editing) {
      // Editar: solo enviar valor
      const updateData: ConfiguracionUpdate = { valor: this.formData.valor.trim() };
      this.configuracionService.update(this.editing.id, updateData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Configuración actualizada');
          this.isSaving = false;
          this.closeFormModal();
          this.loadConfiguraciones(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.detectChanges();
          const msg = err.error?.detail || 'Error al actualizar configuración';
          this.notificationService.showError(msg);
        }
      });
    } else {
      // Crear: enviar clave y valor
      const createData: ConfiguracionCreate = {
        clave: this.formData.clave.trim(),
        valor: this.formData.valor.trim()
      };
      this.configuracionService.create(createData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Configuración creada');
          this.isSaving = false;
          this.closeFormModal();
          if (this.configuraciones.length === 0 && this.skip > 0) this.skip = 0;
          this.loadConfiguraciones(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.detectChanges();
          const msg = err.error?.detail || 'Error al crear configuración';
          this.notificationService.showError(msg);
        }
      });
    }
  }

  // Eliminar
  openDeleteModal(config: Configuracion) {
    this.deleteId = config.id;
    this.deleteClave = config.clave;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteId = null;
    this.deleteClave = '';
    this.isDeleting = false;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.isDeleting = true;
    this.cdr.detectChanges();

    this.configuracionService.delete(this.deleteId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Configuración eliminada');
        this.isDeleting = false;
        this.closeDeleteModal();
        if (this.configuraciones.length === 1 && this.skip > 0) this.skip -= this.limit;
        this.loadConfiguraciones(true);
      },
      error: (err) => {
        this.isDeleting = false;
        this.cdr.detectChanges();
        const msg = err.error?.detail || 'Error al eliminar configuración';
        this.notificationService.showError(msg);
        this.closeDeleteModal();
      }
    });
  }
}
