import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;

  constructor(private http: HttpClient) {
    this.initializeFirebase();
  }

  /**
   * Inicializa Firebase y el servicio de mensajería
   */
  private initializeFirebase(): void {
    try {
      // Verificar si Firebase está configurado correctamente
      if (!environment.firebase?.apiKey || environment.firebase.apiKey === 'TU_API_KEY_AQUI') {
        console.warn('⚠️ Firebase no está configurado. Por favor actualiza environment.ts con tu configuración de Firebase.');
        return;
      }

      // Inicializar Firebase
      const app = initializeApp(environment.firebase);
      
      // Obtener instancia de messaging
      this.messaging = getMessaging(app);
      
      console.log('✅ Firebase Messaging inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
    }
  }

  /**
   * Solicita permisos de notificación y obtiene el token FCM
   */
  async requestPermission(): Promise<string | null> {
    try {
      if (!this.messaging) {
        console.warn('⚠️ Firebase Messaging no está inicializado');
        return null;
      }

      console.log('🔔 Solicitando permisos de notificación...');
      
      // Verificar que el Service Worker está registrado y listo
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('📋 Service Workers registrados:', registrations.length);
        
        if (registrations.length === 0) {
          console.warn('⚠️ No hay Service Workers registrados. Esperando...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Esperar a que el Service Worker esté completamente listo
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker está listo');
      }
      
      // Solicitar permisos de notificación
      const permission = await Notification.requestPermission();
      console.log('🔔 Estado de permisos:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permisos de notificación concedidos');
        
        // Obtener el Service Worker registration fuera del try para usarlo en catch también
        const swRegistration = await navigator.serviceWorker.ready;
        
        try {
          // MÉTODO 1: Intentar con Service Worker registration explícito
          console.log('🎯 Método 1: Obteniendo token FCM con SW explícito...');
          
          const token = await getToken(this.messaging, {
            vapidKey: environment.firebase.vapidKey,
            serviceWorkerRegistration: swRegistration
          });
          
          if (token) {
            console.log('✅ Token FCM obtenido exitosamente');
            console.log('   Token (primeros 50 chars):', token.substring(0, 50) + '...');
            console.log('   Longitud del token:', token.length);
            this.currentToken = token;
            
            // Registrar token en el backend
            console.log('📤 Registrando token en el backend...');
            await this.registerTokenInBackend(token);
            
            return token;
          } else {
            console.warn('⚠️ getToken() retornó vacío');
            return null;
          }
          
        } catch (tokenError: any) {
          console.error('❌ Error obteniendo token FCM:', tokenError);
          console.error('   Tipo de error:', tokenError.name);
          console.error('   Mensaje:', tokenError.message);
          console.error('   Código:', tokenError.code);
          
          // Información adicional para debugging
          if (tokenError.code === 'messaging/token-subscribe-failed') {
            console.error('💡 SOLUCIÓN: El problema es con la VAPID key o con Firebase Cloud Messaging API');
            console.error('   1. Verifica que la VAPID key en environment.ts sea correcta');
            console.error('   2. Verifica que Firebase Cloud Messaging API (V1) esté habilitada en Google Cloud Console');
            console.error('   3. Genera una nueva VAPID key pair en Firebase Console');
          } else if (tokenError.code === 'messaging/permission-blocked') {
            console.error('💡 Los permisos están bloqueados. El usuario debe habilitarlos manualmente.');
          }
          
          // Intentar método alternativo sin VAPID (solo para debugging)
          console.log('🔄 Intentando método alternativo...');
          try {
            const tokenAlt = await getToken(this.messaging, {
              serviceWorkerRegistration: swRegistration
            });
            
            if (tokenAlt) {
              console.log('✅ Token obtenido con método alternativo (sin VAPID explícito)');
              console.log('   Token:', tokenAlt.substring(0, 50) + '...');
              this.currentToken = tokenAlt;
              await this.registerTokenInBackend(tokenAlt);
              return tokenAlt;
            }
          } catch (altError) {
            console.error('❌ Método alternativo también falló:', altError);
          }
          
          return null;
        }
      } else if (permission === 'denied') {
        console.warn('❌ Permisos de notificación denegados por el usuario');
        return null;
      } else {
        console.warn('⚠️ Permisos de notificación no otorgados (estado: default)');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error general solicitando permisos:', error);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  /**
   * Registra el token FCM en el backend
   */
  async registerTokenInBackend(token: string): Promise<void> {
    try {
      const url = `${environment.apiUrl}/notifications/register-token`;
      
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(url, { token_fcm: token })
      );
      
      console.log('✅ Token registrado en backend:', response.message);
    } catch (error: any) {
      console.error('❌ Error registrando token en backend:', error);
      
      // Si el error es 401 (no autenticado), es esperado en algunas situaciones
      if (error.status === 401) {
        console.warn('⚠️ Usuario no autenticado. El token se registrará después del login.');
      }
    }
  }

  /**
   * Desregistra el token FCM del backend (al cerrar sesión)
   */
  async unregisterToken(): Promise<void> {
    try {
      if (!this.currentToken) {
        console.log('No hay token para desregistrar');
        return;
      }

      const url = `${environment.apiUrl}/notifications/unregister-token`;
      
      await firstValueFrom(
        this.http.delete(url, {
          body: { token_fcm: this.currentToken }
        })
      );
      
      console.log('✅ Token desregistrado del backend');
      this.currentToken = null;
    } catch (error) {
      console.error('❌ Error desregistrando token:', error);
    }
  }

  /**
   * Escucha mensajes cuando la app está en primer plano
   */
  listenToMessages(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.warn('Firebase Messaging no está inicializado');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('📩 Mensaje recibido en primer plano:', payload);
      
      // Mostrar notificación del navegador
      if (payload.notification) {
        this.showBrowserNotification(
          payload.notification.title || 'Nueva Notificación',
          payload.notification.body || '',
          payload.data
        );
      }
      
      // Llamar al callback con el payload completo
      callback(payload);
    });
  }

  /**
   * Muestra una notificación nativa del navegador
   */
  private showBrowserNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/icon.png', // Puedes personalizar el icono
        badge: '/badge.png',
        tag: 'notification-' + Date.now(),
        data: data
      });

      // Manejar clic en la notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Puedes agregar lógica de navegación aquí basada en data
        if (data?.accion === 'abrir_solicitud_detalle' && data?.solicitud_id) {
          // Navegar al detalle de la solicitud
          console.log('Navegando a solicitud:', data.solicitud_id);
          window.location.href = `/solicitudes/${data.solicitud_id}`;
        }
      };
    }
  }

  /**
   * Obtiene el token actual
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Verifica si las notificaciones están soportadas
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Obtiene el estado de los permisos
   */
  getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }

  /**
   * Envía una notificación de prueba (solicita al backend)
   */
  async sendTestNotification(): Promise<void> {
    try {
      const url = `${environment.apiUrl}/notifications/test-notification`;
      
      const response = await firstValueFrom(
        this.http.get<any>(url)
      );
      
      console.log('✅ Notificación de prueba enviada:', response);
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
    }
  }

  /**
   * Inicializa las notificaciones después del login
   * Debe llamarse desde el componente de login después de autenticarse
   */
  async initializeAfterLogin(): Promise<void> {
    console.log('🚀 Inicializando notificaciones después del login...');
    
    if (!this.isSupported()) {
      console.warn('⚠️ Las notificaciones push no están soportadas en este navegador');
      return;
    }

    const permissionStatus = this.getPermissionStatus();
    console.log('🔔 Estado actual de permisos:', permissionStatus);

    if (permissionStatus === 'granted') {
      console.log('✅ Permisos ya concedidos, obteniendo token...');
      // Esperar un poco para asegurar que el Service Worker esté listo
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.requestPermission();
    } else if (permissionStatus === 'default') {
      console.log('❓ Permisos no solicitados, solicitando ahora...');
      // Esperar un poco para asegurar que el Service Worker esté listo
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.requestPermission();
    } else {
      console.warn('❌ Permisos denegados. El usuario debe habilitarlos manualmente.');
      console.log('💡 Para habilitar: Click en el candado 🔒 → Permisos del sitio → Notificaciones → Permitir');
    }
  }
}
