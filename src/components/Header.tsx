import React from 'react';
import { Navigation } from './Navigation';

interface HeaderProps {
  onCategoryChange?: (category: string | null) => void;
  onSearchSelect?: (postId: string) => void;
  currentCategory?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onCategoryChange, 
  onSearchSelect,
  currentCategory 
}) => {
  return (
    // ====== 可配置项：亮色主题头部 ======
    // fixed: 固定定位，不随页面滚动
    <header className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-start pointer-events-none">
      <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        {/* ====== 可配置项：个性文本样式 ====== */}
        <h1 className="text-gray-600 text-lg font-semibold leading-relaxed tracking-wide">
          Everything I've built, written, and learned.
          <br />
          <span className="text-gray-900 font-bold text-xl">Archived in time.</span>
        </h1>
      </div>
      
      {/* 右侧导航栏 */}
      <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-xl border border-gray-200 shadow-sm">
        <Navigation 
          onCategoryChange={onCategoryChange}
          onSearchSelect={onSearchSelect}
          currentCategory={currentCategory}
        />
      </div>
    </header>
  );
};
