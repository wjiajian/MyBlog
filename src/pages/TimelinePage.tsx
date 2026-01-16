import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { posts } from '../data/posts';

// 预定义颜色池（Tailwind 颜色类）
const colorPool = [
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

// 根据分类名称自动生成颜色（基于字符串哈希）
const getCategoryColor = (category: string): string => {
  if (!category) return 'text-gray-500';
  
  // 简单哈希：计算字符 ASCII 码之和
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPool[hash % colorPool.length];
};


export const TimelinePage: React.FC = () => {
  // 按年份分组文章
  const postsByYear = posts.reduce((acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  }, {} as Record<number, typeof posts>);

  const sortedYears = Object.keys(postsByYear).map(Number).sort((a, b) => b - a);
  const totalPosts = posts.length;

  // 计算年度进度
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const yearProgress = ((dayOfYear / totalDays) * 100).toFixed(4);

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

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
      <div className="fixed inset-0 bg-editions-gradient pointer-events-none z-0" />
      
      <div className="relative z-10">
        {/* 返回按钮 */}
        <div className="fixed top-8 left-8 z-50">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回首页</span>
          </Link>
        </div>

        <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 页面标题 */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">时间线</h1>
            
            {/* 统计信息 */}
            <div className="text-gray-500 mb-8 space-y-1">
              <p>共有 <span className="font-semibold text-gray-700">{totalPosts}</span> 篇文章，再接再厉</p>
              <p className="text-sm">今天是 {now.getFullYear()} 年的第 {dayOfYear} 天</p>
              <p className="text-sm">今年已过 {yearProgress}%</p>
              <p className="text-sm text-gray-400">活在当下，珍惜眼下</p>
            </div>

            {/* 时间线列表 */}
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
                    <div className="w-1 h-6 bg-gray-300 rounded-full" />
                    <h2 className="text-xl font-bold text-gray-800">{year}</h2>
                    <span className="text-sm text-gray-400">({postsByYear[year].length})</span>
                  </div>

                  {/* 该年文章列表 */}
                  <div className="ml-4 border-l-2 border-gray-200 pl-6 space-y-3">
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
                      const categoryColor = getCategoryColor(post.categories || '');
                      
                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: yearIndex * 0.1 + postIndex * 0.05 }}
                          className="relative flex items-start gap-4 group"
                        >
                          {/* 时间线圆点 */}
                          <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-pink-400 rounded-full border-2 border-white shadow-sm" />
                          
                          {/* 日期 */}
                          <span className="text-sm text-gray-400 font-mono w-12 flex-shrink-0">
                            {String(month).padStart(2, '0')}/{String(day).padStart(2, '0')}
                          </span>
                          
                          {/* 文章标题 */}
                          <Link
                            to={post.link}
                            className="flex-1 text-gray-700 hover:text-gray-900 transition-colors group-hover:underline"
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
          </motion.div>
        </main>
      </div>
    </div>
  );
};
