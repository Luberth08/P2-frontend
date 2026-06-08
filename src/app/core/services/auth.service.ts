// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FcmService } from './fcm.service';
import { WebPushService } from './web-push.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private fcmService = inject(FcmService);
  private webPushService = inject(WebPushService);

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/web/login`, credentials)
      .pipe(
        tap(res => {
          this.setToken(res.access_token);
          // Solicitar permisos de notificación después del login exitoso
          this.requestNotificationPermission();
        })
      );
  }
  
  registerInit(data: any) {
    return this.http.post(`${this.apiUrl}/auth/web/register/init`, data);
  }

  registerComplete(email: string, code: string) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/web/register/complete`, { email, code })
      .pipe(
        tap(res => {
          this.setToken(res.access_token);
          // Solicitar permisos de notificación después del registro exitoso
          this.requestNotificationPermission();
        })
      );
  }

  logout(): Observable<any> {
    // Desregistrar notificaciones antes de cerrar sesión
    this.webPushService.unsubscribe().catch(err => {
      console.error('Error desregistrando notificaciones:', err);
    });
    
    return this.http.post(`${this.apiUrl}/auth/web/logout`, {});
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Solicita permisos de notificación después del login
   * Intenta Web Push nativo primero, si falla intenta Firebase FCM
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      console.log('🔔 Iniciando solicitud de permisos de notificación después del login...');
      
      // Intentar con Web Push nativo primero
      const webPushSuccess = await this.webPushService.initializeAfterLogin();
      
      if (webPushSuccess) {
        console.log('✅ Inicialización de notificaciones completada con Web Push nativo');
        return; // Salir si Web Push funcionó
      }
      
      // Solo intentar con Firebase FCM si Web Push falló
      console.log('⚠️ Web Push nativo falló, intentando con Firebase FCM...');
      await this.fcmService.initializeAfterLogin();
      
      console.log('✅ Inicialización de notificaciones completada con Firebase FCM');
    } catch (error) {
      console.error('❌ Error solicitando permisos de notificación:', error);
    }
  }
}
