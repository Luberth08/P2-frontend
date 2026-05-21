import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-normal-view',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="view-placeholder"><h2>Vista Normal</h2><p>Contenido de ejemplo para la pestaña Mi Cuenta.</p></div>',
  styles: [`
    .view-placeholder {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class NormalView {}