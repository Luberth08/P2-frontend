import { Injectable, inject } from '@angular/core';
import { SyncService } from './sync.service';
import { IndexedDbService } from './indexed-db.service';
import { OperationType, EntityType, SyncItem } from '../models/sync-item.model';

/**
 * Servicio de demostración para probar el sistema offline/sync desde la Console
 * 
 * USO EN CONSOLE:
 * 
 * // Obtener el servicio
 * const demo = window['syncDemo'];
 * 
 * // Crear item de prueba
 * await demo.createTestItem();
 * 
 * // Ver items pendientes
 * await demo.showPendingItems();
 * 
 * // Sincronizar manualmente
 * await demo.syncNow();
 * 
 * // Ver estado
 * await demo.showStatus();
 */
@Injectable({
  providedIn: 'root'
})
export class SyncDemoService {
  private syncService = inject(SyncService);
  private indexedDbService = inject(IndexedDbService);

  constructor() {
    // Exponer en window para acceso desde Console
    (window as any)['syncDemo'] = this;
    console.log('🎮 SyncDemoService disponible en: window.syncDemo');
  }

  /**
   * Crea un item de prueba y lo agrega a la cola offline
   * NOTA: Este es solo un ejemplo de testing. Los IDs deben existir en la BD.
   * Para pruebas reales, captura estos valores de entidades existentes.
   */
  async createTestItem(): Promise<void> {
    const testItem: SyncItem = {
      operation_type: OperationType.CREATE,
      entity_type: EntityType.SOLICITUD_SERVICIO,
      client_sync_id: 'test-' + Date.now(),
      payload: {
        // IMPORTANTE: Estos IDs deben existir en tu base de datos
        // Cambia estos valores según tus datos reales
        id_diagnostico: 999999,  // ID de prueba - ajustar según tu BD
        id_taller: 1,
        distancia_km: 5.5,
        fecha_solicitud: new Date().toISOString(),
        estado: 'pendiente',
        comentario: 'Solicitud de prueba desde offline sync',
        sugerido_por: 'conductor'
      },
      client_timestamp: new Date()
    };

    console.warn('⚠️ NOTA: Esta es una solicitud de prueba.');
    console.warn('⚠️ Los id_diagnostico y id_taller deben existir en la base de datos.');
    console.warn('⚠️ Si recibes error de foreign key, ajusta estos IDs en sync-demo.service.ts');
    
    await this.syncService.queueSyncItem(testItem);
    console.log('✅ Item de prueba creado:', testItem.client_sync_id);
    console.log('📦 Payload:', testItem.payload);
  }

  /**
   * Muestra todos los items pendientes
   */
  async showPendingItems(): Promise<void> {
    const items = await this.indexedDbService.getPendingItems();
    console.log('📋 Items pendientes:', items.length);
    items.forEach((item, index) => {
      console.log(`${index + 1}.`, {
        id: item.client_sync_id,
        type: item.operation_type,
        entity: item.entity_type,
        payload: item.payload
      });
    });
  }

  /**
   * Fuerza una sincronización inmediata
   */
  async syncNow(): Promise<void> {
    console.log('🔄 Iniciando sincronización manual...');
    await this.syncService.syncPendingItems();
  }

  /**
   * Muestra el estado actual de sincronización
   */
  async showStatus(): Promise<void> {
    this.syncService.getSyncStatus().subscribe(status => {
      console.log('📊 Estado de sincronización:', {
        pendingItems: status.pending_items,
        syncInProgress: status.sync_in_progress
      });
    });
  }

  /**
   * Cuenta items pendientes
   */
  async countPending(): Promise<number> {
    const count = await this.indexedDbService.getPendingCount();
    console.log(`📦 Items pendientes: ${count}`);
    return count;
  }

  /**
   * Limpia todos los items (solo para testing)
   */
  async clearAll(): Promise<void> {
    const items = await this.indexedDbService.getPendingItems();
    for (const item of items) {
      await this.indexedDbService.deleteSyncItem(item.client_sync_id);
    }
    console.log('🗑️ Todos los items eliminados');
  }

  /**
   * Muestra ayuda
   */
  help(): void {
    console.log(`
🎮 SYNC DEMO SERVICE - COMANDOS DISPONIBLES

Accede al servicio con: window.syncDemo

COMANDOS:
=========

1. Crear item de prueba:
   await syncDemo.createTestItem()

2. Ver items pendientes:
   await syncDemo.showPendingItems()

3. Sincronizar ahora:
   await syncDemo.syncNow()

4. Ver estado:
   await syncDemo.showStatus()

5. Contar pendientes:
   await syncDemo.countPending()

6. Limpiar todo:
   await syncDemo.clearAll()

7. Esta ayuda:
   syncDemo.help()

FLUJO DE PRUEBA:
================

1. Crear items: await syncDemo.createTestItem()
2. Verificar: await syncDemo.showPendingItems()
3. Sincronizar: await syncDemo.syncNow()
4. Confirmar: await syncDemo.countPending() // Debe ser 0
    `);
  }
}
