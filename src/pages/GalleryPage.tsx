import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhotoWall } from '../components/PhotoWall';
import type { PhotoItem } from '../components/PhotoWall';
import { ArrowLeft, Grid3X3, LayoutGrid, Rows3, Film } from 'lucide-react';
import imagesMetadata from '../../public/photowall/images-metadata.json';

export const GalleryPage: React.FC = () => {
  const [columns, setColumns] = useState(4);
  const [isLoading, setIsLoading] = useState(true);

  // 解析图片列表
  const images = useMemo<PhotoItem[]>(() => {
    // @ts-ignore
    const result = imagesMetadata.map((meta) => {
      const filename = meta.filename;
      const baseName = filename.replace(/\.(jpg|jpeg|png|webp|heic)$/i, '');
      
      return {
        src: (meta as any).src,
        srcMedium: (meta as any).srcMedium,
        srcTiny: (meta as any).srcTiny,
        alt: baseName.replace(/[-_]/g, ' '),
        filename,
        format: meta.format,
        width: meta.width,
        height: meta.height,
        size: meta.size,
        // @ts-ignore
        videoSrc: (meta as any).videoSrc,
        date: (meta as any).date,
      };
    });
    
    // Sort by date descending (newest first)
    return result.sort((a, b) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      return a.filename.localeCompare(b.filename, 'zh-CN');
    });
  }, []);

  // 统计 Live Photo 数量
  const livePhotoCount = useMemo(() => {
    return images.filter(img => img.videoSrc).length;
  }, [images]);

  // 模拟加载延迟仅用于平滑过渡
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // 响应式列数
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1536) setColumns(4);
      else setColumns(5);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <a 
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">返回首页</span>
            </a>

            {/* 标题 */}
            <h1 className="text-xl font-bold tracking-tight">
              📸 Photo Wall
            </h1>

            {/* 列数控制 */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setColumns(3)}
                className={`p-2 rounded transition-colors ${columns === 3 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="3 列"
              >
                <Rows3 size={18} />
              </button>
              <button
                onClick={() => setColumns(4)}
                className={`p-2 rounded transition-colors ${columns === 4 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="4 列"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setColumns(5)}
                className={`p-2 rounded transition-colors ${columns === 5 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="5 列"
              >
                <Grid3X3 size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
        {/* 统计信息 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <p className="text-white/50 text-sm">
            共 <span className="text-white font-medium">{images.length}</span> 张照片
          </p>
          {livePhotoCount > 0 && (
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <Film size={14} />
              <span><span className="text-white font-medium">{livePhotoCount}</span> 张实况照片</span>
            </div>
          )}
        </motion.div>

        {/* 照片墙 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : (
          <PhotoWall images={images} columns={columns} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/40 text-sm">
            按 <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> 关闭预览，
            使用 <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd> <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd> 切换图片
          </p>
          {livePhotoCount > 0 && (
            <p className="text-white/30 text-xs mt-2">
              悬停在 <span className="inline-flex items-center gap-1"><Film size={10} /> LIVE</span> 标记的图片上可预览实况照片
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};
