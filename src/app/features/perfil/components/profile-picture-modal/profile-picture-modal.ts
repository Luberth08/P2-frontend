import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../../shared/components/modal/modal';
import { Button } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-profile-picture-modal',
  standalone: true,
  imports: [CommonModule, Modal, Button],
  templateUrl: './profile-picture-modal.html',
  styleUrls: ['./profile-picture-modal.scss']
})
export class ProfilePictureModal {
  @Input() photoUrl: string | null = null;
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<File>();
  @Output() delete = new EventEmitter<void>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.upload.emit(input.files[0]);
    }
  }
}