# 📘 Jiajian's Blog

这是一个基于 **React + TypeScript + Vite** 构建的现代博客网站，部署于 **Vercel**，并通过 **Cloudflare** CDN 加速。

---

## ⚡ 1. 快速上手

在开始之前，请确保你已经安装了 [Node.js](https://nodejs.org/) (推荐 18.0 或更高版本)。

### 第一步：启动网站
打开你的终端 (Visual Studio Code 的终端或者系统的 CMD/PowerShell)，运行以下命令：

1.  **安装依赖包** (就像给手机装 APP，这步只做一次)：
    ```bash
    npm install
    ```

2.  **启动开发服务器** (这一步会打开网站预览)：
    ```bash
    npm run dev
    ```

3.  如果一切顺利，你会看到终端显示 `http://localhost:5173`。按住 `Ctrl` 点击那个链接，或者在浏览器输入这个地址，就能看到你的博客了！

---

## 📂 2. 项目结构说明

```
MyBlog/
├── api/                    # Vercel Serverless API
│   ├── comments.ts         # 评论系统 API
│   └── pageview.ts         # 页面浏览量 API
├── public/
│   ├── images/             # 文章图片资源
│   ├── resources/          # 网站资源（背景/头像等）
│   ├── photowall/          # 照片墙专用资源
│   │   ├── origin/         # 原始照片（HEIC/JPG/PNG）
│   │   ├── full/           # 完整尺寸图片
│   │   ├── medium/         # 中等缩略图
│   │   └── tiny/           # 模糊预览缩略图
│   └── avatar/             # 默认头像资源
├── scripts/
│   └── process-photos.cjs  # 照片墙数据处理脚本
├── src/
│   ├── components/         # React 组件
│   │   ├── BlogPost/       # 📁 文章详情页组件集（模块化拆分）
│   │   │   ├── BlogHeader.tsx      # 文章头部（头图/标题/元信息）
│   │   │   ├── BlogContent.tsx     # Markdown 内容渲染 + 代码高亮
│   │   │   ├── TableOfContents.tsx # 文章目录（桌面侧边 + 移动抽屉）
│   │   │   └── index.tsx           # BlogPost 主入口
│   │   ├── PhotoWall/      # 📁 照片墙组件集（模块化拆分）
│   │   │   ├── PhotoGrid.tsx       # 照片网格瀑布流
│   │   │   ├── Lightbox.tsx        # 图片预览灯箱
│   │   │   ├── LightboxSidebar.tsx # 灯箱侧边栏（信息/评价切换）
│   │   │   ├── types.ts            # PhotoWall 类型定义
│   │   │   └── index.tsx           # PhotoWall 主入口
│   │   ├── Album.tsx              # 首页文章卡片
│   │   ├── CommentSection.tsx     # 评论区（亮色主题）
│   │   ├── CommentSectionBase.tsx # 🆕 评论统一基础组件（支持 variant 切换）
│   │   ├── PhotoCommentSection.tsx # 评论区（暗色主题）
│   │   ├── ContentTabs.tsx        # Tab 切换（技术/生活）
│   │   ├── Header.tsx             # 页面头部
│   │   ├── Navigation.tsx         # 导航栏
│   │   ├── ProgressiveImage.tsx   # 渐进式图片加载
│   │   ├── Skeleton.tsx           # 🆕 骨架屏组件
│   │   ├── Timeline.tsx           # 时间线组件
│   │   └── ...
│   ├── content/            # Markdown 文章内容
│   │   ├── tech/           # 技术类文章
│   │   └── life/           # 生活类文章
│   ├── data/
│   │   └── posts.ts        # 文章数据配置（中央化管理）
│   ├── hooks/              # 🆕 自定义 Hooks
│   │   └── useDebounce.ts  # 防抖回调 Hook（优化 resize 等高频事件）
│   ├── pages/              # 页面级组件
│   │   ├── HomePage.tsx    # 首页
│   │   ├── GalleryPage.tsx # 照片墙页面
│   │   ├── TimelinePage.tsx # 时间线页面
│   │   ├── About.tsx       # 关于页面
│   │   └── FriendsPage.tsx # 🆕 友链页面
│   ├── utils/              # 🆕 工具函数（统一管理）
│   │   ├── date.ts         # 日期解析工具（parseMonthFromDate, parseDate）
│   │   ├── storage.ts      # 安全 localStorage 封装（SSR 兼容）
│   │   └── theme.ts        # 主题配置工厂函数
│   ├── types/              # 🆕 TypeScript 类型定义
│   │   └── index.ts        # ImageMetadata, Comment 等接口
│   └── App.tsx             # 主应用入口
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🎯 3. 功能介绍

### 📑 Tab 切换（技术笔记 / 生活随笔）

首页支持通过 Tab 切换显示不同类型的内容：

| Tab | 说明 |
|-----|------|
| 📚 技术笔记 | 默认显示，包含技术相关文章 |
| ☕ 生活随笔 | 生活类内容，如随笔、摄影、旅行等 |

**如何设置文章类型？** 在 `posts.ts` 中添加 `type` 字段：
```typescript
{
  id: 'my-life-post',
  title: '周末随笔',
  type: 'life',  // 'tech' 或 'life'，不填默认为 'tech'
  // ...其他字段
}
```

### 📅 时间线页面

通过导航栏的 **时间线** 按钮进入，按年份展示所有文章，支持滚动同步高亮当前年月。

### 💬 评论系统

文章底部内置匿名评论功能，用户只需填写昵称即可评论（使用 Vercel Postgres 存储）。

### 🔍 导航栏功能

右上角导航栏提供以下功能：
- **首页** - 返回主页
- **分类** - 按分类筛选文章（笔记、项目记录等）
- **搜索** - 关键词搜索文章
- **时间线** - 按时间展示所有文章
- **相册** - 照片墙页面
- **友链** - 友链页面
- **关于** - 个人介绍页面

### 📖 文章目录系统

文章详情页右侧（桌面端）或抽屉菜单（移动端）显示自动生成的目录，支持：
- 自动提取 Markdown 标题（H1-H2）
- 点击平滑滚动到对应章节
- 阅读进度高亮
- 回到顶部按钮

### 🔗 友链页面

独立的友链页面，支持：
- 卡片式布局展示友链
- 亮/暗主题自适应
- 悬停动画效果

---

## 🚀 4. 性能优化

### 文章列表懒加载

首页文章列表支持按需加载，提升首屏渲染性能：

| 功能 | 说明 |
|------|------|
| **年内分页** | 每年默认显示 4 篇文章，点击「更多文章」按钮加载更多 |
| **年份分段** | 默认显示最近 2 年，点击「加载更多年份」展开历史内容 |

### 图片加载优化

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| **懒加载** | 原生 `loading="lazy"` | 首屏加载提速 30-50% |
| **CDN 加速** | Vercel + Cloudflare | 全球访问提速 50-70% |
| **渐进式加载** | `ProgressiveImage` 组件 | Shimmer 动画 + 淡入效果 |
| **骨架屏** | `Skeleton` 组件 | 消除内容布局偏移，提升感知速度 |
| **事件防抖** | `useDebounce` Hook | 优化 Resize 等高频事件性能 |

### 代码优化
- **代码高亮** - 使用 `highlight.js` 语法高亮
- **Markdown 渲染** - 支持 GFM 扩展语法
- **动画效果** - 使用 `framer-motion` 流畅动画

---

## ✍️ 5. 教你发一篇新文章

### 第一步：写内容
1.  进入 `src/content/` 文件夹，根据文章类型选择子目录：
    - 技术文章 → `src/content/tech/`
    - 生活随笔 → `src/content/life/`
2.  新建一个文件，命名为 `my-react-journey.md`。
3.  在里面用 Markdown 写你的内容。

### 第二步：上架 (注册文章)
1.  打开 `src/data/posts.ts`。
2.  在文件最上面导入你的文章（注意路径包含子目录）：
    ```typescript
    import myJourney from '../content/tech/my-react-journey.md'; 
    ```
3.  在 `posts` 列表中添加配置：
    ```typescript
    {
      id: 'react-journey',
      title: 'React 学习之旅',
      year: 2026,
      date: 'Jan 16',
      type: 'tech',                // 'tech' 或 'life'
      description: '这是我的第一篇学习笔记...',
      coverImage: '/images/xxx/coverImage.png',
      headerImage: '/images/xxx/header.jpg',  // 可选
      link: '/posts/react-journey',
      content: myJourney,
    },
    ```

---

## 🖼️ 6. 图片管理

### 图片存放位置
- 文章图片：`public/images/[文章名]/`
- 网站资源：`public/resources/`

### 卡片封面图 & 文章头图

| 字段 | 用途 | 推荐比例 | 是否必填 |
|------|------|----------|----------|
| `coverImage` | 首页卡片封面 | 1:1 (正方形) | ✅ 必填 |
| `headerImage` | 文章详情页头图 | 16:9 (宽屏) | ❌ 可选 |

---

---

## 📷 7. 摄影墙 (Photo Wall)

本博客包含一个高级摄影墙功能，支持原生 HEIC 格式处理、EXIF 信息提取、自动缩略图生成和 Live Photo 支持。

### 🚀 快速使用

1.  **添加照片**
    *   将原始照片（HEIC, JPG, PNG, WebP）放入 `public/photowall/origin/` 文件夹。
    *   (可选) 如果是 **Live Photo**，将同名的 `.mov` 视频也放在该目录下。

2.  **生成数据**
    运行以下命令：
    ```bash
    npm run generate-metadata
    ```

3.  **完成！**
    *   脚本会自动检测 HEIC 并转换为高质量 JPEG。
    *   自动提取拍摄日期 (EXIF)。
    *   自动生成 Full（完整尺寸）、Medium（列表用）和 Tiny（模糊背景用）三种缩略图。
    *   前端会自动显示更新后的照片流。

### 🔧 核心特性
| 特性 | 说明 |
|------|------|
| **HEIC 原生支持** | 自动转码为高质量 JPEG，无需手动转换 |
| **Live Photo 支持** | 支持 `.mov` 视频文件，悬停自动播放，左上角显示 "LIVE" 标识 |
| **真·秒开体验** | 采用 Progressive Loading（渐进式加载），优先显示 Medium 缩略图 + 模糊背景 |
| **智能日期** | 优先读取 EXIF 拍摄时间，手动修改的日期会被保留 |
| **瀑布流布局** | 响应式多列布局，支持 2/3/4/5 列自适应 |
| **灯箱预览** | 点击放大查看，侧边栏显示 EXIF 信息和评论区 |
| **骨架屏** | 加载时显示 pulsating 骨架屏，提升感知速度 |

---

## 🛠️ 8. 工具函数与 Hooks

项目采用模块化设计，将工具函数、自定义 Hooks 和类型定义统一管理。

### 📦 Utils 工具函数 (`src/utils/`)

| 文件 | 函数 | 说明 |
|------|------|------|
| `storage.ts` | `safeGetItem()` | 安全读取 localStorage，兼容 SSR |
| `storage.ts` | `safeSetItem()` | 安全写入 localStorage，带异常捕获 |
| `storage.ts` | `safeRemoveItem()` | 安全删除 localStorage |
| `date.ts` | `parseMonthFromDate()` | 从日期字符串解析月份 |
| `date.ts` | `parseDate()` | 解析为月份和日期对象，支持英文月份名称 |
| `theme.ts` | `getAppTheme()` | 获取主应用布局主题（亮/暗模式） |
| `theme.ts` | `getGalleryTheme()` | 获取照片墙页面主题 |
| `theme.ts` | `getNavTheme()` | 获取导航组件主题 |

> **注意**: 始终使用 `safeGetItem/safeSetItem` 而非原生 localStorage API，以避免 SSR 错误和配额异常。

### 🪝 Hooks (`src/hooks/`)

| Hook | 用途 | 示例场景 |
|------|------|----------|
| `useDebounce` | 防抖回调函数 | 窗口 resize 事件、搜索输入 |

```typescript
// 使用示例
import { useDebounce } from '@/hooks/useDebounce';

const debouncedHandleResize = useDebounce(() => {
  // 处理 resize 逻辑
}, 200); // 200ms 延迟
```

### 📝 Types (`src/types/`)

| 类型 | 定义位置 | 说明 |
|------|----------|------|
| `ImageMetadata` | `types/index.ts` | 照片墙图片元数据接口 |
| `Comment` | `types/index.ts` | 评论接口（支持嵌套 replies） |

---

## 🌐 9. 部署

### Vercel 部署（推荐）
项目已配置 `vercel.json`，直接连接 GitHub 仓库即可自动部署。

### 环境变量
在 Vercel 控制台配置以下环境变量（用于评论和浏览量功能）：
- `POSTGRES_URL` - Vercel Postgres 连接字符串
- `ALLOWED_ORIGINS` - 允许访问评论 API 的域名白名单（逗号分隔，例如 `https://example.com,https://www.example.com`）。不设置时仅允许同源请求。

### Cloudflare 加速
1. 在 Cloudflare 添加你的域名
2. 将 DNS 指向 Vercel
3. 开启代理（橙色云朵）

---

## ❓ 常见问题 (Q&A)

*   **Q: 我改了代码，浏览器没变？**
    *   A: 按 `Ctrl + S` 保存文件了吗？或者试着刷新一下浏览器。

*   **Q: 只有文字没有样式？**
    *   A: 确保你运行了 `npm install`。

*   **Q: 打开文章显示 404？**
    *   A: 检查 `posts.ts` 里的 `link` 字段是不是 `/posts/你的ID`，ID 必须和 `id` 字段一致。

*   **Q: 评论功能不工作？**
    *   A: 确保已在 Vercel 配置了 `POSTGRES_URL` 环境变量。

---

## 📦 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 19.2.0 / ~5.9.3 |
| 构建工具 | Vite | 7.2.4 |
| 样式 | Tailwind CSS | 3.4.17 |
| 动画 | Framer Motion | 12.23.26 |
| 路由 | React Router | 7.11.0 |
| Markdown | react-markdown + remark-gfm | 10.1.0 / 4.0.1 |
| 代码高亮 | highlight.js (rehype-highlight) | 7.0.2 |
| 图标 | Lucide React | 0.561.0 |
| 后端 | Vercel Serverless Functions | - |
| 数据库 | Vercel Postgres | 0.10.0 |
| 部署 | Vercel + Cloudflare CDN | - |

---

希望这份指南对你有帮助！尽情探索吧！😉

