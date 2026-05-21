import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { Welcome } from './features/welcome/welcome';
import { RegisterPage } from './features/register/register-page';
import { LoginPage } from './features/login/login-page';
import { DashboardPage } from './features/dashboard/dashboard-page';
import { authGuard } from './core/guards/auth.guard';
import { PerfilPage } from './features/perfil/perfil-page';
import { VehiculosPage } from './features/vehiculos/vehiculos-page';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Welcome, pathMatch: 'full' },
      // otras rutas públicas como login, register (si usan el mismo layout)
    ]
  },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
  { path: 'register', component: RegisterPage },
  { path: 'login', component: LoginPage },
  { path: 'perfil', component: PerfilPage, canActivate: [authGuard] },
  { path: 'vehiculos', component: VehiculosPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];