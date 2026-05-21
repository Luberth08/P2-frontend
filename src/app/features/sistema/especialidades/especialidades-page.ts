import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialidadService, Especialidad } from '../../../core/services/especialidad.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-especialidades-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './especialidades-page.html',
  styleUrls: ['./especialidades-page.scss']
})
export class EspecialidadesPage implements OnInit {
  especialidades: Especialidad[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;

  // Form modal
  showFormModal = false;
  editing: Especialidad | null = null;
  formData: { nombre: string; descripcion?: string } = { nombre: '', descripcion: '' };

  // Delete modal
  showDeleteModal = false;
  deleteId: number | null = null;
  deleteNombre = '';

  constructor(
    private especialidadService: EspecialidadService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEspecialidades();
  }

  loadEspecialidades() {
    this.isLoading = true;
    this.especialidadService.list(this.skip, this.limit).subscribe({
      next: (res) => {
        this.especialidades = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar especialidades');
        this.cdr.detectChanges();
      }
    });
  }

  // Pagination
  get totalPages(): number { return Math.ceil(this.total / this.limit); }
  get currentPage(): number { return Math.floor(this.skip / this.limit) + 1; }
  nextPage() { if (this.skip + this.limit < this.total) { this.skip += this.limit; this.loadEspecialidades(); } }
  prevPage() { if (this.skip > 0) { this.skip -= this.limit; this.loadEspecialidades(); } }

  // Modal create/edit
  openCreateModal() {
    this.editing = null;
    this.formData = { nombre: '', descripcion: '' };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(e: Especialidad) {
    this.editing = e;
    this.formData = { nombre: e.nombre, descripcion: e.descripcion ?? '' };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.editing = null;
    this.cdr.detectChanges();
  }

  saveEspecialidad() {
    if (!this.formData.nombre || !this.formData.nombre.trim()) {
      this.notificationService.showError('El nombre es obligatorio');
      return;
    }
    const payload = { nombre: this.formData.nombre.trim(), descripcion: this.formData.descripcion };
    const req = this.editing
      ? this.especialidadService.update(this.editing.id, payload)
      : this.especialidadService.create(payload);
    req.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.editing ? 'Especialidad actualizada' : 'Especialidad creada');
        this.closeFormModal();
        // reload
        if (this.especialidades.length === 0 && this.skip > 0) this.skip = 0;
        this.loadEspecialidades();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al guardar especialidad';
        this.notificationService.showError(msg);
      }
    });
  }

  // Delete
  openDeleteModal(e: Especialidad) {
    this.deleteId = e.id;
    this.deleteNombre = e.nombre;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteId = null;
    this.deleteNombre = '';
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.especialidadService.delete(this.deleteId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Especialidad eliminada');
        this.closeDeleteModal();
        // adjust page if last item
        if (this.especialidades.length === 1 && this.skip > 0) this.skip -= this.limit;
        this.loadEspecialidades();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al eliminar especialidad';
        this.notificationService.showError(msg);
        this.closeDeleteModal();
      }
    });
  }
}
