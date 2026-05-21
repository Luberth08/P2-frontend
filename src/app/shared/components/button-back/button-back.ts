import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-button-back',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-back.html',
  styleUrls: ['./button-back.scss']
})
export class ButtonBack {
  @Input() routerLink?: string;
  @Output() clicked = new EventEmitter<void>();

  constructor(private location: Location) {}

  goBack() {
    if (this.routerLink) {
      // Si se pasa routerLink, se usa el enlace (se manejará en el padre)
      this.clicked.emit();
    } else {
      this.location.back();
    }
  }
}