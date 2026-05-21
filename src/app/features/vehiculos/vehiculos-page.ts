import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService, Vehiculo, VehiculoCreate, VehiculoUpdate } from '../../core/services/vehiculo.service';
import { NotificationService } from '../../core/services/notification.service';
import { Button } from '../../shared/components/button/button';
import { InputField } from '../../shared/components/input-field/input-field';
import { Modal } from '../../shared/components/modal/modal';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-vehiculos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './vehiculos-page.html',
  styleUrls: ['./vehiculos-page.scss']
})
export class VehiculosPage implements OnInit {
  vehiculos: Vehiculo[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  isLoading = false;

  // Modal de creación/edición
  showFormModal = false;
  editingVehiculo: Vehiculo | null = null;
  formData: VehiculoCreate = {
    matricula: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    tipo: 'auto'
  };
  tipos = ['auto', 'camioneta', 'moto', 'camion', 'microbus', 'otro'];

  // Modal de confirmación de eliminación
  showDeleteModal = false;
  deleteId: number | null = null;
  deleteMatricula = '';

  constructor(
    private vehiculoService: VehiculoService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehiculos();
  }

  loadVehiculos() {
    this.isLoading = true;
    this.vehiculoService.list(this.skip, this.limit).subscribe({
      next: (res) => {
        this.vehiculos = res.items;
        this.total = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar los vehículos');
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
      this.loadVehiculos();
    }
  }
  prevPage() {
    if (this.skip > 0) {
      this.skip -= this.limit;
      this.loadVehiculos();
    }
  }

  // Modal de creación
  openCreateModal() {
    this.editingVehiculo = null;
    this.formData = {
      matricula: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      color: '',
      tipo: 'auto'
    };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  // Modal de edición
  openEditModal(vehiculo: Vehiculo) {
    this.editingVehiculo = vehiculo;
    this.formData = {
      matricula: vehiculo.matricula,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color || '',
      tipo: vehiculo.tipo
    };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.editingVehiculo = null;
    this.cdr.detectChanges();
  }

  saveVehiculo() {
    // Validación básica
    if (!this.formData.matricula || !this.formData.marca || !this.formData.modelo || !this.formData.anio) {
      this.notificationService.showError('Complete los campos obligatorios');
      return;
    }
    const request = this.editingVehiculo
      ? this.vehiculoService.update(this.editingVehiculo.id, this.formData as VehiculoUpdate)
      : this.vehiculoService.create(this.formData);
    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.editingVehiculo ? 'Vehículo actualizado' : 'Vehículo creado');
        this.closeFormModal();
        this.loadVehiculos();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al guardar');
      }
    });
  }

  // Eliminación
  openDeleteModal(vehiculo: Vehiculo) {
    this.deleteId = vehiculo.id;
    this.deleteMatricula = vehiculo.matricula;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteId = null;
    this.deleteMatricula = '';
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (this.deleteId === null) return;
    this.vehiculoService.delete(this.deleteId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Vehículo eliminado');
        this.closeDeleteModal();
        // Si después de eliminar la página actual queda vacía, retrocedemos una página
        if (this.vehiculos.length === 1 && this.skip > 0) {
          this.skip -= this.limit;
        }
        this.loadVehiculos();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al eliminar');
        this.closeDeleteModal();
      }
    });
  }
}