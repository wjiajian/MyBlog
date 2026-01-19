import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, List } from 'lucide-react';
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
  showTocToggle: boolean;
  onTocToggle: () => void;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({ 
  post, 
  views, 
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
        placeholderColor="#e0e0e0"
      />
      {/* 亮色主题渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#f8f9fa]" />
      
      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 mt-10">
        {/* 标题底色框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-200 shadow-lg mb-6"
        >
          {/* 标题 */}
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
          {views !== null && <span>· {views} 次阅读</span>}
        </motion.div>
      </div>

      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-md p-3 rounded-full transition-all border border-gray-200 hover:scale-105 z-20 group shadow-sm"
      >
        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </Link>

      {/* Mobile TOC Toggle */}
      {showTocToggle && (
        <button
          onClick={onTocToggle}
          className="absolute top-8 right-8 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-md p-3 rounded-full transition-all border border-gray-200 hover:scale-105 z-20 lg:hidden shadow-sm"
        >
          <List size={24} />
        </button>
      )}
    </div>
  );
};
