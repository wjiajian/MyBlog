import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhotoWall } from '../components/PhotoWall';
import type { PhotoItem } from '../components/PhotoWall';
import { ArrowLeft, Grid3X3, LayoutGrid, Rows3, Film, Sun, Moon } from 'lucide-react';
import imagesMetadata from '../../public/photowall/images-metadata.json';

export const GalleryPage: React.FC = () => {
  const [columns, setColumns] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  // 主题状态：默认暗色（照片墙页面）
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('gallery-theme');
    return saved !== 'light'; // 默认暗色
  });

  // 保存主题偏好到localStorage
  useEffect(() => {
    localStorage.setItem('gallery-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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

  // 主题样式
  const theme = {
    page: darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-gray-900',
    header: darkMode ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-gray-200',
    backLink: darkMode ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900',
    controlBg: darkMode ? 'bg-white/5' : 'bg-gray-100',
    controlBtn: (active: boolean) => active 
      ? (darkMode ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-900')
      : (darkMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'),
    stats: darkMode ? 'text-white/50' : 'text-gray-500',
    statsHighlight: darkMode ? 'text-white' : 'text-gray-900',
    spinner: darkMode ? 'border-white/20 border-t-white' : 'border-gray-200 border-t-gray-600',
    footer: darkMode ? 'border-white/10' : 'border-gray-200',
    footerText: darkMode ? 'text-white/40' : 'text-gray-500',
    kbd: darkMode ? 'bg-white/10' : 'bg-gray-200',
  };

  return (
    <div className={`min-h-screen ${theme.page}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${theme.header}`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <a 
              href="/"
              className={`flex items-center gap-2 transition-colors group ${theme.backLink}`}
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">返回首页</span>
            </a>

            {/* 标题 */}
            <h1 className="text-xl font-bold tracking-tight">
            📸 Photo Wall
            </h1>

            {/* 右侧控制区 */}
            <div className="flex items-center gap-3">
              {/* 主题切换按钮 */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${theme.controlBg} hover:opacity-80`}
                title={darkMode ? '切换到亮色主题' : '切换到暗色主题'}
              >
                {darkMode ? (
                  <Sun size={18} className="text-yellow-400" />
                ) : (
                  <Moon size={18} className="text-gray-600" />
                )}
              </button>

              {/* 列数控制 */}
              <div className={`flex items-center gap-2 rounded-lg p-1 ${theme.controlBg}`}>
                <button
                  onClick={() => setColumns(3)}
                  className={`p-2 rounded transition-colors cursor-pointer ${theme.controlBtn(columns === 3)}`}
                  title="3 列"
                >
                  <Rows3 size={18} />
                </button>
                <button
                  onClick={() => setColumns(4)}
                  className={`p-2 rounded transition-colors cursor-pointer ${theme.controlBtn(columns === 4)}`}
                  title="4 列"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setColumns(5)}
                  className={`p-2 rounded transition-colors cursor-pointer ${theme.controlBtn(columns === 5)}`}
                  title="5 列"
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
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
          <p className={`text-sm ${theme.stats}`}>
            共 <span className={`font-medium ${theme.statsHighlight}`}>{images.length}</span> 张照片
          </p>
          {livePhotoCount > 0 && (
            <div className={`flex items-center gap-1 text-sm ${theme.stats}`}>
              <Film size={14} />
              <span><span className={`font-medium ${theme.statsHighlight}`}>{livePhotoCount}</span> 张实况照片</span>
            </div>
          )}
        </motion.div>

        {/* 照片墙 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className={`animate-spin rounded-full h-8 w-8 border-2 ${theme.spinner}`}></div>
          </div>
        ) : (
          <PhotoWall images={images} columns={columns} />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 mt-16 ${theme.footer}`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 text-center">
          <p className={`text-sm ${theme.footerText}`}>
            按 <kbd className={`px-2 py-1 rounded text-xs ${theme.kbd}`}>Esc</kbd> 关闭预览，
            使用 <kbd className={`px-2 py-1 rounded text-xs ${theme.kbd}`}>←</kbd> <kbd className={`px-2 py-1 rounded text-xs ${theme.kbd}`}>→</kbd> 切换图片
          </p>
          {livePhotoCount > 0 && (
            <p className={`text-xs mt-2 ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
              悬停在 <span className="inline-flex items-center gap-1"><Film size={10} /> LIVE</span> 标记的图片上可预览实况照片
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};
