import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio alternativo de notificaciones usando Web Push API nativa
 * En lugar de Firebase Cloud Messaging
 */
@Injectable({
  providedIn: 'root'
})
export class WebPushService {
  private subscription: PushSubscription | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Verifica si las notificaciones están soportadas
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
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
   * Solicita permisos y se suscribe a las notificaciones push
   */
  async requestPermissionAndSubscribe(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        console.warn('⚠️ Web Push no está soportado en este navegador');
        return false;
      }

      console.log('🔔 Solicitando permisos de notificación...');

      // Solicitar permisos
      const permission = await Notification.requestPermission();
      console.log('🔔 Estado de permisos:', permission);

      if (permission !== 'granted') {
        console.warn('❌ Permisos de notificación denegados');
        return false;
      }

      console.log('✅ Permisos concedidos');

      // Esperar a que el Service Worker esté listo
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo');

      // Verificar si ya existe una suscripción antigua
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('⚠️ Encontrada suscripción antigua, eliminando...');
        await existingSubscription.unsubscribe();
        console.log('✅ Suscripción antigua eliminada');
      }

      // Convertir VAPID key de base64url a Uint8Array
      const vapidPublicKey = this.urlBase64ToUint8Array(environment.firebase.vapidKey);

      // Suscribirse a notificaciones push
      console.log('📝 Suscribiéndose a notificaciones push...');
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey as BufferSource
      });

      console.log('✅ Suscripción exitosa');
      console.log('   Endpoint:', this.subscription.endpoint.substring(0, 50) + '...');

      // Registrar la suscripción en el backend
      await this.registerSubscriptionInBackend(this.subscription);

      return true;

    } catch (error: any) {
      console.error('❌ Error en requestPermissionAndSubscribe:', error);
      console.error('   Name:', error.name);
      console.error('   Message:', error.message);
      return false;
    }
  }

  /**
   * Registra la suscripción push en el backend
   */
  private async registerSubscriptionInBackend(subscription: PushSubscription): Promise<void> {
    try {
      const url = `${environment.apiUrl}/notifications/register-web-push`;

      const subscriptionJSON = subscription.toJSON();

      console.log('📤 Registrando suscripción en backend...');

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(url, {
          subscription: subscriptionJSON
        })
      );

      console.log('✅ Suscripción registrada en backend:', response.message);

    } catch (error: any) {
      console.error('❌ Error registrando suscripción en backend:', error);

      if (error.status === 401) {
        console.warn('⚠️ Usuario no autenticado. La suscripción se registrará después del login.');
      }
    }
  }

  /**
   * Desregistra la suscripción push del backend
   */
  async unsubscribe(): Promise<void> {
    try {
      // Si no tenemos la suscripción guardada, intentar obtenerla
      if (!this.subscription) {
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
      }

      if (!this.subscription) {
        console.log('No hay suscripción para desregistrar');
        return;
      }

      const url = `${environment.apiUrl}/notifications/unregister-web-push`;

      await firstValueFrom(
        this.http.post(url, {
          endpoint: this.subscription.endpoint
        })
      );

      // Desuscribirse del push manager
      await this.subscription.unsubscribe();

      console.log('✅ Suscripción desregistrada');
      this.subscription = null;

    } catch (error) {
      console.error('❌ Error desregistrando suscripción:', error);
    }
  }

  /**
   * Convierte VAPID key de base64url a Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Inicializa las notificaciones después del login
   */
  async initializeAfterLogin(): Promise<void> {
    console.log('🚀 Inicializando notificaciones Web Push después del login...');

    if (!this.isSupported()) {
      console.warn('⚠️ Web Push no está soportado en este navegador');
      return;
    }

    const permissionStatus = this.getPermissionStatus();
    console.log('🔔 Estado actual de permisos:', permissionStatus);

    if (permissionStatus === 'granted') {
      console.log('✅ Permisos ya concedidos, suscribiendo...');
      await this.requestPermissionAndSubscribe();
    } else if (permissionStatus === 'default') {
      console.log('❓ Permisos no solicitados, solicitando ahora...');
      await this.requestPermissionAndSubscribe();
    } else {
      console.warn('❌ Permisos denegados. El usuario debe habilitarlos manualmente.');
    }
  }

  /**
   * Obtiene la suscripción actual
   */
  getCurrentSubscription(): PushSubscription | null {
    return this.subscription;
  }
}
