import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KPIService, DashboardKPIs } from '../../../core/services/kpi.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-kpi-general-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './kpi-general-page.html',
  styleUrls: ['./kpi-general-page.scss']
})
export class KPIGeneralPage implements OnInit {
  isLoading = false;
  kpisList: DashboardKPIs[] = [];
  
  // Filtros de fecha
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(
    private kpiService: KPIService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargarKPIs();
  }

  cargarKPIs(): void {
    this.isLoading = true;
    
    this.kpiService.getGeneralDashboardKPIs(this.fechaInicio, this.fechaFin).subscribe({
      next: (kpis) => {
        this.kpisList = kpis;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error al cargar KPIs generales');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarKPIs();
  }

  resetearFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.cargarKPIs();
  }

  // Funciones auxiliares para estilos
  getTiempoColor(minutos: number): string {
    if (minutos <= 15) return '#10b981'; // verde
    if (minutos <= 30) return '#f59e0b'; // amarillo
    return '#ef4444'; // rojo
  }

  getPorcentajeColor(porcentaje: number): string {
    if (porcentaje >= 80) return '#10b981'; // verde
    if (porcentaje >= 60) return '#f59e0b'; // amarillo
    return '#ef4444'; // rojo
  }

  // Calcular promedios agregados de todos los talleres
  getPromedioTiempoAsignacion(): number {
    if (!this.kpisList.length) return 0;
    const total = this.kpisList.reduce((sum, kpi) => sum + kpi.tiempo_promedio.tiempo_asignacion_minutos, 0);
    return total / this.kpisList.length;
  }

  getPromedioTiempoLlegada(): number {
    if (!this.kpisList.length) return 0;
    const total = this.kpisList.reduce((sum, kpi) => sum + kpi.tiempo_promedio.tiempo_llegada_minutos, 0);
    return total / this.kpisList.length;
  }

  getTotalServicios(): number {
    return this.kpisList.reduce((sum, kpi) => sum + kpi.casos_cancelados.total_servicios, 0);
  }

  getTotalCancelados(): number {
    return this.kpisList.reduce((sum, kpi) => sum + kpi.casos_cancelados.total_cancelados, 0);
  }

  getPorcentajeCanceladosGlobal(): number {
    const total = this.getTotalServicios();
    const cancelados = this.getTotalCancelados();
    return total > 0 ? (cancelados / total) * 100 : 0;
  }

  getPromedioCumplimientoSLA(): number {
    if (!this.kpisList.length) return 0;
    const total = this.kpisList.reduce((sum, kpi) => sum + kpi.cumplimiento_sla.porcentaje_cumplimiento, 0);
    return total / this.kpisList.length;
  }

  // Agregar incidentes por tipo de todos los talleres
  getIncidentesAgregados(): { tipo: string; cantidad: number; porcentaje: number }[] {
    const incidentesMap: { [key: string]: number } = {};
    let total = 0;

    this.kpisList.forEach(kpi => {
      kpi.incidentes_por_tipo.forEach(incidente => {
        incidentesMap[incidente.tipo] = (incidentesMap[incidente.tipo] || 0) + incidente.cantidad;
        total += incidente.cantidad;
      });
    });

    return Object.entries(incidentesMap).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0
    }));
  }

  // Funciones de exportación
  exportarCSV(): void {
    if (!this.kpisList.length) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    let csv = 'Taller,Tiempo Asignación (min),Tiempo Llegada (min),Total Servicios,Cancelados,Porcentaje Cancelados,SLA Cumplimiento (%)\n';
    
    this.kpisList.forEach(kpi => {
      csv += `${kpi.nombre},`;
      csv += `${kpi.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)},`;
      csv += `${kpi.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)},`;
      csv += `${kpi.casos_cancelados.total_servicios},`;
      csv += `${kpi.casos_cancelados.total_cancelados},`;
      csv += `${kpi.casos_cancelados.porcentaje_cancelados.toFixed(2)},`;
      csv += `${kpi.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kpi_general_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportarExcel(): void {
    if (!this.kpisList.length) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    // Crear tabla HTML para Excel
    let html = '<table><thead><tr>';
    html += '<th>Taller</th>';
    html += '<th>Tiempo Asignación (min)</th>';
    html += '<th>Tiempo Llegada (min)</th>';
    html += '<th>Total Servicios</th>';
    html += '<th>Cancelados</th>';
    html += '<th>Porcentaje Cancelados</th>';
    html += '<th>SLA Cumplimiento (%)</th>';
    html += '</tr></thead><tbody>';

    this.kpisList.forEach(kpi => {
      html += '<tr>';
      html += `<td>${kpi.nombre}</td>`;
      html += `<td>${kpi.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)}</td>`;
      html += `<td>${kpi.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)}</td>`;
      html += `<td>${kpi.casos_cancelados.total_servicios}</td>`;
      html += `<td>${kpi.casos_cancelados.total_cancelados}</td>`;
      html += `<td>${kpi.casos_cancelados.porcentaje_cancelados.toFixed(2)}</td>`;
      html += `<td>${kpi.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kpi_general_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportarPDF(): void {
    if (!this.kpisList.length) {
      this.notificationService.showError('No hay datos para exportar');
      return;
    }

    // Crear contenido HTML para PDF
    let html = '<html><head><title>KPI General</title>';
    html += '<style>body{font-family: Arial, sans-serif; padding: 20px;}';
    html += 'table{width: 100%; border-collapse: collapse; margin-top: 20px;}';
    html += 'th,td{border: 1px solid #ddd; padding: 8px; text-align: left;}';
    html += 'th{background-color: #4CAF50; color: white;}';
    html += 'h1{color: #333;}</style></head><body>';
    html += '<h1>Dashboard General de KPIs</h1>';
    html += `<p>Periodo: ${this.fechaInicio || 'Últimos 30 días'} - ${this.fechaFin || 'Hoy'}</p>`;
    html += '<table><thead><tr>';
    html += '<th>Taller</th>';
    html += '<th>Tiempo Asignación (min)</th>';
    html += '<th>Tiempo Llegada (min)</th>';
    html += '<th>Total Servicios</th>';
    html += '<th>Cancelados</th>';
    html += '<th>Porcentaje Cancelados</th>';
    html += '<th>SLA Cumplimiento (%)</th>';
    html += '</tr></thead><tbody>';

    this.kpisList.forEach(kpi => {
      html += '<tr>';
      html += `<td>${kpi.nombre}</td>`;
      html += `<td>${kpi.tiempo_promedio.tiempo_asignacion_minutos.toFixed(2)}</td>`;
      html += `<td>${kpi.tiempo_promedio.tiempo_llegada_minutos.toFixed(2)}</td>`;
      html += `<td>${kpi.casos_cancelados.total_servicios}</td>`;
      html += `<td>${kpi.casos_cancelados.total_cancelados}</td>`;
      html += `<td>${kpi.casos_cancelados.porcentaje_cancelados.toFixed(2)}</td>`;
      html += `<td>${kpi.cumplimiento_sla.porcentaje_cumplimiento.toFixed(2)}</td>`;
      html += '</tr>';
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
