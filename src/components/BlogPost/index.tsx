import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePost } from '../../hooks/usePosts';

import { BlogHeader } from './BlogHeader';
import { TableOfContents } from './TableOfContents';
import { extractToc } from './toc';
import { BlogContent } from './BlogContent';
import { Header } from '../Header';
import { useThemeMode } from '../../hooks/useThemeMode';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getFrontendPageClass } from '../../utils/theme';

export const BlogPost: React.FC = () => {
  const { darkMode } = useThemeMode();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  // 从 URL 路径解析 type (如 /tech/xxx 或 /life/xxx)
  const type = location.pathname.startsWith('/life') ? 'life' : 'tech';
  const { post, isLoading, error } = usePost(type, id);
  const [activeId, setActiveId] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const [viewsError, setViewsError] = useState<string | null>(null);
  const [viewsPostId, setViewsPostId] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  // 提取目录
  const toc = post?.content ? extractToc(post.content) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  usePageTitle(post?.title);

  // 获取并增加浏览量
  useEffect(() => {
    if (!post?.id) return;

    let isActive = true;
    fetch(`/api/pageview?id=${post.id}`, { method: 'POST' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch views');
        }
        if (isActive && data.views !== undefined) {
          setViewsError(null);
          setViews(data.views);
          setViewsPostId(post.id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch views:', err);
        if (isActive) {
          setViews(null);
          setViewsError('浏览量加载失败');
          setViewsPostId(post.id);
        }
      });

    return () => {
      isActive = false;
    };
  }, [post?.id]);
  const activeViews = viewsPostId === post?.id ? views : null;
  const activeViewsError = viewsPostId === post?.id ? viewsError : null;

  // 监听滚动，高亮当前标题并计算阅读进度
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

      // 计算阅读进度
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化进度
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 加载状态
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col ${getFrontendPageClass(darkMode)}`}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
        </div>
      </div>
    );
  }

  // 错误或未找到
  if (error || !post) {
    return (
      <div className={`min-h-screen flex flex-col ${getFrontendPageClass(darkMode)}`}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{error || 'Post not found'}</h1>
            <Link
              to="/"
              className={`transition-colors underline ${
                darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 selection:bg-blue-500/20 ${getFrontendPageClass(darkMode, false)}`}>
      <Header />
      <BlogHeader 
        post={post} 
        views={activeViews}
        viewsError={activeViewsError}
        darkMode={darkMode}
        showTocToggle={toc.length > 0} 
        onTocToggle={() => setIsTocOpen(!isTocOpen)} 
      />

      <div className="relative -mt-20 z-10 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto relative">
          <BlogContent post={post} darkMode={darkMode} />
          
          <TableOfContents 
            toc={toc} 
            activeId={activeId} 
            readProgress={readProgress} 
            darkMode={darkMode}
            isMobileOpen={isTocOpen} 
            onMobileClose={() => setIsTocOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};
