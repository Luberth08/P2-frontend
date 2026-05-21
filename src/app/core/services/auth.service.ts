// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/web/login`, credentials)
      .pipe(tap(res => this.setToken(res.access_token)));
  }
  
  registerInit(data: any) {
    return this.http.post(`${this.apiUrl}/auth/web/register/init`, data);
  }

  registerComplete(email: string, code: string) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/web/register/complete`, { email, code })
      .pipe(tap(res => this.setToken(res.access_token)));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/web/logout`, {});
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}