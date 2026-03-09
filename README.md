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

### 最近更新

- `2026-03-06`：主分支切换到 **OSS 直传模式**，移除 OneDrive 同步入口。
- 照片上传后会保留原图格式，并统一生成 `medium/tiny` 缩略图用于网格和预览。
- 后台 `/admin/photos` 为当前主流程入口，上传/删除会由服务端维护 `src/data/images-metadata.json`。
- `npm run generate-metadata` / `scripts/process-photos.cjs` 仅保留为历史手动回填工具，不是当前生产主流程。

---

## 项目结构

```
MyBlog/
├── server.ts               # Express 后端服务器入口
├── dist/                   # 前端构建产物 (自动生成)
├── dist-server/            # 服务端构建产物 (自动生成)
├── scripts/
│   ├── init-db.ts          # 数据库初始化脚本
│   └── process-photos.cjs  # 照片墙历史/手动回填脚本（非主流程）
├── src/
│   ├── assets/             # 前端静态资源
│   ├── db/                 # 数据库连接模块 (PostgreSQL)
│   ├── middleware/         # 服务端中间件
│   ├── routes/             # 服务端 API 路由
│   ├── components/         # React 组件
│   │   ├── admin/          # 后台管理组件
│   │   ├── BlogPost/       # 文章详情页组件集
│   │   ├── PhotoWall/      # 照片墙组件集
│   │   └── ...
│   ├── content/            # Markdown 文章
│   │   ├── tech/           # 技术类文章
│   │   └── life/           # 生活类文章
│   ├── data/
│   │   ├── posts.ts        # 文章数据加载与解析
│   │   ├── images-metadata.example.json  # 照片墙元数据示例
│   │   └── images-metadata.json          # 本地/线上运行时元数据（不入库）
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面级组件
│   │   ├── admin/          # 后台页面
│   │   └── ...
│   ├── utils/              # 工具函数模块
│   ├── services/           # 服务模块（含图片处理工具）
│   ├── types/              # TypeScript 类型定义
│   ├── App.tsx             # 主应用入口
│   ├── main.tsx            # 前端入口
│   └── polyfill.ts         # 运行时补丁
├── public/
│   ├── images/             # 文章图片资源
│   ├── resources/          # 网站资源（背景/头像等）
│   ├── photowall/          # 照片墙资源
│   │   ├── origin/         # 原始照片（HEIC/JPG/PNG）
│   │   └── thumbnails/     # 缩略图集合
│   │       ├── medium/     # 中等缩略图
│   │       └── tiny/       # 模糊预览
│   └── avatar/             # 默认头像
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
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
- **相册管理** - 上传原图到 OSS、自动生成缩略图、管理展示状态
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
# 进入后台
# /admin/photos
# 选择图片后上传，服务端会自动写入 OSS 并维护 metadata
```

**特性：** HEIC/HEIF/JPG/PNG 原图保留 | 统一生成 `medium/tiny` 缩略图 | EXIF 提取 | 瀑布流布局 | 灯箱预览

### 当前存储模式（OSS 直传）

当前主分支已切换为后台直传 OSS 模式，不再启用 OneDrive 自动同步链路。
当前主流程为：管理员在 `/admin/photos` 上传/删除照片，服务端在 `src/routes/photos.ts` 中同步维护 OSS 对象与 `src/data/images-metadata.json`。

数据流：

```text
Admin (/admin/photos) 上传图片
          │
          ▼
POST /api/photos/upload
  - 保存原图到 OSS (origin)
  - 统一生成 JPEG 的 medium/tiny 缩略图
  - 更新运行时 `src/data/images-metadata.json`
          │
          ▼
Gallery / Admin 读取 /api/photos/metadata
```

删除流程：

```text
Admin (/admin/photos) 删除图片
          │
          ▼
DELETE /api/photos/:filename
  - 删除 OSS 原图与缩略图对象
  - 更新 src/data/images-metadata.json
```

上传限制与建议：

1. 管理端会自动分批上传：默认每批最多 `10` 张、每批总大小最多 `50MB`。
2. 后端当前单文件大小限制为 `50MB`，且默认每个上传请求最多接收 `10` 个文件。
3. `10` 张/批限制已改为前后端可配置（默认值保持一致），以避免规则漂移。
4. 为了更稳定的上传体验，建议单张图片尽量控制在 `5MB` 以内。

OSS 对象路径约定：

1. 原图：`photowall/origin/<filename>`
2. 全尺寸缩略图：`photowall/thumbnails/full/<baseName>.jpg`
3. 中图缩略图：`photowall/thumbnails/medium/<baseName>.jpg`
4. 小图缩略图：`photowall/thumbnails/tiny/<baseName>.jpg`

说明：

1. `<filename>` 为上传后的安全文件名（保留原扩展名）。
2. `<baseName>` 为去掉原扩展名后的文件名。
3. 原图格式保持不变（如 HEIC/HEIF/JPG/PNG）。
4. 缩略图统一为 JPEG，供网格与预览占位使用。
5. `src/data/images-metadata.json` 属于运行时数据文件，**不再纳入 git 跟踪**。
6. 仓库内提供 `src/data/images-metadata.example.json` 作为格式参考与初始化模板。

### metadata 文件与从 OSS 恢复

当运行时 `src/data/images-metadata.json` 丢失、损坏，或需要按 OSS 现状重建时，可执行：

```bash
npm run rebuild-oss-metadata
```

脚本行为：

1. 自动加载项目根目录 `.env`
2. 扫描 OSS 下的：
   - `photowall/origin/`
   - `photowall/thumbnails/full/`
   - `photowall/thumbnails/medium/`
   - `photowall/thumbnails/tiny/`
3. 以 `origin` 原图文件名作为 `filename`
4. 按 `origin/<filename>` → `thumbnails/*/<baseName>.jpg` 规则匹配缩略图
5. 优先读取原图 EXIF 中的拍摄时间（如 `DateTimeOriginal/CreateDate/ModifyDate`）作为 `date`
6. 若 EXIF 不存在或读取失败，则回退为 OSS 对象时间
7. 重新生成运行时 `src/data/images-metadata.json`，并尽量保留已有记录中的 `videoSrc`、`isVisible`、`visibilityUpdatedAt` 等字段

必需环境变量：

```bash
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=myblog-photowall
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
# 可选
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

注意：

- 该脚本只重建 metadata，不修改现有上传 / 删除主流程。
- 首次部署或新环境初始化时，可先复制示例文件：

```bash
cp src/data/images-metadata.example.json src/data/images-metadata.json
```

- 若线上 metadata 丢失，但 OSS 原图/缩略图仍在，可直接执行 `npm run rebuild-oss-metadata` 恢复。
- 由于真实 metadata 已不再纳入 Git，后续 `git pull` / `git reset --hard` **不会再把仓库里的旧 metadata 覆盖回来**；但如果部署目录会清空未跟踪文件，仍建议在部署后补跑一次恢复脚本。

### 从 OSS 恢复照片墙 metadata

当 `src/data/images-metadata.json` 丢失、损坏，或需要按 OSS 现状重建时，可执行：

```bash
npm run rebuild-oss-metadata
```

脚本行为：

1. 扫描 OSS 下的 `photowall/origin/`、`photowall/thumbnails/full/`、`photowall/thumbnails/medium/`、`photowall/thumbnails/tiny/`
2. 以 `origin` 原图文件名作为 `filename`
3. 优先读取原图 EXIF 中的拍摄时间（`DateTimeOriginal/CreateDate/ModifyDate`）作为 `date`
4. 若 EXIF 不存在或读取失败，则回退为 OSS 对象时间
5. 重新生成 `src/data/images-metadata.json`，并尽量保留已有记录中的 `videoSrc`、`isVisible`、`visibilityUpdatedAt` 等字段

必需环境变量：

```bash
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=myblog-photowall
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
# 可选
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

注意：

- 该脚本只重建 metadata，不修改现有上传 / 删除主流程。
- 当前恢复依赖 `origin` 与 `thumbnails/full` 都存在；若某张图缺少 full 缩略图，会被跳过并在 OSS 侧补齐后重跑。

### 管理端能力

`/admin/photos` 支持：

1. 批量上传图片到 OSS
2. 手动触发处理接口（兼容入口，实际上传时已自动处理）
3. 设置照片可见/隐藏状态
4. 删除照片（同时删除 OSS 对象与 metadata）

### 旧脚本说明

`npm run generate-metadata`（底层脚本为 `scripts/process-photos.cjs`）仍可用于从本地 `public/photowall/` 做历史数据回填或手动重建缩略图/metadata，但它不是当前生产环境的主流程，也不应替代后台上传/删除接口对 metadata 的日常维护。

### 历史方案说明

仓库中仍保留 `readme-OSS.md` 与 `src/services/onedrive-sync/` 作为历史实现参考；当前 `server.ts` 未注册 OneDrive 同步路由，默认不启用该链路。

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

# 照片墙 OSS 读取域名
OSS_PHOTOWALL_BASE_URL=https://myblog-photowall.oss-cn-hangzhou.aliyuncs.com
VITE_OSS_PHOTOWALL_BASE_URL=https://myblog-photowall.oss-cn-hangzhou.aliyuncs.com

# OSS 上传写入权限（后台照片上传）
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=myblog-photowall
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com  # 可选

# 单文件上传大小限制（后端 multer，默认 50MB）
PHOTO_UPLOAD_MAX_MB=50

# 每批最多上传文件数（后端请求限制，默认 10）
PHOTO_UPLOAD_MAX_FILES_PER_BATCH=10

# 前端自动分批上传每批最多文件数（默认 10，应与后端限制保持一致）
VITE_PHOTO_UPLOAD_MAX_FILES_PER_BATCH=10

# 前端自动分批上传大小（每批总大小，默认 50MB）
VITE_PHOTO_UPLOAD_BATCH_MB=50
```

### 4. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 64m;

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
- `photo_visibility` - 照片可见性状态（后台展示开关）

兼容旧版本时，数据库中可能仍保留 `onedrive_sync_state` / `onedrive_sync_items` 历史表，不影响当前 OSS 直传模式。

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

-- 照片可见性表
CREATE TABLE photo_visibility (
    photo_key TEXT PRIMARY KEY,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
| GET | `/api/photos/metadata` | 获取可见照片列表 |
| GET | `/api/photos/metadata?includeHidden=1` | 获取全部照片（含隐藏） |
| POST | `/api/photos/upload` | 上传照片到 OSS（管理员） |
| POST | `/api/photos/process` | 手动处理入口（管理员，兼容接口） |
| PATCH | `/api/photos/visibility` | 设置单张照片是否展示（管理员） |
| DELETE | `/api/photos/:filename` | 删除照片与 OSS 对象（管理员） |

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
| `npm run generate-metadata` | 手动回填/重建照片墙缩略图与 metadata（历史工具，非主流程） |

---

## 许可证

MIT License
