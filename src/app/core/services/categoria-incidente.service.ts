import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CategoriaIncidente {
  id: number;
  nombre: string;
  especialidad_ids: number[];
}

export interface CategoriaIncidenteCreate {
  nombre: string;
  especialidad_ids: number[];
}

export interface CategoriaIncidenteUpdate {
  nombre?: string;
  especialidad_ids?: number[];
}

export interface CategoriaListResponse {
  items: CategoriaIncidente[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriaIncidenteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<CategoriaListResponse> {
    return this.http.get<CategoriaListResponse>(`${this.apiUrl}/admin/categorias`, { params: { skip, limit } as any });
  }

  getById(id: number): Observable<CategoriaIncidente> {
    return this.http.get<CategoriaIncidente>(`${this.apiUrl}/admin/categorias/${id}`);
  }

  create(data: CategoriaIncidenteCreate): Observable<CategoriaIncidente> {
    return this.http.post<CategoriaIncidente>(`${this.apiUrl}/admin/categorias`, data);
  }

  update(id: number, data: CategoriaIncidenteUpdate): Observable<CategoriaIncidente> {
    return this.http.put<CategoriaIncidente>(`${this.apiUrl}/admin/categorias/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/categorias/${id}`);
  }
}
