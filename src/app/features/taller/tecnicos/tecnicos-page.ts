import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TecnicoService, Tecnico, TecnicoCreate } from '../../../core/services/tecnico.service';
import { EspecialidadService, Especialidad } from '../../../core/services/especialidad.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-tecnicos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputField, Modal, LoadingSpinner],
  templateUrl: './tecnicos-page.html',
  styleUrls: ['./tecnicos-page.scss']
})
export class TecnicosPage implements OnInit, OnChanges {
  @Input() tallerId: number = 0;

  tecnicosActivos: Tecnico[] = [];
  totalActivos = 0;
  skipActivos = 0;
  limit = 10;

  tecnicosSuspendidos: Tecnico[] = [];
  totalSuspendidos = 0;
  skipSuspendidos = 0;

  isLoading = false;
  activeTab: 'activos' | 'suspendidos' = 'activos';

  // Modal de creación
  showCreateModal = false;
  formData: TecnicoCreate = { email: '', especialidades_ids: [] };
  especialidades: Especialidad[] = [];

  // Edición
  isEditing = false;
  editingTecnicoId: number | null = null;

  // Modal de confirmación de suspensión
  showSuspendModal = false;
  suspendTecnicoId: number | null = null;
  suspendTecnicoNombre = '';

  constructor(
    private tecnicoService: TecnicoService,
    private especialidadService: EspecialidadService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('TecnicosPage ngOnInit - tallerId:', this.tallerId);
    if (this.tallerId) {
      this.cargarActivos();
      this.cargarSuspendidos();
      this.loadEspecialidades();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('TecnicosPage ngOnChanges - tallerId:', this.tallerId, 'changes:', changes);
    if (this.tallerId && changes['tallerId']) {
      this.resetPaginacion();
      this.cargarActivos();
      this.cargarSuspendidos();
      this.loadEspecialidades();
    }
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

  resetPaginacion() {
    this.skipActivos = 0;
    this.skipSuspendidos = 0;
  }

  cargarActivos() {
    console.log('Cargando técnicos activos - tallerId:', this.tallerId);
    this.isLoading = true;
    // Temporalmente sin filtro de estado para ver si hay técnicos
    this.tecnicoService.listar(this.tallerId, undefined, this.skipActivos, this.limit).subscribe({
      next: (res: any) => {
        console.log('Técnicos activos recibidos:', res);
        this.tecnicosActivos = res.items;
        this.totalActivos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar técnicos activos:', err);
        this.isLoading = false;
        this.notificationService.showError('Error al cargar técnicos activos');
        this.cdr.detectChanges();
      }
    });
  }

  cargarSuspendidos() {
    this.isLoading = true;
    this.tecnicoService.listar(this.tallerId, 'suspendido', this.skipSuspendidos, this.limit).subscribe({
      next: (res: any) => {
        this.tecnicosSuspendidos = res.items;
        this.totalSuspendidos = res.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar técnicos suspendidos');
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

  // Especialidades
  loadEspecialidades() {
    this.especialidadService.listar().subscribe({
      next: (res: Especialidad[]) => {
        this.especialidades = res;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.showError('Error al cargar especialidades');
      }
    });
  }

  toggleEspecialidad(id: number) {
    const idx = this.formData.especialidades_ids.indexOf(id);
    if (idx === -1) {
      this.formData.especialidades_ids.push(id);
    } else {
      this.formData.especialidades_ids.splice(idx, 1);
    }
    this.cdr.detectChanges();
  }

  // Modal de creación
  openCreateModal() {
    this.isEditing = false;
    this.editingTecnicoId = null;
    this.formData = { email: '', especialidades_ids: [] };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.isEditing = false;
    this.editingTecnicoId = null;
    this.cdr.detectChanges();
  }

  createTecnico() {
    if (!this.formData.email) {
      this.notificationService.showError('El email es obligatorio');
      return;
    }
    if (!this.formData.especialidades_ids || this.formData.especialidades_ids.length === 0) {
      this.notificationService.showError('Selecciona al menos una especialidad');
      return;
    }
    this.tecnicoService.crear(this.tallerId, this.formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Técnico agregado correctamente');
        this.closeCreateModal();
        this.resetPaginacion();
        this.cargarActivos();
        this.cargarSuspendidos();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al crear técnico';
        this.notificationService.showError(msg);
      }
    });
  }

  openEditModal(tecnico: Tecnico) {
    this.isEditing = true;
    this.editingTecnicoId = tecnico.id;
    this.formData = { email: tecnico.usuario_email, especialidades_ids: tecnico.especialidades.map(e => e.id) };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  saveTecnico() {
    if (this.isEditing) {
      if (!this.editingTecnicoId) return;
      if (!this.formData.especialidades_ids || this.formData.especialidades_ids.length === 0) {
        this.notificationService.showError('Selecciona al menos una especialidad');
        return;
      }
      this.tecnicoService.updateEspecialidades(this.tallerId, this.editingTecnicoId, this.formData.especialidades_ids).subscribe({
        next: () => {
          this.notificationService.showSuccess('Especialidades actualizadas');
          this.closeCreateModal();
          this.resetPaginacion();
          this.cargarActivos();
          this.cargarSuspendidos();
        },
        error: (err) => {
          const msg = err.error?.detail || 'Error al actualizar especialidades';
          this.notificationService.showError(msg);
        }
      });
      return;
    }
    this.createTecnico();
  }

  // Suspensión
  openSuspendModal(tecnico: Tecnico) {
    this.suspendTecnicoId = tecnico.id;
    this.suspendTecnicoNombre = tecnico.usuario_nombre;
    this.showSuspendModal = true;
    this.cdr.detectChanges();
  }

  closeSuspendModal() {
    this.showSuspendModal = false;
    this.suspendTecnicoId = null;
    this.suspendTecnicoNombre = '';
    this.cdr.detectChanges();
  }

  confirmarSuspension() {
    if (!this.suspendTecnicoId) return;
    this.tecnicoService.suspender(this.tallerId, this.suspendTecnicoId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Técnico suspendido');
        this.closeSuspendModal();
        this.resetPaginacion();
        this.cargarActivos();
        this.cargarSuspendidos();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al suspender técnico';
        this.notificationService.showError(msg);
        this.closeSuspendModal();
      }
    });
  }
}
