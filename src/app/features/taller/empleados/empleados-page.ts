import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService, Empleado, EmpleadoCreate } from '../../../core/services/empleado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-empleados-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './empleados-page.html',
  styleUrls: ['./empleados-page.scss']
})
export class EmpleadosPage implements OnInit, OnChanges {
  @Input() tallerId: number = 0;

  // Activos
  empleadosActivos: Empleado[] = [];
  totalActivos = 0;
  skipActivos = 0;
  limit = 10;

  // Suspendidos
  empleadosSuspendidos: Empleado[] = [];
  totalSuspendidos = 0;
  skipSuspendidos = 0;

  isLoading = false;
  activeTab: 'activos' | 'suspendidos' = 'activos';

  // Modal de creación
  showCreateModal = false;
  formData: EmpleadoCreate = {
    email: '',
    rol: 'admin_taller'
  };
  roles = [
    { value: 'admin_taller', label: 'Administrador de taller' },
    { value: 'super_admin_taller', label: 'Super Administrador de taller' }
  ];

  // Modal de confirmación de suspensión
  showSuspendModal = false;
  suspendEmpleadoId: number | null = null;
  suspendEmpleadoNombre = '';

  constructor(
    private empleadoService: EmpleadoService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('EmpleadosPage ngOnInit - tallerId:', this.tallerId);
    if (this.tallerId) {
      this.cargarActivos();
      this.cargarSuspendidos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EmpleadosPage ngOnChanges - tallerId:', this.tallerId, 'changes:', changes);
    if (this.tallerId && changes['tallerId']) {
      this.resetPaginacion();
      this.cargarActivos();
      this.cargarSuspendidos();
    }
  }

  resetPaginacion() {
    this.skipActivos = 0;
    this.skipSuspendidos = 0;
  }

  cargarActivos() {
    console.log('Cargando empleados activos - tallerId:', this.tallerId);
    this.isLoading = true;
    // Empleados activos tienen estado 'activo' en el backend
    this.empleadoService.listar(this.tallerId, 'activo', this.skipActivos, this.limit).subscribe({
      next: (res) => {
        console.log('Empleados activos recibidos:', res);
        this.empleadosActivos = res.items;
        this.totalActivos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar empleados activos:', err);
        this.isLoading = false;
        this.notificationService.showError('Error al cargar empleados activos');
        this.cdr.detectChanges();
      }
    });
  }

  changeTab(tab: 'activos' | 'suspendidos') {
    this.activeTab = tab;
    if (tab === 'activos') {
      this.cargarActivos();
    } else {
      this.cargarSuspendidos();
    }
    this.cdr.detectChanges();
  }

  cargarSuspendidos() {
    this.isLoading = true;
    this.empleadoService.listar(this.tallerId, 'suspendido', this.skipSuspendidos, this.limit).subscribe({
      next: (res) => {
        this.empleadosSuspendidos = res.items;
        this.totalSuspendidos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar empleados suspendidos');
        this.cdr.detectChanges();
      }
    });
  }

  // Paginación activos
  get pageActivos(): number {
    return Math.floor(this.skipActivos / this.limit) + 1;
  }
  get totalPagesActivos(): number {
    return Math.ceil(this.totalActivos / this.limit);
  }
  nextPageActivos() {
    if (this.skipActivos + this.limit < this.totalActivos) {
      this.skipActivos += this.limit;
      this.cargarActivos();
    }
  }
  prevPageActivos() {
    if (this.skipActivos > 0) {
      this.skipActivos -= this.limit;
      this.cargarActivos();
    }
  }

  // Paginación suspendidos
  get pageSuspendidos(): number {
    return Math.floor(this.skipSuspendidos / this.limit) + 1;
  }
  get totalPagesSuspendidos(): number {
    return Math.ceil(this.totalSuspendidos / this.limit);
  }
  nextPageSuspendidos() {
    if (this.skipSuspendidos + this.limit < this.totalSuspendidos) {
      this.skipSuspendidos += this.limit;
      this.cargarSuspendidos();
    }
  }
  prevPageSuspendidos() {
    if (this.skipSuspendidos > 0) {
      this.skipSuspendidos -= this.limit;
      this.cargarSuspendidos();
    }
  }

  // Modal de creación
  openCreateModal() {
    this.formData = { email: '', rol: 'admin_taller' };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.cdr.detectChanges();
  }

  createEmpleado() {
    if (!this.formData.email) {
      this.notificationService.showError('El email es obligatorio');
      return;
    }
    this.empleadoService.crear(this.tallerId, this.formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Empleado agregado correctamente');
        this.closeCreateModal();
        this.resetPaginacion();
        this.cargarActivos();
        this.cargarSuspendidos();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al crear empleado';
        this.notificationService.showError(msg);
      }
    });
  }

  // Suspensión
  openSuspendModal(empleado: Empleado) {
    this.suspendEmpleadoId = empleado.id;
    this.suspendEmpleadoNombre = empleado.usuario_nombre;
    this.showSuspendModal = true;
    this.cdr.detectChanges();
  }

  closeSuspendModal() {
    this.showSuspendModal = false;
    this.suspendEmpleadoId = null;
    this.suspendEmpleadoNombre = '';
    this.cdr.detectChanges();
  }

  confirmarSuspension() {
    if (!this.suspendEmpleadoId) return;
    this.empleadoService.suspender(this.tallerId, this.suspendEmpleadoId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Empleado suspendido');
        this.closeSuspendModal();
        this.resetPaginacion();
        this.cargarActivos();
        this.cargarSuspendidos();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al suspender empleado';
        this.notificationService.showError(msg);
        this.closeSuspendModal();
      }
    });
  }
}