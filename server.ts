
import express, { Express, Request, Response } from 'express';
import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { query }  from './src/db/index.js';
import authRoutes from './src/routes/auth.js';
import postsRoutes from './src/routes/posts.js';
import photosRoutes from './src/routes/photos.js';
import { assertAuthConfig } from './src/config/auth.js';
import { createRateLimit } from './src/middleware/rateLimit.js';
import { postExistsById } from './src/services/postFiles.js';

dotenv.config();
assertAuthConfig();

const app: Express = express();
const port = parseInt(process.env.PORT || '3000', 10);
const pageviewRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 120 });
const commentsRateLimit = createRateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

function getAllowedCorsOrigins(): Set<string> {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return new Set(configured);
  }

  if (process.env.NODE_ENV === 'production') {
    return new Set<string>();
  }

  return new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = getAllowedCorsOrigins();
    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
};

// 中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// 提供 dist 静态资源
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  return path.resolve(__dirname, '..');
})();
const publicPath = path.join(PROJECT_ROOT, 'public');
const distPath = path.join(PROJECT_ROOT, 'dist');

// 先提供 public（后台上传后的运行时资源），再提供 dist（前端构建产物）
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// 接口路由

// 注册管理 API 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/photos', photosRoutes);

// 浏览量 API
// 获取浏览量
app.get('/api/pageview', async (req: Request, res: Response) => {
    const postId = req.query.id as string;
    if (!postId) {
        res.status(400).json({ error: 'Missing post id' });
        return;
    }

    try {
        const result = await query('SELECT views FROM pageviews WHERE post_id = $1', [postId]);
        res.json({ views: result.rows[0]?.views || 0 });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 增加浏览量
app.post('/api/pageview', pageviewRateLimit, async (req: Request, res: Response) => {
    const postId = req.query.id as string;
    if (!postId) {
        res.status(400).json({ error: 'Missing post id' });
        return;
    }

    try {
        const result = await query(`
            INSERT INTO pageviews (post_id, views)
            VALUES ($1, 1)
            ON CONFLICT (post_id)
            DO UPDATE SET views = pageviews.views + 1, updated_at = CURRENT_TIMESTAMP
            RETURNING views
        `, [postId]);
        res.json({ views: result.rows[0].views });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// 评论 API
// 辅助：构建嵌套评论
interface Comment {
    id: number;
    post_id: string;
    parent_id: number | null;
    nickname: string;
    content: string;
    created_at: string;
    replies?: Comment[];
}

type CommentRow = Omit<Comment, 'replies'>;

app.get('/api/comments', async (req: Request, res: Response) => {
    const postId = req.query.postId as string;
    if (!postId) {
        res.status(400).json({ error: 'Missing postId' });
        return;
    }

    try {
        const result = await query(`
            SELECT id, post_id, parent_id, nickname, content, created_at
            FROM comments
            WHERE post_id = $1
            ORDER BY created_at ASC
        `, [postId]);

        const rows = result.rows as CommentRow[];
        const commentsMap = new Map<number, Comment>();
        const rootComments: Comment[] = [];

        rows.forEach((row) => {
             const comment: Comment = {
                id: row.id,
                post_id: row.post_id,
                parent_id: row.parent_id,
                nickname: row.nickname,
                content: row.content,
                created_at: row.created_at,
                replies: [],
             };
             commentsMap.set(comment.id, comment);
        });

        rows.forEach((row) => {
            const comment = commentsMap.get(row.id)!;
            if (row.parent_id === null) {
                rootComments.push(comment);
            } else {
                const parent = commentsMap.get(row.parent_id);
                if (parent) {
                    parent.replies!.push(comment);
                }
            }
        });

        rootComments.reverse();
        res.json({ comments: rootComments, total: rows.length });

    } catch (error) {
        console.error('Comments API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/comments', commentsRateLimit, async (req: Request, res: Response) => {
    const { postId, nickname, content, parentId } = req.body;

    if (typeof postId !== 'string' || typeof nickname !== 'string' || typeof content !== 'string') {
        res.status(400).json({ error: '昵称和内容不能为空' });
        return;
    }

    const normalizedNickname = nickname.trim();
    const normalizedContent = content.trim();
    if (!postId.trim() || !normalizedNickname || !normalizedContent) {
        res.status(400).json({ error: '昵称和内容不能为空' });
        return;
    }

    if (!postExistsById(postId)) {
        res.status(404).json({ error: '文章不存在' });
        return;
    }

    if (normalizedNickname.length < 1 || normalizedNickname.length > 50) {
        res.status(400).json({ error: '昵称长度应在 1-50 字符之间' });
        return;
    }
    if (normalizedContent.length < 1 || normalizedContent.length > 1000) {
        res.status(400).json({ error: '评论内容长度应在 1-1000 字符之间' });
        return;
    }

    try {
        // 校验 parentId
        if (parentId) {
             const parentCheck = await query('SELECT id, post_id FROM comments WHERE id = $1', [parentId]);
             if (parentCheck.rows.length === 0) {
                 res.status(400).json({ error: '回复的父评论不存在' });
                 return;
             }
             if (parentCheck.rows[0].post_id !== postId) {
                 res.status(400).json({ error: '不能跨文章回复评论' });
                 return;
             }
        }

        const result = await query(`
            INSERT INTO comments (post_id, parent_id, nickname, content)
            VALUES ($1, $2, $3, $4)
            RETURNING id, post_id, parent_id, nickname, content, created_at
        `, [postId, parentId || null, normalizedNickname, normalizedContent]);

        res.status(201).json({ success: true, comment: result.rows[0] });

    } catch (error) {
        console.error('Comments API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 单页应用兜底路由
app.use((req: Request, res: Response) => {
  // API 路由返回 JSON 404
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API not found' });
    return;
  }
  // 非 API 的 GET 请求返回 SPA 入口
  if (req.method === 'GET') {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
    res.status(404).json({ error: 'Frontend build not found' });
    return;
  }
  // 其他请求返回 404
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
