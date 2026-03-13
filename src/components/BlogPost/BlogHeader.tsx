import React from 'react';
import { motion } from 'framer-motion';
import { ProgressiveImage } from '../ProgressiveImage';

// ====== 可配置项：默认文章头图 ======
const DEFAULT_HEADER_IMAGE = '/resources/back_1.jpg';

interface BlogHeaderProps {
  post: {
    title: string;
    headerImage?: string;
    date: string;
    year: string | number;
  };
  views: number | null;
  viewsError?: string | null;
  darkMode: boolean;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({ 
  post, 
  views, 
  viewsError,
  darkMode
}) => {
  return (
    <div className="relative h-[50vh] w-full overflow-hidden">
      {/* 优先使用 headerImage，未设置时使用 DEFAULT_HEADER_IMAGE */}
      <ProgressiveImage 
        src={post.headerImage || DEFAULT_HEADER_IMAGE} 
        alt={post.title} 
        className="w-full h-full opacity-80"
        placeholderColor={darkMode ? '#1a1a1a' : '#e0e0e0'}
      />
      {/* 主题感知渐变遮罩 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/35 via-transparent ${
          darkMode ? 'to-[#0a0a0a]' : 'to-[#f8f9fa]'
        }`}
      />
      
      <div className="absolute inset-0 flex flex-col justify-center items-center px-3 sm:px-4 mt-8 sm:mt-10">
        {/* 标题底色框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-[92vw] sm:max-w-4xl backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border shadow-lg mb-4 sm:mb-6 ${
            darkMode ? 'bg-[#111111]/85 border-white/10' : 'bg-white/90 border-gray-200'
          }`}
        >
          {/* 标题 */}
          <h1
            className={`text-2xl md:text-4xl font-bold text-center leading-tight tracking-tighter break-words ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {post.title}
          </h1>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[11px] sm:text-sm uppercase tracking-[0.18em] sm:tracking-widest px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm border shadow-sm ${
            darkMode
              ? 'text-white/70 bg-[#111111]/70 border-white/10'
              : 'text-gray-600 bg-white/80 border-gray-200'
          }`}
        >
          <span>{post.date}, {post.year}</span>
          {views !== null && !viewsError && <span>· {views} 次阅读</span>}
          {viewsError && <span className="text-red-500">· {viewsError}</span>}
        </motion.div>
      </div>

    </div>
  );
};
