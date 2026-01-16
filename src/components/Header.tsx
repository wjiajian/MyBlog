import React from 'react';
import { Navigation } from './Navigation';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onCategoryChange?: (category: string | null) => void;
  onSearchSelect?: (postId: string) => void;
  currentCategory?: string | null;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onCategoryChange, 
  onSearchSelect,
  currentCategory,
  darkMode = false,
  onToggleDarkMode
}) => {
  const navContainerClass = darkMode 
    ? 'bg-[#1a1a1a]/80 border-white/10' 
    : 'bg-white/80 border-gray-200';

  return (
    // ====== 可配置项：主题感知头部 ======
    // fixed: 固定定位，不随页面滚动
    <header className="fixed top-0 left-0 w-full p-8 z-50 flex justify-end items-start pointer-events-none">
      {/* 右侧导航栏 */}
      <div className={`pointer-events-auto backdrop-blur-md px-2 py-1.5 rounded-xl border shadow-sm flex items-center gap-2 ${navContainerClass}`}>
        <Navigation 
          onCategoryChange={onCategoryChange}
          onSearchSelect={onSearchSelect}
          currentCategory={currentCategory}
          darkMode={darkMode}
        />
        {/* 主题切换按钮 */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode 
                ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title={darkMode ? '切换到亮色主题' : '切换到暗色主题'}
          >
            {darkMode ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
