import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Incidente {
  id: number;
  concepto: string;
  prioridad: number;
  requiere_remolque: boolean;
  id_categoria_incidente: number;
  categoria_nombre?: string;
}

export interface IncidenteListResponse {
  items: Incidente[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class IncidenteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<IncidenteListResponse> {
    return this.http.get<IncidenteListResponse>(`${this.apiUrl}/admin/tipos`, { params: { skip, limit } as any });
  }

  create(data: Partial<Incidente>) {
    return this.http.post<Incidente>(`${this.apiUrl}/admin/tipos`, data);
  }

  update(id: number, data: Partial<Incidente>) {
    return this.http.put<Incidente>(`${this.apiUrl}/admin/tipos/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/admin/tipos/${id}`);
  }
}
