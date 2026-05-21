import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  @Input() items: SidebarItem[] = [];
  @Input() activeItemId: string = '';
  @Output() itemClick = new EventEmitter<string>();
  collapsed = false;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  selectItem(id: string) {
    this.activeItemId = id;
    this.itemClick.emit(id);
  }
}