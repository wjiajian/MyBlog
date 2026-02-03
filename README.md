# Jiajian's Blog

基于 **React + TypeScript + Vite + Express + PostgreSQL** 构建的现代博客系统，支持自托管 (Self-Hosted) 部署。

---

## 快速开始

### 开发模式

```bash
npm install
npm run dev
```

### 生产部署

```bash
npm run build
npm run db:init    # 初始化数据库表结构
npm run serve      # 启动生产服务器
```

---

## 项目结构

```
MyBlog/
├── server.ts               # Express 后端服务器入口
├── dist-server/            # 服务端构建产物 (自动生成)
├── scripts/
│   ├── init-db.ts          # 数据库初始化脚本
│   └── process-photos.cjs  # 照片墙数据处理脚本
├── src/
│   ├── db/                 # 数据库连接模块 (PostgreSQL)
│   ├── components/         # React 组件
│   │   ├── BlogPost/       # 文章详情页组件集
│   │   ├── PhotoWall/      # 照片墙组件集
│   │   └── ...
│   ├── content/            # Markdown 文章
│   │   ├── tech/           # 技术类文章
│   │   └── life/           # 生活类文章
│   ├── data/
│   │   ├── posts.ts        # 文章数据加载与解析
│   │   └── images-metadata.json  # 照片墙元数据
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面级组件
│   ├── utils/              # 工具函数模块
│   ├── types/              # TypeScript 类型定义
│   └── App.tsx             # 主应用入口
├── public/
│   ├── images/             # 文章图片资源
│   ├── resources/          # 网站资源（背景/头像等）
│   ├── photowall/          # 照片墙资源
│   │   ├── origin/         # 原始照片（HEIC/JPG/PNG）
│   │   ├── full/           # 完整尺寸
│   │   ├── medium/         # 中等缩略图
│   │   └── tiny/           # 模糊预览
│   └── avatar/             # 默认头像
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.server.json    # 服务端 TypeScript 配置
└── .env.example            # 环境变量模板
```

---

## 功能介绍

### 内容分类

首页支持通过 Tab 切换显示不同类型的内容：

| Tab | 说明 |
|-----|------|
| 技术笔记 | 默认显示，包含技术相关文章 |
| 生活随笔 | 生活类内容，如随笔、摄影、旅行等 |

在 Markdown 文件的 Frontmatter 中通过 `type` 字段设置：`'tech'` 或 `'life'`，不填默认为 `'tech'`。

### 时间线页面

通过导航栏的「时间线」按钮进入，按年份展示所有文章，支持滚动同步高亮当前年月。

### 评论系统

文章底部内置匿名评论功能，用户只需填写昵称即可评论。评论数据存储于 PostgreSQL 数据库。

### 导航栏功能

右上角导航栏提供以下功能：
- **首页** - 返回主页
- **分类** - 按分类筛选文章（笔记、项目记录等）
- **搜索** - 关键词搜索文章
- **时间线** - 按时间展示所有文章
- **相册** - 照片墙页面
- **友链** - 友链页面
- **关于** - 个人介绍页面

### 文章目录系统

文章详情页右侧（桌面端）或抽屉菜单（移动端）显示自动生成的目录，支持：
- 自动提取 Markdown 标题（H1-H2）
- 点击平滑滚动到对应章节
- 阅读进度高亮
- 回到顶部按钮

### 友链页面

独立的友链页面，支持：
- 卡片式布局展示友链
- 亮/暗主题自适应
- 悬停动画效果

### 后台管理系统

访问 `/admin` 进入后台管理界面 (需鉴权)，支持：
- **文章管理** - 在线增删改查文章，支持 Markdown 实时预览
- **相册管理** - 管理照片墙资源
- **安全登录** - 基于 JWT + bcrypt 的认证系统

---

## 性能优化

### 文章列表懒加载

| 功能 | 说明 |
|------|------|
| **年内分页** | 每年默认显示 4 篇文章，点击「更多文章」按钮加载更多 |
| **年份分段** | 默认显示最近 2 年，点击「加载更多年份」展开历史内容 |

### 图片加载优化

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| **懒加载** | 原生 `loading="lazy"` | 首屏加载提速 30-50% |
| **渐进式加载** | `ProgressiveImage` 组件 | Shimmer 动画 + 淡入效果 |
| **骨架屏** | `Skeleton` 组件 | 消除内容布局偏移，提升感知速度 |
| **事件防抖** | `useDebounce` Hook | 优化 Resize 等高频事件性能 |

### 代码优化
- **代码高亮** - 使用 `highlight.js` 语法高亮
- **Markdown 渲染** - 支持 GFM 扩展语法
- **动画效果** - 使用 `framer-motion` 流畅动画

---

## 发布文章

1. 在 `src/content/tech/` 或 `src/content/life/` 目录下创建 `.md` 文件
2. 文件头添加 Frontmatter 元数据：

```markdown
---
slug: my-post-id
title: 文章标题
date: 2026-01-29
year: 2026
type: tech  # tech | life
description: 简介...
coverImage: /images/xxx/cover.png
categories: 技术笔记
tags: 
  - React
  - Node.js
---
```

3. `posts.ts` 会自动扫描并加载所有 `.md` 文件，无需手动注册

### 图片规格

| 字段 | 用途 | 推荐比例 |
|------|------|----------|
| `coverImage` | 首页卡片封面 | 1:1 |
| `headerImage` | 文章详情头图 | 16:9 |

---

## 照片墙

```bash
# 1. 将照片放入 public/photowall/origin/
# 2. Live Photo 需同名 .mov 文件
# 3. 生成数据
npm run generate-metadata
```

**特性：** HEIC 原生支持 | Live Photo | 渐进式加载 | EXIF 提取 | 瀑布流布局 | 灯箱预览

---

## 工具函数

### Utils (`src/utils/`)

| 文件 | 函数 | 说明 |
|------|------|------|
| `storage.ts` | `safeGetItem/SetItem/RemoveItem` | SSR 兼容的 localStorage |
| `date.ts` | `parseMonthFromDate`, `parseDate` | 日期解析 |
| `theme.ts` | `getAppTheme`, `getGalleryTheme`, `getNavTheme` | 主题配置 |
| `format.ts` | `formatFileSize`, `formatResolution`, `formatMegapixels` | 文件与图片格式化 |

### Hooks (`src/hooks/`)

| Hook | 用途 |
|------|------|
| `useDebounce` | 防抖回调（resize、搜索等） |

---

## 部署 (自托管)

### 1. 准备工作
- Linux 服务器 (Ubuntu 推荐)
- Node.js v20+
- PostgreSQL 数据库
- Nginx (反向代理)

### 2. 部署步骤

```bash
# 克隆项目
git clone <repository-url>
cd MyBlog

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 DATABASE_URL 等

# 初始化数据库
npm run db:init

# 构建项目
npm run build

# 构建服务器
npm run build:server

# 启动服务（使用 PM2）
pm2 start npm --name "myblog" -- run serve

# 停止服务
pm2 stop myblog

# 重启服务
pm2 restart myblog

# 删除服务
pm2 delete myblog
```

### 3. 环境变量 (.env)

```bash
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/myblog
NODE_ENV=production

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123          # 开发环境明文密码
# ADMIN_PASSWORD_HASH=$2a$10$... # 生产环境哈希密码
JWT_SECRET=your_jwt_secret_key
```

### 4. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 数据库管理

### 创建数据库

在初始化表结构之前，需要先创建 PostgreSQL 数据库：

```bash
# 方式一：使用 createdb 命令
sudo -u postgres createdb myblog

# 方式二：进入 PostgreSQL 交互式终端创建
sudo -u postgres psql
CREATE DATABASE myblog;
CREATE USER myblog_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE myblog TO myblog_user;
\q
```

### 初始化数据库表

```bash
npm run db:init
```

该命令将创建以下数据库表：
- `pageviews` - 文章浏览量统计
- `comments` - 评论数据

### 表结构

```sql
-- 浏览量表
CREATE TABLE pageviews (
    post_id VARCHAR(255) PRIMARY KEY,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pageview?id=<postId>` | 获取文章浏览量 |
| POST | `/api/pageview?id=<postId>` | 增加文章浏览量 |
| GET | `/api/comments?postId=<postId>` | 获取文章评论列表 |
| POST | `/api/comments` | 发表评论 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript 5 |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion |
| 路由 | React Router 7 |
| Markdown | react-markdown + remark-gfm |
| 后端 | Express.js |
| 数据库 | PostgreSQL (`pg` library) |
| 认证 | JWT + bcryptjs |
| 部署 | PM2 + Nginx |

---

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建前端和后端 |
| `npm run serve` | 启动生产服务器 |
| `npm run db:init` | 初始化数据库表结构 |
| `npm run generate-metadata` | 生成照片墙元数据 |

---

## 许可证

MIT License
