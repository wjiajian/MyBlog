import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    // 创建 pageviews 表
    await sql`
      CREATE TABLE IF NOT EXISTS pageviews (
        post_id VARCHAR(255) PRIMARY KEY,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Table "pageviews" created successfully' 
      }),
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
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
