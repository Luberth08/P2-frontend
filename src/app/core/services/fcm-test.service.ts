import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FcmTestService {
  
  /**
   * Prueba la conexión con Firebase sin obtener token
   */
  testFirebaseConnection(): void {
    try {
      console.log('🧪 Probando conexión con Firebase...');
      console.log('📋 Config:', {
        apiKey: environment.firebase.apiKey?.substring(0, 20) + '...',
        projectId: environment.firebase.projectId,
        messagingSenderId: environment.firebase.messagingSenderId,
        appId: environment.firebase.appId?.substring(0, 30) + '...'
      });
      
      const app = initializeApp(environment.firebase);
      console.log('✅ Firebase inicializado correctamente');
      console.log('   App name:', app.name);
      console.log('   Options:', app.options);
      
    } catch (error: any) {
      console.error('❌ Error inicializando Firebase:', error);
      console.error('   Name:', error.name);
      console.error('   Message:', error.message);
    }
  }
  
  /**
   * Verifica la VAPID key
   */
  checkVapidKey(): void {
    const vapidKey = environment.firebase.vapidKey;
    console.log('🔑 Verificando VAPID key...');
    console.log('   Longitud:', vapidKey?.length);
    console.log('   Primeros 20 caracteres:', vapidKey?.substring(0, 20));
    console.log('   Es base64 válido:', this.isValidBase64(vapidKey));
    
    if (!vapidKey || vapidKey === 'TU_VAPID_KEY_AQUI') {
      console.error('❌ VAPID key no configurada o es la de ejemplo');
    } else if (vapidKey.length < 80) {
      console.error('❌ VAPID key parece demasiado corta (debería ser ~88 caracteres)');
    } else {
      console.log('✅ VAPID key parece válida');
    }
  }
  
  private isValidBase64(str: string | undefined): boolean {
    if (!str) return false;
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Verifica los Service Workers registrados
   */
  async checkServiceWorkers(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Workers no soportados en este navegador');
      return;
    }
    
    console.log('🔍 Verificando Service Workers...');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('📋 Service Workers registrados:', registrations.length);
    
    registrations.forEach((reg, index) => {
      console.log(`   SW ${index + 1}:`, {
        scope: reg.scope,
        active: reg.active?.scriptURL,
        installing: reg.installing?.scriptURL,
        waiting: reg.waiting?.scriptURL
      });
    });
    
    if (registrations.length === 0) {
      console.warn('⚠️ No hay Service Workers registrados');
    }
    
    // Verificar el estado del Service Worker
    const ready = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready:', ready.scope);
  }
  
  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log('═'.repeat(60));
    console.log('🧪 EJECUTANDO PRUEBAS DE DIAGNÓSTICO FCM');
    console.log('═'.repeat(60));
    
    console.log('\n1️⃣ Verificando Firebase...');
    this.testFirebaseConnection();
    
    console.log('\n2️⃣ Verificando VAPID key...');
    this.checkVapidKey();
    
    console.log('\n3️⃣ Verificando Service Workers...');
    await this.checkServiceWorkers();
    
    console.log('\n4️⃣ Verificando permisos de notificación...');
    console.log('   Estado:', Notification.permission);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🏁 PRUEBAS COMPLETADAS');
    console.log('═'.repeat(60));
  }
}
