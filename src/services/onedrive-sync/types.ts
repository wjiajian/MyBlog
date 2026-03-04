export type SyncTrigger = 'startup' | 'poll' | 'webhook' | 'manual' | 'queued';

export interface OneDriveSyncConfig {
  enabled: boolean;
  pollIntervalSeconds: number;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  refreshScope: string;
  driveId: string;
  sourceFolderPath: string;
  webhookUrl: string;
  webhookClientState: string;
  subscriptionResource: string;
  renewBeforeMinutes: number;
  ossRegion: string;
  ossBucket: string;
  ossAccessKeyId: string;
  ossAccessKeySecret: string;
  ossEndpoint: string;
}

export interface SyncConfigSummary {
  enabled: boolean;
  configured: boolean;
  missing: string[];
  pollIntervalSeconds: number;
  webhookConfigured: boolean;
  usesRefreshToken: boolean;
}

export interface GraphDriveItem {
  id: string;
  name: string;
  eTag?: string;
  lastModifiedDateTime?: string;
  folder?: {
    childCount?: number;
  };
  deleted?: Record<string, unknown>;
}

export interface GraphDeltaResponse {
  value: GraphDriveItem[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

export interface SyncStateRow {
  folder_item_id: string | null;
  delta_link: string | null;
  subscription_id: string | null;
  subscription_expiration: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface SyncItemRow {
  drive_item_id: string;
  filename: string;
  base_name: string;
  etag: string | null;
}

export interface PhotoMetadataRecord {
  driveItemId?: string;
  filename: string;
  originalSrc?: string;
  src: string;
  srcMedium?: string;
  srcTiny?: string;
  width: number;
  height: number;
  size: number;
  format: string;
  date?: string | null;
  videoSrc?: string;
}

export interface SyncRunResult {
  success: boolean;
  trigger: SyncTrigger;
  startedAt: string;
  finishedAt: string;
  scannedItems: number;
  syncedItems: number;
  deletedItems: number;
  skippedItems: number;
  message: string;
}

export interface GraphNotificationItem {
  clientState?: string;
  subscriptionId?: string;
}

export interface GraphNotificationPayload {
  value?: GraphNotificationItem[];
}
