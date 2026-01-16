import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Aperture, Clock, Film } from 'lucide-react';
import EXIF from 'exif-js';

// 扩展的图片信息接口
export interface PhotoItem {
  src: string;
  alt: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number; // bytes
  videoSrc?: string; // Live Photo 视频源
}

// EXIF 数据接口
interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  focalLength?: string;
  aperture?: string;
  exposureTime?: string;
  iso?: string;
  colorSpace?: string;
  artist?: string;
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
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isLoadingExif, setIsLoadingExif] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

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

  // 加载 EXIF 数据
  useEffect(() => {
    if (selectedIndex === null) {
      setExifData(null);
      return;
    }

    setIsLoadingExif(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = images[selectedIndex].src;
    
    img.onload = () => {
      try {
        // @ts-expect-error exif-js types are incomplete
        EXIF.getData(img, function(this: HTMLImageElement) {
          const allExif = EXIF.getAllTags(this);
          
          const data: ExifData = {
            make: allExif.Make,
            model: allExif.Model,
            software: allExif.Software,
            dateTime: allExif.DateTimeOriginal || allExif.DateTime,
            focalLength: allExif.FocalLength ? `${allExif.FocalLength}mm` : undefined,
            aperture: allExif.FNumber ? `f/${allExif.FNumber}` : undefined,
            exposureTime: allExif.ExposureTime ? 
              (allExif.ExposureTime < 1 ? `1/${Math.round(1/allExif.ExposureTime)}s` : `${allExif.ExposureTime}s`) 
              : undefined,
            iso: allExif.ISOSpeedRatings ? `ISO ${allExif.ISOSpeedRatings}` : undefined,
            colorSpace: allExif.ColorSpace === 1 ? 'sRGB' : (allExif.ColorSpace === 2 ? 'Adobe RGB' : undefined),
            artist: allExif.Artist,
          };
          
          setExifData(data);
          setIsLoadingExif(false);
        });
      } catch {
        setIsLoadingExif(false);
      }
    };

    img.onerror = () => {
      setIsLoadingExif(false);
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
  const selectedDimensions = selectedIndex !== null ? imageDimensions.get(selectedIndex) : null;

  return (
    <>
      {/* Masonry Grid 瀑布流布局 */}
      <div 
        className="photowall-grid"
        style={{
          columnCount: columns,
          columnGap: '12px',
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
              className="photowall-item group relative mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              {/* 图片 */}
              <img
                src={image.src}
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
                    <span>{formatResolution(dims?.w || image.width, dims?.h || image.height)}</span>
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
            className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedIndex(null)}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} className="text-white" />
            </button>

            {/* 左箭头 */}
            <button
              onClick={(e) => { e.stopPropagation(); navigatePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>

            {/* 主内容区 - 图片 + EXIF面板 */}
            <div className="flex-1 flex" onClick={(e) => e.stopPropagation()}>
              {/* 图片区域 */}
              <div className="flex-1 flex items-center justify-center p-8">
                <motion.img
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
              </div>

              {/* EXIF 信息面板 - 按照参考图2样式 */}
              <div className="w-80 bg-[#1a1a1a] border-l border-white/10 flex flex-col h-screen">
                <div className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
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
                        <span className="text-white text-sm">{formatResolution(selectedDimensions?.w || selectedImage.width, selectedDimensions?.h || selectedImage.height)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">文件大小</span>
                        <span className="text-white text-sm">{formatFileSize(selectedImage.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">像素</span>
                        <span className="text-white text-sm">{formatMegapixels(selectedDimensions?.w || selectedImage.width, selectedDimensions?.h || selectedImage.height)}</span>
                      </div>
                      {exifData?.colorSpace && (
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">色彩空间</span>
                          <span className="text-white text-sm">{exifData.colorSpace}</span>
                        </div>
                      )}
                      {exifData?.dateTime && (
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">拍摄时间</span>
                          <span className="text-white text-sm">{exifData.dateTime.replace(/:/g, '/').replace(' ', ' ')}</span>
                        </div>
                      )}
                      {exifData?.artist && (
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">艺术家</span>
                          <span className="text-white text-sm">{exifData.artist}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 拍摄参数 */}
                  {(exifData?.focalLength || exifData?.aperture || exifData?.exposureTime || exifData?.iso) && (
                    <div className="mb-6">
                      <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">拍摄参数</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {exifData?.focalLength && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-white/50 text-xs mb-1">焦距</div>
                            <div className="text-white text-sm font-medium">{exifData.focalLength}</div>
                          </div>
                        )}
                        {exifData?.aperture && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-white/50 text-xs mb-1">
                              <Aperture size={10} />
                              <span>光圈</span>
                            </div>
                            <div className="text-white text-sm font-medium">{exifData.aperture}</div>
                          </div>
                        )}
                        {exifData?.exposureTime && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-white/50 text-xs mb-1">
                              <Clock size={10} />
                              <span>快门</span>
                            </div>
                            <div className="text-white text-sm font-medium">{exifData.exposureTime}</div>
                          </div>
                        )}
                        {exifData?.iso && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-white/50 text-xs mb-1">ISO</div>
                            <div className="text-white text-sm font-medium">{exifData.iso}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 设备信息 */}
                  {(exifData?.make || exifData?.model || exifData?.software) && (
                    <div className="mb-6">
                      <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">设备信息</h3>
                      <div className="space-y-2">
                        {(exifData?.make || exifData?.model) && (
                          <div className="flex items-start gap-2">
                            <Camera size={14} className="text-white/50 mt-0.5" />
                            <div>
                              <div className="text-white text-sm">{exifData.make} {exifData.model}</div>
                            </div>
                          </div>
                        )}
                        {exifData?.software && (
                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">软件</span>
                            <span className="text-white text-sm text-right">{exifData.software}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 加载状态 */}
                  {isLoadingExif && (
                    <div className="text-white/40 text-sm text-center py-4">
                      正在读取 EXIF 数据...
                    </div>
                  )}

                  {/* 无 EXIF 数据提示 */}
                  {!isLoadingExif && !exifData?.make && !exifData?.focalLength && (
                    <div className="text-white/30 text-sm text-center py-4 border-t border-white/10 mt-4">
                      未检测到 EXIF 拍摄数据
                    </div>
                  )}

                  {/* 底部索引 */}
                  <div className="text-white/40 text-xs text-center pt-4 border-t border-white/10 mt-4">
                    {selectedIndex + 1} / {images.length}
                  </div>

                  {/* 缩略图预览栏 - 显示所有图片 */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col flex-1 min-h-0">
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">快速预览</h3>
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-hide">
                      {images.map((image, i) => {
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
                            {/* 缩略图 */}
                            <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden">
                              <img
                                src={image.src}
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
