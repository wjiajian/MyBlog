import React from 'react';
import { motion } from 'framer-motion';
import { List, ArrowUp } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 从 Markdown 内容中提取标题生成目录
export function extractToc(content: string): TocItem[] {
  // 1. 只移除代码块（```...```），不移除行内代码
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
  
  // 2. 提取标题
  const result: TocItem[] = [];
  const counts: Record<string, number> = {};
  const regex = /^(#{1,2})\s+(.+)$/gm;
  let m;

  while ((m = regex.exec(contentWithoutCodeBlocks)) !== null) {
    const level = m[1].length;
    const rawText = m[2].trim();
    const displayText = rawText.replace(/`([^`]+)`/g, '$1');
    
    const baseId = displayText
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!baseId) continue;

    let uniqueId = baseId;
    if (counts[baseId]) {
       uniqueId = `${baseId}-${counts[baseId]}`;
       counts[baseId]++;
    } else {
       counts[baseId] = 1;
    }
    
    result.push({ id: uniqueId, text: displayText, level });
  }
  return result;
}

interface TableOfContentsProps {
  toc: TocItem[];
  activeId: string;
  readProgress: number;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  toc,
  activeId,
  readProgress,
  isMobileOpen,
  onMobileClose
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
        <div className="bg-white border border-gray-200 rounded-2xl p-5 max-h-[70vh] overflow-y-auto scrollbar-hide shadow-lg">
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
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
                    ? 'text-blue-700 bg-blue-50 border-l-2 border-blue-700 font-medium'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.text}
              </a>
            ))}
          </nav>

          <hr className="my-4 border-gray-200" />

          <div className="space-y-3">
            {/* 阅读进度 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="text-gray-200" />
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
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowUp size={16} />
              <span>回到顶部</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile TOC Drawer */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onMobileClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 h-full w-72 bg-[#141414] border-l border-white/10 p-6 overflow-y-auto"
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <List size={20} />
              目录
            </h3>
            <nav className="space-y-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onMobileClose();
                    setTimeout(() => {
                      const element = document.getElementById(item.id);
                      if (element) {
                        const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                  className={`block text-sm transition-colors py-2 ${
                    item.level === 2 ? 'pl-4' : ''
                  } ${
                    item.level === 3 ? 'pl-8 text-xs' : ''
                  } ${
                    activeId === item.id
                      ? 'text-white font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
