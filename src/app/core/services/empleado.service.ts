import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Empleado {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  rol: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  estado: 'activo' | 'disponible' | 'en_servicio' | 'suspendido';
}

export interface EmpleadoCreate {
  email: string;
  rol: 'admin_taller' | 'super_admin_taller';
}

export interface EmpleadoListResponse {
  items: Empleado[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(tallerId: number, estado?: string, skip: number = 0, limit: number = 10): Observable<EmpleadoListResponse> {
    let url = `${this.apiUrl}/talleres/${tallerId}/empleados?skip=${skip}&limit=${limit}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    return this.http.get<EmpleadoListResponse>(url);
  }

  crear(tallerId: number, data: EmpleadoCreate): Observable<Empleado> {
    return this.http.post<Empleado>(`${this.apiUrl}/talleres/${tallerId}/empleados`, data);
  }

  suspender(tallerId: number, empleadoId: number): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/talleres/${tallerId}/empleados/${empleadoId}/suspender`, {});
  }
}