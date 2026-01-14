import mcpMd from "../content/mcp.md";
// import geminiCliMd from "../content/gemini-cli.md";
import koishiMd from "../content/koishi.md";
// import opencodeMd from "../content/opencode.md";
// import unstructuredMd from "../content/unstructured.md";
import hexoBlogMd from "../content/hexo-blog.md";
import dingdingKnowledgeMd from "../content/dingding-knowledge.md";
import ragStage2Md from "../content/rag-stage2.md";
import ragStage3Md from "../content/rag-stage3.md";
import summary2025Md from "../content/2025.md";
import ccGitWorktreeMd from "../content/CC-Gitworktree.md";

export interface Post {
  id: string; // 唯一ID，各文章不能重复
  title: string; // 标题
  year: number; // 年份
  date: string; // 日期
  description: string; // 简介，展示在卡片背面
  coverImage: string; // 封面图，展示在卡片正面（1:1）
  headerImage?: string; // 文章头图，可选
  link: string; // 网址，格式必须是/posts/{id}
  content?: string; // import的标签
  tags?: string[]; // 标签
  categories?: string; // 分类
  type?: "tech" | "life"; // 内容类型：技术笔记 / 生活随笔，默认 tech
}

export const posts: Post[] = [
  // 2026 年文章
  {
    id: "2025-summary",
    title: "2025年总结",
    year: 2026,
    date: "Jan 07",
    description: "2025年的流水账",
    coverImage: "/images/2025-summary/coverImage.png",
    link: "/posts/2025-summary",
    content: summary2025Md,
    categories: "生活随笔",
    type: "life",
  },
  {
    id: "cc-gitworktree",
    title: "Claude Code + Git Worktree",
    year: 2026,
    date: "Jan 14",
    description: "结合 Claude Code 与 Git Worktree，实现主控-代理开发模式。",
    coverImage: "/images/CC-Gitworktree/coverImage.png",
    link: "/posts/cc-gitworktree",
    content: ccGitWorktreeMd,
    tags: ["Claude Code", "Git Worktree"],
    categories: "笔记",
    type: "tech",
  },
  // 2025 年文章
  {
    id: "rag-stage3",
    title: "Agent 学习：工程化优化与高级 RAG 技术",
    year: 2025,
    date: "Dec 08",
    description:
      "从跑通代码到解决真实世界的复杂场景。本篇深入讲解固定长度、句子级、递归等多种切分策略的适用场景，结合BM25关键词检索与语义检索构建混合检索系统，并介绍重排序技术优化Top-K检索结果，最终构建生产级RAG系统。",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    link: "/posts/rag-stage3",
    content: ragStage3Md,
    tags: ["Agent", "RAG", "文本切分", "混合检索"],
    categories: "笔记",
  },
  {
    id: "rag-stage2",
    title: "Agent 学习：构建丐版 RAG 系统",
    year: 2025,
    date: "Dec 02",
    description:
      "完全脱离框架，先手动造轮子。从零实现文本切分（固定长度、语义切分）、使用SentenceTransformer向量化、Faiss构建向量数据库、余弦相似度检索，最终通过Prompt拼接调用LLM生成答案，完整走一遍RAG系统的数据流转全流程。",
    coverImage:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
    link: "/posts/rag-stage2",
    content: ragStage2Md,
    tags: ["Agent", "RAG", "文本切分", "向量化"],
    categories: "笔记",
  },
  {
    id: "dingding-knowledge",
    title: "钉钉知识库同步与文档解析",
    year: 2025,
    date: "Nov 28",
    description:
      "解决企业知识分散在各个平台的困境。本文介绍两个项目：DingDingZhiKuTong实现钉钉知识库三步走智能增量同步，LinkContentAI通过模块化架构支持PDF/Word/PPT等多格式解析，并使用多模态大模型对文档图片进行深度分析与语义化描述。",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
    link: "/posts/dingding-knowledge",
    content: dingdingKnowledgeMd,
    tags: ["钉钉", "文档解析"],
    categories: "项目记录",
  },
  /*
  {
    id: "opencode",
    title: "Windows 上安装 OpenCode 并接入 Minimax M2",
    year: 2025,
    date: "Nov 21",
    description:
      "OpenCode是一款在终端中运行的CLI+TUI AI编程代理工具，支持快速代码生成、调试和项目分析。本文详细介绍通过curl/npm安装OpenCode、配置MiniMax M2 API Key接入大模型，以及使用winget安装Oh My Posh美化终端显示Git状态等信息。",
    coverImage: "/images/OpenCode/coverImage.png",
    link: "/posts/opencode",
    content: opencodeMd,
    tags: ["Terminal", "OpenCode", "Claude Code"],
    categories: "笔记",
  },
  */
 /*
  {
    id: "unstructured",
    title: "Unstructured 及其使用入门",
    year: 2025,
    date: "Nov 21",
    description:
      "Unstructured是一个强大的开源文档解析库，无论PDF、Word、PPT、HTML还是图片，都可以用同一个partition()函数提取结构化数据。本文介绍其核心优势（归一化接口、语义分块、元数据保留），并提供Windows下使用Scoop安装Tesseract OCR和Poppler以支持中文PDF解析的完整指南。",
    coverImage: "/images/Unstructured/coverImage.png",
    link: "/posts/unstructured",
    content: unstructuredMd,
    tags: ["Python", "Scoop", "文档解析", "Unstructured"],
    categories: "笔记",
  },
  */
  {
    id: "koishi",
    title: "通过 Docker+Koishi+NapCat 搭建 QQ 机器人",
    year: 2025,
    date: "Nov 12",
    description:
      "在Ubuntu服务器上搞定一个稳定高效的QQ机器人。本文包含完整流程：使用国内镜像安装Docker、持久化部署Koishi机器人框架、一键安装NapCat并用screen后台运行、配置OneBot正向WebSocket连接，还附带常用Docker命令参考。",
    coverImage: "/images/Koishi/coverImage.png",
    link: "/posts/koishi",
    content: koishiMd,
    tags: ["聊天机器人", "Docker"],
    categories: "笔记",
  },
  {
    id: "mcp",
    title: "MCP Server 入门体验",
    year: 2025,
    date: "Oct 30",
    description:
      "MCP是为AI应用提供标准化连接的开放协议，就像USB-C接口一样让模型连接各种数据源和工具。本文以天气查询服务为例，详解MCP Server开发：使用FastMCP定义Tools、调用外部API、配置uv环境，并展示如何在VS Code的mcp.json中集成使用。",
    coverImage: "/images/mcp/coverImage.png",
    link: "/posts/mcp",
    content: mcpMd,
    tags: ["MCP", "LLM", "VS Code"],
    categories: "笔记",
  },
  /*
  {
    id: "gemini-cli",
    title: "Gemini CLI 配置",
    year: 2025,
    date: "Oct 30",
    description:
      "Gemini CLI完整安装配置指南。包括Windows/macOS/Linux下使用nvm安装Node.js、npm全局安装@google/gemini-cli、创建Google Cloud项目并启用Gemini API、配置GOOGLE_CLOUD_PROJECT环境变量，即可开启命令行AI交互体验。",
    coverImage: "/images/Gemini CLI/coverImage.png",
    link: "/posts/gemini-cli",
    content: geminiCliMd,
    tags: ["Gemini CLI", "VS Code"],
    categories: "笔记",
  },
  */
  {
    id: "hexo-blog",
    title: "使用 Hexo 通过 GitHub Pages 搭建博客",
    year: 2025,
    date: "Oct 30",
    description:
      "使用Hexo快速搭建个人博客的完整教程。从Node.js环境准备开始，依次介绍hexo-cli安装、hexo init初始化项目、hexo server本地预览、配置hexo-deployer-git插件和_config.yml，最后通过hexo deploy一键部署到GitHub Pages，开启你的博客之旅。",
    coverImage: "/images/Blogs/coverImage.jpg",
    link: "/posts/hexo-blog",
    content: hexoBlogMd,
    tags: ["blogs", "Hexo", "Github Pages"],
    categories: "笔记",
  },
];
