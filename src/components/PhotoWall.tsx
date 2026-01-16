import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Film } from 'lucide-react';

// 扩展的图片信息接口
export interface PhotoItem {
  src: string;           // Full resolution (original)
  srcMedium?: string;    // Medium thumbnail (400px) for grid
  srcTiny?: string;      // Tiny thumbnail (50px) for list
  alt: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number; // bytes
  videoSrc?: string; // Live Photo 视频源
  date?: string; // EXIF Shooting Date
}


interface PhotoWallProps {
  images: PhotoItem[];
  columns?: number;
}

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '未知';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 格式化分辨率
const formatResolution = (width?: number, height?: number): string => {
  if (!width || !height) return '未知';
  return `${width} × ${height}`;
};

// 计算像素数
const formatMegapixels = (width?: number, height?: number): string => {
  if (!width || !height) return '未知';
  const mp = (width * height) / 1000000;
  return `${mp.toFixed(1)} MP`;
};

export const PhotoWall: React.FC<PhotoWallProps> = ({ 
  images, 
  columns = 4 
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<Map<number, {w: number, h: number}>>(new Map());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  
  // States for enhanced UI
  const [activeTab, setActiveTab] = useState<'info' | 'rating'>('info');
  const [imageLoadProgress, setImageLoadProgress] = useState(0);
  const [imageLoadedBytes, setImageLoadedBytes] = useState(0);
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false);
  const [fullImageDimensions, setFullImageDimensions] = useState<{w: number, h: number} | null>(null);

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      
      switch (e.key) {
        case 'Escape':
          setSelectedIndex(null);
          break;
        case 'ArrowLeft':
          setSelectedIndex(prev => 
            prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
          );
          break;
        case 'ArrowRight':
          setSelectedIndex(prev => 
            prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
          );
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images.length]);

  // 锁定背景滚动
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedIndex]);

  // Load full resolution image with progress tracking
  useEffect(() => {
    if (selectedIndex === null) {
      setImageLoadProgress(0);
      setImageLoadedBytes(0);
      setIsFullImageLoaded(false);
      return;
    }

    const image = images[selectedIndex];
    const totalSize = image.size || 0;
    
    // Reset states
    setImageLoadProgress(0);
    setImageLoadedBytes(0);
    setIsFullImageLoaded(false);

    // Fetch image with progress tracking
    const controller = new AbortController();
    
    fetch(image.src, { signal: controller.signal })
      .then(response => {
        const reader = response.body?.getReader();
        const contentLength = parseInt(response.headers.get('Content-Length') || '0') || totalSize;
        
        if (!reader) {
          setIsFullImageLoaded(true);
          setImageLoadProgress(100);
          return;
        }

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        const read = (): Promise<void> => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              setIsFullImageLoaded(true);
              setImageLoadProgress(100);
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
        // On error, just mark as loaded
        setIsFullImageLoaded(true);
        setImageLoadProgress(100);
      });

    return () => {
      controller.abort();
    };
  }, [selectedIndex, images]);

  // Load full image dimensions
  useEffect(() => {
    if (selectedIndex === null) {
      setFullImageDimensions(null);
      return;
    }

    const img = new Image();
    img.src = images[selectedIndex].src;
    
    img.onload = () => {
      setFullImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [selectedIndex, images]);

  const handleImageLoad = useCallback((index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setLoadedImages(prev => new Set([...prev, index]));
    setImageDimensions(prev => new Map(prev).set(index, { w: img.naturalWidth, h: img.naturalHeight }));
  }, []);

  // Live Photo 悬停播放
  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
    const video = videoRefs.current.get(index);
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, []);

  const handleMouseLeave = useCallback((index: number) => {
    setHoveredIndex(index);
    const video = videoRefs.current.get(index);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setHoveredIndex(null);
  }, []);

  const navigatePrev = useCallback(() => {
    setSelectedIndex(prev => 
      prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
    );
  }, [images.length]);

  const navigateNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
    );
  }, [images.length]);

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      {/* Masonry Grid 瀑布流布局 */}
      <div 
        className="photowall-grid"
        style={{
          columnCount: columns,
          columnGap: '6px',
        }}
      >
        {images.map((image, index) => {
          const dims = imageDimensions.get(index);
          const isLivePhoto = !!image.videoSrc;
          
          return (
            <motion.div
              key={image.src}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className="photowall-item group relative mb-1.5 break-inside-avoid cursor-pointer overflow-hidden"
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              {/* 图片 - 使用中等质量缩略图 */}
              <img
                src={image.srcMedium || image.src}
                alt={image.alt}
                loading="lazy"
                onLoad={(e) => handleImageLoad(index, e)}
                className={`
                  w-full h-auto block transition-all duration-500 ease-out
                  group-hover:scale-105
                  ${loadedImages.has(index) ? 'opacity-100' : 'opacity-0'}
                  ${hoveredIndex === index && isLivePhoto ? 'opacity-0' : ''}
                `}
              />

              {/* Live Photo 视频 */}
              {isLivePhoto && (
                <video
                  ref={el => { if (el) videoRefs.current.set(index, el); }}
                  src={image.videoSrc}
                  muted
                  loop
                  playsInline
                  className={`
                    absolute inset-0 w-full h-full object-cover
                    transition-opacity duration-300
                    ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}
                  `}
                />
              )}

              {/* 加载占位 */}
              {!loadedImages.has(index) && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
              )}

              {/* Live Photo 标识 */}
              {isLivePhoto && loadedImages.has(index) && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    <Film size={12} className="text-white" />
                    <span className="text-white text-xs font-medium">LIVE</span>
                  </div>
                </div>
              )}

              {/* Hover 遮罩 - 按照参考图1样式 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* 底部信息 - 文件名 + 格式 + 分辨率 + 大小 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  {/* 文件名 (不含扩展名) */}
                  <p className="text-white text-base font-semibold truncate mb-1">
                    {image.alt || image.filename.replace(/\.(jpg|jpeg|png|webp|heic)$/i, '')}
                  </p>
                  {/* 格式 + 分辨率 + 大小 */}
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span className="uppercase">{image.format || image.filename.split('.').pop()}</span>
                    <span className="text-white/40">·</span>
                    <span>{formatResolution(image.width || dims?.w, image.height || dims?.h)}</span>
                    <span className="text-white/40">·</span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox 灯箱弹窗 - 带 EXIF 面板 */}
      <AnimatePresence>
        {selectedIndex !== null && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Current image blur background */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                // Prioritize medium thumbnail for better quality blur, fallback to tiny or src
                backgroundImage: `url(${selectedImage.srcMedium || selectedImage.srcTiny || selectedImage.src})`,
                filter: 'blur(50px) brightness(0.6)',
                transform: 'scale(1.2)',
              }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* 左箭头 */}
            <button
              onClick={(e) => { e.stopPropagation(); navigatePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>

            {/* 主内容区 - 图片 + EXIF面板 */}
            <div className="flex-1 flex relative z-10" onClick={(e) => e.stopPropagation()}>
              {/* 图片区域 */}
              <div className="flex-1 flex items-center justify-center p-0 relative h-full">
                {/* 关闭按钮 - 在图片区域内 */}
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <X size={24} className="text-white" />
                </button>

                {/* Medium Thumbnail Placeholder (Pre-display) */}
                {/* Displayed underneath the main image until main image loads (or covering blank space) */}
                <img
                  src={selectedImage.srcMedium || selectedImage.srcTiny}
                  alt={selectedImage.alt}
                  className="absolute max-w-full max-h-screen object-contain opacity-100" // Always visible behind, main image covers it
                  style={{ filter: isFullImageLoaded ? 'none' : 'blur(5px)' }} // Optional: slight blur if medium is too low res, but 800px is fine. Let's remove blur.
                />

                {/* Main image */}
                <motion.img
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isFullImageLoaded ? 1 : 0, scale: 1 }} // Only show when loaded to prevent partial rendering? Or standard fade in.
                  // Better UX: Fade in ON TOP of the placeholder.
                  transition={{ duration: 0.3 }}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  onLoad={() => setIsFullImageLoaded(true)}
                  className="relative max-w-full max-h-screen object-contain shadow-2xl z-10"
                />

                {/* Load progress indicator */}
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

              {/* EXIF 信息面板 - 按照参考图2样式 */}
              <div className="w-80 bg-[#1a1a1a] border-l border-white/10 flex flex-col h-screen">
                <div className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Tab switcher */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                        ${activeTab === 'info' 
                          ? 'bg-white/15 text-white' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                    >
                      信息
                    </button>
                    <button
                      onClick={() => setActiveTab('rating')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                        ${activeTab === 'rating' 
                          ? 'bg-white/15 text-white' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                    >
                      评价
                    </button>
                  </div>

                  {activeTab === 'info' ? (
                  <>
                  {/* 基本信息 */}
                  <div className="mb-6">
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">基本信息</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">文件名</span>
                        <span className="text-white text-sm font-medium">{selectedImage.filename.replace(/\.(jpg|jpeg|png|webp|heic)$/i, '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">格式</span>
                        <span className="text-white text-sm uppercase">{selectedImage.format || selectedImage.filename.split('.').pop()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">尺寸</span>
                        <span className="text-white text-sm">{formatResolution(fullImageDimensions?.w || selectedImage.width, fullImageDimensions?.h || selectedImage.height)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">文件大小</span>
                        <span className="text-white text-sm">{formatFileSize(selectedImage.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">像素</span>
                        <span className="text-white text-sm">{formatMegapixels(fullImageDimensions?.w || selectedImage.width, fullImageDimensions?.h || selectedImage.height)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">拍摄日期</span>
                        <span className="text-white text-sm tabular-nums">
                          {selectedImage.date 
                            ? selectedImage.date.split(' ')[0].replace(/:/g, '-')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 底部索引 */}
                  <div className="text-white/40 text-xs text-center pt-4 border-t border-white/10 mt-4">
                    {selectedIndex + 1} / {images.length}
                  </div>

                  {/* 缩略图预览栏 - 显示所有图片 */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col flex-1 min-h-0">
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">快速预览</h3>
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-hide">
                      {images.map((image, i) => {
                        // Only show thumbnails within +/- 10 range
                        if (Math.abs(i - selectedIndex) > 10) return null;
                        
                        const isActive = i === selectedIndex;
                        return (
                          <div
                            key={image.src}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(i);
                            }}
                            className={`
                              relative flex items-center gap-3 p-2 rounded-lg cursor-pointer
                              transition-all duration-200
                              ${isActive 
                                ? 'bg-white/15 ring-2 ring-white/50' 
                                : 'bg-white/5 hover:bg-white/10'
                              }
                            `}
                          >
                            {/* 缩略图 - 使用最小质量缩略图 */}
                            <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden">
                              <img
                                src={image.srcTiny || image.src}
                                alt={image.alt}
                                className="w-full h-full object-cover"
                              />
                              {/* Live Photo 标识 */}
                              {image.videoSrc && (
                                <div className="absolute top-1 left-1">
                                  <Film size={10} className="text-white drop-shadow-lg" />
                                </div>
                              )}
                            </div>
                            
                            {/* 图片信息 */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/70'}`}>
                                {image.alt || image.filename.replace(/\.(jpg|jpeg|png|webp|heic)$/i, '')}
                              </p>
                              <p className="text-white/40 text-xs">
                                {i + 1} / {images.length}
                              </p>
                            </div>
                            
                            {/* 当前选中指示器 */}
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  </>
                  ) : (
                  /* Rating tab content */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="text-white/30 text-sm">
                      <p className="mb-2">评价功能即将推出</p>
                      <p className="text-xs text-white/20">敬请期待</p>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右箭头 */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateNext(); }}
              className="absolute right-[336px] top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
