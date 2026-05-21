import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vehiculo {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  tipo: 'auto' | 'camioneta' | 'moto' | 'camion' | 'microbus' | 'otro';
}

export interface VehiculoCreate {
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  tipo: Vehiculo['tipo'];
}

export interface VehiculoUpdate extends Partial<VehiculoCreate> {}

export interface VehiculoListResponse {
  items: Vehiculo[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(skip: number = 0, limit: number = 10): Observable<VehiculoListResponse> {
    return this.http.get<VehiculoListResponse>(`${this.apiUrl}/vehiculos`, { params: { skip, limit } });
  }

  get(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`);
  }

  create(data: VehiculoCreate): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, data);
  }

  update(id: number, data: VehiculoUpdate): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`);
  }
}