/**
 * Database Initialization Script
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
    // Test connection
    console.log("🔌 Testing database connection...");
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful!");

    // Create pageviews table
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

    // Create comments table
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

    // Create indexes for better performance
    console.log("🔍 Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    `);
    console.log("✅ Indexes created!");

    console.log("");
    console.log("🎉 Database initialization completed successfully!");
    console.log("");
    console.log("📋 Created tables:");
    console.log("   - pageviews (post_id, views, created_at, updated_at)");
    console.log("   - comments (id, post_id, parent_id, nickname, content, created_at)");

  } catch (error) {
    console.error("❌ Database initialization failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("👋 Database connection closed.");
  }
}

// Run the initialization
initDatabase();
