import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KPIService, DashboardKPIs } from '../../../core/services/kpi.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-kpi-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './kpi-dashboard-page.html',
  styleUrls: ['./kpi-dashboard-page.scss']
})
export class KPIDashboardPage implements OnInit {
  @Input() tallerId: number = 0;

  isLoading = false;
  kpis: DashboardKPIs | null = null;
  
  // Filtros de fecha
  fechaInicio: string = '';
  fechaFin: string = '';
  
  constructor(
    private kpiService: KPIService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.fechaInicio = hace30Dias.toISOString().split('T')[0];
    
    if (this.tallerId) {
      this.cargarKPIs();
    }
  }

  ngOnChanges(): void {
    if (this.tallerId) {
      this.cargarKPIs();
    }
  }

  cargarKPIs(): void {
    if (!this.tallerId) return;

    this.isLoading = true;
    
    this.kpiService.getTallerDashboardKPIs(
      this.tallerId,
      this.fechaInicio ? `${this.fechaInicio}T00:00:00Z` : undefined,
      this.fechaFin ? `${this.fechaFin}T23:59:59Z` : undefined
    ).subscribe({
      next: (data) => {
        this.kpis = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showError('Error al cargar los indicadores');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarKPIs();
  }

  resetearFiltros(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.fechaInicio = hace30Dias.toISOString().split('T')[0];
    
    this.cargarKPIs();
  }

  getPorcentajeColor(porcentaje: number): string {
    if (porcentaje >= 90) return '#10b981'; // verde
    if (porcentaje >= 70) return '#f59e0b'; // amarillo
    return '#ef4444'; // rojo
  }

  getTiempoColor(minutos: number): string {
    if (minutos <= 15) return '#10b981'; // verde
    if (minutos <= 30) return '#f59e0b'; // amarillo
    return '#ef4444'; // rojo
  }

  // Funciones de exportación
  exportarCSV(): void {
    if (!this.kpis) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    let csv = 'Métrica,Valor\n';
    csv += `Tiempo Asignación Promedio (min),${this.kpis.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)}\n`;
    csv += `Tiempo Llegada Promedio (min),${this.kpis.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)}\n`;
    csv += `Total Servicios,${this.kpis.casos_cancelados.total_servicios}\n`;
    csv += `Servicios Cancelados,${this.kpis.casos_cancelados.total_cancelados}\n`;
    csv += `Porcentaje Cancelados,${this.kpis.casos_cancelados.porcentaje_cancelados.toFixed(2)}%\n`;
    csv += `SLA Cumplimiento,${this.kpis.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}%\n`;
    csv += '\nIncidentes por Tipo\n';
    this.kpis.incidentes_por_tipo.forEach(incidente => {
      csv += `${incidente.tipo},${incidente.cantidad} (${incidente.porcentaje.toFixed(2)}%)\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kpi_taller_${this.kpis.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportarExcel(): void {
    if (!this.kpis) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    let html = '<table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>';
    html += `<tr><td>Tiempo Asignación Promedio (min)</td><td>${this.kpis.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)}</td></tr>`;
    html += `<tr><td>Tiempo Llegada Promedio (min)</td><td>${this.kpis.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)}</td></tr>`;
    html += `<tr><td>Total Servicios</td><td>${this.kpis.casos_cancelados.total_servicios}</td></tr>`;
    html += `<tr><td>Servicios Cancelados</td><td>${this.kpis.casos_cancelados.total_cancelados}</td></tr>`;
    html += `<tr><td>Porcentaje Cancelados</td><td>${this.kpis.casos_cancelados.porcentaje_cancelados.toFixed(2)}%</td></tr>`;
    html += `<tr><td>SLA Cumplimiento</td><td>${this.kpis.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}%</td></tr>`;
    html += '</tbody></table>';
    html += '<h3>Incidentes por Tipo</h3><table><thead><tr><th>Tipo</th><th>Cantidad</th><th>Porcentaje</th></tr></thead><tbody>';
    this.kpis.incidentes_por_tipo.forEach(incidente => {
      html += `<tr><td>${incidente.tipo}</td><td>${incidente.cantidad}</td><td>${incidente.porcentaje.toFixed(2)}%</td></tr>`;
    });
    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kpi_taller_${this.kpis.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportarPDF(): void {
    if (!this.kpis) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    let html = '<html><head><title>KPI Taller</title>';
    html += '<style>body{font-family: Arial, sans-serif; padding: 20px;}';
    html += 'table{width: 100%; border-collapse: collapse; margin-top: 20px;}';
    html += 'th,td{border: 1px solid #ddd; padding: 8px; text-align: left;}';
    html += 'th{background-color: #4CAF50; color: white;}';
    html += 'h1{color: #333;}</style></head><body>';
    html += '<h1>Dashboard de KPIs - ' + this.kpis.nombre + '</h1>';
    html += `<p>Periodo: ${this.fechaInicio || 'Últimos 30 días'} - ${this.fechaFin || 'Hoy'}</p>`;
    html += '<h2>Métricas Principales</h2>';
    html += '<table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>';
    html += `<tr><td>Tiempo Asignación Promedio (min)</td><td>${this.kpis.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)}</td></tr>`;
    html += `<tr><td>Tiempo Llegada Promedio (min)</td><td>${this.kpis.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)}</td></tr>`;
    html += `<tr><td>Total Servicios</td><td>${this.kpis.casos_cancelados.total_servicios}</td></tr>`;
    html += `<tr><td>Servicios Cancelados</td><td>${this.kpis.casos_cancelados.total_cancelados}</td></tr>`;
    html += `<tr><td>Porcentaje Cancelados</td><td>${this.kpis.casos_cancelados.porcentaje_cancelados.toFixed(2)}%</td></tr>`;
    html += `<tr><td>SLA Cumplimiento</td><td>${this.kpis.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}%</td></tr>`;
    html += '</tbody></table>';
    html += '<h2>Incidentes por Tipo</h2>';
    html += '<table><thead><tr><th>Tipo</th><th>Cantidad</th><th>Porcentaje</th></tr></thead><tbody>';
    this.kpis.incidentes_por_tipo.forEach(incidente => {
      html += `<tr><td>${incidente.tipo}</td><td>${incidente.cantidad}</td><td>${incidente.porcentaje.toFixed(2)}%</td></tr>`;
    });
    html += '</tbody></table></body></html>';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
}
