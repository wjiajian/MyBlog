import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 优先使用 cwd（通常是项目根目录），否则根据运行位置回退
const PROJECT_ROOT = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "package.json"))) {
    return cwd;
  }
  const isDistServer = __dirname.split(path.sep).includes("dist-server");
  return isDistServer
    ? path.resolve(__dirname, "..", "..", "..")
    : path.resolve(__dirname, "..", "..");
})();
const CONTENT_DIR = path.join(PROJECT_ROOT, "src", "content");
const IMAGES_DIR = path.join(PROJECT_ROOT, "public", "images");

// 确保图片目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

interface ParsedMarkdownImport {
  title: string;
  slug: string;
  content: string;
  type: "tech" | "life";
  categories: string;
  description: string;
  date: string;
  coverImage: string;
  tags?: string[];
}

interface PostCreatePayload {
  title?: string;
  slug?: string;
  content?: string;
  type?: string;
  categories?: string;
  description?: string;
  tags?: string[];
  date?: string;
  coverImage?: string;
}

function sanitizeSlug(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 50);
}

function normalizeDateValue(input: unknown): string {
  if (!input) return new Date().toISOString().split("T")[0];
  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }

  const dateStr = String(input).trim();
  const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : new Date().toISOString().split("T")[0];
}

function inferPostType(value: unknown): "tech" | "life" {
  const raw = String(value || "").trim().toLowerCase();
  if (["life", "生活", "日常"].includes(raw)) return "life";
  return "tech";
}

function normalizeCategories(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  }
  return String(value || "").trim();
}

function buildCreatePostPayload(body: PostCreatePayload): { error?: string; payload?: Required<PostCreatePayload> } {
  const { title, slug, content, type, categories, description, tags, date, coverImage } = body;

  if (!title || !String(title).trim()) {
    return { error: "标题不能为空" };
  }
  if (!content || !String(content).trim()) {
    return { error: "内容不能为空" };
  }
  if (!type || !POST_TYPES.includes(type)) {
    return { error: "无效的文章类型" };
  }

  return {
    payload: {
      title: String(title).trim(),
      slug: String(slug || "").trim(),
      content: String(content),
      type,
      categories: String(categories || "").trim(),
      description: String(description || "").trim(),
      tags: Array.isArray(tags) ? tags : [],
      date: normalizeDateValue(date),
      coverImage: String(coverImage || "").trim(),
    },
  };
}

function createPostFromPayload(body: PostCreatePayload):
  | { success: true; filename: string; path: string }
  | { success: false; status: number; error: string } {
  const prepared = buildCreatePostPayload(body);
  if (!prepared.payload) {
    return {
      success: false,
      status: 400,
      error: prepared.error || "参数错误",
    };
  }

  const { title, slug, content, type, categories, description, tags, date, coverImage } = prepared.payload;

  const timestamp = Date.now();
  let filename = "";
  if (slug) {
    const safeSlug = sanitizeSlug(slug);
    if (safeSlug) {
      filename = `${safeSlug}.md`;
    }
  }

  if (!filename) {
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 50);
    filename = `${safeTitle || timestamp}.md`;
  }

  const filePath = resolvePostFilePath(type, filename);
  if (!filePath) {
    return { success: false, status: 400, error: "无效的文件名" };
  }

  if (fs.existsSync(filePath)) {
    return { success: false, status: 409, error: "同名文章已存在" };
  }

  try {
    const frontmatter: Record<string, unknown> = {
      title,
      date,
    };
    if (categories) frontmatter.categories = categories;
    if (description) frontmatter.description = description;
    if (tags && tags.length > 0) frontmatter.tags = tags;
    if (coverImage) frontmatter.coverImage = coverImage;

    const fileContent = matter.stringify(content, frontmatter);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent, "utf8");
    return { success: true, filename, path: `${type}/${filename}` };
  } catch (error) {
    console.error("Posts API error:", error);
    return { success: false, status: 500, error: "保存文章失败" };
  }
}

function parseMarkdownImportFile(markdownText: string): ParsedMarkdownImport {
  const { data, content } = matter(markdownText);
  const title = String(data.title || "").trim() || "未命名文章";
  const slugSource = String(data.slug || data.permalink || title).trim();
  const tags = Array.isArray(data.tags)
    ? data.tags.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    title,
    slug: sanitizeSlug(slugSource),
    content: content.trim(),
    type: inferPostType(data.type ?? data.categoryType ?? data.section),
    categories: normalizeCategories(data.categories ?? data.category),
    description: String(data.description || data.summary || data.excerpt || "").trim(),
    date: normalizeDateValue(data.date),
    coverImage: String(data.coverImage || data.cover || data.banner || "").trim(),
    tags,
  };
}

// 配置 multer 用于封面图片上传
const coverStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // 优先从 query 中获取 slug，其次从 body 中获取 folderName，最后回退
    const slug = req.query.slug as string;
    const folderName = slug || req.body.folderName || `cover-${Date.now()}`;
    const safeFolderName =
      folderName
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-_]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
        .slice(0, 50) || `cover-${Date.now()}`;

    // 验证路径安全性，确保在 IMAGES_DIR 内
    const destDir = path.resolve(IMAGES_DIR, safeFolderName);
    if (!destDir.startsWith(IMAGES_DIR + path.sep) && destDir !== IMAGES_DIR) {
      return cb(new Error("无效的目录路径"), "");
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // 将目录名保存到请求中供后续使用
    (req as CoverFolderRequest).coverFolder = safeFolderName;
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
      cb(new Error("不支持的文件格式，仅支持 JPG、PNG、WebP、GIF"));
    }
  },
});

const uploadMarkdown = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (/\.md$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持上传 .md 文件"));
    }
  },
});

// 支持的文章类型
const POST_TYPES = ["tech", "life"];

function resolvePostFilePath(type: string, filename: string): string | null {
  // 验证 type 参数是否在允许列表中
  if (!POST_TYPES.includes(type)) return null;

  if (!filename || filename.includes("\0")) return null;
  if (filename.includes("/") || filename.includes("\\")) return null;
  if (!filename.toLowerCase().endsWith(".md")) return null;
  if (path.basename(filename) !== filename) return null;

  const typeDir = path.resolve(CONTENT_DIR, type);
  // 验证 typeDir 是否在 CONTENT_DIR 内
  if (!typeDir.startsWith(CONTENT_DIR + path.sep)) return null;

  const resolved = path.resolve(typeDir, filename);
  // 验证最终路径是否在 typeDir 内
  if (!resolved.startsWith(typeDir + path.sep)) return null;

  return resolved;
}

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

interface CoverFolderRequest extends Request {
  coverFolder?: string;
}

/**
 * 解析 Markdown 文件的 frontmatter
 */
function parsePostFile(filePath: string, type: string): PostMeta | null {
  try {
    const content = fs.readFileSync(filePath, "utf8");
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
    let formattedDate = "";
    if (data.date) {
      if (data.date instanceof Date) {
        formattedDate = data.date.toISOString().split("T")[0];
      } else {
        // 字符串格式，可能包含时间，只取日期部分
        const dateStr = String(data.date);
        const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
        formattedDate = match ? match[0] : dateStr;
      }
    }

    return {
      filename,
      title: data.title || filename.replace(".md", ""),
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

    const files = fs.readdirSync(typeDir).filter((f) => f.endsWith(".md"));
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
    const dateA = String(a.date || "");
    const dateB = String(b.date || "");
    return dateB.localeCompare(dateA);
  });
}

/**
 * GET /api/posts
 * 获取所有文章列表
 */
router.get("/", (_req: Request, res: Response): void => {
  try {
    const posts = scanAllPosts();
    res.json({ posts, total: posts.length });
  } catch (error) {
    console.error("Posts API error:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

/**
 * GET /api/posts/:type/:filename
 * 获取单篇文章内容
 */
router.get("/:type/:filename", (req: Request, res: Response): void => {
  const { type, filename } = req.params as { type: string; filename: string };

  if (!POST_TYPES.includes(type)) {
    res.status(400).json({ error: "无效的文章类型" });
    return;
  }

  const filePath = resolvePostFilePath(type, filename);
  if (!filePath) {
    res.status(400).json({ error: "无效的文件名" });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "文章不存在" });
    return;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { data, content: body } = matter(content);

    // 格式化日期为 YYYY-MM-DD 字符串（gray-matter 可能将其解析为 Date 对象）
    const meta = { ...data };
    if (meta.date) {
      if (meta.date instanceof Date) {
        meta.date = meta.date.toISOString().split("T")[0];
      } else {
        meta.date = String(meta.date);
      }
    }

    res.json({ meta, content: body, filename, type });
  } catch (error) {
    console.error("Posts API error:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

/**
 * POST /api/posts
 * 创建新文章（需要认证）
 */
router.post("/", authMiddleware, (req: Request, res: Response): void => {
  const result = createPostFromPayload(req.body);

  if (!result.success) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(201).json({ success: true, filename: result.filename, path: result.path });
});

/**
 * PUT /api/posts/:type/:filename
 * 更新文章（需要认证）
 */
router.put(
  "/:type/:filename",
  authMiddleware,
  (req: Request, res: Response): void => {
    const { type, filename } = req.params as { type: string; filename: string };
    const { title, content, categories, description, tags, date, coverImage } =
      req.body;

    if (!POST_TYPES.includes(type)) {
      res.status(400).json({ error: "无效的文章类型" });
      return;
    }

    const filePath = resolvePostFilePath(type, filename);
    if (!filePath) {
      res.status(400).json({ error: "无效的文件名" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "文章不存在" });
      return;
    }

    try {
      // 读取现有 frontmatter 和正文
      const existing = fs.readFileSync(filePath, "utf8");
      const { data: existingMeta, content: existingContent } = matter(existing);

      // 合并更新（使用 undefined 判断，允许显式清空字段）
      const frontmatter: Record<string, unknown> = {
        ...existingMeta,
        title: title !== undefined ? title : existingMeta.title,
        date: date !== undefined ? date : existingMeta.date,
      };
      if (categories !== undefined) frontmatter.categories = categories;
      if (description !== undefined) frontmatter.description = description;
      if (tags !== undefined) frontmatter.tags = tags;
      if (coverImage !== undefined) frontmatter.coverImage = coverImage;

      // 如果未传递 content，保留原有正文
      const finalContent = content !== undefined ? content : existingContent;
      const fileContent = matter.stringify(finalContent, frontmatter);
      fs.writeFileSync(filePath, fileContent, "utf8");
      res.json({ success: true, filename, path: `${type}/${filename}` });
    } catch (error) {
      console.error("Posts API error:", error);
      res.status(500).json({ error: "更新文章失败" });
    }
  },
);

/**
 * DELETE /api/posts/:type/:filename
 * 删除文章（需要认证）
 */
router.delete(
  "/:type/:filename",
  authMiddleware,
  (req: Request, res: Response): void => {
    const { type, filename } = req.params as { type: string; filename: string };

    if (!POST_TYPES.includes(type)) {
      res.status(400).json({ error: "无效的文章类型" });
      return;
    }

    const filePath = resolvePostFilePath(type, filename);
    if (!filePath) {
      res.status(400).json({ error: "无效的文件名" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "文章不存在" });
      return;
    }

    try {
      fs.unlinkSync(filePath);

      // 尝试删除对应的图片文件夹
      const slug = filename.replace(/\.md$/i, "");
      const imageDir = path.join(IMAGES_DIR, slug);
      if (fs.existsSync(imageDir)) {
        fs.rmSync(imageDir, { recursive: true, force: true });
      }

      res.json({ success: true, message: "文章及相关图片已删除" });
    } catch (error) {
      console.error("Posts API error:", error);
      res.status(500).json({ error: "删除文章失败" });
    }
  },
);

/**
 * POST /api/posts/import-markdown
 * 上传 Markdown 并自动解析创建文章（需要认证）
 */
router.post(
  "/import-markdown",
  authMiddleware,
  uploadMarkdown.single("file"),
  (req: Request, res: Response): void => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "未上传任何 Markdown 文件" });
      return;
    }

    try {
      const parsed = parseMarkdownImportFile(file.buffer.toString("utf8"));
      const result = createPostFromPayload(parsed);

      if (!result.success) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        filename: result.filename,
        path: result.path,
        parsed,
        message: "Markdown 导入成功，已创建文章",
      });
    } catch (error) {
      console.error("Markdown import error:", error);
      res.status(400).json({ error: "Markdown 解析失败，请检查 frontmatter 和内容格式" });
    }
  },
);

/**
 * POST /api/posts/upload-cover
 * 上传封面图片（需要认证）
 */
router.post(
  "/upload-cover",
  authMiddleware,
  uploadCover.single("cover"),
  (req: Request, res: Response): void => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "未上传任何文件" });
      return;
    }

    const folderName = (req as CoverFolderRequest).coverFolder || "default";
    const ext = path.extname(file.originalname).toLowerCase();
    const coverUrl = `/images/${folderName}/coverImage${ext}`;

    res.json({
      success: true,
      url: coverUrl,
      message: "封面图片上传成功",
    });
  },
);

export default router;
