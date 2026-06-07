import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, takeUntil } from 'rxjs';
import { WebSocketService } from './websocket.service';

/**
 * Interfaz para eventos de solicitud aceptada
 */
export interface SolicitudAceptadaEvent {
  solicitud_id: number;
  servicio_id: number;
  id_taller: number;
  timestamp: string;
}

/**
 * Interfaz para eventos de solicitud rechazada
 */
export interface SolicitudRechazadaEvent {
  solicitud_id: number;
  id_taller: number;
  timestamp: string;
}

/**
 * Interfaz para eventos de cambio de estado de servicio
 */
export interface ServicioEstadoCambiadoEvent {
  servicio_id: number;
  estado_anterior: string;
  estado_nuevo: string;
  timestamp: string;
}

/**
 * Interfaz para eventos de ubicación de técnico
 */
export interface TecnicoUbicacionActualizadaEvent {
  servicio_id: number;
  empleado_id: number;
  latitud: number;
  longitud: number;
  timestamp: string;
}

/**
 * Interfaz para eventos de servicio finalizado
 */
export interface ServicioFinalizadoEvent {
  servicio_id: number;
  timestamp: string;
}

/**
 * Servicio para gestionar eventos específicos del negocio vía WebSocket
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketEventsService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Subjects para eventos específicos
  private solicitudAceptadaSubject = new Subject<SolicitudAceptadaEvent>();
  private solicitudRechazadaSubject = new Subject<SolicitudRechazadaEvent>();
  private servicioEstadoCambiadoSubject = new Subject<ServicioEstadoCambiadoEvent>();
  private tecnicoUbicacionActualizadaSubject = new Subject<TecnicoUbicacionActualizadaEvent>();
  private servicioFinalizadoSubject = new Subject<ServicioFinalizadoEvent>();
  
  // Observables públicos
  public solicitudAceptada$ = this.solicitudAceptadaSubject.asObservable();
  public solicitudRechazada$ = this.solicitudRechazadaSubject.asObservable();
  public servicioEstadoCambiado$ = this.servicioEstadoCambiadoSubject.asObservable();
  public tecnicoUbicacionActualizada$ = this.tecnicoUbicacionActualizadaSubject.asObservable();
  public servicioFinalizado$ = this.servicioFinalizadoSubject.asObservable();
  
  constructor(private wsService: WebSocketService) {
    this.setupEventListeners();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura los listeners para eventos del WebSocket
   */
  private setupEventListeners(): void {
    // Escuchar todos los mensajes del WebSocket
    this.wsService.messages$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(message => {
        this.handleMessage(message);
      });
  }
  
  /**
   * Maneja mensajes recibidos del WebSocket
   */
  private handleMessage(message: any): void {
    if (!message || !message.type) {
      console.warn('Mensaje WebSocket sin tipo:', message);
      return;
    }
    
    switch (message.type) {
      case 'solicitud_aceptada':
        this.handleSolicitudAceptada(message.data);
        break;
      
      case 'solicitud_rechazada':
        this.handleSolicitudRechazada(message.data);
        break;
      
      case 'servicio_estado_cambiado':
        this.handleServicioEstadoCambiado(message.data);
        break;
      
      case 'tecnico_ubicacion_actualizada':
        this.handleTecnicoUbicacionActualizada(message.data);
        break;
      
      case 'servicio_finalizado':
        this.handleServicioFinalizado(message.data);
        break;
      
      case 'connected':
        console.log('WebSocket conectado:', message.data);
        break;
      
      case 'joined_service':
        console.log('Unido a sala de servicio:', message.data);
        break;
      
      case 'left_service':
        console.log('Salió de sala de servicio:', message.data);
        break;
      
      case 'pong':
        // Respuesta a ping, no hacer nada
        break;
      
      case 'error':
        console.error('Error WebSocket:', message.data);
        break;
      
      default:
        console.warn('Tipo de evento WebSocket no manejado:', message.type);
    }
  }
  
  /**
   * Maneja evento de solicitud aceptada
   */
  private handleSolicitudAceptada(data: any): void {
    console.log('Solicitud aceptada:', data);
    this.solicitudAceptadaSubject.next(data);
  }
  
  /**
   * Maneja evento de solicitud rechazada
   */
  private handleSolicitudRechazada(data: any): void {
    console.log('Solicitud rechazada:', data);
    this.solicitudRechazadaSubject.next(data);
  }
  
  /**
   * Maneja evento de cambio de estado de servicio
   */
  private handleServicioEstadoCambiado(data: any): void {
    console.log('Estado de servicio cambiado:', data);
    this.servicioEstadoCambiadoSubject.next(data);
  }
  
  /**
   * Maneja evento de actualización de ubicación de técnico
   */
  private handleTecnicoUbicacionActualizada(data: any): void {
    console.log('Ubicación de técnico actualizada:', data);
    this.tecnicoUbicacionActualizadaSubject.next(data);
  }
  
  /**
   * Maneja evento de servicio finalizado
   */
  private handleServicioFinalizado(data: any): void {
    console.log('Servicio finalizado:', data);
    this.servicioFinalizadoSubject.next(data);
  }
  
  /**
   * Obtiene un observable filtrado para un servicio específico
   */
  public onServicioEstadoCambiado(servicioId: number): Observable<ServicioEstadoCambiadoEvent> {
    return this.servicioEstadoCambiado$.pipe(
      filter(event => event.servicio_id === servicioId)
    );
  }
  
  /**
   * Obtiene un observable filtrado para un servicio específico (ubicación)
   */
  public onTecnicoUbicacionActualizada(servicioId: number): Observable<TecnicoUbicacionActualizadaEvent> {
    return this.tecnicoUbicacionActualizada$.pipe(
      filter(event => event.servicio_id === servicioId)
    );
  }
}
