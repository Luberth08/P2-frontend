import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, firstValueFrom, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SyncRequest, SyncItem } from '../models/sync-item.model';
import { SyncResponse, SyncStatus } from '../models/sync-response.model';
import { IndexedDbService } from './indexed-db.service';
import { OfflineDetectionService } from './offline-detection.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly API_URL = `${environment.apiUrl}/sync`;
  private syncInProgress = false;
  
  // Observable para notificar cuando se complete la sincronización
  private syncCompletedSubject = new Subject<void>();
  public syncCompleted$ = this.syncCompletedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService,
    private offlineDetection: OfflineDetectionService
  ) {
    this.initAutoSync();
  }

  private initAutoSync(): void {
    // Escuchar cambios de conexión
    this.offlineDetection.isOnline$.subscribe(async (isOnline) => {
      if (isOnline && !this.syncInProgress) {
        await this.syncPendingItems();
      }
    });
  }

  async queueSyncItem(item: SyncItem): Promise<void> {
    if (this.offlineDetection.isOnline) {
      // Si está online, intentar sincronizar inmediatamente
      try {
        await this.syncSingleItem(item);
      } catch (error) {
        // Si falla, guardar localmente
        console.log('Fallo sincronización inmediata, guardando localmente:', error);
        await this.indexedDb.addSyncItem(item);
      }
    } else {
      // Si está offline, guardar localmente
      await this.indexedDb.addSyncItem(item);
    }
  }

  async syncPendingItems(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sincronización ya en progreso');
      return;
    }

    const pendingItems = await this.indexedDb.getPendingItems();
    if (pendingItems.length === 0) {
      console.log('No hay items pendientes de sincronización');
      return;
    }

    console.log(`Sincronizando ${pendingItems.length} items pendientes`);
    console.log('📋 Items a sincronizar:', JSON.stringify(pendingItems, null, 2));
    this.syncInProgress = true;

    try {
      const syncRequest: SyncRequest = {
        items: pendingItems,
        user_id: this.getUserId()
      };

      const response = await firstValueFrom(this.http.post<SyncResponse>(`${this.API_URL}/pending`, syncRequest));

      // Procesar resultados
      for (const result of response.results) {
        if (result.status === 'success') {
          await this.indexedDb.deleteSyncItem(result.client_sync_id);
          console.log(`✅ Item sincronizado exitosamente: ${result.client_sync_id}`);
          if (result.error_message && result.error_message.includes('duplicado')) {
            console.log(`   ℹ️ ${result.error_message}`);
          }
        } else if (result.status === 'conflict') {
          console.warn(`⚠️ Conflicto en item ${result.client_sync_id}:`, result.error_message);
          await this.indexedDb.updateSyncItemStatus(result.client_sync_id, 'conflict');
        } else {
          console.error(`❌ Error sincronizando item ${result.client_sync_id}:`, result.error_message);
          // NO borrar items fallidos, marcarlos como failed para poder revisarlos
          await this.indexedDb.updateSyncItemStatus(result.client_sync_id, 'failed');
        }
      }

      console.log(`🎯 Sincronización completada: ${response.successful_items} exitosos, ${response.failed_items} fallidos, ${response.conflicted_items} conflictos`);
      
      if (response.failed_items > 0 || response.conflicted_items > 0) {
        console.warn('⚠️ Algunos items no se sincronizaron. Revisa los errores arriba.');
      }
      
      // Emitir evento de sincronización completada para que los componentes recarguen datos
      if (response.successful_items > 0) {
        this.syncCompletedSubject.next();
      }
    } catch (error) {
      console.error('Error durante sincronización:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncSingleItem(item: SyncItem): Promise<void> {
    const syncRequest: SyncRequest = {
      items: [item],
      user_id: this.getUserId()
    };

    const response = await firstValueFrom(this.http.post<SyncResponse>(`${this.API_URL}/pending`, syncRequest));
    
    if (response.results[0].status === 'success') {
      console.log('Item sincronizado exitosamente:', item.client_sync_id);
    } else {
      throw new Error(response.results[0].error_message || 'Error desconocido');
    }
  }

  getSyncStatus(): Observable<SyncStatus> {
    return from(this.indexedDb.getPendingCount()).pipe(
      map(pendingCount => ({
        pending_items: pendingCount,
        sync_in_progress: this.syncInProgress
      }))
    );
  }

  private getUserId(): number | undefined {
    // Obtener ID del usuario del localStorage o JWT
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id;
      } catch (error) {
        console.error('Error decodificando token:', error);
      }
    }
    return undefined;
  }

  healthCheck(): Observable<{ status: string; module: string; message: string }> {
    return this.http.get<{ status: string; module: string; message: string }>(`${this.API_URL}/health`);
  }
}
