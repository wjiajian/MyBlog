/**
 * 数据库初始化脚本
 *
 * 用于初始化 PostgreSQL 数据库表结构
 * 运行方式: npm run db:init
 */

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function initDatabase(): Promise<void> {
  console.log("🚀 Starting database initialization...");
  console.log(`📍 Database URL: ${process.env.DATABASE_URL ? "[configured]" : "[missing]"}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    console.log("💡 Please set DATABASE_URL in your .env file");
    process.exit(1);
  }

  try {
    // 测试连接
    console.log("🔌 Testing database connection...");
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful!");

    // 创建 pageviews 表
    console.log("📊 Creating pageviews table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pageviews (
        post_id VARCHAR(255) PRIMARY KEY,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ pageviews table ready!");

    // 创建 comments 表
    console.log("💬 Creating comments table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        nickname VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ comments table ready!");

    // 创建 OneDrive 同步状态表
    console.log("☁️ Creating onedrive_sync_state table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS onedrive_sync_state (
        id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        folder_item_id TEXT,
        delta_link TEXT,
        subscription_id TEXT,
        subscription_expiration TIMESTAMPTZ,
        last_synced_at TIMESTAMPTZ,
        last_error TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      INSERT INTO onedrive_sync_state (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ onedrive_sync_state table ready!");

    // 创建 OneDrive 同步文件索引表
    console.log("☁️ Creating onedrive_sync_items table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS onedrive_sync_items (
        drive_item_id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        base_name TEXT NOT NULL,
        etag TEXT,
        last_modified_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ onedrive_sync_items table ready!");

    // 创建照片展示状态表
    console.log("🖼️ Creating photo_visibility table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photo_visibility (
        photo_key TEXT PRIMARY KEY,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ photo_visibility table ready!");

    // 创建索引以提升性能
    console.log("🔍 Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_onedrive_sync_items_filename ON onedrive_sync_items(filename);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_onedrive_sync_items_base_name ON onedrive_sync_items(base_name);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_photo_visibility_is_visible ON photo_visibility(is_visible);
    `);
    console.log("✅ Indexes created!");

    console.log("");
    console.log("🎉 Database initialization completed successfully!");
    console.log("");
    console.log("📋 Created tables:");
    console.log("   - pageviews (post_id, views, created_at, updated_at)");
    console.log("   - comments (id, post_id, parent_id, nickname, content, created_at)");
    console.log("   - onedrive_sync_state (sync cursor/subscription/runtime state)");
    console.log("   - onedrive_sync_items (drive_item_id -> filename/base_name/etag)");
    console.log("   - photo_visibility (photo visibility switch state)");

  } catch (error) {
    console.error("❌ Database initialization failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("👋 Database connection closed.");
  }
}

// 执行初始化
initDatabase();
