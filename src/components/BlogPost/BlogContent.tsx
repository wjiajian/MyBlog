import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { CommentSection } from '../CommentSection';

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

  // 复制功能
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
      <pre 
        ref={preRef} 
        className="!m-0 !p-4 !bg-transparent !border-0 overflow-x-auto font-mono text-sm leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
};

interface BlogContentProps {
  post: {
    id: string;
    content?: string;
  };
}

export const BlogContent: React.FC<BlogContentProps> = ({ post }) => {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-4xl bg-white border border-gray-200 p-6 md:p-10 lg:p-12 rounded-2xl shadow-lg min-h-[50vh]"
    >
      {/* Markdown 样式在 index.css 中覆盖 */}
      <div className="markdown-body !bg-transparent !font-sans">
        {post.content ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            components={{
              // 自定义代码块组件
              pre: PreBlock,
              // 自定义图片组件：添加懒加载支持
              img: ({ src, alt, ...props }) => (
                <img 
                  src={src} 
                  alt={alt || ''} 
                  loading="lazy"
                  className="rounded-lg"
                  {...props}
                />
              ),
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

      {/* 评论区 */}
      <CommentSection postId={post.id} />
    </motion.article>
  );
};
