import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaIncidenteService, CategoriaIncidente, CategoriaIncidenteCreate, CategoriaIncidenteUpdate } from '../../../core/services/categoria-incidente.service';
import { EspecialidadService, Especialidad } from '../../../core/services/especialidad.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-categorias-incidentes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './categorias-incidentes-page.html',
  styleUrls: ['./categorias-incidentes-page.scss']
})
export class CategoriasIncidentesPage implements OnInit {
  categorias: CategoriaIncidente[] = [];
  especialidades: Especialidad[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;

  // Modal crear/editar
  showFormModal = false;
  editing: CategoriaIncidente | null = null;
  formData: CategoriaIncidenteCreate = { nombre: '', especialidad_ids: [] };
  isSaving = false;

  // Modal eliminar
  showDeleteModal = false;
  deleteId: number | null = null;
  deleteNombre = '';
  isDeleting = false;

  constructor(
    private categoriaService: CategoriaIncidenteService,
    private especialidadService: EspecialidadService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEspecialidades();
    this.loadCategorias();
  }

  loadEspecialidades() {
    this.especialidadService.listAll().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.showError('Error al cargar especialidades');
      }
    });
  }

  loadCategorias(showSpinner: boolean = true) {
    if (showSpinner) {
      this.isLoading = true;
    }
    this.categoriaService.list(this.skip, this.limit).subscribe({
      next: (res) => {
        this.categorias = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar categorías');
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
      this.loadCategorias();
    }
  }
  prevPage() {
    if (this.skip > 0) {
      this.skip -= this.limit;
      this.loadCategorias();
    }
  }

  // Modal crear
  openCreateModal() {
    this.editing = null;
    this.formData = { nombre: '', especialidad_ids: [] };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  // Modal editar
  openEditModal(categoria: CategoriaIncidente) {
    this.editing = categoria;
    this.formData = { 
      nombre: categoria.nombre, 
      especialidad_ids: [...categoria.especialidad_ids] 
    };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.editing = null;
    this.isSaving = false;
    this.cdr.detectChanges();
  }

  // Toggle especialidad
  toggleEspecialidad(especialidadId: number) {
    const index = this.formData.especialidad_ids.indexOf(especialidadId);
    if (index > -1) {
      this.formData.especialidad_ids.splice(index, 1);
    } else {
      this.formData.especialidad_ids.push(especialidadId);
    }
    this.cdr.detectChanges();
  }

  isEspecialidadSelected(especialidadId: number): boolean {
    return this.formData.especialidad_ids.includes(especialidadId);
  }

  saveCategoria() {
    if (!this.formData.nombre || !this.formData.nombre.trim()) {
      this.notificationService.showError('El nombre es obligatorio');
      return;
    }
    if (this.formData.especialidad_ids.length === 0) {
      this.notificationService.showError('Debe seleccionar al menos una especialidad');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.editing) {
      // Editar
      const updateData: CategoriaIncidenteUpdate = {
        nombre: this.formData.nombre.trim(),
        especialidad_ids: this.formData.especialidad_ids
      };
      this.categoriaService.update(this.editing.id, updateData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Categoría actualizada');
          this.isSaving = false;
          this.closeFormModal();
          this.loadCategorias(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.detectChanges();
          const msg = err.error?.detail || 'Error al actualizar categoría';
          this.notificationService.showError(msg);
        }
      });
    } else {
      // Crear
      const createData: CategoriaIncidenteCreate = {
        nombre: this.formData.nombre.trim(),
        especialidad_ids: this.formData.especialidad_ids
      };
      this.categoriaService.create(createData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Categoría creada');
          this.isSaving = false;
          this.closeFormModal();
          if (this.categorias.length === 0 && this.skip > 0) this.skip = 0;
          this.loadCategorias(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.detectChanges();
          const msg = err.error?.detail || 'Error al crear categoría';
          this.notificationService.showError(msg);
        }
      });
    }
  }

  // Eliminar
  openDeleteModal(categoria: CategoriaIncidente) {
    this.deleteId = categoria.id;
    this.deleteNombre = categoria.nombre;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteId = null;
    this.deleteNombre = '';
    this.isDeleting = false;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.isDeleting = true;
    this.cdr.detectChanges();

    this.categoriaService.delete(this.deleteId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Categoría eliminada');
        this.isDeleting = false;
        this.closeDeleteModal();
        if (this.categorias.length === 1 && this.skip > 0) this.skip -= this.limit;
        this.loadCategorias(true);
      },
      error: (err) => {
        this.isDeleting = false;
        this.cdr.detectChanges();
        const msg = err.error?.detail || 'Error al eliminar categoría';
        this.notificationService.showError(msg);
        this.closeDeleteModal();
      }
    });
  }

  // Obtener nombres de especialidades
  getEspecialidadNombres(ids: number[]): string {
    if (!ids || ids.length === 0) return 'Sin especialidades';
    const nombres = ids
      .map(id => this.especialidades.find(e => e.id === id)?.nombre)
      .filter(n => n);
    return nombres.length > 0 ? nombres.join(', ') : 'Sin especialidades';
  }

  // Obtener nombre de una especialidad
  getEspecialidadNombre(id: number): string {
    return this.especialidades.find(e => e.id === id)?.nombre || 'Desconocida';
  }
}
