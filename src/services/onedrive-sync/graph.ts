import { getPathForGraph } from './config.js';
import { getSyncState, saveSyncState } from './state.js';
import type { GraphDriveItem, OneDriveSyncConfig } from './types.js';

interface GraphSubscriptionPayload {
  id: string;
  expirationDateTime: string;
}

export async function getGraphAccessToken(config: OneDriveSyncConfig): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const form = new URLSearchParams();
  form.set('client_id', config.clientId);
  form.set('client_secret', config.clientSecret);

  if (config.refreshToken) {
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', config.refreshToken);
    form.set('scope', config.refreshScope);
  } else {
    form.set('grant_type', 'client_credentials');
    form.set('scope', 'https://graph.microsoft.com/.default');
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Graph token request failed: HTTP ${response.status} ${message}`);
  }

  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('Graph token response missing access_token');
  }

  return payload.access_token;
}

export async function graphRequestJson<T>(
  accessToken: string,
  endpointOrUrl: string,
  init: RequestInit = {},
): Promise<T> {
  const endpoint = endpointOrUrl.startsWith('http')
    ? endpointOrUrl
    : `https://graph.microsoft.com/v1.0${endpointOrUrl}`;

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Graph request failed: HTTP ${response.status} ${endpoint} ${message}`);
  }

  return await response.json() as T;
}

export async function downloadOneDriveFile(accessToken: string, driveId: string, itemId: string): Promise<Buffer> {
  const endpoint = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Download OneDrive file failed: HTTP ${response.status} ${message}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function resolveFolderItemId(accessToken: string, config: OneDriveSyncConfig): Promise<string> {
  const state = await getSyncState();
  if (state.folder_item_id) return state.folder_item_id;

  if (!config.sourceFolderPath) {
    const root = await graphRequestJson<GraphDriveItem>(
      accessToken,
      `/drives/${encodeURIComponent(config.driveId)}/root`,
    );
    if (!root.id) {
      throw new Error('Failed to resolve OneDrive root folder id');
    }
    await saveSyncState({ folder_item_id: root.id });
    return root.id;
  }

  const graphPath = getPathForGraph(config.sourceFolderPath);
  const folder = await graphRequestJson<GraphDriveItem>(
    accessToken,
    `/drives/${encodeURIComponent(config.driveId)}/root:/${graphPath}`,
  );
  if (!folder.id) {
    throw new Error(`Failed to resolve OneDrive folder path: ${config.sourceFolderPath}`);
  }
  await saveSyncState({ folder_item_id: folder.id });
  return folder.id;
}

function getNextSubscriptionExpiration(): string {
  // Graph 对 drive 资源订阅有效期较短，这里设置 2 天并在到期前续订
  return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
}

async function createSubscription(accessToken: string, config: OneDriveSyncConfig, resource: string): Promise<GraphSubscriptionPayload> {
  return await graphRequestJson<GraphSubscriptionPayload>(
    accessToken,
    '/subscriptions',
    {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'updated',
        notificationUrl: config.webhookUrl,
        resource,
        expirationDateTime: getNextSubscriptionExpiration(),
        clientState: config.webhookClientState || undefined,
      }),
    },
  );
}

async function renewSubscription(accessToken: string, subscriptionId: string): Promise<GraphSubscriptionPayload> {
  return await graphRequestJson<GraphSubscriptionPayload>(
    accessToken,
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        expirationDateTime: getNextSubscriptionExpiration(),
      }),
    },
  );
}

export async function determineSubscriptionResource(accessToken: string, config: OneDriveSyncConfig): Promise<string> {
  if (config.subscriptionResource) return config.subscriptionResource;
  // 默认订阅 drive root，兼容 OneDrive for Business 仅支持 root 订阅的限制。
  // 目录级同步范围由 delta 轮询时的 sourceFolderPath 控制。
  await resolveFolderItemId(accessToken, config);
  return `/drives/${config.driveId}/root`;
}

export async function ensureSubscription(accessToken: string, config: OneDriveSyncConfig, forceRenew = false): Promise<{
  success: boolean;
  message: string;
  subscriptionId?: string;
  expirationDateTime?: string;
}> {
  const state = await getSyncState();
  const resource = await determineSubscriptionResource(accessToken, config);

  const now = Date.now();
  const renewBeforeMs = config.renewBeforeMinutes * 60 * 1000;
  const expirationMs = state.subscription_expiration ? new Date(state.subscription_expiration).getTime() : 0;
  const shouldRenew = forceRenew || !state.subscription_id || !expirationMs || expirationMs - now <= renewBeforeMs;

  if (!shouldRenew) {
    return {
      success: true,
      message: 'Subscription is still valid, no renew needed',
      subscriptionId: state.subscription_id || undefined,
      expirationDateTime: state.subscription_expiration || undefined,
    };
  }

  try {
    if (state.subscription_id) {
      const renewed = await renewSubscription(accessToken, state.subscription_id);
      await saveSyncState({
        subscription_id: renewed.id,
        subscription_expiration: renewed.expirationDateTime,
      });
      return {
        success: true,
        message: 'Subscription renewed',
        subscriptionId: renewed.id,
        expirationDateTime: renewed.expirationDateTime,
      };
    }
  } catch (error) {
    console.error('[onedrive-sync] Renew subscription failed, will create a new one:', error);
  }

  const created = await createSubscription(accessToken, config, resource);
  await saveSyncState({
    subscription_id: created.id,
    subscription_expiration: created.expirationDateTime,
  });
  return {
    success: true,
    message: 'Subscription created',
    subscriptionId: created.id,
    expirationDateTime: created.expirationDateTime,
  };
}
