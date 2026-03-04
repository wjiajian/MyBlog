import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { resolvePhotoAssetPaths } from '../utils/photoUrl.js';

const execAsync = promisify(exec);
const router = Router();

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 优先使用 cwd（通常是项目根目录），否则根据运行位置回退
const PROJECT_ROOT = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  const isDistServer = __dirname.split(path.sep).includes('dist-server');
  return isDistServer
    ? path.resolve(__dirname, '..', '..', '..')
    : path.resolve(__dirname, '..', '..');
})();
const PHOTOWALL_ROOT = path.join(PROJECT_ROOT, 'public', 'photowall');
const ORIGIN_DIR = path.join(PHOTOWALL_ROOT, 'origin');
const METADATA_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'images-metadata.json');
const requireFromEsm = createRequire(import.meta.url);
const {
  SUPPORTED_FORMAT_TEXT,
  PHOTO_EXTENSION_REGEX,
  isSupportedPhotoExtension,
} = requireFromEsm(path.join(PROJECT_ROOT, 'shared', 'photo-extensions.cjs')) as {
  SUPPORTED_FORMAT_TEXT: string;
  PHOTO_EXTENSION_REGEX: RegExp;
  isSupportedPhotoExtension: (ext: string) => boolean;
};
const parsedUploadLimitMb = Number.parseInt(process.env.PHOTO_UPLOAD_MAX_MB || '50', 10);
const MAX_UPLOAD_MB = Number.isFinite(parsedUploadLimitMb) && parsedUploadLimitMb > 0 ? parsedUploadLimitMb : 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const PHOTO_ASSET_BASE_URL = process.env.OSS_PHOTOWALL_BASE_URL || process.env.VITE_OSS_PHOTOWALL_BASE_URL || '';
let photoVisibilityTableEnsured = false;

interface PhotoMetadataRecord {
  driveItemId?: string;
  filename: string;
  originalSrc?: string;
  src: string;
  srcMedium?: string;
  srcTiny?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  date?: string;
  videoSrc?: string;
  isVisible?: boolean;
  visibilityUpdatedAt?: string | null;
}

interface PhotoVisibilityRow {
  photo_key: string;
  is_visible: boolean;
  updated_at: string;
}

function normalizePhotoFilename(filename: string): string | null {
  if (!filename || filename.includes('\0')) return null;
  if (filename.includes('/') || filename.includes('\\')) return null;
  if (path.basename(filename) !== filename) return null;
  const ext = path.extname(filename).toLowerCase();
  if (!isSupportedPhotoExtension(ext)) return null;
  return filename;
}

function getUploadFilenameCandidates(originalName: string): string[] {
  const candidates = [originalName];
  try {
    const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
    if (decoded && decoded !== originalName) {
      candidates.push(decoded);
    }
  } catch {
    // ignore decode errors and fallback to original filename
  }
  return candidates;
}

function sanitizeUploadFilename(originalName: string): string | null {
  for (const candidate of getUploadFilenameCandidates(originalName)) {
    const baseName = path.basename(candidate);
    const normalized = normalizePhotoFilename(baseName);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function parseIncludeHiddenQuery(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function getPhotoVisibilityKey(driveItemId: string | undefined, filename: string): string {
  if (driveItemId && driveItemId.trim().length > 0) {
    return `drive:${driveItemId.trim()}`;
  }
  return `file:${filename}`;
}

function buildVisibilityKeyFromInput(driveItemId: unknown, filename: unknown): string | null {
  if (typeof driveItemId === 'string' && driveItemId.trim().length > 0) {
    return `drive:${driveItemId.trim()}`;
  }
  if (typeof filename === 'string') {
    const normalizedFilename = normalizePhotoFilename(filename);
    if (normalizedFilename) {
      return `file:${normalizedFilename}`;
    }
  }
  return null;
}

async function ensurePhotoVisibilityTable(): Promise<void> {
  if (photoVisibilityTableEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS photo_visibility (
      photo_key TEXT PRIMARY KEY,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  photoVisibilityTableEnsured = true;
}

async function getVisibilityMapForPhotos(photos: PhotoMetadataRecord[]): Promise<Map<string, PhotoVisibilityRow>> {
  const keys = Array.from(
    new Set(
      photos
        .filter(photo => typeof photo.filename === 'string' && photo.filename.length > 0)
        .map(photo => getPhotoVisibilityKey(photo.driveItemId, photo.filename)),
    ),
  );

  if (keys.length === 0) {
    return new Map<string, PhotoVisibilityRow>();
  }

  const result = await query(`
    SELECT photo_key, is_visible, updated_at
    FROM photo_visibility
    WHERE photo_key = ANY($1::text[]);
  `, [keys]);

  const visibilityMap = new Map<string, PhotoVisibilityRow>();
  for (const row of result.rows as PhotoVisibilityRow[]) {
    visibilityMap.set(row.photo_key, row);
  }
  return visibilityMap;
}

// 确保上传目录存在
if (!fs.existsSync(ORIGIN_DIR)) {
  fs.mkdirSync(ORIGIN_DIR, { recursive: true });
}

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ORIGIN_DIR);
  },
  filename: (_req, file, cb) => {
    // 保留文件名并阻止路径穿越
    const safeName = sanitizeUploadFilename(file.originalname);
    if (!safeName) {
      cb(new Error('无效的文件名'), '');
      return;
    }
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES, // 单文件大小限制
  },
  fileFilter: (_req, file, cb) => {
    const isAllowed = getUploadFilenameCandidates(file.originalname).some(name => PHOTO_EXTENSION_REGEX.test(name));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件格式，仅支持 ${SUPPORTED_FORMAT_TEXT}`));
    }
  },
});

function uploadPhotosMiddleware(req: Request, res: Response, next: (error?: unknown) => void): void {
  upload.array('photos', 20)(req, res, (err?: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: `单个文件不能超过 ${MAX_UPLOAD_MB}MB` });
        return;
      }
      res.status(400).json({ error: err.message || '文件上传失败' });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({ error: err.message || '文件上传失败' });
      return;
    }

    res.status(500).json({ error: '文件上传失败' });
  });
}

/**
 * GET /api/photos/metadata
 * 获取照片元数据（动态读取）
 */
router.get('/metadata', async (req: Request, res: Response): Promise<void> => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const includeHidden = parseIncludeHiddenQuery(req.query.includeHidden);
    await ensurePhotoVisibilityTable();

    if (!fs.existsSync(METADATA_FILE)) {
      res.json({ photos: [], total: 0 });
      return;
    }

    const content = fs.readFileSync(METADATA_FILE, 'utf8');
    const parsedPhotos = JSON.parse(content);
    const metadataPhotos = Array.isArray(parsedPhotos) ? (parsedPhotos as PhotoMetadataRecord[]) : [];
    const visibilityMap = await getVisibilityMapForPhotos(metadataPhotos);

    const resolvedPhotos = metadataPhotos.map(photo => {
      const resolved = resolvePhotoAssetPaths(photo, PHOTO_ASSET_BASE_URL);
      const visibilityKey = getPhotoVisibilityKey(photo.driveItemId, photo.filename);
      const visibility = visibilityMap.get(visibilityKey);
      const isVisible = visibility ? visibility.is_visible : true;

      return {
        ...resolved,
        isVisible,
        visibilityUpdatedAt: visibility?.updated_at ?? null,
      };
    });

    const photos = includeHidden
      ? resolvedPhotos
      : resolvedPhotos.filter(photo => photo.isVisible !== false);

    res.json({
      photos,
      total: photos.length,
      allTotal: resolvedPhotos.length,
    });
  } catch (error) {
    console.error('Photos API error:', error);
    res.status(500).json({ error: '读取照片元数据失败' });
  }
});

/**
 * POST /api/photos/upload
 * 上传照片（需要认证）
 */
router.post('/upload', authMiddleware, uploadPhotosMiddleware, async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ error: '未上传任何文件' });
    return;
  }

  const uploaded = files.map(file => ({
    filename: file.filename,
    size: file.size,
    path: file.path,
  }));

  res.json({
    success: true,
    uploaded,
    message: `成功上传 ${files.length} 张照片，请手动触发处理生成缩略图`,
  });
});

/**
 * POST /api/photos/process
 * 手动触发照片处理（需要认证）
 */
router.post('/process', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'process-photos.cjs');
    
    if (!fs.existsSync(scriptPath)) {
      res.status(500).json({ error: '照片处理脚本不存在' });
      return;
    }

    // 异步执行处理脚本
    res.json({ success: true, message: '照片处理已启动，请稍后刷新查看结果' });
    
    // 后台执行
    execAsync(`node "${scriptPath}"`, { cwd: PROJECT_ROOT })
      .then(() => console.log('Photos processed successfully'))
      .catch(err => console.error('Photo processing error:', err));
  } catch (error) {
    console.error('Photos API error:', error);
    res.status(500).json({ error: '启动照片处理失败' });
  }
});

/**
 * PATCH /api/photos/visibility
 * 设置照片是否展示在照片墙（需要认证）
 */
router.patch('/visibility', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { filename, driveItemId, isVisible } = req.body as {
    filename?: unknown;
    driveItemId?: unknown;
    isVisible?: unknown;
  };

  if (typeof isVisible !== 'boolean') {
    res.status(400).json({ error: 'isVisible 必须为布尔值' });
    return;
  }

  const visibilityKey = buildVisibilityKeyFromInput(driveItemId, filename);
  if (!visibilityKey) {
    res.status(400).json({ error: '无效的照片标识' });
    return;
  }

  try {
    await ensurePhotoVisibilityTable();
    await query(`
      INSERT INTO photo_visibility (photo_key, is_visible, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (photo_key)
      DO UPDATE SET
        is_visible = EXCLUDED.is_visible,
        updated_at = CURRENT_TIMESTAMP;
    `, [visibilityKey, isVisible]);

    res.json({
      success: true,
      photoKey: visibilityKey,
      isVisible,
    });
  } catch (error) {
    console.error('Photos API error:', error);
    res.status(500).json({ error: '更新照片展示状态失败' });
  }
});

/**
 * DELETE /api/photos/:filename
 * 删除照片（需要认证）
 */
router.delete('/:filename', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params as { filename: string };
  let decodedFilename = '';
  try {
    decodedFilename = decodeURIComponent(filename);
  } catch {
    res.status(400).json({ error: '无效的文件名' });
    return;
  }

  const normalizedFilename = normalizePhotoFilename(decodedFilename);
  if (!normalizedFilename) {
    res.status(400).json({ error: '无效的文件名' });
    return;
  }

  // 获取文件基名（不含扩展名）
  const baseName = path.basename(normalizedFilename, path.extname(normalizedFilename));

  const filesToDelete = [
    path.join(ORIGIN_DIR, normalizedFilename),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'full', `${baseName}.jpg`),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'medium', `${baseName}.jpg`),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'tiny', `${baseName}.jpg`),
  ];

  let deletedCount = 0;

  for (const filePath of filesToDelete) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    }
  }

  // 更新元数据文件 + 清理可见性配置
  try {
    await ensurePhotoVisibilityTable();

    let deletedDriveItemId: string | undefined;
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      const photos = Array.isArray(parsed) ? (parsed as PhotoMetadataRecord[]) : [];
      const found = photos.find(photo => photo.filename === normalizedFilename);
      deletedDriveItemId = found?.driveItemId;
      const filtered = photos.filter(photo => photo.filename !== normalizedFilename);
      fs.writeFileSync(METADATA_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    }

    const visibilityKeys = [`file:${normalizedFilename}`];
    if (deletedDriveItemId) {
      visibilityKeys.push(`drive:${deletedDriveItemId}`);
    }

    await query(`
      DELETE FROM photo_visibility
      WHERE photo_key = ANY($1::text[]);
    `, [visibilityKeys]);
  } catch (err) {
    console.error('Failed to update metadata or visibility:', err);
  }

  res.json({
    success: true,
    message: `已删除 ${deletedCount} 个文件`,
    deletedFiles: deletedCount,
  });
});

export default router;
