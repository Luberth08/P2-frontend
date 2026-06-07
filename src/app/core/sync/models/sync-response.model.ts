export interface SyncItemResult {
  client_sync_id: string;
  status: 'success' | 'conflict' | 'error';
  server_entity_id?: number;
  error_message?: string;
}

export interface SyncResponse {
  success: boolean;
  total_items: number;
  successful_items: number;
  failed_items: number;
  conflicted_items: number;
  results: SyncItemResult[];
  server_timestamp: Date;
}

export interface SyncStatus {
  pending_items: number;
  last_sync_timestamp?: Date;
  sync_in_progress: boolean;
}
