import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineDetectionService } from '../../core/sync/services/offline-detection.service';
import { SyncService } from '../../core/sync/services/sync.service';
import { IndexedDbService } from '../../core/sync/services/indexed-db.service';

/**
 * Banner que muestra el estado de conexión y sincronización
 * 
 * Se muestra cuando:
 * - El usuario está offline
 * - Hay items pendientes de sincronización
 * - Se está sincronizando actualmente
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-banner" *ngIf="showBanner">
      <div class="banner-content" [ngClass]="bannerClass">
        <div class="banner-icon">{{ icon }}</div>
        <div class="banner-text">
          <div class="banner-title">{{ title }}</div>
          <div class="banner-message">{{ message }}</div>
        </div>
        <button 
          *ngIf="canSync" 
          class="sync-button" 
          (click)="syncNow()"
          [disabled]="isSyncing">
          {{ isSyncing ? 'Sincronizando...' : 'Sincronizar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .banner-content {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .banner-content.offline {
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      color: white;
    }

    .banner-content.syncing {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
    }

    .banner-content.online {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .banner-icon {
      font-size: 24px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .banner-text {
      flex: 1;
    }

    .banner-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .banner-message {
      font-size: 12px;
      opacity: 0.9;
    }

    .sync-button {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sync-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .sync-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class OfflineBannerComponent implements OnInit {
  private offlineService = inject(OfflineDetectionService);
  private syncService = inject(SyncService);
  private indexedDbService = inject(IndexedDbService);

  isOnline = true;
  pendingCount = 0;
  isSyncing = false;
  showBanner = false;
  
  get bannerClass(): string {
    if (!this.isOnline) return 'offline';
    if (this.isSyncing) return 'syncing';
    return 'online';
  }

  get icon(): string {
    if (!this.isOnline) return '🔌';
    if (this.isSyncing) return '🔄';
    return '✅';
  }

  get title(): string {
    if (!this.isOnline) return 'Sin conexión';
    if (this.isSyncing) return 'Sincronizando...';
    if (this.pendingCount > 0) return 'Datos pendientes';
    return 'Conectado';
  }

  get message(): string {
    if (!this.isOnline) {
      return this.pendingCount > 0 
        ? `Modo offline - ${this.pendingCount} operación(es) guardadas localmente`
        : 'Puedes seguir trabajando, los datos se guardarán localmente';
    }
    if (this.isSyncing) {
      return `Sincronizando ${this.pendingCount} operación(es)...`;
    }
    if (this.pendingCount > 0) {
      return `${this.pendingCount} operación(es) pendientes de sincronización`;
    }
    return 'Todos los datos están sincronizados';
  }

  get canSync(): boolean {
    return this.isOnline && this.pendingCount > 0 && !this.isSyncing;
  }

  ngOnInit() {
    // Monitorear estado de conexión
    this.offlineService.isOnline$.subscribe(online => {
      this.isOnline = online;
      this.updateBannerVisibility();
      
      // Si recupera conexión y hay pendientes, sincronizar automáticamente
      if (online && this.pendingCount > 0 && !this.isSyncing) {
        setTimeout(() => this.syncNow(), 1000);
      }
    });

    // Monitorear items pendientes
    this.updatePendingCount();
    setInterval(() => this.updatePendingCount(), 5000);
    
    // Escuchar eventos de sincronización completada
    this.syncService.syncCompleted$.subscribe(async () => {
      await this.updatePendingCount();
      
      // Si está online y no hay más pendientes, ocultar después de 2 segundos
      if (this.isOnline && this.pendingCount === 0) {
        setTimeout(() => {
          this.isSyncing = false;
          this.updateBannerVisibility();
        }, 2000);
      }
    });
  }

  async updatePendingCount() {
    this.pendingCount = await this.indexedDbService.getPendingCount();
    this.updateBannerVisibility();
  }

  updateBannerVisibility() {
    // Mostrar banner si:
    // - Está offline
    // - Hay items pendientes
    // - Se está sincronizando
    this.showBanner = !this.isOnline || this.pendingCount > 0 || this.isSyncing;
  }

  async syncNow() {
    if (!this.canSync) return;
    
    this.isSyncing = true;
    this.updateBannerVisibility();
    
    try {
      await this.syncService.syncPendingItems();
      await this.updatePendingCount();
      
      // Si está online y no hay más pendientes, ocultar el banner después de 2 segundos
      if (this.isOnline && this.pendingCount === 0) {
        setTimeout(() => {
          this.isSyncing = false;
          this.updateBannerVisibility();
        }, 2000);
      } else {
        this.isSyncing = false;
        this.updateBannerVisibility();
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      this.isSyncing = false;
      this.updateBannerVisibility();
    }
  }
}
