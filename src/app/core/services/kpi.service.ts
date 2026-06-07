import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TiempoPromedioKPI {
  tiempo_asignacion_minutos: number;
  tiempo_llegada_minutos: number;
}

export interface IncidentePorTipoKPI {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

export interface TallerEficienteKPI {
  taller_id: number;
  nombre: string;
  tiempo_respuesta_promedio_minutos: number;
  tiempo_finalizacion_promedio_minutos: number;
  total_servicios: number;
}

export interface ZonaIncidenteKPI {
  zona: string;
  latitud_promedio: number;
  longitud_promedio: number;
  cantidad_incidentes: number;
}

export interface CasosCanceladosKPI {
  total_cancelados: number;
  total_servicios: number;
  porcentaje_cancelados: number;
  cancelados_por_motivo: { [key: string]: number };
}

export interface SLAKPI {
  total_servicios: number;
  servicios_dentro_sla: number;
  porcentaje_cumplimiento: number;
  sla_minutos_esperado: number;
}

export interface DashboardKPIs {
  taller_id: number;
  nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  tiempo_promedio: TiempoPromedioKPI;
  incidentes_por_tipo: IncidentePorTipoKPI[];
  talleres_eficientes: TallerEficienteKPI[];
  zonas_incidentes: ZonaIncidenteKPI[];
  casos_cancelados: CasosCanceladosKPI;
  cumplimiento_sla: SLAKPI;
}

@Injectable({ providedIn: 'root' })
export class KPIService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTallerDashboardKPIs(
    tallerId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<DashboardKPIs> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;

    return this.http.get<DashboardKPIs>(
      `${this.apiUrl}/kpi/taller/${tallerId}/dashboard`,
      { params }
    );
  }

  getGeneralDashboardKPIs(
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<DashboardKPIs[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;

    return this.http.get<DashboardKPIs[]>(
      `${this.apiUrl}/kpi/general/dashboard`,
      { params }
    );
  }
}
