import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { authMiddleware } from '../middleware/auth.js';

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
const PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const PHOTO_EXTENSION_REGEX = /\.(jpg|jpeg|png|webp|heic|heif)$/i;
const parsedUploadLimitMb = Number.parseInt(process.env.PHOTO_UPLOAD_MAX_MB || '50', 10);
const MAX_UPLOAD_MB = Number.isFinite(parsedUploadLimitMb) && parsedUploadLimitMb > 0 ? parsedUploadLimitMb : 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

function normalizePhotoFilename(filename: string): string | null {
  if (!filename || filename.includes('\0')) return null;
  if (filename.includes('/') || filename.includes('\\')) return null;
  if (path.basename(filename) !== filename) return null;
  const ext = path.extname(filename).toLowerCase();
  if (!PHOTO_EXTENSIONS.has(ext)) return null;
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
      cb(new Error('不支持的文件格式，仅支持 JPG、PNG、WebP、HEIC、HEIF'));
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
router.get('/metadata', (_req: Request, res: Response): void => {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      res.json({ photos: [], total: 0 });
      return;
    }

    const content = fs.readFileSync(METADATA_FILE, 'utf8');
    const photos = JSON.parse(content);
    res.json({ photos, total: photos.length });
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
 * DELETE /api/photos/:filename
 * 删除照片（需要认证）
 */
router.delete('/:filename', authMiddleware, (req: Request, res: Response): void => {
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

  // 更新元数据文件
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, 'utf8');
      const photos = JSON.parse(content);
      const filtered = photos.filter((p: any) => p.filename !== normalizedFilename);
      fs.writeFileSync(METADATA_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to update metadata:', err);
  }

  res.json({
    success: true,
    message: `已删除 ${deletedCount} 个文件`,
    deletedFiles: deletedCount,
  });
});

export default router;
