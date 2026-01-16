import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Coffee } from 'lucide-react';

export type ContentType = 'tech' | 'life';

interface ContentTabsProps {
  activeTab: ContentType;
  onTabChange: (tab: ContentType) => void;
  darkMode?: boolean;
}

const tabs: { key: ContentType; label: string; icon: React.ReactNode }[] = [
  { key: 'tech', label: '技术笔记', icon: <BookOpen size={18} /> },
  { key: 'life', label: '生活随笔', icon: <Coffee size={18} /> },
];

export const ContentTabs: React.FC<ContentTabsProps> = ({ activeTab, onTabChange, darkMode = false }) => {
  const containerClass = darkMode 
    ? 'bg-white/10 border-white/10' 
    : 'bg-white/80 border-gray-200';
  
  const activeTextClass = darkMode ? 'text-white' : 'text-gray-900';
  const inactiveTextClass = darkMode ? 'text-white/60 hover:text-white/80' : 'text-gray-500 hover:text-gray-700';
  const activeBgClass = darkMode ? 'bg-white/15' : 'bg-gray-100';

  return (
    <div className="flex justify-center mb-8">
      <div className={`inline-flex items-center gap-2 p-1.5 backdrop-blur-md rounded-xl border shadow-sm ${containerClass}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
              activeTab === tab.key
                ? activeTextClass
                : inactiveTextClass
            }`}
          >
            {/* 选中态背景 */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTabBg"
                className={`absolute inset-0 rounded-lg ${activeBgClass}`}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {/* 内容 */}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
