import React from 'react';
import type { Post } from '../hooks/usePosts';
import { ArrowUpRight } from 'lucide-react';
import { ProgressiveImage } from './ProgressiveImage';

interface AlbumProps {
  post: Post;
  darkMode?: boolean;
}

export const Album: React.FC<AlbumProps> = ({ 
  post, 
  darkMode = false,
}) => {
  // 日期格式化：将 "Jan 07" + 2026 转换为 "2026年1月7日"
  const formatDate = (dateStr: string, year: number): string => {
    const monthMap: Record<string, number> = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    const parts = dateStr.split(' ');
    const month = monthMap[parts[0]] || 1;
    const day = parseInt(parts[1]) || 1;
    return `${year}年${month}月${day}日`;
  };

  return (
    <div className="flex flex-col">
      <div
        className="group relative z-10 w-full aspect-square rounded-2xl overflow-hidden shadow-xl border border-gray-200 cursor-pointer"
        onClick={() => {
          window.open(post.link, '_blank', 'noopener,noreferrer');
        }}
      >
        <div className="absolute inset-0">
          <ProgressiveImage 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full opacity-90 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
            placeholderColor="#f3f4f6"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-gray-700 text-sm font-medium shadow-sm">
            {formatDate(post.date, post.year)}
          </span>
        </div>

        <div className="absolute inset-0 p-5 md:p-6 bg-gradient-to-b from-black/85 via-black/65 to-black/25 backdrop-blur-sm md:backdrop-blur-md flex flex-col items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="max-h-[66.666%] overflow-hidden">
            <p className="text-white text-sm md:text-base leading-relaxed">
              {post.description || '暂无简介'}
            </p>
          </div>
          <div className="absolute left-1/2 bottom-6 -translate-x-1/2">
            <a
              href={post.link}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 transition-colors"
            >
              <span>查看详情</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <a href={post.link} target="_blank" rel="noopener noreferrer" className="block">
        <h2
          className={`mt-4 text-lg font-semibold tracking-tight leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {post.title}
        </h2>
      </a>
    </div>
  );
};
