import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<Notification | null>();
  notifications$ = this.notificationSubject.asObservable();
  private currentTimeout: any = null;

  private show(message: string, type: Notification['type'], duration: number = 4000) {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.notificationSubject.next({ message, type });
    this.currentTimeout = setTimeout(() => {
      this.clear();
      this.currentTimeout = null;
    }, duration);
  }

  showSuccess(message: string) {
    this.show(message, 'success', 4000);
  }

  showError(message: string) {
    this.show(message, 'error', 5000);
  }

  showInfo(message: string) {
    this.show(message, 'info', 3000);
  }

  clear() {
    this.notificationSubject.next(null);
  }
}