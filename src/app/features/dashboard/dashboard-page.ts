import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';
import { Logo } from '../../shared/components/logo/logo';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';
import { Tabs, TabItem } from '../../shared/components/tabs/tabs';
import { Sidebar, SidebarItem } from '../../shared/components/sidebar/sidebar';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { NormalView } from './views/normal-view';
import { TallerView } from './views/taller-view';
import { SistemaView } from './views/sistema-view';
import { VehiculosPage } from '../vehiculos/vehiculos-page';
import { SolicitudesPage } from '../solicitudes/solicitudes-page';
import { SolicitudesPendientesPage } from '../solicitudes-pendientes-page/solicitudes-pendientes-page';
import { TallerService, Taller } from '../../core/services/taller.service';
import { EmpleadosPage } from '../taller/empleados/empleados-page';
import { TecnicosPage } from '../taller/tecnicos/tecnicos-page';
import { VehiculosTallerPage } from '../taller/vehiculos/vehiculos-page';
import { EspecialidadesPage } from '../sistema/especialidades/especialidades-page';
import { TalleresAdminPage } from '../sistema/talleres/talleres-admin-page';
import { CategoriasIncidentesPage } from '../sistema/incidentes/categorias-incidentes-page';
import { IncidentesPage } from '../sistema/incidentes/incidentes-page';
import { ConfiguracionPage } from '../sistema/configuracion/configuracion-page';
import { PerfilTallerPage } from '../taller/perfil-taller/perfil-taller-page';
import { ServiciosTallerPage } from '../taller/servicios/servicios-page';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Logo, UserAvatar, Tabs, Sidebar, LoadingSpinner, NormalView, TallerView, SistemaView, VehiculosPage, SolicitudesPage, SolicitudesPendientesPage, EmpleadosPage, TecnicosPage, VehiculosTallerPage, EspecialidadesPage, TalleresAdminPage, CategoriasIncidentesPage, IncidentesPage, ConfiguracionPage, PerfilTallerPage, ServiciosTallerPage],
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.scss']
})
export class DashboardPage implements OnInit {
  user: UserProfile | null = null;
  roles: string[] = [];
  tabs: TabItem[] = [];
  activeTabId: string = '';
  sidebarItems: SidebarItem[] = [];
  activeSidebarItemId: string = '';
  currentView: string = '';
  isLoading: boolean = false;
  talleres: Taller[] = [];
  selectedTallerId: number | null = null;
  loadingTalleres = false;


  // Mapeo de vistas según (tab, opción)
  viewMap: { [key: string]: string } = {
    'normal_inicio': 'normal',
    'taller_gestion': 'taller',
    'sistema_usuarios': 'sistema'
  };

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private tallerService: TallerService
  ) {}

  async ngOnInit() {
    await this.loadUserProfile();
    this.setupTabs();
    this.setupSidebarForTab(this.activeTabId);
    this.selectFirstSidebarItem();
  }

  loadUserProfile() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        // Obtener roles del token (o de una llamada adicional)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.roles = payload.roles || [];
          } catch(e) {}
        }
        this.setupTabs();
        // Si el usuario tiene rol de admin_taller o super_admin_taller, cargar talleres
        if (this.roles.includes('admin_taller') || this.roles.includes('super_admin_taller')) {
          this.cargarTalleres();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarTalleres() {
    this.loadingTalleres = true;
    this.tallerService.listMisTalleres().subscribe({
      next: (res) => {
        this.talleres = res.items;
        if (this.talleres.length > 0) {
          this.selectedTallerId = this.talleres[0].id;
          localStorage.setItem('selectedTallerId', String(this.selectedTallerId));
        }
        this.loadingTalleres = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingTalleres = false;
      }
    });
  }

  onTallerChange() {
    if (this.selectedTallerId) {
      localStorage.setItem('selectedTallerId', String(this.selectedTallerId));
      // Aquí puedes refrescar las vistas que dependen del taller (solicitudes, técnicos, etc.)
      // Por ahora, solo lo almacenamos.
    }
  }

  setupTabs() {
    this.tabs = [
      { id: 'normal', label: 'Mi Cuenta', icon: 'fa-user', visible: this.roles.includes('cliente') },
      { id: 'taller', label: 'Gestión de Taller', icon: 'fa-wrench', visible: this.roles.includes('admin_taller') || this.roles.includes('super_admin_taller') },
      { id: 'sistema', label: 'Administración', icon: 'fa-cogs', visible: this.roles.includes('admin_sistema') }
    ];
    const firstVisible = this.tabs.find(t => t.visible);
    if (firstVisible) {
      this.activeTabId = firstVisible.id;
    } else {
      this.activeTabId = 'normal'; // fallback
    }
  }

  onTabChange(tabId: string) {
    this.activeTabId = tabId;
    this.setupSidebarForTab(tabId);
    this.selectFirstSidebarItem();
    this.cdr.detectChanges();
  }

  setupSidebarForTab(tabId: string) {
    if (tabId === 'normal') {
      this.sidebarItems = [
        { id: 'inicio', label: 'Inicio', icon: 'fa-home', visible: true },
        { id: 'vehiculos', label: 'Mis Vehículos', icon: 'fa-car', visible: true },
        { id: 'solicitudes', label: 'Solicitar Afiliación', icon: 'fa-file-signature', visible: true }
      ];
    } else if (tabId === 'taller') {
      this.sidebarItems = [
        { id: 'perfil', label: 'Perfil del Taller', icon: 'fa-building', visible: true },
        { id: 'solicitudes', label: 'Solicitudes', icon: 'fa-clipboard-list', visible: true },
        { id: 'servicios', label: 'Gestión de Servicios', icon: 'fa-tools', visible: true },
        { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car', visible: true },
        { id: 'tecnicos', label: 'Técnicos', icon: 'fa-users', visible: true },
        { id: 'empleados', label: 'Empleados', icon: 'fa-users', visible: true }
      ];
    } else if (tabId === 'sistema') {
      this.sidebarItems = [
        { id: 'usuarios', label: 'Usuarios', icon: 'fa-user-cog', visible: true },
        { id: 'especialidades', label: 'Especialidades', icon: 'fa-star', visible: true },
        { id: 'categorias-incidentes', label: 'Categorías (Incidentes)', icon: 'fa-list', visible: true },
        { id: 'incidentes', label: 'Tipos de Incidentes', icon: 'fa-triangle-exclamation', visible: true },
        { id: 'solicitudes-pendientes', label: 'Solicitudes de afiliación', icon: 'fa-clipboard-list', visible: true },
        { id: 'talleres', label: 'Talleres', icon: 'fa-building', visible: true },
        { id: 'configuracion', label: 'Configurar Criterios', icon: 'fa-cog', visible: true }
      ];
    }
  }

  selectFirstSidebarItem() {
    const first = this.sidebarItems.find(i => i.visible);
    if (first) {
      this.activeSidebarItemId = first.id;
      this.onSidebarItemClick(first.id);
    }
  }

  onSidebarItemClick(itemId: string) {
    this.currentView = `${this.activeTabId}_${itemId}`;
    this.cdr.detectChanges();
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('token');
        this.notificationService.showSuccess('Sesión cerrada correctamente');
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }
}