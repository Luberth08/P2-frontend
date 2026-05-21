import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoTallerService, VehiculoTaller, VehiculoTallerCreate, VehiculoTallerUpdate } from '../../../core/services/vehiculo-taller.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-vehiculos-taller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './vehiculos-page.html',
  styleUrls: ['./vehiculos-page.scss']
})
export class VehiculosTallerPage implements OnInit {
  @Input() tallerId: number = 0;

  // Actuales / Descontinuados
  vehiculosActivos: VehiculoTaller[] = [];
  totalActivos = 0;
  skipActivos = 0;
  limit = 10;

  vehiculosInactivos: VehiculoTaller[] = [];
  totalInactivos = 0;
  skipInactivos = 0;

  isLoading = false;
  activeTab: 'activos' | 'inactivos' = 'activos';

  // Modal crear/editar
  showFormModal = false;
  editingVehiculo: VehiculoTaller | null = null;
  formData: VehiculoTallerCreate = { matricula: '', marca: '', modelo: '', anio: new Date().getFullYear(), color: '', tipo: 'servicio' };
  tipos = ['servicio', 'remolque', 'otro'];

  // Modal inactivar
  showInactivateModal = false;
  inactivateId: number | null = null;
  inactivateMatricula = '';

  constructor(
    private vehiculoService: VehiculoTallerService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.tallerId) {
      this.cargarActivos();
      this.cargarInactivos();
    }
  }

  ngOnChanges(): void {
    if (this.tallerId) {
      this.resetPagination();
      this.cargarActivos();
      this.cargarInactivos();
    }
  }

  resetPagination() {
    this.skipActivos = 0;
    this.skipInactivos = 0;
  }

  cargarActivos() {
    this.isLoading = true;
    this.vehiculoService.list(this.tallerId, 'disponible', this.skipActivos, this.limit).subscribe({
      next: (res) => {
        this.vehiculosActivos = res.items;
        this.totalActivos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar vehículos activos');
        this.cdr.detectChanges();
      }
    });
  }

  cargarInactivos() {
    this.isLoading = true;
    this.vehiculoService.list(this.tallerId, 'inactivo', this.skipInactivos, this.limit).subscribe({
      next: (res) => {
        this.vehiculosInactivos = res.items;
        this.totalInactivos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar vehículos descontinuados');
        this.cdr.detectChanges();
      }
    });
  }

  changeTab(tab: 'activos' | 'inactivos') {
    this.activeTab = tab;
    if (tab === 'activos') this.cargarActivos(); else this.cargarInactivos();
    this.cdr.detectChanges();
  }

  // Paginación
  get pageActivos(): number { return Math.floor(this.skipActivos / this.limit) + 1; }
  get totalPagesActivos(): number { return Math.ceil(this.totalActivos / this.limit); }
  nextPageActivos() { if (this.skipActivos + this.limit < this.totalActivos) { this.skipActivos += this.limit; this.cargarActivos(); } }
  prevPageActivos() { if (this.skipActivos > 0) { this.skipActivos -= this.limit; this.cargarActivos(); } }

  get pageInactivos(): number { return Math.floor(this.skipInactivos / this.limit) + 1; }
  get totalPagesInactivos(): number { return Math.ceil(this.totalInactivos / this.limit); }
  nextPageInactivos() { if (this.skipInactivos + this.limit < this.totalInactivos) { this.skipInactivos += this.limit; this.cargarInactivos(); } }
  prevPageInactivos() { if (this.skipInactivos > 0) { this.skipInactivos -= this.limit; this.cargarInactivos(); } }

  // Modal crear/editar
  openCreateModal() {
    this.editingVehiculo = null;
    this.formData = { matricula: '', marca: '', modelo: '', anio: new Date().getFullYear(), color: '', tipo: 'servicio' };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(v: VehiculoTaller) {
    this.editingVehiculo = v;
    this.formData = { matricula: v.matricula, marca: v.marca, modelo: v.modelo, anio: v.anio, color: v.color ?? '', tipo: v.tipo };
    this.showFormModal = true;
    this.cdr.detectChanges();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.editingVehiculo = null;
    this.cdr.detectChanges();
  }

  saveVehiculo() {
    if (!this.formData.matricula || !this.formData.marca || !this.formData.modelo || !this.formData.anio) {
      this.notificationService.showError('Complete los campos obligatorios');
      return;
    }
    const req = this.editingVehiculo
      ? this.vehiculoService.update(this.tallerId, this.editingVehiculo.id, this.formData as VehiculoTallerUpdate)
      : this.vehiculoService.create(this.tallerId, this.formData);
    req.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.editingVehiculo ? 'Vehículo actualizado' : 'Vehículo creado');
        this.closeFormModal();
        this.resetPagination();
        this.cargarActivos();
        this.cargarInactivos();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al guardar vehículo');
      }
    });
  }

  // Inactivar
  openInactivateModal(v: VehiculoTaller) {
    this.inactivateId = v.id;
    this.inactivateMatricula = v.matricula;
    this.showInactivateModal = true;
    this.cdr.detectChanges();
  }

  closeInactivateModal() {
    this.showInactivateModal = false;
    this.inactivateId = null;
    this.inactivateMatricula = '';
    this.cdr.detectChanges();
  }

  confirmarInactivar() {
    if (!this.inactivateId) return;
    this.vehiculoService.inactivate(this.tallerId, this.inactivateId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Vehículo inactivado');
        this.closeInactivateModal();
        this.resetPagination();
        this.cargarActivos();
        this.cargarInactivos();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al inactivar vehículo');
        this.closeInactivateModal();
      }
    });
  }
}
