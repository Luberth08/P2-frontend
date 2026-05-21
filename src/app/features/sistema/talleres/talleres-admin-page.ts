import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TallerService, Taller } from '../../../core/services/taller.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Button } from '../../../shared/components/button/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-talleres-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, Button],
  templateUrl: './talleres-admin-page.html',
  styleUrls: ['./talleres-admin-page.scss']
})
export class TalleresAdminPage implements OnInit {
  public Math = Math;
  activos: Taller[] = [];
  suspendidos: Taller[] = [];
  totalActivos = 0;
  totalSuspendidos = 0;
  skipActivos = 0;
  skipSuspendidos = 0;
  limit = 10;
  loading = false;
  activeTab: 'activos' | 'suspendidos' = 'activos';

  constructor(private tallerService: TallerService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadActivos();
    this.loadSuspendidos();
  }

  changeTab(tab: 'activos' | 'suspendidos') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadActivos() {
    this.loading = true;
    this.tallerService.listAll(this.skipActivos, this.limit, 'activo').subscribe({
      next: (res: any) => {
        this.activos = res.items;
        this.totalActivos = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSuspendidos() {
    this.loading = true;
    this.tallerService.listAll(this.skipSuspendidos, this.limit, 'suspendido').subscribe({
      next: (res: any) => {
        this.suspendidos = res.items;
        this.totalSuspendidos = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Paginación
  nextPageActivos() {
    if (this.skipActivos + this.limit < this.totalActivos) {
      this.skipActivos += this.limit;
      this.loadActivos();
    }
  }
  prevPageActivos() {
    if (this.skipActivos > 0) {
      this.skipActivos -= this.limit;
      this.loadActivos();
    }
  }

  nextPageSuspendidos() {
    if (this.skipSuspendidos + this.limit < this.totalSuspendidos) {
      this.skipSuspendidos += this.limit;
      this.loadSuspendidos();
    }
  }
  prevPageSuspendidos() {
    if (this.skipSuspendidos > 0) {
      this.skipSuspendidos -= this.limit;
      this.loadSuspendidos();
    }
  }

  suspender(taller: Taller) {
    this.tallerService.suspender(taller.id).subscribe({
      next: () => {
        this.loadActivos();
        this.loadSuspendidos();
      }
    });
  }

  activar(taller: Taller) {
    this.tallerService.activar(taller.id).subscribe({
      next: () => {
        this.loadActivos();
        this.loadSuspendidos();
      }
    });
  }
}
