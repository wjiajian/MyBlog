import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from './Navigation';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '../hooks/useThemeMode';

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
  const { darkMode, toggleDarkMode } = useThemeMode();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const HIDE_START_SCROLL_Y = 96;
    const DIRECTION_TRIGGER_DELTA = 10;

    const updateVisibility = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= HIDE_START_SCROLL_Y) {
        setIsVisible(true);
      } else if (delta > DIRECTION_TRIGGER_DELTA) {
        setIsVisible(false);
      } else if (delta < -DIRECTION_TRIGGER_DELTA) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateVisibility);
    };

    lastScrollYRef.current = Math.max(window.scrollY, 0);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navContainerClass = darkMode 
    ? 'bg-[#1a1a1a]/80 border-white/10' 
    : 'bg-white/80 border-gray-200';

  return (
    // ====== 可配置项：主题感知头部 ======
    // 固定定位：不随页面滚动
    <header
      className={`fixed top-0 left-0 w-full p-8 z-50 flex justify-end items-start pointer-events-none transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-[120%]'
      }`}
    >
      {/* 右侧导航栏 */}
      <div className={`pointer-events-auto backdrop-blur-md px-2 py-1.5 rounded-xl border shadow-sm flex items-center gap-2 ${navContainerClass}`}>
        <Navigation 
          onCategoryChange={onCategoryChange}
          onSearchSelect={onSearchSelect}
          currentCategory={currentCategory}
          darkMode={darkMode}
        />
        {/* 主题切换按钮 */}
        <button
          onClick={toggleDarkMode}
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
      </div>
    </header>
  );
};
