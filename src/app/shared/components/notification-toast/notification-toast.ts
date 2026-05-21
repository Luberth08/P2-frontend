import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.html',
  styleUrls: ['./notification-toast.scss']
})
export class NotificationToast implements OnInit, OnDestroy {
  notification: Notification | null = null;
  closing: boolean = false;
  private subscription: Subscription | null = null;
  private closeTimeout: any = null;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(notif => {
      // Si llega una nueva notificación, cancelar cualquier cierre pendiente
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
      if (notif === null) {
        // Iniciar animación de salida
        this.startClosing();
      } else {
        // Nueva notificación: reemplazar la actual
        this.notification = notif;
        this.closing = false;
        this.cdr.detectChanges();
      }
    });
  }

  private startClosing() {
    if (!this.notification) return;
    this.closing = true;
    this.cdr.detectChanges();
    this.closeTimeout = setTimeout(() => {
      this.notification = null;
      this.closing = false;
      this.closeTimeout = null;
      this.cdr.detectChanges();
    }, 300); // debe coincidir con la duración de la transición CSS
  }

  close() {
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
    this.startClosing();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
  }

  getIcon(): string {
    switch (this.notification?.type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      default: return 'fa-info-circle';
    }
  }
}