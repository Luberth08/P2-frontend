import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Configuracion {
  id: number;
  clave: string;
  valor: string;
  id_usuario: number;
}

export interface ConfiguracionCreate {
  clave: string;
  valor: string;
}

export interface ConfiguracionUpdate {
  valor: string;
}

export interface ConfiguracionListResponse {
  items: Configuracion[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<ConfiguracionListResponse> {
    return this.http.get<ConfiguracionListResponse>(`${this.apiUrl}/admin/configuracion?skip=${skip}&limit=${limit}`);
  }

  create(data: ConfiguracionCreate): Observable<Configuracion> {
    return this.http.post<Configuracion>(`${this.apiUrl}/admin/configuracion`, data);
  }

  update(id: number, data: ConfiguracionUpdate): Observable<Configuracion> {
    return this.http.put<Configuracion>(`${this.apiUrl}/admin/configuracion/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/configuracion/${id}`);
  }
}
