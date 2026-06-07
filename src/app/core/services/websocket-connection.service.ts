import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';
import { WebSocketService } from './websocket.service';

/**
 * Servicio para gestionar la conexión WebSocket global
 * Se conecta automáticamente cuando el usuario está autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketConnectionService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private isConnected = false;
  private currentServicioId: number | null = null;

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService
  ) {
    this.setupAuthListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Configura el listener para cambios de autenticación
   */
  private setupAuthListener(): void {
    // Verificar si hay token al iniciar
    this.checkAndConnect();

    // Escuchar cambios de autenticación (si el servicio lo proporciona)
    // Por ahora, asumimos que necesitamos verificar el token manualmente
  }

  /**
   * Verifica si hay token y conecta si es necesario
   */
  private checkAndConnect(): void {
    const token = localStorage.getItem('token');
    if (token && !this.isConnected) {
      this.connect(token);
    }
  }

  /**
   * Conecta al WebSocket
   */
  public connect(token?: string, servicioId?: number): void {
    if (!token) {
      token = localStorage.getItem('token') || undefined;
    }

    if (!token) {
      console.warn('No hay token disponible para conectar WebSocket');
      return;
    }

    this.wsService.connect(token, servicioId);
    this.isConnected = true;
    this.currentServicioId = servicioId || null;

    // Escuchar estado de conexión
    this.wsService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        console.log('WebSocket connection status:', connected);
      });
  }

  /**
   * Desconecta del WebSocket
   */
  public disconnect(): void {
    this.wsService.disconnect();
    this.isConnected = false;
    this.currentServicioId = null;
  }

  /**
   * Se une a una sala de servicio específica
   */
  public joinServiceRoom(servicioId: number): void {
    this.wsService.joinServiceRoom(servicioId);
    this.currentServicioId = servicioId;
  }

  /**
   * Sale de la sala de servicio actual
   */
  public leaveServiceRoom(): void {
    if (this.currentServicioId) {
      this.wsService.leaveServiceRoom(this.currentServicioId);
      this.currentServicioId = null;
    }
  }

  /**
   * Verifica si está conectado
   */
  public isWebSocketConnected(): boolean {
    return this.wsService.isConnected();
  }
}
