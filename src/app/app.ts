import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToast } from './shared/components/notification-toast/notification-toast';
import { OfflineBannerComponent } from './shared/components/offline-banner.component';
import { FcmService } from './core/services/fcm.service';
import { SyncService } from './core/sync/services/sync.service';
import { IndexedDbService } from './core/sync/services/indexed-db.service';
import { OfflineDetectionService } from './core/sync/services/offline-detection.service';
import { SyncDemoService } from './core/sync/services/sync-demo.service';
import { WebSocketConnectionService } from './core/services/websocket-connection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToast, OfflineBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('FRONTEND');
  private fcmService = inject(FcmService);
  private syncService = inject(SyncService);
  private indexedDbService = inject(IndexedDbService);
  private offlineDetection = inject(OfflineDetectionService);
  private syncDemo = inject(SyncDemoService); // Para demos desde Console
  private wsConnection = inject(WebSocketConnectionService);

  ngOnInit(): void {
    this.initializeWebSocket();
    this.initializeNotifications();
    this.initializeOfflineSync();
  }

  private initializeWebSocket(): void {
    console.log('🔌 Conectando WebSocket al iniciar la aplicación...');
    this.wsConnection.connect();
    console.log('✅ WebSocket conectado desde el inicio');
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

  private initializeOfflineSync(): void {
    console.log('🔄 Inicializando sistema de sincronización offline...');
    
    // El IndexedDB se inicializa automáticamente en el constructor
    // El SyncService se inicializa automáticamente en el constructor
    
    // Escuchar cambios de conexión
    this.offlineDetection.isOnline$.subscribe(isOnline => {
      if (isOnline) {
        console.log('✅ Conexión restaurada - Sincronizando datos pendientes...');
      } else {
        console.log('📴 Sin conexión - Modo offline activado');
      }
    });

    // Verificar estado de sincronización
    this.syncService.getSyncStatus().subscribe(status => {
      console.log('📊 Estado de sincronización:', {
        pendingItems: status.pending_items,
        syncInProgress: status.sync_in_progress
      });
    });

    console.log('✅ Sistema de sincronización offline inicializado');
  }
}