import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimeout: any = null;
  
  // Subjects para eventos
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<any>();
  private errorSubject = new Subject<any>();
  
  // Observables públicos
  public connected$ = this.connectedSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();
  public errors$ = this.errorSubject.asObservable();
  
  constructor() {
    // Intentar reconectar cuando el navegador recupere conexión
    window.addEventListener('online', () => {
      if (!this.connectedSubject.value) {
        this.connect();
      }
    });
  }
  
  /**
   * Conecta al servidor WebSocket
   */
  connect(token?: string, servicioId?: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }
    
    // Construir URL de WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let wsUrl = `${protocol}//${host}/ws/connect`;
    
    // Agregar parámetros
    const params = new URLSearchParams();
    if (token) {
      params.append('token', token);
    }
    if (servicioId) {
      params.append('servicio_id', servicioId.toString());
    }
    
    if (params.toString()) {
      wsUrl += `?${params.toString()}`;
    }
    
    console.log('Conectando a WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado exitosamente');
        this.connectedSubject.next(true);
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Mensaje WebSocket recibido:', data);
          this.messageSubject.next(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
        this.errorSubject.next(error);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket cerrado:', event.code, event.reason);
        this.connectedSubject.next(false);
        this.ws = null;
        
        // Intentar reconectar si no fue un cierre normal
        if (event.code !== 1000) {
          this.scheduleReconnect(token, servicioId);
        }
      };
      
    } catch (error) {
      console.error('Error creando WebSocket:', error);
      this.errorSubject.next(error);
    }
  }
  
  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    console.log('Desconectando WebSocket...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexión normal');
      this.ws = null;
    }
    
    this.connectedSubject.next(false);
    this.reconnectAttempts = 0;
  }
  
  /**
   * Envía un mensaje al servidor WebSocket
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('Mensaje WebSocket enviado:', message);
      } catch (error) {
        console.error('Error enviando mensaje WebSocket:', error);
      }
    } else {
      console.warn('WebSocket no está conectado, no se puede enviar mensaje');
    }
  }
  
  /**
   * Se une a una sala de servicio específica
   */
  joinServiceRoom(servicioId: number): void {
    this.send({
      type: 'join_service',
      data: {
        servicio_id: servicioId
      }
    });
  }
  
  /**
   * Sale de una sala de servicio específica
   */
  leaveServiceRoom(servicioId: number): void {
    this.send({
      type: 'leave_service',
      data: {
        servicio_id: servicioId
      }
    });
  }
  
  /**
   * Envía ping para mantener conexión viva
   */
  ping(): void {
    this.send({
      type: 'ping',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Programa una reconexión automática
   */
  private scheduleReconnect(token?: string, servicioId?: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de intentos de reconexión alcanzado');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`Intentando reconectar en ${delay}ms (intentos: ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(token, servicioId);
    }, delay);
  }
  
  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.connectedSubject.value;
  }
}
