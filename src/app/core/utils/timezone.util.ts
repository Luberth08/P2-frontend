/**
 * Utilidades para manejo de zona horaria
 * Bolivia está en UTC-4 (sin horario de verano)
 * 
 * Simplemente restamos 4 horas a cualquier fecha que venga del backend
 */

/**
 * Formatea una fecha restando 4 horas (formato corto: DD/MM/YYYY HH:mm)
 * Usar para solicitudes de servicio
 */
export function formatBoliviaDateShort(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  // Convertir a Date
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Fecha inválida:', dateString);
    return String(dateString);
  }

  // Restar 4 horas (4 * 60 * 60 * 1000 milisegundos)
  const boliviaDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));

  const day = String(boliviaDate.getDate()).padStart(2, '0');
  const month = String(boliviaDate.getMonth() + 1).padStart(2, '0');
  const year = boliviaDate.getFullYear();
  const hours = String(boliviaDate.getHours()).padStart(2, '0');
  const minutes = String(boliviaDate.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

/**
 * Formatea una fecha SIN restar horas (formato corto: DD/MM/YYYY HH:mm)
 * Usar para servicios en proceso
 */
export function formatDateShort(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  // Convertir a Date
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Fecha inválida:', dateString);
    return String(dateString);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

/**
 * Formatea una fecha con segundos (DD/MM/YYYY HH:mm:ss)
 */
export function formatBoliviaDate(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return String(dateString);
  }

  // Restar 4 horas
  const boliviaDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));

  const day = String(boliviaDate.getDate()).padStart(2, '0');
  const month = String(boliviaDate.getMonth() + 1).padStart(2, '0');
  const year = boliviaDate.getFullYear();
  const hours = String(boliviaDate.getHours()).padStart(2, '0');
  const minutes = String(boliviaDate.getMinutes()).padStart(2, '0');
  const seconds = String(boliviaDate.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Formatea solo la fecha (sin hora): DD/MM/YYYY
 */
export function formatBoliviaDateOnly(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '';
  }

  // Restar 4 horas
  const boliviaDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));

  const day = String(boliviaDate.getDate()).padStart(2, '0');
  const month = String(boliviaDate.getMonth() + 1).padStart(2, '0');
  const year = boliviaDate.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formatea solo la hora: HH:mm:ss
 */
export function formatBoliviaTimeOnly(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '';
  }

  // Restar 4 horas
  const boliviaDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));

  const hours = String(boliviaDate.getHours()).padStart(2, '0');
  const minutes = String(boliviaDate.getMinutes()).padStart(2, '0');
  const seconds = String(boliviaDate.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Obtiene la hora actual en Bolivia
 */
export function getBoliviaTime(): Date {
  const now = new Date();
  return new Date(now.getTime() - (4 * 60 * 60 * 1000));
}

/**
 * Obtiene el offset de Bolivia respecto a UTC
 */
export function getBoliviaOffset(): number {
  return -4;
}
