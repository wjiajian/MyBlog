
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query }  from './src/db/index.js';
import authRoutes from './src/routes/auth.js';
import postsRoutes from './src/routes/posts.js';
import photosRoutes from './src/routes/photos.js';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '3000', 10);

// 中间件
app.use(cors());
app.use(express.json());

// 提供 dist 静态资源
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 编译后 server.js 在 dist-server/ 目录，需要访问上级的 dist/ 目录
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

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
app.post('/api/pageview', async (req: Request, res: Response) => {
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

        const rows = result.rows;
        const commentsMap = new Map<number, Comment>();
        const rootComments: Comment[] = [];

        rows.forEach((row: any) => {
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

        rows.forEach((row: any) => {
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

app.post('/api/comments', async (req: Request, res: Response) => {
    const { postId, nickname, content, parentId } = req.body;

    if (!postId || !nickname || !content) {
        res.status(400).json({ error: '昵称和内容不能为空' });
        return;
    }

    if (nickname.length < 1 || nickname.length > 50) {
        res.status(400).json({ error: '昵称长度应在 1-50 字符之间' });
        return;
    }
    if (content.length < 1 || content.length > 1000) {
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
        `, [postId, parentId || null, nickname.trim(), content.trim()]);

        res.status(201).json({ success: true, comment: result.rows[0] });

    } catch (error) {
        console.error('Comments API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 单页应用兜底路由
app.get('/{*path}', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
