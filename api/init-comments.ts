import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    // 创建 comments 表，支持嵌套回复
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        nickname VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建索引优化查询
    await sql`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)
    `;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Table "comments" created successfully with reply support' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to create table',
        details: String(error) 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
