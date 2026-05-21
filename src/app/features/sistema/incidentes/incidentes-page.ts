import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenteService, Incidente } from '../../../core/services/incidente.service';
import { CategoriaIncidenteService, CategoriaIncidente } from '../../../core/services/categoria-incidente.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Button } from '../../../shared/components/button/button';
import { InputField } from '../../../shared/components/input-field/input-field';
import { Modal } from '../../../shared/components/modal/modal';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-incidentes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, Button, InputField, Modal],
  templateUrl: './incidentes-page.html',
  styleUrls: ['./incidentes-page.scss']
})
export class IncidentesPage implements OnInit {
  public Math = Math;
  incidentes: Incidente[] = [];
  categorias: CategoriaIncidente[] = [];
  total = 0;
  skip = 0;
  limit = 10;
  loading = false;

  // modal
  showForm = false;
  editing = false;
  editingId: number | null = null;
  formData: Partial<Incidente> = { concepto: '', prioridad: 3, requiere_remolque: false, id_categoria_incidente: 0 };

  // bloqueo de acciones (evitar multi-clicks)
  isSaving = false;
  isDeleting = false;

  // delete
  showDelete = false;
  deleteId: number | null = null;

  prioridades = [
    { value: 1, label: 'Baja' },
    { value: 3, label: 'Media' },
    { value: 5, label: 'Alta' }
  ];

  constructor(
    private svc: IncidenteService,
    private catSvc: CategoriaIncidenteService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadCategorias();
  }

  load() {
    this.loading = true;
    this.svc.list(this.skip, this.limit).subscribe({
      next: (res: any) => { this.incidentes = res.items; this.total = res.total; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.notificationService.showError('Error al cargar tipos'); this.cdr.detectChanges(); }
    });
  }

  loadCategorias() {
    this.catSvc.list(0, 100).subscribe({ next: (res: any) => { this.categorias = res.items; this.cdr.detectChanges(); } });
  }

  openCreate() {
    this.editing = false;
    this.editingId = null;
    this.formData = { concepto: '', prioridad: 3, requiere_remolque: false, id_categoria_incidente: this.categorias.length?Number(this.categorias[0].id):0 };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  openEdit(i: Incidente) {
    this.editing = true;
    this.editingId = i.id;
    this.formData = { concepto: i.concepto, prioridad: Number(i.prioridad), requiere_remolque: !!i.requiere_remolque, id_categoria_incidente: i.id_categoria_incidente != null ? Number(i.id_categoria_incidente) : undefined };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  save() {
    if (this.isSaving) return; // evitar doble envío
    if (!this.formData.concepto) { this.notificationService.showError('Complete el concepto'); return; }
    this.isSaving = true;
    this.cdr.detectChanges();
    const payload: any = {
      concepto: this.formData.concepto,
      prioridad: Number(this.formData.prioridad),
      requiere_remolque: !!this.formData.requiere_remolque,
      id_categoria_incidente: this.formData.id_categoria_incidente != null ? Number(this.formData.id_categoria_incidente) : null
    };
    const req = this.editing && this.editingId ? this.svc.update(this.editingId, payload) : this.svc.create(payload);
    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.notificationService.showSuccess(this.editing ? 'Tipo actualizado' : 'Tipo creado');
        this.showForm = false;
        this.resetPaginationAndLoad();
        this.cdr.detectChanges();
      },
      error: (err) => { this.isSaving = false; this.notificationService.showError(err.error?.detail || 'Error al guardar'); this.cdr.detectChanges(); }
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showDelete = true; this.cdr.detectChanges(); }

  doDelete() {
    if (!this.deleteId) return;
    if (this.isDeleting) return;
    this.isDeleting = true;
    this.cdr.detectChanges();
    this.svc.delete(this.deleteId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.notificationService.showSuccess('Tipo eliminado');
        this.showDelete = false;
        if (this.incidentes.length === 1 && this.skip > 0) this.skip -= this.limit;
        this.resetPaginationAndLoad();
        this.cdr.detectChanges();
      },
      error: (err) => { this.isDeleting = false; this.notificationService.showError(err.error?.detail || 'Error al eliminar'); this.showDelete = false; this.cdr.detectChanges(); }
    });
  }

  resetPaginationAndLoad() { this.skip = 0; this.load(); }

  getPriorityLabel(priority: number | undefined): string {
    if (priority === undefined || priority === null) return '-';
    const val = Number(priority);
    if (Number.isNaN(val)) return '-';
    const p = this.prioridades.find(x => x.value === val);
    return p ? p.label : String(val);
  }

  nextPage() { if (this.skip + this.limit < this.total) { this.skip += this.limit; this.load(); } }
  prevPage() { if (this.skip > 0) { this.skip -= this.limit; this.load(); } }
}
