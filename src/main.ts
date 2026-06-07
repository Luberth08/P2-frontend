import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Esperar a que la app esté lista antes de registrar el Service Worker
bootstrapApplication(App, appConfig)
  .then(() => {
    // Registrar Service Workers después de que la app esté inicializada
    if ('serviceWorker' in navigator) {
      // Esperar un poco para asegurar que todo esté listo
      setTimeout(() => {
        // Registrar Service Worker de Firebase para notificaciones
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Firebase Service Worker registrado exitosamente:', registration);
            console.log('   Scope:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Error registrando Firebase Service Worker:', error);
          });

        // Registrar Service Worker de Angular PWA para offline
        navigator.serviceWorker
          .register('/ngsw-worker.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Angular PWA Service Worker registrado exitosamente:', registration);
            console.log('   Scope:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Error registrando Angular PWA Service Worker:', error);
          });
      }, 1000);
    }
  })
  .catch((err) => console.error(err));
