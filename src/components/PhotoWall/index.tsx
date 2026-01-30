import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { PhotoItem } from './types';
import { PhotoGrid } from './PhotoGrid';
import { Lightbox } from './Lightbox';

// 重新导出类型供外部使用
export type { PhotoItem };

export interface PhotoWallProps {
  images: PhotoItem[];
  columns?: number;
}

export const PhotoWall: React.FC<PhotoWallProps> = ({ 
  images, 
  columns = 4 
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  return (
    <>
      <PhotoGrid 
        images={images} 
        columns={columns} 
        onImageClick={setSelectedIndex} 
      />

      <AnimatePresence>
        {selectedIndex !== null && (
          <Lightbox
            images={images}
            selectedIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
            onPrev={navigatePrev}
            onNext={navigateNext}
            onNavigate={setSelectedIndex}
          />
        )}
      </AnimatePresence>
    </>
  );
};
