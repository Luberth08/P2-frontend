import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  email: string;
  username: string | null;
  url_img_perfil: string | null;
  nombre: string | null;
  apellido_p: string | null;
  apellido_m: string | null;
  ci: string | null;
  complemento: string | null;
  telefono: string | null;
  direccion: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/perfil/me`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/perfil/me`, data);
  }

  uploadProfilePhoto(file: File): Observable<{ photo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ photo_url: string }>(`${this.apiUrl}/perfil/upload-photo`, formData);
  }

  deleteProfilePhoto(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/perfil/photo`);
  }

  requestPasswordChange(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/perfil/request-password-change`, { email });
  }

  changePassword(email: string, code: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/perfil/change-password`, { email, code, new_password: newPassword });
  }
}