import { Pipe, PipeTransform } from '@angular/core';
import { formatBoliviaDateShort, formatBoliviaDateOnly, formatBoliviaTimeOnly } from '../../core/utils/timezone.util';

/**
 * Pipe para formatear fechas en hora de Bolivia
 * 
 * Uso:
 * {{ fecha | boliviaDate }}           -> DD/MM/YYYY HH:mm:ss
 * {{ fecha | boliviaDate:'short' }}   -> DD/MM/YYYY HH:mm
 * {{ fecha | boliviaDate:'dateOnly' }} -> DD/MM/YYYY
 * {{ fecha | boliviaDate:'timeOnly' }} -> HH:mm:ss
 */
@Pipe({
  name: 'boliviaDate',
  standalone: true
})
export class BoliviaDatePipe implements PipeTransform {
  transform(value: string | Date, format: 'full' | 'short' | 'dateOnly' | 'timeOnly' = 'short'): string {
    if (!value) {
      return '';
    }

    switch (format) {
      case 'short':
        return formatBoliviaDateShort(value);
      case 'dateOnly':
        return formatBoliviaDateOnly(value);
      case 'timeOnly':
        return formatBoliviaTimeOnly(value);
      case 'full':
      default:
        return formatBoliviaDateShort(value);
    }
  }
}
