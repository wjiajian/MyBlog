import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePosts, type Post } from '../hooks/usePosts';
import { Header } from '../components/Header';
import { useThemeMode } from '../hooks/useThemeMode';
import { usePageTitle } from '../hooks/usePageTitle';

// 预定义颜色池（Tailwind 颜色类）
const lightColorPool = [
  'text-blue-600',
  'text-purple-600',
  'text-pink-500',
  'text-emerald-600',
  'text-orange-500',
  'text-cyan-600',
  'text-rose-500',
  'text-indigo-600',
  'text-teal-600',
  'text-amber-600',
];

const darkColorPool = [
  'text-blue-300',
  'text-purple-300',
  'text-pink-300',
  'text-emerald-300',
  'text-orange-300',
  'text-cyan-300',
  'text-rose-300',
  'text-indigo-300',
  'text-teal-300',
  'text-amber-300',
];

// 根据分类名称自动生成颜色（基于字符串哈希）
const getCategoryColor = (category: string, darkMode: boolean): string => {
  if (!category) return darkMode ? 'text-white/50' : 'text-gray-500';
  
  // 简单哈希：计算字符 ASCII 码之和
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pool = darkMode ? darkColorPool : lightColorPool;
  return pool[hash % pool.length];
};

// 解析日期获取月日
const parseDate = (dateStr: string): { month: number; day: number } => {
  const monthMap: Record<string, number> = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  const parts = dateStr.split(' ');
  return {
    month: monthMap[parts[0]] || 1,
    day: parseInt(parts[1]) || 1
  };
};


export const TimelinePage: React.FC = () => {
  const { posts, isLoading } = usePosts();
  const { darkMode } = useThemeMode();
  usePageTitle('时间线');

  const theme = {
    page: darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-gray-900',
    title: darkMode ? 'text-white' : 'text-gray-900',
    stats: darkMode ? 'text-white/60' : 'text-gray-500',
    statsStrong: darkMode ? 'text-white/80' : 'text-gray-700',
    statsMuted: darkMode ? 'text-white/40' : 'text-gray-400',
    loader: darkMode ? 'text-white/40' : 'text-gray-400',
    yearMarker: darkMode ? 'bg-white/20' : 'bg-gray-300',
    yearTitle: darkMode ? 'text-white/80' : 'text-gray-800',
    yearCount: darkMode ? 'text-white/40' : 'text-gray-400',
    listBorder: darkMode ? 'border-white/10' : 'border-gray-200',
    dot: darkMode ? 'bg-pink-300 border-[#0a0a0a]' : 'bg-pink-400 border-white',
    date: darkMode ? 'text-white/40' : 'text-gray-400',
    link: darkMode ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-gray-900',
  };

  // 按年份分组文章
  const postsByYear = useMemo(() => {
    return posts.reduce((acc, post) => {
      if (!acc[post.year]) {
        acc[post.year] = [];
      }
      acc[post.year].push(post);
      return acc;
    }, {} as Record<number, Post[]>);
  }, [posts]);

  const sortedYears = useMemo(() => {
    return Object.keys(postsByYear).map(Number).sort((a, b) => b - a);
  }, [postsByYear]);

  const totalPosts = posts.length;

  // 计算年度进度
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const yearProgress = ((dayOfYear / totalDays) * 100).toFixed(4);

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? '' : 'bg-editions-gradient'}`} />
      
      <div className="relative z-10">
        <Header />

        <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 页面标题 */}
            <h1 className={`text-4xl font-bold mb-4 ${theme.title}`}>时间线</h1>
            
            {/* 统计信息 */}
            <div className={`mb-8 space-y-1 ${theme.stats}`}>
              <p>共有 <span className={`font-semibold ${theme.statsStrong}`}>{totalPosts}</span> 篇文章，再接再厉</p>
              <p className="text-sm">今天是 {now.getFullYear()} 年的第 {dayOfYear} 天</p>
              <p className="text-sm">今年已过 {yearProgress}%</p>
              <p className={`text-sm ${theme.statsMuted}`}>活在当下，珍惜眼下</p>
            </div>

            {/* 加载状态 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className={`animate-spin ${theme.loader}`} />
              </div>
            ) : (
              /* 时间线列表 */
              <div className="space-y-8">
                {sortedYears.map((year, yearIndex) => (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: yearIndex * 0.1 }}
                  >
                    {/* 年份标题 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-1 h-6 rounded-full ${theme.yearMarker}`} />
                      <h2 className={`text-xl font-bold ${theme.yearTitle}`}>{year}</h2>
                      <span className={`text-sm ${theme.yearCount}`}>({postsByYear[year].length})</span>
                    </div>

                    {/* 该年文章列表 */}
                    <div className={`ml-4 border-l-2 pl-6 space-y-3 ${theme.listBorder}`}>
                      {postsByYear[year]
                        .slice()
                        .sort((a, b) => {
                          const dateA = parseDate(a.date);
                          const dateB = parseDate(b.date);
                          // 降序排序：先按月份，再按日期
                          if (dateB.month !== dateA.month) return dateB.month - dateA.month;
                          return dateB.day - dateA.day;
                        })
                        .map((post, postIndex) => {
                        const { month, day } = parseDate(post.date);
                        const categoryColor = getCategoryColor(post.categories || '', darkMode);
                        
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: yearIndex * 0.1 + postIndex * 0.05 }}
                            className="relative flex items-start gap-4 group"
                          >
                            {/* 时间线圆点 */}
                            <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 shadow-sm ${theme.dot}`} />
                            
                            {/* 日期 */}
                            <span className={`text-sm font-mono w-12 flex-shrink-0 ${theme.date}`}>
                              {String(month).padStart(2, '0')}/{String(day).padStart(2, '0')}
                            </span>
                            
                            {/* 文章标题 */}
                            <Link
                              to={post.link}
                              className={`flex-1 transition-colors group-hover:underline ${theme.link}`}
                            >
                              {post.title}
                            </Link>
                            
                            {/* 分类标签 */}
                            {post.categories && (
                              <span className={`text-sm ${categoryColor} flex-shrink-0`}>
                                {post.categories}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
