import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhotoWall } from '../components/PhotoWall';
import type { PhotoItem } from '../components/PhotoWall';
import { ArrowLeft, Grid3X3, LayoutGrid, Rows3, Film, Sun, Moon } from 'lucide-react';
import imagesMetadata from '../data/images-metadata.json';

import type { ImageMetadata } from '../types';

import { resolvePhotoAssetPaths } from '../utils/photoUrl';

import { getGalleryTheme } from '../utils/theme';

import { useDebouncedCallback } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useIsMobile';
import { useThemeMode } from '../hooks/useThemeMode';
import { GallerySkeleton } from '../components/Skeleton';

const PHOTO_ASSET_BASE_URL = import.meta.env.VITE_OSS_PHOTOWALL_BASE_URL as string | undefined;

export const GalleryPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [columns, setColumns] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [metadata, setMetadata] = useState<ImageMetadata[]>(imagesMetadata as ImageMetadata[]);
  const { darkMode, toggleDarkMode } = useThemeMode();

  // 解析图片列表
  const images = useMemo<PhotoItem[]>(() => {
    const result = metadata
      .filter(meta => meta.isVisible !== false)
      .map((meta) => {
      const resolved = resolvePhotoAssetPaths(meta, PHOTO_ASSET_BASE_URL);
      const filename = meta.filename;
      const baseName = filename.replace(/\.(jpg|jpeg|png|webp|heic|heif)$/i, '');
      
      return {
        src: resolved.src,
        srcMedium: resolved.srcMedium,
        srcTiny: resolved.srcTiny,
        alt: baseName.replace(/[-_]/g, ' '),
        filename,
        format: meta.format,
        width: meta.width,
        height: meta.height,
        size: meta.size,
        videoSrc: resolved.videoSrc,
        date: meta.date,
      };
      });
    
    // 按日期降序排序（最新优先）
    return result.sort((a, b) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      return a.filename.localeCompare(b.filename, 'zh-CN');
    });
  }, [metadata]);

  // 统计实况照片数量
  const livePhotoCount = useMemo(() => {
    return images.filter(img => img.videoSrc).length;
  }, [images]);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/photos/metadata', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled && Array.isArray(data.photos)) {
          setMetadata(data.photos as ImageMetadata[]);
        }
      } catch {
        // 保留构建时元数据作为兜底，避免页面空白
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  // 响应式列数 - 使用防抖
  // 移动端强制 1 列布局，平板和桌面端需要更多列数
  const handleResize = useDebouncedCallback(() => {
    const width = window.innerWidth;
    if (width < 768) setColumns(1);  // 移动端：1 列
    else if (width < 1024) setColumns(2); // 平板：2 列
    else if (width < 1536) setColumns(4); // 桌面：4 列
    else setColumns(5); // 大屏：5 列
  }, 200);

  useEffect(() => {
    // 初始化列数
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 主题样式
  const theme = getGalleryTheme(darkMode);

  return (
    <div className={`min-h-screen ${theme.page}`}>
      {/* 头部 */}
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

            {/* 标题 - 移动端居中显示 */}
            <h1 className={`text-xl font-bold tracking-tight ${isMobile ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
              Photo Wall
            </h1>

            {/* 右侧控制区 */}
            <div className="flex items-center gap-3">
              {/* 主题切换按钮 */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${theme.controlBg} hover:opacity-80`}
                title={darkMode ? '切换到亮色主题' : '切换到暗色主题'}
              >
                {darkMode ? (
                  <Sun size={18} className="text-yellow-400" />
                ) : (
                  <Moon size={18} className="text-gray-600" />
                )}
              </button>

              {/* 列数控制 - 移动端隐藏（固定 1 列） */}
              {!isMobile && (
                <div className={`flex items-center gap-2 rounded-lg p-1 ${theme.controlBg}`}>
                  <button
                    onClick={() => setColumns(2)}
                    className={`p-2 rounded transition-colors cursor-pointer ${theme.controlBtn(columns === 2)}`}
                    title="2 列"
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
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
          <GallerySkeleton columns={columns} />
        ) : (
          <PhotoWall images={images} columns={columns} />
        )}

      </main>

      {/* 页脚 */}
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
