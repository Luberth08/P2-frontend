import { Injectable } from '@angular/core';
import { SyncItem } from '../models/sync-item.model';

const DB_NAME = 'OfflineSyncDB';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'client_sync_id' });
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('created_at', 'created_at', { unique: false });
          console.log('Store de sincronización creado en IndexedDB');
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
}
