import React from 'react';
import { motion } from 'framer-motion';
import { List, ArrowUp, X } from 'lucide-react';
import type { TocItem } from './toc';

interface TableOfContentsProps {
  toc: TocItem[];
  activeId: string;
  readProgress: number;
  darkMode: boolean;
  isMobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  toc,
  activeId,
  readProgress,
  darkMode,
  isMobileOpen,
  onMobileOpen,
  onMobileClose,
}) => {
  if (toc.length === 0) return null;

  return (
    <>
      {/* Table of Contents - Desktop (Fixed on right side) */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="hidden 2xl:block fixed top-24 w-56 z-20"
        style={{ left: 'calc(50% + 448px + 1.5rem)' }}
      >
        <div
          className={`rounded-2xl p-5 max-h-[70vh] overflow-y-auto scrollbar-hide shadow-lg border ${
            darkMode ? 'bg-[#111111]/95 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-white/80' : 'text-gray-900'}`}>
            <List size={16} />
            目录
          </h3>
          <nav className="space-y-2">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                  }
                }}
                className={`block text-sm transition-all duration-200 rounded-lg px-3 py-1.5 ${
                  item.level === 1 ? 'font-medium' : ''
                } ${
                  item.level === 2 ? 'pl-5' : ''
                } ${
                  item.level === 3 ? 'pl-7 text-xs' : ''
                } ${
                  activeId === item.id
                    ? (darkMode
                      ? 'text-blue-300 bg-blue-500/10 border-l-2 border-blue-400 font-medium'
                      : 'text-blue-700 bg-blue-50 border-l-2 border-blue-700 font-medium')
                    : (darkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                {item.text}
              </a>
            ))}
          </nav>

          <hr className={`my-4 ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />

          <div className="space-y-3">
            {/* 阅读进度 */}
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className={darkMode ? 'text-white/20' : 'text-gray-200'} />
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  className="text-blue-500"
                  strokeDasharray={`${readProgress * 0.628} 62.8`}
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
              <span>{readProgress}%</span>
            </div>

            {/* 回到顶部 */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2 text-sm transition-colors ${
                darkMode ? 'text-white/60 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <ArrowUp size={16} />
              <span>回到顶部</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile TOC Trigger */}
      <button
        onClick={onMobileOpen}
        className={`fixed right-4 bottom-6 z-30 lg:hidden rounded-full border shadow-lg backdrop-blur-sm px-3 py-2 flex items-center gap-2 transition-colors ${
          darkMode
            ? 'bg-[#111111]/90 border-white/15 text-white/85 hover:bg-[#111111]'
            : 'bg-white/95 border-gray-200 text-gray-700 hover:bg-white'
        }`}
        aria-label="打开目录"
      >
        <List size={16} />
        <span className="text-sm font-medium">目录</span>
      </button>

      {/* Mobile TOC Bottom Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={onMobileClose}
            aria-label="关闭目录"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.25 }}
            className={`absolute bottom-0 left-0 right-0 rounded-t-2xl border-t shadow-2xl max-h-[78vh] flex flex-col ${
              darkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
              <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <List size={18} />
                目录
              </h3>
              <button
                onClick={onMobileClose}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 text-gray-500'
                }`}
                aria-label="关闭目录面板"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-2">
              <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-gray-500'}`}>
                阅读进度 {readProgress}%
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(item.id);
                    onMobileClose();
                    if (element) {
                      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                  }}
                  className={`block text-sm rounded-lg px-3 py-2 transition-colors ${
                    item.level === 2 ? 'pl-6' : ''
                  } ${
                    item.level === 3 ? 'pl-8 text-xs' : ''
                  } ${
                    activeId === item.id
                      ? (darkMode
                        ? 'bg-blue-500/15 text-blue-300'
                        : 'bg-blue-50 text-blue-700')
                      : (darkMode
                        ? 'text-white/75 hover:bg-white/5 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </motion.div>
        </div>
      )}

    </>
  );
};
