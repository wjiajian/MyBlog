import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PhotoItem } from './types';
import { LightboxSidebar } from './LightboxSidebar';
import { formatFileSize } from '../../utils/format';

interface LightboxProps {
  images: PhotoItem[];
  selectedIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNavigate: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  selectedIndex,
  onClose,
  onPrev,
  onNext,
  onNavigate
}) => {
  const [imageLoadProgress, setImageLoadProgress] = useState(0);
  const [imageLoadedBytes, setImageLoadedBytes] = useState(0);
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false);
  const [fullImageDimensions, setFullImageDimensions] = useState<{w: number, h: number} | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const selectedImage = images[selectedIndex];

  // 使用单次 fetch + blob 加载原图并跟踪进度
  useEffect(() => {
    if (!selectedImage) return;

    const totalSize = selectedImage.size || 0;
    
    // 重置状态
    setImageLoadProgress(0);
    setImageLoadedBytes(0);
    setIsFullImageLoaded(false);
    setFullImageDimensions(null);
    
    // 释放上一次的 blob URL，避免内存泄漏
    if (fullImageUrl) {
      URL.revokeObjectURL(fullImageUrl);
      setFullImageUrl(null);
    }

    // 拉取图片并跟踪进度
    const controller = new AbortController();
    
    fetch(selectedImage.src, { signal: controller.signal })
      .then(response => {
        const reader = response.body?.getReader();
        const contentLength = parseInt(response.headers.get('Content-Length') || '0') || totalSize;
        
        if (!reader) {
          // 若 reader 不可用，则直接使用 src
          setFullImageUrl(selectedImage.src);
          setIsFullImageLoaded(true);
          setImageLoadProgress(100);
          return;
        }

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        const read = (): Promise<void> => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              // 使用已收集的分片创建 blob
              const blob = new Blob(chunks as any);
              const blobUrl = URL.createObjectURL(blob);
              setFullImageUrl(blobUrl);
              
              // 从 blob 获取图片尺寸
              const img = new Image();
              img.src = blobUrl;
              img.onload = () => {
                setFullImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                setIsFullImageLoaded(true);
                setImageLoadProgress(100);
              };
              img.onerror = () => {
                // 即使尺寸获取失败也标记为已加载
                setIsFullImageLoaded(true);
                setImageLoadProgress(100);
              };
              return;
            }
            
            chunks.push(value);
            receivedLength += value.length;
            
            const progress = contentLength > 0 ? Math.round((receivedLength / contentLength) * 100) : 0;
            setImageLoadProgress(progress);
            setImageLoadedBytes(receivedLength);
            
            return read();
          });
        };

        return read();
      })
      .catch(() => {
        // 出错时回退为直接使用 src
        setFullImageUrl(selectedImage.src);
        setIsFullImageLoaded(true);
        setImageLoadProgress(100);
      });

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage]);

  // 卸载时清理 blob URL
  useEffect(() => {
    return () => {
      if (fullImageUrl && fullImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fullImageUrl);
      }
    };
  }, [fullImageUrl]);

  if (!selectedImage) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex"
      onClick={onClose}
    >
      {/* 当前图片的模糊背景 */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${selectedImage.srcMedium || selectedImage.srcTiny || selectedImage.src})`,
          filter: 'blur(50px) brightness(0.6)',
          transform: 'scale(1.2)',
        }}
      />
      {/* 深色遮罩 */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 左箭头 */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
      >
        <ChevronLeft size={28} className="text-white" />
      </button>

      {/* 主内容区 - 图片 + EXIF面板 */}
      <div className="flex-1 flex relative z-10" onClick={(e) => e.stopPropagation()}>
        {/* 图片区域 */}
        <div className="flex-1 flex items-center justify-center p-0 relative h-full">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X size={24} className="text-white" />
          </button>

          {/* 中等缩略图占位 */}
          {!isFullImageLoaded && (
            <img
              src={selectedImage.srcMedium || selectedImage.srcTiny}
              alt={selectedImage.alt}
              className="absolute max-w-full max-h-screen object-contain"
            />
          )}

          {/* 主图 */}
          <motion.img
            key={selectedIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isFullImageLoaded ? 1 : 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={fullImageUrl || selectedImage.src}
            alt={selectedImage.alt}
            onLoad={() => setIsFullImageLoaded(true)}
            className="relative max-w-full max-h-screen object-contain shadow-2xl z-10"
          />

          {/* 加载进度指示 */}
          {!isFullImageLoaded && imageLoadProgress < 100 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm font-medium">
                {imageLoadProgress}%
              </span>
              <span className="text-white/60 text-sm">
                {formatFileSize(imageLoadedBytes)} / {formatFileSize(selectedImage.size)}
              </span>
            </div>
          )}
        </div>

        {/* 侧栏 */}
        <LightboxSidebar 
          selectedImage={selectedImage}
          fullDimensions={fullImageDimensions}
          images={images}
          currentIndex={selectedIndex}
          onNavigate={onNavigate}
        />
      </div>

      {/* 右箭头 */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-[336px] top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronRight size={28} className="text-white" />
      </button>
    </motion.div>
  );
};
