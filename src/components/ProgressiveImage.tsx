import React, { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

/**
 * 渐进式图片加载组件
 * 
 * 功能：
 * 1. 初始显示模糊的占位色块/低质量预览
 * 2. 在后台加载高清图片
 * 3. 高清图片加载完成后平滑淡入
 * 
 * 使用方法：
 * <ProgressiveImage 
 *   src="/images/photo.jpg" 
 *   alt="图片描述" 
 *   className="w-full h-full object-cover"
 * />
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholderColor = '#e5e7eb', // 默认灰色占位
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 实现懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // 提前 100px 开始加载
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 预加载图片
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;
    
    if (img.complete) {
      setIsLoaded(true);
    } else {
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true); // 即使加载失败也显示
    }
  }, [isInView, src]);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* 模糊占位层 - 渐变动画背景 */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: `linear-gradient(
            135deg,
            ${placeholderColor} 0%,
            ${placeholderColor}dd 50%,
            ${placeholderColor} 100%
          )`,
          animation: isLoaded ? 'none' : 'shimmer 1.5s infinite',
        }}
      />
      
      {/* 实际图片 - 淡入效果 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* 内联样式：shimmer 动画 */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressiveImage;
