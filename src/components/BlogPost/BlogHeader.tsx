import React from 'react';
import { motion } from 'framer-motion';
import { List } from 'lucide-react';
import { ProgressiveImage } from '../ProgressiveImage';
import { getFrontendHeaderGradientToClass } from '../../utils/theme';

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
  showTocToggle: boolean;
  onTocToggle: () => void;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({ 
  post, 
  views, 
  viewsError,
  darkMode,
  showTocToggle, 
  onTocToggle 
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
          getFrontendHeaderGradientToClass(darkMode)
        }`}
      />
      
      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 mt-10">
        {/* 标题底色框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-md px-6 py-4 rounded-2xl border shadow-lg mb-6 ${
            darkMode ? 'bg-[#111111]/85 border-white/10' : 'bg-white/90 border-gray-200'
          }`}
        >
          {/* 标题 */}
          <h1
            className={`text-2xl md:text-4xl font-bold text-center max-w-4xl leading-tight tracking-tighter ${
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
          className={`flex gap-4 font-mono text-sm uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-sm border shadow-sm ${
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

      {/* Mobile TOC Toggle */}
      {showTocToggle && (
        <button
          onClick={onTocToggle}
          className={`absolute top-24 left-4 sm:top-8 sm:left-8 backdrop-blur-md p-3 rounded-full transition-all border hover:scale-105 z-20 lg:hidden shadow-sm ${
            darkMode
              ? 'text-white/70 bg-[#111111]/75 hover:bg-[#111111]/90 border-white/10'
              : 'text-gray-700 bg-white/80 hover:bg-white border-gray-200'
          }`}
        >
          <List size={24} />
        </button>
      )}
    </div>
  );
};
