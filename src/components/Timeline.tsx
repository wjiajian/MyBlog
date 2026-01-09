import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimelineItem {
  year: number;
  months: { month: number; count: number }[];
}

interface TimelineProps {
  items: TimelineItem[];
  activeYear: number | null;
  onYearClick: (year: number) => void;
}

// 月份名称映射
const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * 左侧时间线导航组件
 */
export const Timeline: React.FC<TimelineProps> = ({ items, activeYear, onYearClick }) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

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
    <nav className="hidden 2xl:block fixed left-8 top-1/2 -translate-y-1/2 z-30">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg p-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">时间线</h3>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.year}>
              <button
                onClick={() => handleYearClick(item.year)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                  activeYear === item.year
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
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
                  className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3"
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
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors block py-1 cursor-pointer text-left w-full"
                      >
                        {monthNames[m.month]} <span className="text-xs text-gray-400">({m.count})</span>
                      </button>
                    </li>
                  ))}

                </motion.ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
