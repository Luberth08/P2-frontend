import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitudAfiliacion {
  id: number;
  nombre: string;
  ubicacion: string;      // "lat,lon"
  telefono: string;
  email: string;
  comentario?: string;
  fecha: string;
  fecha_revision?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentario_revision?: string;
  id_usuario_solicita: number;
  id_usuario_revisa?: number;
  nombre_usuario_solicita: string;
  nombre_usuario_revisa?: string;
}

export interface SolicitudCreate {
  nombre: string;
  ubicacion: string;
  telefono: string;
  email: string;
  comentario?: string;
}

export interface SolicitudListResponse {
  items: SolicitudAfiliacion[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  crear(data: SolicitudCreate): Observable<SolicitudAfiliacion> {
    return this.http.post<SolicitudAfiliacion>(`${this.apiUrl}/solicitudes/afiliacion/`, data);
  }

  misSolicitudes(skip: number = 0, limit: number = 10): Observable<SolicitudListResponse> {
    return this.http.get<SolicitudListResponse>(`${this.apiUrl}/solicitudes/afiliacion/mis-solicitudes`, {
      params: { skip, limit }
    });
  }

  listarPendientes(skip: number = 0, limit: number = 10): Observable<SolicitudListResponse> {
    return this.http.get<SolicitudListResponse>(`${this.apiUrl}/solicitudes/afiliacion/pendientes`, { params: { skip, limit } });
  }

  actualizarEstado(id: number, estado: string, comentario_revision?: string): Observable<SolicitudAfiliacion> {
    return this.http.put<SolicitudAfiliacion>(`${this.apiUrl}/solicitudes/afiliacion/${id}/estado`, { estado, comentario_revision });
  }
}