import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface EspecialidadCreate {
  nombre: string;
  descripcion?: string;
}

export interface EspecialidadUpdate {
  nombre?: string;
  descripcion?: string;
}

export interface EspecialidadListResponse {
  items: Especialidad[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class EspecialidadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10) {
    return this.http.get<EspecialidadListResponse>(`${this.apiUrl}/especialidades`, { params: { skip, limit } });
  }

  // Conveniencia en español: devuelve sólo el arreglo de especialidades
  listar(): Observable<Especialidad[]> {
    return this.http.get<EspecialidadListResponse>(`${this.apiUrl}/especialidades`).pipe(
      map(res => res.items)
    );
  }

  // Obtener todas las especialidades sin límite
  listAll(): Observable<Especialidad[]> {
    return this.http.get<EspecialidadListResponse>(`${this.apiUrl}/especialidades`, { 
      params: { skip: 0, limit: 1000 } 
    }).pipe(
      map(res => res.items)
    );
  }

  create(data: EspecialidadCreate) {
    return this.http.post<Especialidad>(`${this.apiUrl}/especialidades`, data);
  }

  update(id: number, data: EspecialidadUpdate) {
    return this.http.put<Especialidad>(`${this.apiUrl}/especialidades/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/especialidades/${id}`);
  }
}
