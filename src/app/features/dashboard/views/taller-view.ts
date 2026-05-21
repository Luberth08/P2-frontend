import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-taller-view',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="view-placeholder"><h2>Vista Taller</h2><p>Contenido de ejemplo para la pestaña Mi Taller.</p></div>',
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
export class TallerView {}