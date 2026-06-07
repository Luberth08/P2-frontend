import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuoteItem {
  id: number;
  titulo: string;
  precio: number;
}

export interface QuoteItemCreate {
  titulo: string;
  precio: number;
}

export interface QuoteResponse {
  id: number;
  fecha_creacion: string;
  fecha_respuesta?: string;
  estado: string;
  total?: number;
  id_quote_request: number;
  id_taller: number;
  items: QuoteItem[];
}

export interface QuoteResponseCreate {
  items: QuoteItemCreate[];
}

export interface VehiculoInfo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
}

export interface ServicioInfo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface TallerQuoteRequest {
  id: number;
  ubicacion?: string;
  fecha_creacion: string;
  fecha_expiracion?: string;
  comentario?: string;
  estado: string;
  vehiculo?: VehiculoInfo;
  servicio?: ServicioInfo;
  cliente_nombre?: string;
  ya_respondio: boolean;
  mi_respuesta?: QuoteResponse;
  fotos?: string[];
}

export interface TallerQuoteRequestListResponse {
  items: TallerQuoteRequest[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener solicitudes pendientes para el taller
  getSolicitudesPendientes(skip: number = 0, limit: number = 10): Observable<TallerQuoteRequestListResponse> {
    return this.http.get<TallerQuoteRequestListResponse>(`${this.apiUrl}/cotizaciones/taller/solicitudes-pendientes`, {
      params: { skip, limit }
    });
  }

  // Obtener detalle de una solicitud
  getDetalleSolicitud(requestId: number): Observable<TallerQuoteRequest> {
    return this.http.get<TallerQuoteRequest>(`${this.apiUrl}/cotizaciones/taller/solicitudes/${requestId}`);
  }

  // Responder a una solicitud de cotización
  responderCotizacion(requestId: number, data: QuoteResponseCreate): Observable<QuoteResponse> {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/cotizaciones/taller/solicitudes/${requestId}/responder`, data);
  }
}
