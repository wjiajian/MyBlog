import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Post } from '../hooks/usePosts';
import { ArrowUpRight, X } from 'lucide-react';
import clsx from 'clsx';
import { ProgressiveImage } from './ProgressiveImage';

interface AlbumProps {
  post: Post;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  darkMode?: boolean;
}

export const Album: React.FC<AlbumProps> = ({ 
  post, 
  isExpanded = false, 
  onExpand, 
  onClose,
  darkMode = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 展开时自动翻转到背面
  useEffect(() => {
    if (isExpanded && !isClosing) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 200);
      return () => clearTimeout(timer);
    } else if (!isExpanded) {
      setIsFlipped(false);
      setIsClosing(false);
    }
  }, [isExpanded, isClosing]);

  // 处理关闭：先翻转回正面，再关闭
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setIsFlipped(false);
    setTimeout(() => {
      onClose?.();
    }, 400);
  };

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || isClosing) return;
    if (isExpanded) return;
    
    setIsAnimating(true);
    clickTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 400);
    
    if (onExpand) {
      onExpand();
    }
  };

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
      {/* 卡片图片区域 */}
      <motion.div 
        layoutId={`album-wrapper-${post.id}`}
        className={clsx(
          "relative perspective-1000 z-10 w-full",
          isExpanded 
            ? "h-auto aspect-[4/3]"
            : "aspect-square cursor-pointer"
        )}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => !isExpanded && setIsHovered(false)}
        onClick={handleContainerClick}
      >
        {/* CSS transform 翻转 */}
        <div
          className="w-full h-full relative preserve-3d transition-transform duration-500 ease-out"
          style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)` }}
        >
          {/* === FRONT SIDE === */}
          <div className="absolute w-full h-full backface-hidden shadow-xl rounded-2xl overflow-hidden bg-white group border border-gray-200">
            {/* Cover Image */}
            <div className="absolute inset-0">
              <ProgressiveImage 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full opacity-90 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105"
                placeholderColor="#f3f4f6"
              />
              {/* 底部轻微渐变 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* 左下角日期标签 */}
            {!isExpanded && (
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-gray-700 text-sm font-medium shadow-sm">
                  {formatDate(post.date, post.year)}
                </span>
              </div>
            )}

            {/* Hover 箭头 */}
            {!isExpanded && (
              <motion.div 
                className="absolute top-4 right-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white text-black p-2.5 rounded-full shadow-md">
                  <ArrowUpRight size={18} />
                </div>
              </motion.div>
            )}
          </div>

          {/* === BACK SIDE === */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white shadow-xl rounded-2xl p-5 md:p-8 flex flex-col justify-between border border-gray-200">
            <div className="relative z-10">
              <div className="mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tighter leading-tight">{post.title}</h3>
              </div>
              <p className="text-gray-700 text-sm md:text-base font-normal leading-relaxed max-w-2xl">
                {post.description}
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); window.location.href = post.link; }}
                className="group inline-flex items-center gap-3 text-gray-900 text-lg font-medium hover:text-blue-600 transition-colors"
              >
                <span className="border-b border-gray-900 pb-1 group-hover:border-blue-600">Read the article</span>
                <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {/* 装饰性网格 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
          </div>
        </div>

        {/* 关闭按钮 */}
        {isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="fixed top-4 right-8 text-gray-600 bg-white hover:bg-gray-100 p-3 rounded-full backdrop-blur-md transition-colors border border-gray-300 shadow-lg z-50 pointer-events-auto cursor-pointer"
          >
            <X size={24} />
          </motion.button>
        )}
      </motion.div>

      {/* 卡片外部标题（仅在非展开状态显示） */}
      {!isExpanded && (
        <motion.h2 
          layoutId={`album-title-${post.id}`}
          className={`mt-4 text-lg font-semibold tracking-tight leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {post.title}
        </motion.h2>
      )}
    </div>
  );
};
