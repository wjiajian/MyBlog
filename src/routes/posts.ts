import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 编译后在 dist-server/src/routes/ 目录，需要回到项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src', 'content');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images');

// 确保图片目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// 配置 multer 用于封面图片上传
const coverStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // 优先从 query 中获取 slug，其次从 body 中获取 folderName，最后回退
    const slug = req.query.slug as string;
    const folderName = slug || req.body.folderName || `cover-${Date.now()}`;
    const safeFolderName = folderName
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 50) || `cover-${Date.now()}`;
    const destDir = path.join(IMAGES_DIR, safeFolderName);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // 将目录名保存到请求中供后续使用
    (req as any).coverFolder = safeFolderName;
    cb(null, destDir);
  },
  filename: (_req, file, cb) => {
    // 统一命名为 coverImage + 扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `coverImage${ext}`);
  },
});

const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 JPG、PNG、WebP、GIF'));
    }
  },
});

// 支持的文章类型
const POST_TYPES = ['tech', 'life'];

interface PostMeta {
  filename: string;
  title: string;
  date: string;
  year: number;
  type: string;
  categories?: string;
  description?: string;
  tags?: string[];
  coverImage?: string;
  path: string;
}

/**
 * 解析 Markdown 文件的 frontmatter
 */
function parsePostFile(filePath: string, type: string): PostMeta | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    const filename = path.basename(filePath);

    // 提取年份（从日期或文件名）
    let year = new Date().getFullYear();
    if (data.date) {
      const dateStr = String(data.date);
      // 尝试多种日期格式
      const yearMatch = dateStr.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
    }

    // 格式化日期：只保留 YYYY-MM-DD 部分
    let formattedDate = '';
    if (data.date) {
      if (data.date instanceof Date) {
        formattedDate = data.date.toISOString().split('T')[0];
      } else {
        // 字符串格式，可能包含时间，只取日期部分
        const dateStr = String(data.date);
        const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
        formattedDate = match ? match[0] : dateStr;
      }
    }

    return {
      filename,
      title: data.title || filename.replace('.md', ''),
      date: formattedDate,
      year,
      type,
      categories: data.categories,
      description: data.description,
      tags: data.tags,
      coverImage: data.coverImage,
      path: `${type}/${filename}`,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * 扫描所有文章
 */
function scanAllPosts(): PostMeta[] {
  const posts: PostMeta[] = [];

  for (const type of POST_TYPES) {
    const typeDir = path.join(CONTENT_DIR, type);
    if (!fs.existsSync(typeDir)) continue;

    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(typeDir, file);
      const meta = parsePostFile(filePath, type);
      if (meta) posts.push(meta);
    }
  }

  // 按日期降序排序
  return posts.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    // 确保 date 是字符串
    const dateA = String(a.date || '');
    const dateB = String(b.date || '');
    return dateB.localeCompare(dateA);
  });
}

/**
 * GET /api/posts
 * 获取所有文章列表
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    const posts = scanAllPosts();
    res.json({ posts, total: posts.length });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/posts/:type/:filename
 * 获取单篇文章内容
 */
router.get('/:type/:filename', (req: Request, res: Response): void => {
  const { type, filename } = req.params as { type: string; filename: string };

  if (!POST_TYPES.includes(type)) {
    res.status(400).json({ error: '无效的文章类型' });
    return;
  }

  const filePath = path.join(CONTENT_DIR, type, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '文章不存在' });
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);
    
    // 格式化日期为 YYYY-MM-DD 字符串（gray-matter 可能将其解析为 Date 对象）
    const meta = { ...data };
    if (meta.date) {
      if (meta.date instanceof Date) {
        meta.date = meta.date.toISOString().split('T')[0];
      } else {
        meta.date = String(meta.date);
      }
    }
    
    res.json({ meta, content: body, filename, type });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/posts
 * 创建新文章（需要认证）
 */
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const { title, slug, content, type, categories, description, tags, date, coverImage } = req.body;

  if (!title || !content || !type) {
    res.status(400).json({ error: '标题、内容和类型不能为空' });
    return;
  }

  if (!POST_TYPES.includes(type)) {
    res.status(400).json({ error: '无效的文章类型' });
    return;
  }

  // 生成文件名（优先使用 slug，否则使用标题或时间戳）
  const timestamp = Date.now();
  let filename = '';
  if (slug) {
     const safeSlug = slug
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-_]/g, '')
      .replace(/\s+/g, '-') // 空格转连字符
      .replace(/-+/g, '-')  // 多个连字符合并
      .toLowerCase()
      .slice(0, 50);
     if (safeSlug) {
       filename = `${safeSlug}.md`;
     }
  }

  if (!filename) {
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 50);
    filename = `${safeTitle || timestamp}.md`;
  }

  const filePath = path.join(CONTENT_DIR, type, filename);

  if (fs.existsSync(filePath)) {
    res.status(409).json({ error: '同名文章已存在' });
    return;
  }

  try {
    // 构建 frontmatter
    const frontmatter: Record<string, any> = {
      title,
      date: date || new Date().toISOString().split('T')[0],
    };
    if (categories) frontmatter.categories = categories;
    if (description) frontmatter.description = description;
    if (tags) frontmatter.tags = tags;
    if (coverImage) frontmatter.coverImage = coverImage;

    const fileContent = matter.stringify(content, frontmatter);
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent, 'utf8');
    res.status(201).json({ success: true, filename, path: `${type}/${filename}` });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: '保存文章失败' });
  }
});

/**
 * PUT /api/posts/:type/:filename
 * 更新文章（需要认证）
 */
router.put('/:type/:filename', authMiddleware, (req: Request, res: Response): void => {
  const { type, filename } = req.params as { type: string; filename: string };
  const { title, content, categories, description, tags, date, coverImage } = req.body;

  if (!POST_TYPES.includes(type)) {
    res.status(400).json({ error: '无效的文章类型' });
    return;
  }

  const filePath = path.join(CONTENT_DIR, type, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '文章不存在' });
    return;
  }

  try {
    // 读取现有 frontmatter
    const existing = fs.readFileSync(filePath, 'utf8');
    const { data: existingMeta } = matter(existing);

    // 合并更新
    const frontmatter: Record<string, any> = {
      ...existingMeta,
      title: title || existingMeta.title,
      date: date || existingMeta.date,
    };
    if (categories !== undefined) frontmatter.categories = categories;
    if (description !== undefined) frontmatter.description = description;
    if (tags !== undefined) frontmatter.tags = tags;
    if (coverImage !== undefined) frontmatter.coverImage = coverImage;

    const fileContent = matter.stringify(content || '', frontmatter);
    fs.writeFileSync(filePath, fileContent, 'utf8');
    res.json({ success: true, filename, path: `${type}/${filename}` });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: '更新文章失败' });
  }
});

/**
 * DELETE /api/posts/:type/:filename
 * 删除文章（需要认证）
 */
router.delete('/:type/:filename', authMiddleware, (req: Request, res: Response): void => {
  const { type, filename } = req.params as { type: string; filename: string };

  if (!POST_TYPES.includes(type)) {
    res.status(400).json({ error: '无效的文章类型' });
    return;
  }

  const filePath = path.join(CONTENT_DIR, type, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '文章不存在' });
    return;
  }

  try {
    fs.unlinkSync(filePath);

    // 尝试删除对应的图片文件夹
    const slug = filename.replace(/\.md$/i, '');
    const imageDir = path.join(IMAGES_DIR, slug);
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: '文章及相关图片已删除' });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
});

/**
 * POST /api/posts/upload-cover
 * 上传封面图片（需要认证）
 */
router.post('/upload-cover', authMiddleware, uploadCover.single('cover'), (req: Request, res: Response): void => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: '未上传任何文件' });
    return;
  }

  const folderName = (req as any).coverFolder;
  const ext = path.extname(file.originalname).toLowerCase();
  const coverUrl = `/images/${folderName}/coverImage${ext}`;

  res.json({
    success: true,
    url: coverUrl,
    message: '封面图片上传成功',
  });
});

export default router;
