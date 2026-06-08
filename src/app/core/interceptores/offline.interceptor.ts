import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SyncService } from '../sync/services/sync.service';
import { IndexedDbService } from '../sync/services/indexed-db.service';
import { OperationType, EntityType } from '../sync/models/sync-item.model';

/**
 * Interceptor que maneja errores de red y provee funcionalidad offline
 * 
 * FUNCIONALIDADES:
 * 1. Cachea respuestas GET en IndexedDB
 * 2. Cuando no hay conexión, devuelve datos cacheados para GET
 * 3. Guarda operaciones POST/PUT/DELETE para sincronización posterior
 */
export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const syncService = inject(SyncService);
  const indexedDbService = inject(IndexedDbService);

  return next(req).pipe(
    switchMap((event) => {
      // Cachear respuestas exitosas de GET
      if (event instanceof HttpResponse && req.method === 'GET') {
        const cacheKey = `cache:${req.url}`;
        indexedDbService.saveCache(cacheKey, event.body).catch(() => {
          // Ignorar errores de caché silenciosamente
        });
        console.log('💾 Respuesta cacheada:', req.url);
      }
      return of(event);
    }),
    
    catchError((error: HttpErrorResponse) => {
      // Detectar errores de red (sin conexión)
      const isNetworkError = error.status === 0 || error.status === 504;
      
      if (isNetworkError) {
        console.warn('🔌 Sin conexión detectada para:', req.url);
        
        // Para GET: intentar devolver datos cacheados
        if (req.method === 'GET') {
          const cacheKey = `cache:${req.url}`;
          return from(indexedDbService.getCache(cacheKey)).pipe(
            switchMap((cachedData) => {
              if (cachedData) {
                console.log('📦 Devolviendo datos cacheados para:', req.url);
                return of(new HttpResponse({
                  body: cachedData,
                  status: 200,
                  statusText: 'OK (from cache)',
                  url: req.url || undefined
                }));
              } else {
                console.warn('⚠️ No hay datos cacheados para:', req.url);
                // Devolver array vacío para que la UI no crashee
                return of(new HttpResponse({
                  body: [],
                  status: 200,
                  statusText: 'OK (empty offline)',
                  url: req.url || undefined
                }));
              }
            })
          );
        }
        
        // Para POST/PUT/PATCH/DELETE: guardar para sincronización
        if (shouldQueueRequest(req)) {
          console.warn('💾 Guardando operación offline:', req.url);
          
          const syncItem = extractSyncItem(req);
          if (syncItem) {
            return from(syncService.queueSyncItem(syncItem)).pipe(
              switchMap(() => {
                console.log('✅ Operación guardada para sincronización');
                
                // Generar un ID temporal para la respuesta
                const tempId = Date.now();
                
                // Retornar respuesta simulada de éxito que imita la respuesta real
                const successBody = req.body ? {
                  ...(typeof req.body === 'object' ? req.body : {}),
                  id: tempId,
                  offlineQueued: true,
                  _offline: true,
                  success: true,
                  message: 'Guardado localmente. Se sincronizará cuando recuperes conexión.'
                } : {
                  success: true,
                  offlineQueued: true,
                  message: 'Operación guardada. Se sincronizará cuando recuperes conexión.'
                };
                
                return of(new HttpResponse({
                  body: successBody,
                  status: 201, // Created
                  statusText: 'Created (queued for sync)',
                  url: req.url || undefined
                }));
              }),
              catchError((err) => {
                console.error('Error guardando offline:', err);
                // Si falla guardar, igual devolver respuesta de éxito
                // para que la UI no crashee
                return of(new HttpResponse({
                  body: {
                    success: true,
                    offlineQueued: false,
                    message: 'Sin conexión. Reintenta cuando recuperes conexión.',
                    data: req.body
                  },
                  status: 202, // Accepted
                  statusText: 'Accepted (offline)',
                  url: req.url || undefined
                }));
              })
            );
          } else {
            // No se pudo extraer syncItem, pero igual devolver éxito
            console.warn('No se pudo crear syncItem, pero devolviendo éxito');
            return of(new HttpResponse({
              body: {
                success: true,
                message: 'Sin conexión. Operación no guardada.',
                data: req.body
              },
              status: 202,
              statusText: 'Accepted (offline - not queued)',
              url: req.url || undefined
            }));
          }
        }
      }
      
      // Para otros errores o si no se pudo manejar, dejar pasar
      return throwError(() => error);
    })
  );
};

/**
 * Determina si la petición debe guardarse para sincronización offline
 */
function shouldQueueRequest(req: any): boolean {
  // Solo guardar POST, PUT, PATCH, DELETE (operaciones que modifican datos)
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  
  // No guardar peticiones de sync (evitar loops)
  if (req.url.includes('/sync/')) {
    return false;
  }
  
  // No guardar login/auth
  if (req.url.includes('/auth/') || req.url.includes('/login')) {
    return false;
  }
  
  return true;
}

/**
 * Extrae información de la petición HTTP para crear un SyncItem
 */
function extractSyncItem(req: any): any | null {
  const method = req.method.toUpperCase();
  // Usar urlWithParams si está disponible, si no usar url
  const url = req.urlWithParams || req.url;
  const body = req.body;
  
  console.log('🔍 Extrayendo sync item de URL:', url);
  
  // Mapear método HTTP a OperationType
  let operationType: OperationType;
  if (method === 'POST') {
    operationType = OperationType.CREATE;
  } else if (method === 'PUT' || method === 'PATCH') {
    operationType = OperationType.UPDATE;
  } else if (method === 'DELETE') {
    operationType = OperationType.DELETE;
  } else {
    return null;
  }
  
  // Intentar detectar el tipo de entidad desde la URL
  const entityType = detectEntityType(url);
  if (!entityType) {
    console.warn('No se pudo detectar el tipo de entidad de la URL:', url);
    return null;
  }
  
  // Extraer entity_id si es update/delete
  const entityId = extractEntityId(url, method);
  
  // Extraer parámetros de query (como id_taller)
  const queryParams = extractQueryParams(url);
  console.log('🔍 Query params extraídos:', queryParams, 'de URL:', url);
  
  // Combinar body con query params para tener todos los datos
  const fullPayload = body ? { ...body, ...queryParams } : queryParams;
  console.log('📦 Payload completo para sync:', fullPayload);
  
  return {
    operation_type: operationType,
    entity_type: entityType,
    client_sync_id: `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    entity_id: entityId,
    payload: fullPayload,
    client_timestamp: new Date()
  };
}

/**
 * Detecta el tipo de entidad desde la URL
 */
function detectEntityType(url: string): EntityType | null {
  const urlLower = url.toLowerCase();
  
  // Casos específicos primero (más específicos a más generales)
  if (urlLower.includes('/solicitudes/') && urlLower.includes('/aceptar')) {
    // POST /taller/solicitudes/{id}/aceptar -> crea un SERVICIO
    return EntityType.SERVICIO;
  }
  
  if (urlLower.includes('/solicitudes/') && urlLower.includes('/responder')) {
    // POST /cotizaciones/taller/solicitudes/{id}/responder -> actualiza SOLICITUD
    return EntityType.SOLICITUD_SERVICIO;
  }
  
  // Casos generales
  if (urlLower.includes('/solicitud')) {
    return EntityType.SOLICITUD_SERVICIO;
  }
  if (urlLower.includes('/diagnostico')) {
    return EntityType.DIAGNOSTICO;
  }
  if (urlLower.includes('/servicio')) {
    return EntityType.SERVICIO;
  }
  if (urlLower.includes('/incidente')) {
    return EntityType.INCIDENTE;
  }
  
  // Para otros endpoints, usar un tipo genérico
  console.warn('Tipo de entidad no específico para:', url);
  return EntityType.SERVICIO; // Default fallback (cambiado de SOLICITUD_SERVICIO)
}

/**
 * Extrae el ID de la entidad desde la URL (para update/delete)
 */
function extractEntityId(url: string, method: string): number | undefined {
  if (method === 'POST') {
    return undefined; // CREATE no necesita entity_id
  }
  
  // Intentar extraer el último número de la URL
  const matches = url.match(/\/(\d+)(?:\/|$)/);
  return matches ? parseInt(matches[1], 10) : undefined;
}

/**
 * Extrae parámetros de query de la URL
 */
function extractQueryParams(url: string): any {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }
  
  const queryString = url.substring(queryIndex + 1);
  const params: any = {};
  
  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      // Intentar convertir a número si es posible
      const numValue = Number(value);
      params[key] = isNaN(numValue) ? decodeURIComponent(value) : numValue;
    }
  });
  
  return params;
}
