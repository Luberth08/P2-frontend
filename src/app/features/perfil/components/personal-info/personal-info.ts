import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditableField } from '../../../../shared/components/editable-field/editable-field';
import { ProfilePicture } from '../../../../shared/components/profile-picture/profile-picture';
import { UserProfile } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, EditableField, ProfilePicture],
  templateUrl: './personal-info.html',
  styleUrls: ['./personal-info.scss']
})
export class PersonalInfo {
  @Input() profile: UserProfile | null = null;
  @Input() isLoading: boolean = false;
  @Output() updateField = new EventEmitter<{ field: keyof UserProfile; value: any }>();
  @Output() photoClick = new EventEmitter<void>();
}