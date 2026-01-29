import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { posts } from './data/posts';
import { Album } from './components/Album';
import { Header } from './components/Header';
import { ContentTabs } from './components/ContentTabs';
import { Timeline } from './components/Timeline';
import type { ContentType } from './components/ContentTabs';


import { safeGetItem, safeSetItem } from './utils/storage';
import { parseMonthFromDate, parseDate } from './utils/date';

import { getAppTheme } from './utils/theme';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>('tech');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeYear, setActiveYear] = useState<number | null>(null);
  // 每年显示的文章数量
  const [postsPerYear, setPostsPerYear] = useState<Record<number, number>>({});
  // 已加载的年份数量
  const [visibleYearsCount, setVisibleYearsCount] = useState(2);
  // 主题状态：默认亮色
  const [darkMode, setDarkMode] = useState(() => {
    const saved = safeGetItem('blog-theme');
    return saved === 'dark';
  });

  // 保存主题偏好到localStorage
  useEffect(() => {
    safeSetItem('blog-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 主题相关样式
  const theme = getAppTheme(darkMode);
  
  const selectedPost = posts.find(p => p.id === selectedId);

  // 从 URL 读取分类参数
  useEffect(() => {
    const category = searchParams.get('category');
    setCurrentCategory(category);
  }, [searchParams]);

  // 处理分类变更
  const handleCategoryChange = (category: string | null) => {
    setCurrentCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  // 处理搜索选择
  const handleSearchSelect = (postId: string) => {
    setSelectedId(postId);
  };

  // 根据 Tab 和分类筛选文章
  const filteredPosts = posts.filter(post => {
    // 先按 Tab 筛选（未设置 type 的视为 tech）
    const matchesTab = (post.type || 'tech') === activeTab;
    // 再按分类筛选
    const matchesCategory = !currentCategory || post.categories === currentCategory;
    return matchesTab && matchesCategory;
  });

  // 按年份分组文章
  const postsByYear = filteredPosts.reduce((acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  }, {} as Record<number, typeof posts>);

  const sortedYears = Object.keys(postsByYear).map(Number).sort((a, b) => b - a);

  // 获取当前年份应显示的文章数
  const getVisiblePostsCount = (year: number) => postsPerYear[year] || 4;

  // 加载更多某年的文章
  const loadMorePostsForYear = (year: number) => {
    setPostsPerYear(prev => ({
      ...prev,
      [year]: (prev[year] || 4) + 4
    }));
  };

  // 加载更多年份
  const loadMoreYears = () => {
    setVisibleYearsCount(prev => prev + 1);
  };

  // 可见的年份列表
  const visibleYears = sortedYears.slice(0, visibleYearsCount);

  // 监听年份区块滚动，更新时间线高亮
  // 将 sortedYears 转换为字符串，避免数组引用变化触发无限循环
  const sortedYearsKey = sortedYears.join(',');
  
  // 初始化 activeYear
  useEffect(() => {
    if (activeYear === null && sortedYears.length > 0) {
      setActiveYear(sortedYears[0]);
    }
  }, [sortedYears.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    // 解析年份列表
    const years = sortedYearsKey.split(',').filter(Boolean).map(Number);
    if (years.length === 0) return;

    // 使用 IntersectionObserver 监听年份区块
    const observer = new IntersectionObserver(
      (entries) => {
        // 找出当前在视口中可见的年份
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const yearId = entry.target.id;
            const yearMatch = yearId.match(/^year-(\d+)$/);
            if (yearMatch) {
              setActiveYear(Number(yearMatch[1]));
              break;
            }
          }
        }
      },
      {
        root: null, // 视口
        rootMargin: '-20% 0px -60% 0px', // 上方留20%，下方留60%，中间区域触发
        threshold: 0.1,
      }
    );

    // 需要稍微延迟以确保 DOM 元素已渲染
    const timeoutId = setTimeout(() => {
      years.forEach((year) => {
        const element = document.getElementById(`year-${year}`);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [sortedYearsKey]);

  // 生成时间线数据
  const timelineItems = sortedYears.map(year => {
    const yearPosts = postsByYear[year];
    const monthMap: Record<number, number> = {};
    
    yearPosts.forEach(post => {
      // 从 date 字段解析月份 ("Jan 07" -> 1)
      const month = parseMonthFromDate(post.date);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const months = Object.entries(monthMap)
      .map(([m, count]) => ({ month: Number(m), count }))
      .sort((a, b) => b.month - a.month);

    return { year, months };
  });

  // 点击时间线年份跳转
  const handleTimelineYearClick = (year: number) => {
    const element = document.getElementById(`year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    // ====== 可配置项：主页背景 - 支持主题切换 ======
    <div className={`min-h-screen overflow-x-hidden pb-32 selection:bg-blue-500/20 ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? '' : 'bg-editions-gradient'}`} />
      
      <div className="relative z-10">
        <Header 
          onCategoryChange={handleCategoryChange}
          onSearchSelect={handleSearchSelect}
          currentCategory={currentCategory}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* 左侧时间线导航 */}
        <Timeline 
          items={timelineItems} 
          activeYear={activeYear}
          onYearClick={handleTimelineYearClick}
          darkMode={darkMode}
        />
        
        {/* 个性文本 - 随页面滚动 */}
        <div className="pt-8 px-6">
          <div className={`backdrop-blur-md px-4 py-3 rounded-xl border shadow-sm inline-block ${theme.tagline}`}>
            <h1 className={`text-lg font-semibold leading-relaxed tracking-wide ${theme.taglineText}`}>
              Everything I've built, written, and learned.
              <br />
              <span className={`font-bold text-xl ${theme.taglineHighlight}`}>Archived in time.</span>
            </h1>
          </div>
        </div>
        
        <main className="pt-8 md:pt-12 px-6 max-w-[1600px] mx-auto">
          
          {/* Tab 切换 */}
          <ContentTabs activeTab={activeTab} onTabChange={setActiveTab} darkMode={darkMode} />
          
          {/* 当前筛选提示 */}
          {currentCategory && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center gap-2"
            >
              <span className={theme.filterText}>当前分类：</span>
              <span className={`px-3 py-1 rounded-lg font-medium ${theme.filterBadge}`}>{currentCategory}</span>
              <button 
                onClick={() => handleCategoryChange(null)}
                className={`transition-colors cursor-pointer ${theme.filterClear}`}
              >
                清除筛选
              </button>
            </motion.div>
          )}

          {visibleYears.map((year, index) => {
            const yearPosts = postsByYear[year]
              .slice()
              .sort((a, b) => {
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                if (dateB.month !== dateA.month) return dateB.month - dateA.month;
                return dateB.day - dateA.day;
              });
            const visibleCount = getVisiblePostsCount(year);
            const visiblePosts = yearPosts.slice(0, visibleCount);
            const hasMorePosts = yearPosts.length > visibleCount;

            return (
            <div key={year} id={`year-${year}`} className="mb-32 scroll-mt-40">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`flex items-end gap-6 mb-12 border-b pb-4 ${theme.yearBorder}`}
              >
                  <h2 className={`text-7xl md:text-8xl font-bold tracking-tighter ${theme.yearTitle}`}>{year}</h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {visiblePosts.map((post, postIndex) => {
                  // 解析当前文章的月份
                  const currentMonth = parseMonthFromDate(post.date);
                  
                  // 检查是否是该月份的第一篇文章
                  const isFirstOfMonth = postIndex === 0 || (() => {
                    const prevPost = visiblePosts[postIndex - 1];
                    const prevMonth = parseMonthFromDate(prevPost.date);
                    return prevMonth !== currentMonth;
                  })();

                  return (
                    <motion.div 
                      key={post.id} 
                      id={isFirstOfMonth ? `year-${year}-month-${currentMonth}` : undefined}
                      className="relative group scroll-mt-40"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: postIndex * 0.05 }}
                    >
                       <div style={{ opacity: selectedId === post.id ? 0 : 1 }}>
                          <Album 
                            post={post} 
                            onExpand={() => setSelectedId(post.id)}
                            darkMode={darkMode}
                          />
                       </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 加载更多文章按钮 */}
              {hasMorePosts && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mt-8"
                >
                  <button
                    onClick={() => loadMorePostsForYear(year)}
                    className={`px-6 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600' 
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">更多文章</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      (+{Math.min(4, yearPosts.length - visibleCount)})
                    </span>
                  </button>
                </motion.div>
              )}

            </div>
          )})}

          {/* 加载更多年份按钮 */}
          {visibleYearsCount < sortedYears.length && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center py-8"
            >
              <button
                onClick={loadMoreYears}
                className={`flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border transition-all cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600' 
                    : 'bg-white/80 border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">加载更多年份</span>
                <ChevronDown size={20} className="animate-bounce" />
              </button>
            </motion.div>
          )}

          {/* 无结果提示 */}
          {sortedYears.length === 0 && (
            <div className="text-center py-20">
              <p className={`text-lg ${theme.emptyText}`}>该分类下暂无文章</p>
            </div>
          )}

        </main>
      </div>

      {/* 选中相册的全屏遮罩 */}
      {/* ====== 展开弹窗配置区域 ====== */}
      <AnimatePresence>
        {selectedId && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* ====== 可配置项：背景遮罩 ====== */}
            {/* bg-black/40: 背景透明度 (40%), 可调整为 bg-black/60 等 */}
            {/* backdrop-blur-sm: 模糊程度 (sm/md/lg/xl), 越大越模糊 */}
            {/* duration: 淡入淡出动画时长 (秒) */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelectedId(null)}
              className={`absolute inset-0 backdrop-blur-sm ${theme.overlay}`}
            />
            
            {/* ====== 可配置项：展开卡片容器 ====== */}
            {/* max-w-2xl: 最大宽度 (可调整为 max-w-xl/max-w-3xl/max-w-4xl/max-w-5xl) */}
            <div className="relative z-60 pointer-events-auto w-full max-w-2xl">
              <Album 
                post={selectedPost} 
                isExpanded={true} 
                onClose={() => setSelectedId(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
