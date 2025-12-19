import mcpMd from '../content/mcp.md';
import geminiCliMd from '../content/gemini-cli.md';
import koishiMd from '../content/koishi.md';
import opencodeMd from '../content/opencode.md';
import unstructuredMd from '../content/unstructured.md';
import hexoBlogMd from '../content/hexo-blog.md';
import dingdingKnowledgeMd from '../content/dingding-knowledge.md';
import ragStage2Md from '../content/rag-stage2.md';
import ragStage3Md from '../content/rag-stage3.md';

export interface Post {
  id: string;
  title: string;
  year: number;
  date: string;
  description: string;
  coverImage: string;
  link: string;
  content?: string; // Markdown content
  tags?: string[];
  categories?: string;
}

export const posts: Post[] = [
  // 2025 年文章
  {
    id: 'rag-stage3',
    title: 'Agent 学习：工程化优化与高级 RAG 技术',
    year: 2025,
    date: 'Dec 08',
    description: '掌握高级切分策略、混合检索、重排序等先进技术，构建生产级 RAG 系统。',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/rag-stage3',
    content: ragStage3Md,
    tags: ['Agent', 'RAG', '文本切分', '混合检索', '重排序'],
    categories: '笔记',
  },
  {
    id: 'rag-stage2',
    title: 'Agent 学习：构建丐版 RAG 系统',
    year: 2025,
    date: 'Dec 02',
    description: '从零搭建 RAG 系统，理解 Text → Embedding → Vector Store → Retrieval → Prompt → Generation 全流程。',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/rag-stage2',
    content: ragStage2Md,
    tags: ['Agent', 'RAG', '文本切分', '向量化'],
    categories: '笔记',
  },
  {
    id: 'dingding-knowledge',
    title: '钉钉知识库同步与文档解析',
    year: 2025,
    date: 'Nov 28',
    description: '从钉钉知识库同步到钉钉AI表格内容提取的智能化解决方案。',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/dingding-knowledge',
    content: dingdingKnowledgeMd,
    tags: ['钉钉知识库', '文档解析'],
    categories: '项目记录',
  },
  {
    id: 'opencode',
    title: 'Windows 上安装 OpenCode 并接入 Minimax M2',
    year: 2025,
    date: 'Nov 21',
    description: 'OpenCode 终端 AI 编程代理工具安装配置指南，搭配 Oh My Posh 美化终端。',
    coverImage: '/images/OpenCode/OpenCode.png',
    link: '/posts/opencode',
    content: opencodeMd,
    tags: ['Terminal', 'OpenCode', 'Claude Code', 'Vibe Coding'],
    categories: '笔记',
  },
  {
    id: 'unstructured',
    title: 'Unstructured 及其使用入门',
    year: 2025,
    date: 'Nov 21',
    description: '强大的开源文档解析库，从任意格式中提取干净的结构化数据。',
    coverImage: '/images/Unstructured/Unstructured.png',
    link: '/posts/unstructured',
    content: unstructuredMd,
    tags: ['Python', 'Scoop', '文档解析', 'Unstructured'],
    categories: '笔记',
  },
  {
    id: 'koishi',
    title: '通过 Docker+Koishi+NapCat 搭建 QQ 机器人',
    year: 2025,
    date: 'Nov 12',
    description: '在 Ubuntu 服务器上快速部署 Koishi 机器人框架，使用 NapCat 作为 QQ 适配器。',
    coverImage: '/images/Koishi/Docker&Koishi&NapCat.png',
    link: '/posts/koishi',
    content: koishiMd,
    tags: ['聊天机器人', 'Docker'],
    categories: '笔记',
  },
  {
    id: 'mcp',
    title: 'MCP Server 入门体验',
    year: 2025,
    date: 'Oct 30',
    description: 'Model Context Protocol 简介，为 AI 应用提供标准化的数据源和工具连接接口。',
    coverImage: '/images/mcp/mcp.png',
    link: '/posts/mcp',
    content: mcpMd,
    tags: ['MCP', 'LLM', 'VS Code'],
    categories: '笔记',
  },
  {
    id: 'gemini-cli',
    title: 'Gemini CLI 配置',
    year: 2025,
    date: 'Oct 30',
    description: 'Gemini CLI 安装指南，配置 Google Cloud 环境实现命令行 AI 交互。',
    coverImage: '/images/Gemini CLI/gemini.png',
    link: '/posts/gemini-cli',
    content: geminiCliMd,
    tags: ['Gemini CLI', 'VS Code'],
    categories: '笔记',
  },
  {
    id: 'hexo-blog',
    title: '使用 Hexo 通过 GitHub Pages 搭建博客',
    year: 2025,
    date: 'Oct 30',
    description: '快速搭建功能强大的个人博客，部署到 GitHub Pages。',
    coverImage: '/images/Blogs/hexo&github.jpg',
    link: '/posts/hexo-blog',
    content: hexoBlogMd,
    tags: ['blogs', 'Hexo', 'Github Pages'],
    categories: '笔记',
  },
];
