import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import OSS from 'ali-oss';
import { createRequire } from 'module';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { resolvePhotoAssetPaths } from '../utils/photoUrl.js';
import {
  buildPhotoVariants,
  convertToJpegBuffer,
  deleteObjectIgnoreNotFound,
  extractPhotoDate,
  getPhotoObjectKeys,
  putObject,
} from '../services/onedrive-sync/media.js';
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
const parsedMaxFilesPerBatch = Number.parseInt(process.env.PHOTO_UPLOAD_MAX_FILES_PER_BATCH || '10', 10);
const MAX_FILES_PER_UPLOAD_BATCH = Number.isFinite(parsedMaxFilesPerBatch) && parsedMaxFilesPerBatch > 0
  ? parsedMaxFilesPerBatch
  : 10;
const PHOTO_ASSET_BASE_URL = process.env.OSS_PHOTOWALL_BASE_URL || process.env.VITE_OSS_PHOTOWALL_BASE_URL || '';
let photoVisibilityTableEnsured = false;

interface OssConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  endpoint: string;
}

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

function getOssConfig(): OssConfig {
  return {
    region: process.env.OSS_REGION || '',
    bucket: process.env.OSS_BUCKET || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
  };
}

function getMissingOssConfig(config: OssConfig): string[] {
  const missing: string[] = [];
  if (!config.region) missing.push('OSS_REGION');
  if (!config.bucket) missing.push('OSS_BUCKET');
  if (!config.accessKeyId) missing.push('OSS_ACCESS_KEY_ID');
  if (!config.accessKeySecret) missing.push('OSS_ACCESS_KEY_SECRET');
  return missing;
}

function isOssConfigured(config: OssConfig): boolean {
  return getMissingOssConfig(config).length === 0;
}

function createOssClient(config: OssConfig): OSS {
  return new OSS({
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: config.endpoint || undefined,
    secure: true,
  });
}

function readMetadataRecords(): PhotoMetadataRecord[] {
  if (!fs.existsSync(METADATA_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(METADATA_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as PhotoMetadataRecord[]) : [];
  } catch (error) {
    console.error('Failed to parse metadata file:', error);
    return [];
  }
}

function writeMetadataRecords(records: PhotoMetadataRecord[]): void {
  const sorted = [...records].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return a.filename.localeCompare(b.filename, 'zh-CN');
  });
  fs.writeFileSync(METADATA_FILE, JSON.stringify(sorted, null, 2), 'utf8');
}

function upsertMetadataRecordByFilename(records: PhotoMetadataRecord[], entry: PhotoMetadataRecord): void {
  const index = records.findIndex(record => record.filename === entry.filename);
  if (index >= 0) {
    records[index] = entry;
    return;
  }
  records.push(entry);
}

function extractObjectKeyFromUrl(urlValue: string | undefined): string | null {
  if (!urlValue) return null;
  const trimmed = urlValue.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    try {
      const url = trimmed.startsWith('//') ? new URL(`https:${trimmed}`) : new URL(trimmed);
      pathname = url.pathname;
    } catch {
      return null;
    }
  }

  const normalizedPath = pathname.split('?')[0].split('#')[0].replace(/^\/+/, '');
  if (!normalizedPath.startsWith('photowall/')) return null;
  return normalizedPath;
}

function buildOriginalObjectKey(filename: string): string {
  return `photowall/origin/${filename}`;
}

function buildThumbnailObjectKeys(filename: string): { fullKey: string; mediumKey: string; tinyKey: string } {
  return {
    fullKey: `photowall/thumbnails/full/${filename}.jpg`,
    mediumKey: `photowall/thumbnails/medium/${filename}.jpg`,
    tinyKey: `photowall/thumbnails/tiny/${filename}.jpg`,
  };
}

function getContentTypeFromExtension(extension: string): string {
  const normalized = extension.toLowerCase();
  if (normalized === '.jpg' || normalized === '.jpeg') return 'image/jpeg';
  if (normalized === '.png') return 'image/png';
  if (normalized === '.webp') return 'image/webp';
  if (normalized === '.gif') return 'image/gif';
  if (normalized === '.heic') return 'image/heic';
  if (normalized === '.heif') return 'image/heif';
  return 'application/octet-stream';
}

function getFormatLabelFromExtension(extension: string): string {
  const normalized = extension.toLowerCase();
  if (normalized === '.jpg' || normalized === '.jpeg') return 'JPEG';
  if (normalized === '.heic') return 'HEIC';
  if (normalized === '.heif') return 'HEIF';
  return normalized.replace('.', '').toUpperCase();
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

// 配置 multer 文件上传
const upload = multer({
  storage: multer.memoryStorage(),
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
  upload.array('photos', MAX_FILES_PER_UPLOAD_BATCH)(req, res, (err?: unknown) => {
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
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    res.status(400).json({ error: '未上传任何文件' });
    return;
  }

  const ossConfig = getOssConfig();
  const missingOssConfig = getMissingOssConfig(ossConfig);
  if (missingOssConfig.length > 0) {
    res.status(500).json({ error: `OSS 配置缺失: ${missingOssConfig.join(', ')}` });
    return;
  }

  const metadataRecords = readMetadataRecords();
  const client = createOssClient(ossConfig);
  const uploaded: Array<{ filename: string; size: number; src: string }> = [];
  const failed: Array<{ filename: string; error: string }> = [];

  for (const file of files) {
    const safeName = sanitizeUploadFilename(file.originalname);
    if (!safeName) {
      failed.push({
        filename: file.originalname,
        error: '无效的文件名',
      });
      continue;
    }

    try {
      const extension = path.extname(safeName).toLowerCase();
      const existingRecord = metadataRecords.find(record => record.filename === safeName);
      const objectKey = buildOriginalObjectKey(safeName);
      const photoDate = await extractPhotoDate(file.buffer, new Date().toISOString());
      const contentType = file.mimetype?.startsWith('image/')
        ? file.mimetype
        : getContentTypeFromExtension(extension);

      await putObject(client, objectKey, file.buffer, contentType);

      const thumbnailKeys = buildThumbnailObjectKeys(safeName);
      const jpegBuffer = await convertToJpegBuffer(file.buffer, extension);
      const variants = await buildPhotoVariants(jpegBuffer);
      await putObject(client, thumbnailKeys.fullKey, variants.fullBuffer, 'image/jpeg');
      await putObject(client, thumbnailKeys.mediumKey, variants.mediumBuffer, 'image/jpeg');
      await putObject(client, thumbnailKeys.tinyKey, variants.tinyBuffer, 'image/jpeg');
      const srcFull = `/${thumbnailKeys.fullKey}`;
      const srcMedium = `/${thumbnailKeys.mediumKey}`;
      const srcTiny = `/${thumbnailKeys.tinyKey}`;

      const keepKeys = new Set<string>([objectKey]);
      const normalizedFullKey = extractObjectKeyFromUrl(srcFull);
      const normalizedMediumKey = extractObjectKeyFromUrl(srcMedium);
      const normalizedTinyKey = extractObjectKeyFromUrl(srcTiny);
      if (normalizedFullKey) keepKeys.add(normalizedFullKey);
      if (normalizedMediumKey) keepKeys.add(normalizedMediumKey);
      if (normalizedTinyKey) keepKeys.add(normalizedTinyKey);
      const previousKeys = new Set<string>();
      for (const candidate of [
        existingRecord?.src,
        existingRecord?.srcMedium,
        existingRecord?.srcTiny,
        existingRecord?.originalSrc,
      ]) {
        const key = extractObjectKeyFromUrl(candidate);
        if (key && !keepKeys.has(key)) {
          previousKeys.add(key);
        }
      }
      if (previousKeys.size > 0) {
        await Promise.all(Array.from(previousKeys).map(async key => {
          await deleteObjectIgnoreNotFound(client, key);
        }));
      }

      upsertMetadataRecordByFilename(metadataRecords, {
        filename: safeName,
        originalSrc: `/${objectKey}`,
        src: srcFull,
        srcMedium,
        srcTiny,
        width: variants.width || existingRecord?.width,
        height: variants.height || existingRecord?.height,
        size: file.size,
        format: getFormatLabelFromExtension(extension),
        date: photoDate || undefined,
        videoSrc: existingRecord?.videoSrc,
      });

      uploaded.push({
        filename: safeName,
        size: file.size,
        src: srcFull,
      });
    } catch (error) {
      failed.push({
        filename: safeName,
        error: error instanceof Error ? error.message : '上传到 OSS 失败',
      });
    }
  }

  if (uploaded.length > 0) {
    writeMetadataRecords(metadataRecords);
  }

  if (uploaded.length === 0) {
    res.status(500).json({
      success: false,
      error: failed[0]?.error || '照片上传失败',
      failed,
    });
    return;
  }

  const hasFailed = failed.length > 0;
  res.status(hasFailed ? 207 : 200).json({
    success: true,
    partial: hasFailed,
    uploaded,
    failed,
    message: hasFailed
      ? `成功上传 ${uploaded.length} 张，失败 ${failed.length} 张`
      : `成功上传并处理 ${uploaded.length} 张照片`,
  });
});

/**
 * POST /api/photos/process
 * 手动触发照片处理（需要认证）
 */
router.post('/process', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'OSS 模式下上传时已保留原图，并统一生成 JPEG 全尺寸与缩略图，无需手动处理',
  });
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

  const metadataRecords = readMetadataRecords();
  const matchedRecord = metadataRecords.find(photo => photo.filename === normalizedFilename);
  const fallbackBaseName = path.basename(normalizedFilename, path.extname(normalizedFilename));
  const fallbackKeys = getPhotoObjectKeys(fallbackBaseName);
  const ossKeys = new Set<string>();
  for (const candidate of [
    matchedRecord?.src,
    matchedRecord?.srcMedium,
    matchedRecord?.srcTiny,
    matchedRecord?.originalSrc,
  ]) {
    const key = extractObjectKeyFromUrl(candidate);
    if (key) {
      ossKeys.add(key);
    }
  }
  if (ossKeys.size === 0) {
    const thumbnailKeys = buildThumbnailObjectKeys(normalizedFilename);
    ossKeys.add(buildOriginalObjectKey(normalizedFilename));
    ossKeys.add(thumbnailKeys.fullKey);
    ossKeys.add(thumbnailKeys.mediumKey);
    ossKeys.add(thumbnailKeys.tinyKey);
    ossKeys.add(fallbackKeys.fullKey);
    ossKeys.add(fallbackKeys.mediumKey);
    ossKeys.add(fallbackKeys.tinyKey);
  }

  let deletedOssCount = 0;
  const ossConfig = getOssConfig();
  if (isOssConfigured(ossConfig)) {
    const client = createOssClient(ossConfig);
    for (const key of ossKeys) {
      try {
        await deleteObjectIgnoreNotFound(client, key);
        deletedOssCount += 1;
      } catch (error) {
        console.error(`Failed to delete OSS object ${key}:`, error);
      }
    }
  } else {
    console.warn('Skip OSS delete: OSS config is incomplete');
  }

  const filesToDelete = [
    path.join(ORIGIN_DIR, normalizedFilename),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'full', `${fallbackBaseName}.jpg`),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'medium', `${fallbackBaseName}.jpg`),
    path.join(PHOTOWALL_ROOT, 'thumbnails', 'tiny', `${fallbackBaseName}.jpg`),
  ];

  let deletedLocalCount = 0;

  for (const filePath of filesToDelete) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deletedLocalCount++;
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    }
  }

  // 更新元数据文件 + 清理可见性配置
  try {
    await ensurePhotoVisibilityTable();

    const deletedDriveItemId = matchedRecord?.driveItemId;
    const filtered = metadataRecords.filter(photo => photo.filename !== normalizedFilename);
    if (filtered.length !== metadataRecords.length) {
      writeMetadataRecords(filtered);
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
    message: `已删除 ${deletedOssCount} 个 OSS 对象，清理 ${deletedLocalCount} 个本地文件`,
    deletedOssFiles: deletedOssCount,
    deletedLocalFiles: deletedLocalCount,
  });
});

export default router;
