import type OSS from 'ali-oss';
import { getConfig, getSyncConfigSummary } from './config.js';
import {
  deleteMetadataEntry,
  deleteSyncItem,
  ensureSyncTables,
  findBaseNameConflict,
  getSyncItem,
  getSyncState,
  readMetadataRecords,
  saveSyncState,
  upsertMetadataEntry,
  upsertSyncItem,
  writeMetadataRecords,
} from './state.js';
import {
  downloadOneDriveFile,
  ensureSubscription,
  getGraphAccessToken,
  graphRequestJson,
  resolveFolderItemId,
} from './graph.js';
import {
  buildPhotoVariants,
  convertToJpegBuffer,
  createOssClient,
  deleteObjectIgnoreNotFound,
  extractPhotoDate,
  getBaseName,
  getExtension,
  getPhotoObjectKeys,
  isSupportedPhoto,
  putObject,
} from './media.js';
import type {
  GraphDeltaResponse,
  GraphDriveItem,
  GraphNotificationPayload,
  OneDriveSyncConfig,
  PhotoMetadataRecord,
  SyncRunResult,
  SyncTrigger,
} from './types.js';

let scheduler: NodeJS.Timeout | null = null;
let running = false;
let rerunRequested = false;
let lastRunResult: SyncRunResult | null = null;

async function resolveUniqueBaseName(baseName: string, driveItemId: string): Promise<string> {
  const hasConflict = await findBaseNameConflict(baseName, driveItemId);
  if (!hasConflict) return baseName;
  return `${baseName}-${driveItemId.slice(0, 8)}`;
}

async function processDeletedItem(
  driveItemId: string,
  client: OSS,
  metadataRecords: PhotoMetadataRecord[],
): Promise<{
  metadataRecords: PhotoMetadataRecord[];
  deleted: boolean;
}> {
  const syncItem = await getSyncItem(driveItemId);
  if (!syncItem) {
    return {
      metadataRecords,
      deleted: false,
    };
  }

  const keys = getPhotoObjectKeys(syncItem.base_name);
  await Promise.all([
    deleteObjectIgnoreNotFound(client, keys.fullKey),
    deleteObjectIgnoreNotFound(client, keys.mediumKey),
    deleteObjectIgnoreNotFound(client, keys.tinyKey),
  ]);

  await deleteSyncItem(driveItemId);
  const updatedMetadata = deleteMetadataEntry(metadataRecords, driveItemId, syncItem.filename);
  return {
    metadataRecords: updatedMetadata,
    deleted: true,
  };
}

async function processChangedPhotoItem(
  item: GraphDriveItem,
  accessToken: string,
  config: OneDriveSyncConfig,
  client: OSS,
  metadataRecords: PhotoMetadataRecord[],
): Promise<{
  metadataRecords: PhotoMetadataRecord[];
  updated: boolean;
}> {
  if (!isSupportedPhoto(item.name)) {
    return {
      metadataRecords,
      updated: false,
    };
  }

  const existing = await getSyncItem(item.id);
  if (existing && existing.etag && item.eTag && existing.etag === item.eTag && existing.filename === item.name) {
    return {
      metadataRecords,
      updated: false,
    };
  }

  const extension = getExtension(item.name);
  const downloaded = await downloadOneDriveFile(accessToken, config.driveId, item.id);
  const fullSourceBuffer = await convertToJpegBuffer(downloaded, extension);
  const variants = await buildPhotoVariants(fullSourceBuffer);
  const photoDate = await extractPhotoDate(downloaded, item.lastModifiedDateTime);
  const preferredBaseName = getBaseName(item.name);
  const uniqueBaseName = await resolveUniqueBaseName(preferredBaseName, item.id);

  if (existing && existing.base_name !== uniqueBaseName) {
    const oldKeys = getPhotoObjectKeys(existing.base_name);
    await Promise.all([
      deleteObjectIgnoreNotFound(client, oldKeys.fullKey),
      deleteObjectIgnoreNotFound(client, oldKeys.mediumKey),
      deleteObjectIgnoreNotFound(client, oldKeys.tinyKey),
    ]);
  }

  const keys = getPhotoObjectKeys(uniqueBaseName);
  await Promise.all([
    putObject(client, keys.fullKey, variants.fullBuffer, 'image/jpeg'),
    putObject(client, keys.mediumKey, variants.mediumBuffer, 'image/jpeg'),
    putObject(client, keys.tinyKey, variants.tinyBuffer, 'image/jpeg'),
  ]);

  await upsertSyncItem(item.id, item.name, uniqueBaseName, item.eTag || null, item.lastModifiedDateTime);

  const previous = metadataRecords.find(record => record.driveItemId === item.id || record.filename === item.name);
  const updatedMetadataRecord: PhotoMetadataRecord = {
    driveItemId: item.id,
    filename: item.name,
    originalSrc: `/${keys.fullKey}`,
    src: `/${keys.fullKey}`,
    srcMedium: `/${keys.mediumKey}`,
    srcTiny: `/${keys.tinyKey}`,
    width: variants.width,
    height: variants.height,
    size: variants.fullBuffer.length,
    format: 'JPEG',
    date: photoDate,
    videoSrc: previous?.videoSrc,
  };

  return {
    metadataRecords: upsertMetadataEntry(metadataRecords, updatedMetadataRecord),
    updated: true,
  };
}

function buildDeltaEndpoint(config: OneDriveSyncConfig, folderItemId: string, deltaLink: string | null): string {
  if (deltaLink) return deltaLink;
  return `/drives/${encodeURIComponent(config.driveId)}/items/${encodeURIComponent(folderItemId)}/delta`;
}

async function runSyncInternal(trigger: SyncTrigger): Promise<SyncRunResult> {
  const startedAt = new Date().toISOString();
  const config = getConfig();
  const summary = getSyncConfigSummary();

  if (!summary.enabled) {
    return {
      success: false,
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      scannedItems: 0,
      syncedItems: 0,
      deletedItems: 0,
      skippedItems: 0,
      message: 'OneDrive sync is disabled',
    };
  }

  if (!summary.configured) {
    return {
      success: false,
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      scannedItems: 0,
      syncedItems: 0,
      deletedItems: 0,
      skippedItems: 0,
      message: `Missing config: ${summary.missing.join(', ')}`,
    };
  }

  await ensureSyncTables();

  let scannedItems = 0;
  let syncedItems = 0;
  let deletedItems = 0;
  let skippedItems = 0;
  let nextDeltaLink = '';

  try {
    const token = await getGraphAccessToken(config);
    const state = await getSyncState();
    const folderItemId = await resolveFolderItemId(token, config);
    const client = createOssClient(config);
    let metadataRecords = readMetadataRecords();
    let nextEndpointOrUrl = buildDeltaEndpoint(config, folderItemId, state.delta_link);

    while (nextEndpointOrUrl) {
      const payload = await graphRequestJson<GraphDeltaResponse>(token, nextEndpointOrUrl);
      const items = Array.isArray(payload.value) ? payload.value : [];
      scannedItems += items.length;

      for (const item of items) {
        if (!item || !item.id) {
          skippedItems++;
          continue;
        }

        if (item.folder) {
          skippedItems++;
          continue;
        }

        if (item.deleted) {
          const deletedResult = await processDeletedItem(item.id, client, metadataRecords);
          metadataRecords = deletedResult.metadataRecords;
          if (deletedResult.deleted) {
            deletedItems++;
          } else {
            skippedItems++;
          }
          continue;
        }

        const changedResult = await processChangedPhotoItem(item, token, config, client, metadataRecords);
        metadataRecords = changedResult.metadataRecords;
        if (changedResult.updated) {
          syncedItems++;
        } else {
          skippedItems++;
        }
      }

      if (payload['@odata.deltaLink']) {
        nextDeltaLink = payload['@odata.deltaLink'];
      }

      nextEndpointOrUrl = payload['@odata.nextLink'] || '';
    }

    writeMetadataRecords(metadataRecords);
    await saveSyncState({
      delta_link: nextDeltaLink || state.delta_link,
      folder_item_id: folderItemId,
      last_synced_at: new Date().toISOString(),
      last_error: null,
    });

    return {
      success: true,
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      scannedItems,
      syncedItems,
      deletedItems,
      skippedItems,
      message: 'Sync completed',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await saveSyncState({
      last_error: message,
    });
    return {
      success: false,
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      scannedItems,
      syncedItems,
      deletedItems,
      skippedItems,
      message,
    };
  }
}

async function runSyncWithQueue(trigger: SyncTrigger): Promise<SyncRunResult> {
  if (running) {
    rerunRequested = true;
    return {
      success: true,
      trigger,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      scannedItems: 0,
      syncedItems: 0,
      deletedItems: 0,
      skippedItems: 0,
      message: 'Sync already running, queued one follow-up run',
    };
  }

  running = true;
  const result = await runSyncInternal(trigger);
  lastRunResult = result;
  running = false;

  if (rerunRequested) {
    rerunRequested = false;
    void runSyncWithQueue('queued');
  }

  return result;
}

export async function ensureOneDriveSubscription(forceRenew = false): Promise<{
  success: boolean;
  message: string;
  subscriptionId?: string;
  expirationDateTime?: string;
}> {
  const config = getConfig();
  const summary = getSyncConfigSummary();

  if (!summary.enabled) {
    return { success: false, message: 'OneDrive sync is disabled' };
  }
  if (!summary.configured) {
    return { success: false, message: `Missing config: ${summary.missing.join(', ')}` };
  }
  if (!config.webhookUrl) {
    return { success: false, message: 'ONEDRIVE_WEBHOOK_URL is not configured' };
  }

  await ensureSyncTables();
  const token = await getGraphAccessToken(config);
  return await ensureSubscription(token, config, forceRenew);
}

export async function queueOneDriveSync(trigger: SyncTrigger): Promise<SyncRunResult> {
  return await runSyncWithQueue(trigger);
}

export async function handleOneDriveWebhook(payload: unknown): Promise<{
  accepted: number;
  ignored: number;
  queued: boolean;
}> {
  const config = getConfig();
  const notification = (payload || {}) as GraphNotificationPayload;
  const items = Array.isArray(notification.value) ? notification.value : [];

  if (items.length === 0) {
    return { accepted: 0, ignored: 0, queued: false };
  }

  let accepted = 0;
  let ignored = 0;
  for (const item of items) {
    if (config.webhookClientState && item.clientState !== config.webhookClientState) {
      ignored++;
      continue;
    }
    accepted++;
  }

  if (accepted > 0) {
    void runSyncWithQueue('webhook');
  }

  return {
    accepted,
    ignored,
    queued: accepted > 0,
  };
}

export function startOneDriveSyncScheduler(): void {
  if (scheduler) return;

  const summary = getSyncConfigSummary();
  if (!summary.enabled) {
    console.log('[onedrive-sync] Scheduler not started: ONEDRIVE_SYNC_ENABLED is false');
    return;
  }
  if (!summary.configured) {
    console.error(`[onedrive-sync] Scheduler not started: missing config -> ${summary.missing.join(', ')}`);
    return;
  }

  console.log(`[onedrive-sync] Scheduler started, polling every ${summary.pollIntervalSeconds}s`);
  void ensureSyncTables().catch(error => {
    console.error('[onedrive-sync] Ensure tables failed:', error);
  });
  void ensureOneDriveSubscription(false).catch(error => {
    console.error('[onedrive-sync] Initial subscription setup failed:', error);
  });
  void runSyncWithQueue('startup');

  scheduler = setInterval(() => {
    void runSyncWithQueue('poll');
  }, summary.pollIntervalSeconds * 1000);
}

export function stopOneDriveSyncScheduler(): void {
  if (!scheduler) return;
  clearInterval(scheduler);
  scheduler = null;
}

export async function getOneDriveSyncStatus(): Promise<{
  runtime: {
    running: boolean;
    queued: boolean;
    lastRun: SyncRunResult | null;
  };
  config: ReturnType<typeof getSyncConfigSummary>;
  state: Awaited<ReturnType<typeof getSyncState>>;
}> {
  await ensureSyncTables();
  return {
    runtime: {
      running,
      queued: rerunRequested,
      lastRun: lastRunResult,
    },
    config: getSyncConfigSummary(),
    state: await getSyncState(),
  };
}
