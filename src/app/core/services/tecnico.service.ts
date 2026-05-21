import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tecnico {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  estado: string;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  especialidades: { id: number; nombre: string }[];
}

export interface TecnicoCreate {
  email: string;
  especialidades_ids: number[];
}

export interface TecnicoListResponse {
  items: Tecnico[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class TecnicoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(tallerId: number, estado?: string, skip: number = 0, limit: number = 10): Observable<TecnicoListResponse> {
    let url = `${this.apiUrl}/talleres/${tallerId}/tecnicos?skip=${skip}&limit=${limit}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    return this.http.get<TecnicoListResponse>(url);
  }

  crear(tallerId: number, data: TecnicoCreate) {
    return this.http.post<Tecnico>(`${this.apiUrl}/talleres/${tallerId}/tecnicos`, data);
  }

  suspender(tallerId: number, tecnicoId: number) {
    return this.http.put<Tecnico>(`${this.apiUrl}/talleres/${tallerId}/tecnicos/${tecnicoId}/suspender`, {});
  }

  updateEspecialidades(tallerId: number, tecnicoId: number, especialidades_ids: number[]) {
    return this.http.put<Tecnico>(`${this.apiUrl}/talleres/${tallerId}/tecnicos/${tecnicoId}/especialidades`, { especialidades_ids });
  }
}
