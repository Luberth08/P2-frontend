export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum EntityType {
  SOLICITUD_SERVICIO = 'solicitud_servicio',
  DIAGNOSTICO = 'diagnostico',
  SERVICIO = 'servicio',
  INCIDENTE = 'incidente'
}

export interface SyncItem {
  operation_type: OperationType;
  entity_type: EntityType;
  client_sync_id: string;
  entity_id?: number;
  payload: Record<string, any>;
  client_timestamp?: Date;
}

export interface SyncRequest {
  items: SyncItem[];
  user_id?: number;
  device_info?: Record<string, any>;
}
