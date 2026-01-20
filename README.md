# 📘 Jiajian Blog (新手入门指南)

欢迎！这是一个基于 **React + TypeScript + Vite** 构建的现代博客网站，部署于 **Vercel**，并通过 **Cloudflare** CDN 加速。

---

## ⚡ 1. 快速上手 (Quick Start)

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
│   └── avatar/             # 默认头像资源
├── scripts/
│   └── process-photos.cjs  # 照片墙数据处理脚本
├── src/
│   ├── components/         # React 组件
│   │   ├── BlogPost/       # 文章详情页组件集
│   │   ├── PhotoWall/      # 照片墙组件集
│   │   ├── Album.tsx       # 首页文章卡片
│   │   ├── CommentSection.tsx  # 评论区组件
│   │   ├── Navigation.tsx  # 导航栏
│   │   ├── Skeleton.tsx    # 骨架屏组件
│   │   └── ...
│   ├── content/            # Markdown 文章内容
│   │   ├── tech/           # 技术类文章
│   │   └── life/           # 生活类文章
│   ├── data/posts.ts       # 文章数据配置
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面级组件
│   ├── utils/              # 工具函数 (日期/存储/主题)
│   ├── types/              # TypeScript 类型定义
│   └── App.tsx             # 主应用入口
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
- **关于** - 个人介绍页面

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

本项目包含一个高级摄影墙功能，支持原生 HEIC 格式处理、EXIF 信息提取和自动缩略图生成。

### 🚀 快速使用

1.  **添加照片**
    *   将原始照片（HEIC, JPG, PNG, WebP）放入 `public/photowall/origin/` 文件夹。
    *   (可选) 如果是 Live Photo，将同名的 `.mov` 视频也放在该目录下。

2.  **生成数据**
    运行以下命令：
    ```bash
    npm run generate-metadata
    ```

3.  **完成！**
    *   脚本会自动检测 HEIC 并转换为高质量 JPEG。
    *   自动提取拍摄日期 (EXIF)。
    *   自动生成 Medium (列表用) 和 Tiny (模糊背景用) 两种缩略图。
    *   前端会自动显示更新后的照片流。

### 🔧 核心特性
*   **HEIC 原生支持**: 自动转码，无需手动转换。
*   **真·秒开体验**: 采用 Progressive Loading（渐进式加载），优先显示 Medium 缩略图 + 模糊背景，后台静默加载原图。
*   **智能日期**: 优先读取 EXIF 拍摄时间，如果手动修改了 JSON 中的日期，脚本会智能保留，不会覆盖。

---

## 🌐 8. 部署

### Vercel 部署（推荐）
项目已配置 `vercel.json`，直接连接 GitHub 仓库即可自动部署。

### 环境变量
在 Vercel 控制台配置以下环境变量（用于评论和浏览量功能）：
- `POSTGRES_URL` - Vercel Postgres 连接字符串

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

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 样式 | Tailwind CSS |
| 动画 | Framer Motion |
| Markdown | react-markdown + remark-gfm |
| 代码高亮 | highlight.js |
| 后端 | Vercel Serverless Functions |
| 数据库 | Vercel Postgres |
| 部署 | Vercel + Cloudflare CDN |

---

希望这份指南对你有帮助！尽情探索吧！😉

