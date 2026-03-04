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
├── dist/                   # 前端构建产物 (自动生成)
├── dist-server/            # 服务端构建产物 (自动生成)
├── scripts/
│   ├── init-db.ts          # 数据库初始化脚本
│   └── process-photos.cjs  # 照片墙数据处理脚本
├── src/
│   ├── assets/             # 前端静态资源
│   ├── db/                 # 数据库连接模块 (PostgreSQL)
│   ├── middleware/         # 服务端中间件
│   ├── routes/             # 服务端 API 路由
│   │   ├── onedrive-sync.ts # OneDrive 同步与 webhook API
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
│   │   └── images-metadata.json  # 照片墙元数据
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面级组件
│   │   ├── admin/          # 后台页面
│   │   └── ...
│   ├── utils/              # 工具函数模块
│   ├── services/
│   │   └── onedrive-sync/  # OneDrive -> OSS 同步服务
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
│   │       ├── full/       # 完整尺寸
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

### OneDrive -> OSS 自动同步（详细实施版）

本项目现已内置 OneDrive 增量同步服务，目标是将你 OneDrive 指定目录中的图片自动同步到 OSS 的照片墙目录结构，网站继续按原有 `photowall` 路径消费，不改前端业务逻辑。
完整独立手册见 [readme-OSS](/C:/Users/Admin/Desktop/code/MyBlog/readme-OSS)。
如果你是个人 Microsoft 账号，请直接按 `readme-OSS` 的“6.2~6.11 个人账号流程”配置（`ONEDRIVE_TENANT_ID=consumers` + `ONEDRIVE_REFRESH_TOKEN`）。

#### 一、架构与数据流

```text
OneDrive(指定文件夹)
    │
    ├─ Webhook 通知（实时触发）
    └─ Delta 轮询（定时补偿）
             │
             ▼
      同步服务（本项目后端）
      - 获取增量项
      - 下载源图
      - 统一转 JPEG
      - 生成 full/medium/tiny
      - 上传 OSS
      - 更新 metadata 与游标
             │
             ▼
    OSS: /photowall/thumbnails/{full|medium|tiny}
             │
             ▼
    网站照片墙（Gallery + Admin）
```

#### 二、你将获得什么

1. OneDrive 新增/更新照片后，自动同步至 OSS。
2. OneDrive 删除照片后，自动删除对应 OSS 缩略图并清理 metadata。
3. 支持定时轮询 + Webhook 双通道，避免漏同步。
4. 前端与后端统一支持 OSS 地址改写。
5. 同步状态、错误、订阅信息可通过 API 查询。

#### 三、目录与对象约定

同步服务会写入以下 OSS Key：

1. `photowall/thumbnails/full/<basename>.jpg`
2. `photowall/thumbnails/medium/<basename>.jpg`
3. `photowall/thumbnails/tiny/<basename>.jpg`

说明：

1. `<basename>` 默认取 OneDrive 文件名去扩展名。
2. 如果发生同名冲突，会自动追加 `-<driveItemId前8位>` 防覆盖。
3. metadata 中仍保持 `/photowall/...` 相对路径，运行时按 OSS 域名改写。

#### 四、前置准备

1. 阿里云 OSS：准备 Bucket 与公网域名。
2. Microsoft Entra 应用：用于调用 Graph API。
3. OneDrive driveId：目标账号/站点对应 drive 标识。
4. 本项目服务端：可访问外网（Graph + OSS）。

#### 五、微软端配置（Graph）

##### 5.1 注册应用

1. 进入 Microsoft Entra 管理中心，注册新应用。
2. 获取并记录：
   1. `Tenant ID`
   2. `Client ID`
3. 创建 `Client Secret`，保存明文值。

##### 5.2 配置权限

按你的账号类型选择：

1. 个人 OneDrive（你当前场景，推荐）：
   1. 使用 `refresh_token`（委托权限）。
   2. `ONEDRIVE_TENANT_ID` 设置为 `consumers`。
   3. Graph 权限使用 `Delegated permissions`：`Files.Read` + `offline_access`。
2. 企业/组织 OneDrive（服务端模式）：
   1. 使用 `client_credentials`。
   2. 配置应用权限（例如 `Files.Read.All`），并完成管理员同意。

##### 5.3 获取 driveId

可以通过 Graph Explorer 或你自己的工具调用：

```http
GET https://graph.microsoft.com/v1.0/me/drive
```

或组织版按用户查：

```http
GET https://graph.microsoft.com/v1.0/users/{userId}/drive
```

返回中的 `id` 即 `ONEDRIVE_DRIVE_ID`。

#### 六、OSS 端配置

##### 6.1 Bucket 与权限

1. 建议使用独立 Bucket（例如 `myblog-photowall`）。
2. 使用 RAM 子账号最小权限（Put/Get/Delete 对该 Bucket 即可）。

##### 6.2 CORS 建议

为照片墙站点域名配置 CORS，至少允许：

1. Method: `GET`, `HEAD`
2. Allowed Origin: 你的站点域名（不要全开 `*`，除非你明确接受）
3. Allowed Headers: `*` 或常规头

##### 6.3 CDN（可选）

1. 如有高并发访问，建议 OSS 前接 CDN。
2. `OSS_PHOTOWALL_BASE_URL` / `VITE_OSS_PHOTOWALL_BASE_URL` 可直接填 CDN 域名。

#### 七、环境变量（完整示例）

在 `.env` 中至少配置：

```bash
# =============================
# 照片墙读取域名（前后端）
# =============================
OSS_PHOTOWALL_BASE_URL=https://myblog-photowall.oss-cn-hangzhou.aliyuncs.com
VITE_OSS_PHOTOWALL_BASE_URL=https://myblog-photowall.oss-cn-hangzhou.aliyuncs.com

# =============================
# OneDrive 同步开关与轮询
# =============================
ONEDRIVE_SYNC_ENABLED=true
ONEDRIVE_SYNC_POLL_INTERVAL_SECONDS=600

# =============================
# Graph 应用参数
# =============================
ONEDRIVE_TENANT_ID=consumers
ONEDRIVE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_CLIENT_SECRET=your_client_secret
ONEDRIVE_DRIVE_ID=b!xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ONEDRIVE_SOURCE_FOLDER_PATH=PhotoWall

# 个人账号场景必填
ONEDRIVE_REFRESH_TOKEN=...
ONEDRIVE_REFRESH_SCOPE=Files.Read offline_access

# Webhook（推荐）
ONEDRIVE_WEBHOOK_URL=https://your-domain.com/api/onedrive-sync/webhook
ONEDRIVE_WEBHOOK_CLIENT_STATE=your_random_state_value
ONEDRIVE_SUBSCRIPTION_RENEW_BEFORE_MINUTES=720

# =============================
# OSS 写入参数（同步服务）
# =============================
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=myblog-photowall
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
# OSS_ENDPOINT=  # 可选
```

#### 八、部署顺序（建议严格按序）

1. 安装依赖（包含新增 `ali-oss`）：

```bash
npm install
```

2. 初始化或升级数据库表：

```bash
npm run db:init
```

3. 构建：

```bash
npm run build
npm run build:server
```

4. 启动服务：

```bash
npm run serve
```

5. 首次启动后，服务会：
   1. 自动检查并创建同步状态表（兜底）
   2. 自动尝试建立/续订 OneDrive Webhook（如果配置了 `ONEDRIVE_WEBHOOK_URL`）
   3. 自动执行一次 `startup` 同步

#### 九、Webhook 配置说明

1. 回调地址固定为：
   1. `GET /api/onedrive-sync/webhook`（验证）
   2. `POST /api/onedrive-sync/webhook`（接收通知）
2. Graph 验证时会携带 `validationToken`，服务会原样返回。
3. 通知到达后服务不会做重逻辑阻塞，采用队列式触发同步。
4. 即使 Webhook 漏通知，定时 Delta 轮询仍会补偿。

#### 十、同步策略细节

1. 仅处理图片格式（基于项目共享扩展名规则）。
2. 所有图片统一转为 JPEG 输出，生成 3 套尺寸：
   1. `full`: 高质量展示图
   2. `medium`: 网格缩略图
   3. `tiny`: 模糊预览图
3. 记录 `drive_item_id -> 文件名/baseName/eTag` 索引，避免重复处理。
4. 删除事件会删除 OSS 对象并清理 metadata。
5. metadata 按日期倒序写回 `src/data/images-metadata.json`。

#### 十一、管理 API

以下接口均已接入：

1. `GET /api/onedrive-sync/status`（管理员鉴权）
   1. 返回运行状态、配置校验、数据库状态游标等信息。
2. `POST /api/onedrive-sync/run`（管理员鉴权）
   1. 手动触发一次同步。
3. `POST /api/onedrive-sync/subscription/renew`（管理员鉴权）
   1. 手动强制续订 Webhook 订阅。
4. `GET /api/onedrive-sync/webhook`（公开）
   1. Graph 验证。
5. `POST /api/onedrive-sync/webhook`（公开）
   1. Graph 变更通知入口。

#### 十二、数据库表说明

新增两张表：

1. `onedrive_sync_state`
   1. 保存 delta 游标、订阅 ID/到期时间、最近同步时间、最近错误。
2. `onedrive_sync_items`
   1. 保存 `drive_item_id` 与文件名、baseName、etag 映射。

#### 十三、验证清单（上线前）

1. 新增一张图片到 OneDrive 指定目录，确认 OSS 出现 `full/medium/tiny` 三个对象。
2. 修改同一图片（覆盖上传），确认 OSS 对象刷新、metadata 更新。
3. 删除图片，确认 OSS 与 metadata 均删除。
4. 调 `GET /api/onedrive-sync/status`，确认：
   1. `config.configured = true`
   2. `state.last_error = null`
   3. `runtime.lastRun.success = true`
5. 打开照片墙页面，确认图片均从 OSS 域名加载。

#### 十四、常见问题排查

1. 提示 `Missing config`：
   1. 检查 `.env` 是否缺少必填项（特别是 `ONEDRIVE_*` 与 `OSS_*`）。
2. token 获取失败：
   1. 校验 Tenant/Client/Secret。
   2. 检查 Graph 权限与管理员同意。
3. 同步成功但前端还是本地路径：
   1. 检查 `OSS_PHOTOWALL_BASE_URL` 和 `VITE_OSS_PHOTOWALL_BASE_URL`。
   2. 重新构建前端。
4. Webhook 收不到通知：
   1. 检查 `ONEDRIVE_WEBHOOK_URL` 是否公网可访问。
   2. 检查反向代理是否放行对应路径。
   3. 用手动 `POST /api/onedrive-sync/subscription/renew` 重新建订阅。
5. 出现同名覆盖问题：
   1. 服务已内建冲突后缀策略，请检查 OneDrive 文件名与 `drive_item_id` 映射。

#### 十五、回滚方案

1. 将 `ONEDRIVE_SYNC_ENABLED=false`，重启服务，即可停止自动同步。
2. 保留 `OSS_PHOTOWALL_BASE_URL`，前端仍可继续读取既有 OSS 资源。
3. 若需完全回退到本地静态资源：
   1. 清空 `OSS_PHOTOWALL_BASE_URL` 与 `VITE_OSS_PHOTOWALL_BASE_URL`
   2. 重新构建并部署

#### 十六、已知限制

1. 当前同步链路默认只处理图片，不处理 Live Photo 视频文件（`videoSrc` 不自动生成）。
2. 多实例并发部署时，建议后续增加分布式锁，避免跨实例同时跑同步任务。
3. 超大目录首跑时间可能较长，建议在低峰执行首次同步。

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

# OneDrive 同步
ONEDRIVE_SYNC_ENABLED=true
ONEDRIVE_SYNC_POLL_INTERVAL_SECONDS=600
ONEDRIVE_TENANT_ID=consumers
ONEDRIVE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_CLIENT_SECRET=your_client_secret
ONEDRIVE_DRIVE_ID=b!xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ONEDRIVE_SOURCE_FOLDER_PATH=PhotoWall
# 个人账号场景必填
ONEDRIVE_REFRESH_TOKEN=your_refresh_token
ONEDRIVE_REFRESH_SCOPE=Files.Read offline_access
ONEDRIVE_WEBHOOK_URL=https://your-domain.com/api/onedrive-sync/webhook
ONEDRIVE_WEBHOOK_CLIENT_STATE=your_random_state_value
ONEDRIVE_SUBSCRIPTION_RENEW_BEFORE_MINUTES=720

# OSS 上传写入权限（同步服务）
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=myblog-photowall
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
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
- `onedrive_sync_state` - OneDrive 增量游标/订阅/同步状态
- `onedrive_sync_items` - OneDrive 文件索引（id/etag/baseName）

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

-- OneDrive 同步状态表
CREATE TABLE onedrive_sync_state (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    folder_item_id TEXT,
    delta_link TEXT,
    subscription_id TEXT,
    subscription_expiration TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OneDrive 文件索引表
CREATE TABLE onedrive_sync_items (
    drive_item_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    base_name TEXT NOT NULL,
    etag TEXT,
    last_modified_at TIMESTAMPTZ,
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
| PATCH | `/api/photos/visibility` | 设置单张照片是否展示（管理员） |
| GET | `/api/onedrive-sync/status` | 获取 OneDrive 同步状态（管理员） |
| POST | `/api/onedrive-sync/run` | 手动触发同步（管理员） |
| POST | `/api/onedrive-sync/subscription/renew` | 强制续订 OneDrive Webhook（管理员） |
| GET | `/api/onedrive-sync/webhook` | Graph 回调验证 |
| POST | `/api/onedrive-sync/webhook` | Graph 变更通知回调 |

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
