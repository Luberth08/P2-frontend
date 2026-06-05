import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToast } from './shared/components/notification-toast/notification-toast';
import { FcmService } from './core/services/fcm.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('FRONTEND');
  private fcmService = inject(FcmService);

  ngOnInit(): void {
    this.initializeNotifications();
  }

  private initializeNotifications(): void {
    // Verificar si las notificaciones están soportadas
    if (!this.fcmService.isSupported()) {
      console.warn('⚠️ Las notificaciones push no están soportadas en este navegador');
      return;
    }

    console.log('📱 Notificaciones push soportadas en este navegador');

    // Escuchar mensajes en primer plano (siempre activo)
    this.fcmService.listenToMessages((payload) => {
      console.log('📩 Nueva notificación recibida en primer plano:', payload);
      // Aquí puedes actualizar la UI, mostrar un toast, etc.
    });
    
    console.log('✅ Listener de notificaciones configurado');
  }
}