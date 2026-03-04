import fs from 'fs';
import { query } from '../../db/index.js';
import { METADATA_FILE } from './config.js';
import type { PhotoMetadataRecord, SyncItemRow, SyncStateRow } from './types.js';

let tablesEnsured = false;

export async function ensureSyncTables(): Promise<void> {
  if (tablesEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS onedrive_sync_state (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      folder_item_id TEXT,
      delta_link TEXT,
      subscription_id TEXT,
      subscription_expiration TIMESTAMPTZ,
      last_synced_at TIMESTAMPTZ,
      last_error TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    INSERT INTO onedrive_sync_state (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS onedrive_sync_items (
      drive_item_id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      base_name TEXT NOT NULL,
      etag TEXT,
      last_modified_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_onedrive_sync_items_filename
    ON onedrive_sync_items(filename);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_onedrive_sync_items_base_name
    ON onedrive_sync_items(base_name);
  `);

  tablesEnsured = true;
}

export async function getSyncState(): Promise<SyncStateRow> {
  await ensureSyncTables();
  const result = await query(`
    SELECT folder_item_id, delta_link, subscription_id, subscription_expiration, last_synced_at, last_error, updated_at
    FROM onedrive_sync_state
    WHERE id = 1
    LIMIT 1;
  `);

  if (result.rows.length === 0) {
    return {
      folder_item_id: null,
      delta_link: null,
      subscription_id: null,
      subscription_expiration: null,
      last_synced_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    };
  }

  return result.rows[0] as SyncStateRow;
}

export async function saveSyncState(patch: Partial<SyncStateRow>): Promise<void> {
  const current = await getSyncState();
  const merged: SyncStateRow = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  await query(`
    UPDATE onedrive_sync_state
    SET
      folder_item_id = $1,
      delta_link = $2,
      subscription_id = $3,
      subscription_expiration = $4,
      last_synced_at = $5,
      last_error = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
  `, [
    merged.folder_item_id,
    merged.delta_link,
    merged.subscription_id,
    merged.subscription_expiration,
    merged.last_synced_at,
    merged.last_error,
  ]);
}

export async function getSyncItem(driveItemId: string): Promise<SyncItemRow | null> {
  const result = await query(`
    SELECT drive_item_id, filename, base_name, etag
    FROM onedrive_sync_items
    WHERE drive_item_id = $1
    LIMIT 1;
  `, [driveItemId]);

  return result.rows.length > 0 ? (result.rows[0] as SyncItemRow) : null;
}

export async function findBaseNameConflict(baseName: string, driveItemId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1
    FROM onedrive_sync_items
    WHERE base_name = $1
      AND drive_item_id <> $2
    LIMIT 1;
  `, [baseName, driveItemId]);

  return result.rows.length > 0;
}

export async function upsertSyncItem(
  driveItemId: string,
  filename: string,
  baseName: string,
  etag: string | null,
  lastModifiedDateTime?: string,
): Promise<void> {
  await query(`
    INSERT INTO onedrive_sync_items (drive_item_id, filename, base_name, etag, last_modified_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (drive_item_id)
    DO UPDATE SET
      filename = EXCLUDED.filename,
      base_name = EXCLUDED.base_name,
      etag = EXCLUDED.etag,
      last_modified_at = EXCLUDED.last_modified_at,
      updated_at = CURRENT_TIMESTAMP;
  `, [
    driveItemId,
    filename,
    baseName,
    etag,
    lastModifiedDateTime ? new Date(lastModifiedDateTime).toISOString() : null,
  ]);
}

export async function deleteSyncItem(driveItemId: string): Promise<void> {
  await query(`
    DELETE FROM onedrive_sync_items
    WHERE drive_item_id = $1;
  `, [driveItemId]);
}

export function readMetadataRecords(): PhotoMetadataRecord[] {
  if (!fs.existsSync(METADATA_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(METADATA_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as PhotoMetadataRecord[]) : [];
  } catch (error) {
    console.error('[onedrive-sync] Failed to parse metadata file:', error);
    return [];
  }
}

export function writeMetadataRecords(records: PhotoMetadataRecord[]): void {
  const sorted = [...records].sort((a, b) => {
    if (a.date && b.date) {
      return b.date.localeCompare(a.date);
    }
    return a.filename.localeCompare(b.filename, 'zh-CN');
  });

  fs.writeFileSync(METADATA_FILE, JSON.stringify(sorted, null, 2), 'utf8');
}

export function deleteMetadataEntry(records: PhotoMetadataRecord[], driveItemId: string, fallbackFilename?: string): PhotoMetadataRecord[] {
  return records.filter(record => {
    if (record.driveItemId && record.driveItemId === driveItemId) return false;
    if (!record.driveItemId && fallbackFilename && record.filename === fallbackFilename) return false;
    return true;
  });
}

export function upsertMetadataEntry(records: PhotoMetadataRecord[], entry: PhotoMetadataRecord): PhotoMetadataRecord[] {
  const index = records.findIndex(record => {
    if (record.driveItemId) return record.driveItemId === entry.driveItemId;
    return record.filename === entry.filename;
  });

  if (index >= 0) {
    const next = [...records];
    next[index] = {
      ...next[index],
      ...entry,
    };
    return next;
  }

  return [...records, entry];
}
