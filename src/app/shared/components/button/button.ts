import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrls: ['./button.scss']
})
export class Button {
  @Input() type: 'submit' | 'button' = 'submit';
  @Input() variant: 'primary' | 'secondary' | 'text' = 'primary';
  @Input() loading: boolean = false;
  @Input() loadingText: string = 'Enviando...';
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() routerLink?: string;
}