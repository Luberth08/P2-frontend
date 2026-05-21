import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VehiculoTaller {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string | null;
  tipo: string; // 'servicio' | 'remolque' | 'otro'
  estado: string; // 'disponible' | 'inactivo' | ...
  id_taller: number;
}

export interface VehiculoTallerCreate {
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  tipo: string;
}

export interface VehiculoTallerUpdate {
  matricula?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  tipo?: string;
  estado?: string;
}

export interface VehiculoTallerListResponse {
  items: VehiculoTaller[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class VehiculoTallerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(tallerId: number, estado?: string, skip: number = 0, limit: number = 10): Observable<VehiculoTallerListResponse> {
    const params: any = { skip, limit };
    if (estado) params.estado = estado;
    return this.http.get<VehiculoTallerListResponse>(`${this.apiUrl}/talleres/${tallerId}/vehiculos`, { params });
  }

  create(tallerId: number, data: VehiculoTallerCreate) {
    return this.http.post<VehiculoTaller>(`${this.apiUrl}/talleres/${tallerId}/vehiculos`, data);
  }

  update(tallerId: number, vehiculoId: number, data: VehiculoTallerUpdate) {
    return this.http.put<VehiculoTaller>(`${this.apiUrl}/talleres/${tallerId}/vehiculos/${vehiculoId}`, data);
  }

  inactivate(tallerId: number, vehiculoId: number) {
    return this.http.put<VehiculoTaller>(`${this.apiUrl}/talleres/${tallerId}/vehiculos/${vehiculoId}/inactivar`, {});
  }
}
