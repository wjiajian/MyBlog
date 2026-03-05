import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { OneDriveSyncConfig, SyncConfigSummary } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  const isDistServer = __dirname.split(path.sep).includes('dist-server');
  return isDistServer
    ? path.resolve(__dirname, '..', '..', '..', '..')
    : path.resolve(__dirname, '..', '..', '..');
})();

export const METADATA_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'images-metadata.json');

function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeFolderPath(sourceFolderPath: string): string {
  if (!sourceFolderPath) return '';
  return sourceFolderPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

export function getConfig(): OneDriveSyncConfig {
  return {
    enabled: parseBoolean(process.env.ONEDRIVE_SYNC_ENABLED, false),
    pollIntervalSeconds: parseIntOrDefault(process.env.ONEDRIVE_SYNC_POLL_INTERVAL_SECONDS, 600),
    yieldEveryItems: parseIntOrDefault(process.env.ONEDRIVE_SYNC_YIELD_EVERY_ITEMS, 25),
    interItemDelayMs: parseNonNegativeIntOrDefault(process.env.ONEDRIVE_SYNC_INTER_ITEM_DELAY_MS, 0),
    tenantId: process.env.ONEDRIVE_TENANT_ID || '',
    clientId: process.env.ONEDRIVE_CLIENT_ID || '',
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
    refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN || '',
    refreshScope: process.env.ONEDRIVE_REFRESH_SCOPE || 'Files.Read offline_access',
    driveId: process.env.ONEDRIVE_DRIVE_ID || '',
    sourceFolderPath: normalizeFolderPath(process.env.ONEDRIVE_SOURCE_FOLDER_PATH || 'PhotoWall'),
    webhookUrl: process.env.ONEDRIVE_WEBHOOK_URL || '',
    webhookClientState: process.env.ONEDRIVE_WEBHOOK_CLIENT_STATE || '',
    subscriptionResource: process.env.ONEDRIVE_SUBSCRIPTION_RESOURCE || '',
    renewBeforeMinutes: parseIntOrDefault(process.env.ONEDRIVE_SUBSCRIPTION_RENEW_BEFORE_MINUTES, 720),
    ossRegion: process.env.OSS_REGION || '',
    ossBucket: process.env.OSS_BUCKET || '',
    ossAccessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    ossAccessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    ossEndpoint: process.env.OSS_ENDPOINT || '',
  };
}

export function getMissingConfig(config: OneDriveSyncConfig): string[] {
  const missing: string[] = [];
  if (!config.driveId) missing.push('ONEDRIVE_DRIVE_ID');
  if (!config.clientId) missing.push('ONEDRIVE_CLIENT_ID');
  if (!config.clientSecret) missing.push('ONEDRIVE_CLIENT_SECRET');
  if (!config.tenantId) missing.push('ONEDRIVE_TENANT_ID');
  if (!config.ossRegion) missing.push('OSS_REGION');
  if (!config.ossBucket) missing.push('OSS_BUCKET');
  if (!config.ossAccessKeyId) missing.push('OSS_ACCESS_KEY_ID');
  if (!config.ossAccessKeySecret) missing.push('OSS_ACCESS_KEY_SECRET');
  return missing;
}

export function getSyncConfigSummary(): SyncConfigSummary {
  const config = getConfig();
  const missing = getMissingConfig(config);
  return {
    enabled: config.enabled,
    configured: config.enabled && missing.length === 0,
    missing,
    pollIntervalSeconds: config.pollIntervalSeconds,
    yieldEveryItems: config.yieldEveryItems,
    interItemDelayMs: config.interItemDelayMs,
    webhookConfigured: Boolean(config.webhookUrl),
    usesRefreshToken: Boolean(config.refreshToken),
  };
}

export function getPathForGraph(folderPath: string): string {
  if (!folderPath) return '';
  return folderPath
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export function formatDate(input: string | Date | undefined | null): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
