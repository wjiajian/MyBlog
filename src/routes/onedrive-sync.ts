import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  ensureOneDriveSubscription,
  getOneDriveSyncStatus,
  handleOneDriveWebhook,
  queueOneDriveSync,
} from '../services/onedrive-sync/service.js';

const router = Router();

/**
 * GET /api/onedrive-sync/webhook
 * Graph webhook 验证
 */
router.get('/webhook', (req: Request, res: Response): void => {
  const validationToken = req.query.validationToken;
  if (typeof validationToken === 'string' && validationToken.length > 0) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(validationToken);
    return;
  }
  res.status(400).json({ error: 'Missing validationToken' });
});

/**
 * POST /api/onedrive-sync/webhook
 * Graph 变更通知回调
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const validationToken = req.query.validationToken;
  if (typeof validationToken === 'string' && validationToken.length > 0) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(validationToken);
    return;
  }

  try {
    const result = await handleOneDriveWebhook(req.body);
    res.status(202).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[onedrive-sync] Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

/**
 * GET /api/onedrive-sync/status
 * 查询同步状态（管理员）
 */
router.get('/status', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await getOneDriveSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('[onedrive-sync] Status API error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /api/onedrive-sync/run
 * 手动触发一次同步（管理员）
 */
router.post('/run', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await queueOneDriveSync('manual');
    res.json(result);
  } catch (error) {
    console.error('[onedrive-sync] Manual run API error:', error);
    res.status(500).json({ error: 'Failed to run sync' });
  }
});

/**
 * POST /api/onedrive-sync/subscription/renew
 * 手动续订 webhook（管理员）
 */
router.post('/subscription/renew', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await ensureOneDriveSubscription(true);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('[onedrive-sync] Subscription renew API error:', error);
    res.status(500).json({ error: 'Failed to renew subscription' });
  }
});

export default router;
