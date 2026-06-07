import { Injectable } from '@angular/core';
import { fromEvent, Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineDetectionService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline(): void {
    console.log('Conexión restaurada');
    this.isOnlineSubject.next(true);
  }

  private handleOffline(): void {
    console.log('Conexión perdida - Modo offline activado');
    this.isOnlineSubject.next(false);
  }

  public get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }
}
