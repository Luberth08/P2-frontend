import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Esperar a que la app esté lista antes de registrar el Service Worker
bootstrapApplication(App, appConfig)
  .then(() => {
    // Registrar Service Worker después de que la app esté inicializada
    if ('serviceWorker' in navigator) {
      // Esperar un poco para asegurar que todo esté listo
      setTimeout(() => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker registrado exitosamente:', registration);
            console.log('   Scope:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Error registrando Service Worker:', error);
          });
      }, 1000);
    }
  })
  .catch((err) => console.error(err));
