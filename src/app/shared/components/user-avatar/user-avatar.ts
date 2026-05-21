import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.html',
  styleUrls: ['./user-avatar.scss']
})
export class UserAvatar {
  @Input() username: string = '';
  @Input() email: string = '';
  @Input() photoUrl: string | null = null;
  @Output() profileClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  showMenu = false;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  onProfile() {
    this.profileClick.emit();
    this.showMenu = false;
  }

  onLogout() {
    this.logoutClick.emit();
    this.showMenu = false;
  }
}