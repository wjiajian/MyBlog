import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

// 评论数据类型
interface Comment {
  id: number;
  post_id: string;
  parent_id: number | null;
  nickname: string;
  content: string;
  created_at: string;
  replies?: Comment[];
}

// 简单的频率限制（基于 IP）
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10000; // 10秒

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimit.get(ip);
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    return false;
  }
  rateLimit.set(ip, now);
  return true;
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET: 获取文章评论
    if (request.method === 'GET') {
      const postId = url.searchParams.get('postId');
      
      if (!postId) {
        return new Response(
          JSON.stringify({ error: 'Missing postId' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 获取所有评论（按时间正序，便于构建树结构）
      const { rows } = await sql`
        SELECT id, post_id, parent_id, nickname, content, created_at
        FROM comments
        WHERE post_id = ${postId}
        ORDER BY created_at ASC
      `;

      // 构建嵌套结构
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

      // 根评论按时间倒序
      rootComments.reverse();

      return new Response(
        JSON.stringify({ comments: rootComments, total: rows.length }),
        { headers: corsHeaders }
      );
    }

    // POST: 提交新评论
    if (request.method === 'POST') {
      // 频率限制
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      if (!checkRateLimit(ip)) {
        return new Response(
          JSON.stringify({ error: '评论太频繁，请稍后再试' }),
          { status: 429, headers: corsHeaders }
        );
      }

      const body = await request.json();
      const { postId, nickname, content, parentId } = body;

      // 验证必填字段
      if (!postId || !nickname || !content) {
        return new Response(
          JSON.stringify({ error: '昵称和内容不能为空' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 验证长度
      if (nickname.length < 1 || nickname.length > 50) {
        return new Response(
          JSON.stringify({ error: '昵称长度应在 1-50 字符之间' }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (content.length < 1 || content.length > 1000) {
        return new Response(
          JSON.stringify({ error: '评论内容长度应在 1-1000 字符之间' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 插入评论
      const { rows } = await sql`
        INSERT INTO comments (post_id, parent_id, nickname, content)
        VALUES (${postId}, ${parentId || null}, ${nickname.trim()}, ${content.trim()})
        RETURNING id, post_id, parent_id, nickname, content, created_at
      `;

      return new Response(
        JSON.stringify({ success: true, comment: rows[0] }),
        { status: 201, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Comments API error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
