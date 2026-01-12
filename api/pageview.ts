import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const postId = url.searchParams.get('id');

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

  if (!postId) {
    return new Response(
      JSON.stringify({ error: 'Missing post id' }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    if (request.method === 'GET') {
      // 获取浏览量
      const { rows } = await sql`
        SELECT views FROM pageviews WHERE post_id = ${postId}
      `;
      return new Response(
        JSON.stringify({ views: rows[0]?.views || 0 }),
        { headers: corsHeaders }
      );
    }

    if (request.method === 'POST') {
      // 增加浏览量（使用 UPSERT）
      const { rows } = await sql`
        INSERT INTO pageviews (post_id, views)
        VALUES (${postId}, 1)
        ON CONFLICT (post_id)
        DO UPDATE SET views = pageviews.views + 1, updated_at = CURRENT_TIMESTAMP
        RETURNING views
      `;
      return new Response(
        JSON.stringify({ views: rows[0].views }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Database error', details: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
