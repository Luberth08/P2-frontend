import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptores/auth.interceptor';
import { offlineInterceptor } from './core/interceptores/offline.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor, offlineInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() || environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};