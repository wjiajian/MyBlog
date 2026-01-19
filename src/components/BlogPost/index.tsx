import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { posts } from '../../data/posts';

import { BlogHeader } from './BlogHeader';
import { TableOfContents, extractToc } from './TableOfContents';
import { BlogContent } from './BlogContent';

export const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = posts.find(p => p.id === id);
  const [activeId, setActiveId] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const [readProgress, setReadProgress] = useState(0);

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

  // 获取并增加浏览量
  useEffect(() => {
    if (post?.id) {
      fetch(`/api/pageview?id=${post.id}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.views !== undefined) {
            setViews(data.views);
          }
        })
        .catch(err => console.error('Failed to fetch views:', err));
    }
  }, [post?.id]);

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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 selection:bg-blue-500/20">
      <BlogHeader 
        post={post} 
        views={views}
        showTocToggle={toc.length > 0} 
        onTocToggle={() => setIsTocOpen(!isTocOpen)} 
      />

      <div className="relative -mt-20 z-10 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto relative">
          <BlogContent post={post} />
          
          <TableOfContents 
            toc={toc} 
            activeId={activeId} 
            readProgress={readProgress} 
            isMobileOpen={isTocOpen} 
            onMobileClose={() => setIsTocOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};
