import { Injectable } from '@angular/core';
import { SyncItem } from '../models/sync-item.model';

const DB_NAME = 'OfflineSyncDB';
const DB_VERSION = 2;  // Incrementado para agregar nuevo store
const STORE_NAME = 'sync_queue';
const CACHE_STORE_NAME = 'http_cache';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error abriendo IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inicializado correctamente');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para cola de sincronización
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'client_sync_id' });
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('created_at', 'created_at', { unique: false });
          console.log('Store de sincronización creado en IndexedDB');
        }
        
        // Store para caché de respuestas HTTP
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const cacheStore = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Store de caché HTTP creado en IndexedDB');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  async addSyncItem(item: SyncItem): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        ...item,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      request.onsuccess = () => {
        console.log('Item agregado a cola de sincronización:', item.client_sync_id);
        resolve();
      };

      request.onerror = () => {
        console.error('Error agregando item a IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async getPendingItems(): Promise<SyncItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result as SyncItem[]);
      };

      request.onerror = () => {
        console.error('Error obteniendo items pendientes:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteSyncItem(clientSyncId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(clientSyncId);

      request.onsuccess = () => {
        console.log('Item eliminado de cola de sincronización:', clientSyncId);
        resolve();
      };

      request.onerror = () => {
        console.error('Error eliminando item de IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async updateSyncItemStatus(clientSyncId: string, status: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(clientSyncId);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = status;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        console.error('Error obteniendo item para actualizar:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async getPendingCount(): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.count('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error contando items pendientes:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Guarda una respuesta HTTP en caché
   */
  async saveCache(key: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.put({
        key,
        data,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene datos cacheados
   */
  async getCache(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          // Verificar si el caché no es muy viejo (24 horas)
          const cacheAge = Date.now() - new Date(request.result.timestamp).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas
          
          if (cacheAge < maxAge) {
            resolve(request.result.data);
          } else {
            // Caché expirado
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpia caché viejo (más de 7 días)
   */
  async cleanOldCache(): Promise<void> {
    const db = await this.ensureDB();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
    const cutoff = new Date(Date.now() - maxAge).toISOString();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina items con estado 'failed' o 'conflict' de la cola
   */
  async clearFailedItems(): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value;
          if (item.status === 'failed' || item.status === 'conflict') {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🗑️ ${deletedCount} items fallidos/conflictos eliminados`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}
