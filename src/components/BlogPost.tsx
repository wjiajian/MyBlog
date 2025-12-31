import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';
import { posts } from '../data/posts';
import { ArrowLeft, List, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// ====== 可配置项：默认文章头图 ======
// 当文章未配置 headerImage 时使用此默认头图
const DEFAULT_HEADER_IMAGE = '/resources/back_1.jpg';

// ====== 自定义 Pre 组件 ======
// 统一处理代码块外框、标题栏和复制功能
const PreBlock: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const preRef = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // 解析子元素 (code) 的 props
  let language = 'text';
  let isPlainText = true;
  
  if (React.isValidElement(children) && children.type === 'code') {
     const childProps = children.props as any;
     const className = childProps.className || '';
     const match = /language-(\w+)/.exec(className);
     if (match) {
        language = match[1];
        isPlainText = false;
     } else if (className === 'language-text' || className === 'language-plaintext') {
        language = 'text';
        isPlainText = true;
     }
  }

  // 复制功能：直接从 dom 节点获取文本，避免格式问题
  const handleCopy = useCallback(async () => {
    if (!preRef.current) return;
    try {
      const text = preRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // 语言显示名称映射
  const languageNames: Record<string, string> = {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    py: 'Python',
    python: 'Python',
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    css: 'CSS',
    html: 'HTML',
    sql: 'SQL',
    md: 'Markdown',
    markdown: 'Markdown',
    text: 'Text',
    plaintext: 'Text',
  };
  
  const displayName = languageNames[language] || language.toUpperCase();

  return (
    <div className="relative group rounded-lg border border-gray-200 bg-[#f6f8fa] mb-6 overflow-hidden">
      {/* 代码块头部 */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100/50 border-b border-gray-200">
        <span className="text-xs font-mono text-gray-500 font-medium">{displayName}</span>
        
        {!isPlainText && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            title="复制代码"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600" />
                <span className="text-xs text-green-600 font-medium">已复制</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs">复制</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 代码内容容器 */}
      {/* 使用 !m-0 !p-4 !bg-transparent 等样式覆盖 index.css 中的默认 pre 样式 */}
      {/* 注意：这里的 ref 绑定到内部的 pre 上，用于获取 innerText */}
      <pre 
        ref={preRef} 
        className="!m-0 !p-4 !bg-transparent !border-0 overflow-x-auto font-mono text-sm leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
};

// ====== 可配置项：目录提取 ======
interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 从 Markdown 内容中提取标题生成目录
// ====== 改进：排除代码块，但保留行内代码内容 ======
function extractToc(content: string): TocItem[] {
  // 1. 只移除代码块（```...```），不移除行内代码
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
  
  // 2. 提取标题（只匹配行首的 # 开头的标题）
  
  // 重新实现循环逻辑以避免逻辑混乱
  return (() => {
      const result: TocItem[] = [];
      const counts: Record<string, number> = {};
      const regex = /^(#{1,3})\s+(.+)$/gm;
      let m;
  
      while ((m = regex.exec(contentWithoutCodeBlocks)) !== null) {
        const level = m[1].length;
        const rawText = m[2].trim();
        const displayText = rawText.replace(/`([^`]+)`/g, '$1');
        
        const baseId = displayText
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        if (!baseId) continue;
  
        let uniqueId = baseId;
        if (counts[baseId]) {
           uniqueId = `${baseId}-${counts[baseId]}`;
           counts[baseId]++;
        } else {
           counts[baseId] = 1;
        }
        
        result.push({ id: uniqueId, text: displayText, level });
      }
      return result;
  })();
}

export const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = posts.find(p => p.id === id);
  const [activeId, setActiveId] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);

  // 提取目录
  const toc = useMemo(() => {
    if (post?.content) {
      return extractToc(post.content);
    }
    return [];
  }, [post?.content]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // 监听滚动，高亮当前标题
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
      let currentId = '';
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 150) {
          currentId = heading.id;
        }
      });
      
      setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!post) {
    return (
      // ====== 可配置项：亮色主题 404 页面 ======
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    // ====== 可配置项：亮色主题页面背景 ======
    <div className="min-h-screen bg-[#f8f9fa] pb-20 selection:bg-blue-500/20">
      {/* Header Image with Title */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img 
          src={post.headerImage || DEFAULT_HEADER_IMAGE} 
          alt={post.title} 
          // ====== 可配置项：亮色主题封面图片 ======
          // 优先使用 headerImage，未设置时使用 DEFAULT_HEADER_IMAGE
          className="w-full h-full object-cover opacity-80"
        />
        {/* 亮色主题渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#f8f9fa]" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4 mt-10">
          {/* ====== 可配置项：亮色主题标题底色框 ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-200 shadow-lg mb-6"
          >
            {/* ====== 可配置项：亮色主题标题字号 ====== */}
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 text-center max-w-4xl leading-tight tracking-tighter">
              {post.title}
            </h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 text-gray-600 font-mono text-sm uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200 shadow-sm"
          >
            <span>{post.date}, {post.year}</span>
          </motion.div>
        </div>

        {/* Back Button */}
        <Link 
          to="/" 
          className="absolute top-8 left-8 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-md p-3 rounded-full transition-all border border-gray-200 hover:scale-105 z-20 group shadow-sm"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        {toc.length > 0 && (
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="absolute top-8 right-8 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-md p-3 rounded-full transition-all border border-gray-200 hover:scale-105 z-20 lg:hidden shadow-sm"
          >
            <List size={24} />
          </button>
        )}
      </div>

      {/* Content with TOC */}
      {/* ====== 可配置项：内容区域布局 ====== */}
      <div className="relative -mt-20 z-10 px-4 lg:px-8">
        {/* 文章正文居中容器 */}
        <div className="max-w-4xl mx-auto relative">

          {/* Main Content */}
          {/* ====== 可配置项：文章内容区域 ====== */}
          <motion.article 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            // ====== 可配置项：亮色主题文章卡片 ======
            className="w-full max-w-4xl bg-white border border-gray-200 p-6 md:p-10 lg:p-12 rounded-2xl shadow-lg min-h-[50vh]"
          >
            {/* Markdown 样式在 index.css 中覆盖 */}
            <div className="markdown-body !bg-transparent !font-sans">
              {post.content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeSlug]}
                  components={{
                    // 自定义代码块组件：只替换 pre，因为我们的 PreBlock 内部处理了 code 的显示
                    pre: PreBlock,
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic text-center py-10">
                  Content placeholder. Add markdown content to posts.ts to see it here.
                </p>
              )}
            </div>
          </motion.article>

          {/* Table of Contents - Desktop (Fixed on right side) */}
          {/* ====== 可配置项：目录栏 ====== */}
          {toc.length > 0 && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              // ====== 目录使用 fixed 定位，始终跟随滚动 ======
              // 使用 calc 确保在大屏幕上不会与内容重叠
              className="hidden xl:block fixed top-24 w-56 z-20"
              style={{ 
                // 计算位置：页面中心 + 文章半宽 + 间距
                left: 'calc(50% + 28rem + 2rem)'
              }}
            >

                {/* ====== 可配置项：亮色主题目录栏 ====== */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 max-h-[70vh] overflow-y-auto scrollbar-hide shadow-lg">
                  <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <List size={16} />
                    目录
                  </h3>
                  <nav className="space-y-2">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(item.id);
                          if (element) {
                            // 计算滚动位置，添加顶部偏移量
                            const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                          }
                        }}
                        // ====== 可配置项：目录项样式 ======
                        className={`block text-sm transition-all duration-200 rounded-lg px-3 py-1.5 ${
                          item.level === 1 ? 'font-medium' : ''
                        } ${
                          item.level === 2 ? 'pl-5' : ''
                        } ${
                          item.level === 3 ? 'pl-7 text-xs' : ''
                        } ${
                          activeId === item.id
                            ? 'text-blue-700 bg-blue-50 border-l-2 border-blue-700 font-medium'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
            </motion.aside>

          )}
        </div>
      </div>

      {/* Mobile TOC Drawer */}
      {toc.length > 0 && isTocOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsTocOpen(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 h-full w-72 bg-[#141414] border-l border-white/10 p-6 overflow-y-auto"
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <List size={20} />
              目录
            </h3>
            <nav className="space-y-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTocOpen(false);
                    setTimeout(() => {
                      const element = document.getElementById(item.id);
                      if (element) {
                        const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                  className={`block text-sm transition-colors py-2 ${
                    item.level === 2 ? 'pl-4' : ''
                  } ${
                    item.level === 3 ? 'pl-8 text-xs' : ''
                  } ${
                    activeId === item.id
                      ? 'text-white font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
