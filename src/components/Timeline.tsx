import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineItem {
  year: number;
  months: { month: number; count: number }[];
}

interface TimelineProps {
  items: TimelineItem[];
  activeYear: number | null;
  onYearClick: (year: number) => void;
  darkMode?: boolean;
}

// 月份名称映射
const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * 左侧时间线导航组件
 */
export const Timeline: React.FC<TimelineProps> = ({ items, activeYear, onYearClick, darkMode = false }) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 主题样式
  const theme = {
    button: darkMode 
      ? 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/15' 
      : 'bg-white/80 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-white',
    container: darkMode 
      ? 'bg-white/10 border-white/10' 
      : 'bg-white/80 border-gray-200',
    title: darkMode ? 'text-white/40' : 'text-gray-400',
    yearActive: darkMode ? 'bg-white text-black' : 'bg-gray-900 text-white',
    yearInactive: darkMode ? 'text-white/70 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100',
    monthBorder: darkMode ? 'border-white/20' : 'border-gray-200',
    monthText: darkMode ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900',
    monthCount: darkMode ? 'text-white/40' : 'text-gray-400',
  };

  // 当 activeYear 变化时展开对应年份
  useEffect(() => {
    if (activeYear) {
      setExpandedYear(activeYear);
    }
  }, [activeYear]);

  const handleYearClick = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
    onYearClick(year);
  };

  return (
    <>
      {/* 收起/展开按钮 - 固定居中，位置永不变化 */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden 2xl:flex fixed left-8 top-1/3 z-30 backdrop-blur-md rounded-xl border shadow-lg p-2.5 transition-colors cursor-pointer ${theme.button}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isCollapsed ? "展开时间线" : "收起时间线"}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isCollapsed ? -90 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </motion.svg>
      </motion.button>

      {/* 时间线内容 - 在按钮下方展开 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`hidden 2xl:block fixed left-8 z-30 backdrop-blur-md rounded-2xl border shadow-lg p-4 max-h-[50vh] overflow-y-auto scrollbar-hide ${theme.container}`}
            style={{ top: 'calc(33.33% + 48px)' }}
          >
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 ${theme.title}`}>时间线</h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.year}>
                  <button
                    onClick={() => handleYearClick(item.year)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                      activeYear === item.year
                        ? theme.yearActive
                        : theme.yearInactive
                    }`}
                  >
                    <span className="font-bold text-lg">{item.year}</span>
                    <span className="text-xs opacity-60">({item.months.reduce((sum, m) => sum + m.count, 0)})</span>
                  </button>
                  
                  {/* 展开的月份列表 */}
                  {expandedYear === item.year && item.months.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`ml-4 mt-1 space-y-1 border-l-2 pl-3 ${theme.monthBorder}`}
                    >
                      {item.months.map((m) => (
                        <li key={m.month}>
                          <button
                            onClick={() => {
                              const element = document.getElementById(`year-${item.year}-month-${m.month}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={`text-sm transition-colors block py-1 cursor-pointer text-left w-full ${theme.monthText}`}
                          >
                            {monthNames[m.month]} <span className={`text-xs ${theme.monthCount}`}>({m.count})</span>
                          </button>
                        </li>
                      ))}

                    </motion.ul>
                  )}
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};
