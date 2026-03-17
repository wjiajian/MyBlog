import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { usePosts } from './hooks/usePosts';
import { Album } from './components/Album';
import { Header } from './components/Header';
import { ContentTabs } from './components/ContentTabs';
import { Timeline } from './components/Timeline';
import type { ContentType } from './components/ContentTabs';


import { parseMonthFromDate } from './utils/date';

import { getAppTheme } from './utils/theme';
import { useThemeMode } from './hooks/useThemeMode';
import { usePageTitle } from './hooks/usePageTitle';
import { openPostLink } from './utils/navigation';
import { API_BASE_HINT } from './utils/api';

function App() {
  const { posts, isLoading, error, refresh } = usePosts();
  const [activeTab, setActiveTab] = useState<ContentType>('tech');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const currentCategory = searchParams.get('category');
  // 每年显示的文章数量
  const [postsPerYear, setPostsPerYear] = useState<Record<number, number>>({});
  // 已加载的年份数量
  const [visibleYearsCount, setVisibleYearsCount] = useState(2);
  const { darkMode } = useThemeMode();
  usePageTitle('首页');

  // 主题相关样式
  const theme = getAppTheme(darkMode);
  
  // 处理分类变更
  const handleCategoryChange = (category: string | null) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  // 处理搜索选择
  const handleSearchSelect = (postId: string) => {
    const matchedPost = posts.find((post) => post.id === postId);
    if (matchedPost) {
      openPostLink(matchedPost.link);
    }
  };

  // 根据 Tab 和分类筛选文章
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 先按 Tab 筛选（未设置 type 的视为 tech）
      const matchesTab = (post.type || 'tech') === activeTab;
      // 再按分类筛选
      const matchesCategory = !currentCategory || post.categories === currentCategory;
      return matchesTab && matchesCategory;
    });
  }, [posts, activeTab, currentCategory]);

  // 按年份分组文章
  const postsByYear = useMemo(() => {
    return filteredPosts.reduce((acc, post) => {
      if (!acc[post.year]) {
        acc[post.year] = [];
      }
      acc[post.year].push(post);
      return acc;
    }, {} as Record<number, typeof posts>);
  }, [filteredPosts]);

  const sortedYears = useMemo(() => {
    return Object.keys(postsByYear).map(Number).sort((a, b) => b - a);
  }, [postsByYear]);
  const resolvedActiveYear = activeYear ?? sortedYears[0] ?? null;

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
  const visibleYears = useMemo(() => {
    return sortedYears.slice(0, visibleYearsCount);
  }, [sortedYears, visibleYearsCount]);

  // 监听年份区块滚动，更新时间线高亮
  // 将 sortedYears 转换为字符串，避免数组引用变化触发无限循环
  const sortedYearsKey = sortedYears.join(',');
  
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
  }, [sortedYearsKey, isLoading]); // 添加 isLoading 依赖以确保加载完后重新监听

  // 生成时间线数据
  const timelineItems = useMemo(() => {
    return sortedYears.map(year => {
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
  }, [sortedYears, postsByYear]);

  // 点击时间线年份跳转
  const handleTimelineYearClick = (year: number) => {
    const element = document.getElementById(`year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const footerHeadingClass = `text-[1rem] font-medium tracking-wide ${
    darkMode ? 'text-white/85' : 'text-gray-700'
  }`;
  const footerLinkClass = `inline-flex items-center gap-1.5 text-[0.92rem] leading-relaxed transition-colors ${
    darkMode ? 'text-white/55 hover:text-white/85' : 'text-gray-600 hover:text-gray-900'
  }`;
  const footerMutedClass = darkMode ? 'text-white/50' : 'text-gray-600';

  return (
    // ====== 可配置项：主页背景 - 支持主题切换 ======
    <div className={`min-h-screen overflow-x-hidden pb-8 selection:bg-blue-500/20 ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? '' : 'bg-editions-gradient'}`} />
      
      <div className="relative z-10">
        <Header 
          onCategoryChange={handleCategoryChange}
          onSearchSelect={handleSearchSelect}
          currentCategory={currentCategory}
        />

        {/* 左侧时间线导航 */}
        <Timeline 
          items={timelineItems} 
          activeYear={resolvedActiveYear}
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

          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-40">
              <Loader2 size={48} className="animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className={`text-lg mb-3 ${theme.emptyText}`}>文章数据加载失败</p>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                请确认后端服务或 API 配置可用（{API_BASE_HINT}）
              </p>
              <button
                onClick={refresh}
                className={`px-5 py-2 rounded-xl border transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                重试加载
              </button>
            </div>
          ) : (
            <>
              {visibleYears.map((year, index) => {
                const yearPosts = postsByYear[year]
                  .slice()
                  .sort((a, b) => {
                    // 使用 _sortDate 进行排序会更准确，但这里保持原有逻辑兼容性
                    // 将 date 转换为 Date 对象比较
                    const dateA = new Date(a._sortDate || a.date);
                    const dateB = new Date(b._sortDate || b.date);
                    return dateB.getTime() - dateA.getTime();
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
                          <Album post={post} darkMode={darkMode} />
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
            </>
          )}

        </main>

        <footer className={`mt-10 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="max-w-[1080px] mx-auto px-6 py-6 sm:py-7">
            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3 md:justify-items-center md:gap-12">
              <section className="mx-auto max-w-xs">
                <h2 className={`text-[1.56rem] font-black tracking-tight leading-none ${darkMode ? 'text-white/92' : 'text-gray-900'}`}>
                  JiaJian
                </h2>
                <p className={`mt-2.5 text-[1rem] italic leading-snug ${footerMutedClass}`}>
                  已识乾坤大，犹怜草木青
                </p>

                <div className={`mt-4 space-y-1 text-[0.82rem] leading-relaxed ${footerMutedClass}`}>
                  <p>&copy; 2025-2026</p>
                  <p>
                    Powered by <span className={darkMode ? 'text-white/75' : 'text-gray-700'}>Cladue /</span> Gemini /{' '}
                    <span className={darkMode ? 'text-white/75' : 'text-gray-700'}>Codex.</span>
                  </p>
                  <p>
                    <a
                      href="https://icp.gov.moe/?keyword=20260255"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:underline"
                    >
                      萌ICP备20260255号
                    </a>
                  </p>
                </div>
              </section>

              <nav className="mx-auto flex w-full max-w-xs flex-col items-center space-y-2.5">
                <p className={footerHeadingClass}>更多</p>
                <div className="flex flex-col items-center space-y-2">
                  <Link
                    to="/gallery"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-[0.9rem] font-medium transition-colors ${
                      darkMode
                        ? 'border-cyan-400/35 text-cyan-300 hover:border-cyan-300/60 hover:text-cyan-200'
                        : 'border-cyan-700/25 text-cyan-700 hover:border-cyan-700/45 hover:text-cyan-800'
                    }`}
                  >
                    照片墙
                  </Link>
                  <Link to="/timeline" className={footerLinkClass}>时间线</Link>
                  <Link to="/friends" className={footerLinkClass}>友链</Link>
                </div>
              </nav>

              <nav className="mx-auto flex w-full max-w-xs flex-col items-center space-y-2.5">
                <p className={footerHeadingClass}>联系</p>
                <div className="flex flex-col items-center space-y-2">
                  <Link to="/message" className={footerLinkClass}>写留言</Link>
                  <a
                    href="mailto:jiajian2233@gmail.com"
                    className={footerLinkClass}
                  >
                    发邮件
                    <span className="text-[0.82rem]">↗</span>
                  </a>
                  <a
                    href="https://github.com/wjiajian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerLinkClass}
                  >
                    GitHub
                    <span className="text-[0.82rem]">↗</span>
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
export default App;
