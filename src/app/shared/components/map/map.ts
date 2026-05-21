import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

// Fix para los iconos de Leaflet (por defecto no se cargan)
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.scss']
})
export class Map implements AfterViewInit, OnDestroy {
  @Input() initialLat: number = -17.78629;   // Coordenadas de Bolivia (La Paz)
  @Input() initialLng: number = -63.18117;
  @Input() interactive: boolean = true;
  @Input() mapId: string = 'map'; // ID único para cada instancia del mapa
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private retryCount = 0;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // Esperar un poco más para asegurar que el contenedor esté visible
    setTimeout(() => {
      this.initMapWithRetry();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
    // Limpiar el contenedor
    const container = this.el.nativeElement.querySelector(`#${this.mapId}`);
    if (container) {
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }
  }

  private initMapWithRetry(): void {
    const container = this.el.nativeElement.querySelector(`#${this.mapId}`);
    console.log(`Intentando inicializar mapa con ID: ${this.mapId}`, {
      container,
      width: container?.offsetWidth,
      height: container?.offsetHeight,
      retryCount: this.retryCount
    });
    
    if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
      this.initMap();
    } else if (this.retryCount < 20) {
      this.retryCount++;
      setTimeout(() => this.initMapWithRetry(), 250);
    } else {
      console.warn(`No se pudo inicializar el mapa ${this.mapId} después de varios intentos`);
    }
  }

  private initMap(): void {
    const container = this.el.nativeElement.querySelector(`#${this.mapId}`);
    if (!container) return;

    // Verificar si el mapa ya está inicializado
    if (this.map) {
      console.log('Mapa ya inicializado, solo actualizando vista');
      this.map.setView([this.initialLat, this.initialLng], 13);
      if (this.marker) {
        this.marker.setLatLng([this.initialLat, this.initialLng]);
      }
      return;
    }

    // Verificar si el contenedor ya tiene una instancia de Leaflet
    if ((container as any)._leaflet_id) {
      console.log('Contenedor ya tiene un mapa, limpiando...');
      // Limpiar el contenedor
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }

    // Crear el mapa con el ID específico
    this.map = L.map(this.mapId).setView([this.initialLat, this.initialLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Añadir marcador inicial si hay coordenadas
    if (this.initialLat && this.initialLng) {
      this.marker = L.marker([this.initialLat, this.initialLng]).addTo(this.map);
    }

    // Configurar interacción según la propiedad `interactive`
    if (!this.interactive) {
      // Modo solo lectura: deshabilitar todas las interacciones
      this.map.dragging.disable();
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.scrollWheelZoom.disable();
      // Deshabilitar el evento click
      this.map.off('click');
    } else {
      // Modo interactivo: permitir selección de ubicación
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.updateMarker(lat, lng);
        this.locationSelected.emit({ lat, lng });
      });
    }

    // Ajustar tamaño después de que el modal esté completamente visible
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        // Centrar el mapa en las coordenadas iniciales
        this.map.setView([this.initialLat, this.initialLng], 13);
      }
    }, 300);
  }

  private updateMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }
  }
}