import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { posts } from './data/posts';
import { Album } from './components/Album';
import { Header } from './components/Header';
import { ContentTabs } from './components/ContentTabs';
import type { ContentType } from './components/ContentTabs';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>('tech');
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  // Group posts by year
  const postsByYear = filteredPosts.reduce((acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  }, {} as Record<number, typeof posts>);

  const sortedYears = Object.keys(postsByYear).map(Number).sort((a, b) => b - a);

  return (
    // ====== 可配置项：主页背景 ======
    // 亮色主题：bg-[#f8f9fa] 浅灰白背景, text-gray-900 深色文字
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 overflow-x-hidden pb-32 selection:bg-blue-500/20">
      <div className="fixed inset-0 bg-editions-gradient pointer-events-none z-0" />
      
      <div className="relative z-10">
        <Header 
          onCategoryChange={handleCategoryChange}
          onSearchSelect={handleSearchSelect}
          currentCategory={currentCategory}
        />
        
        <main className="pt-32 md:pt-40 px-6 max-w-[1600px] mx-auto">
          
          {/* Tab 切换 */}
          <ContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 当前筛选提示 */}
          {currentCategory && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center gap-2"
            >
              <span className="text-gray-500">当前分类：</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-medium">{currentCategory}</span>
              <button 
                onClick={() => handleCategoryChange(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                清除筛选
              </button>
            </motion.div>
          )}

          {sortedYears.map((year, index) => (
            <div key={year} className="mb-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                // ====== 可配置项：年份标题样式 ======
                className="flex items-end gap-6 mb-12 border-b border-gray-200 pb-4"
              >
                  {/* text-gray-300: 年份颜色加深 */}
                  <h2 className="text-8xl md:text-9xl font-bold tracking-tighter text-gray-300">{year}</h2>
                  <span className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4 ml-[-2rem]">Edition</span>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {postsByYear[year].map((post) => (
                  <div key={post.id} className="relative group">
                     <div style={{ opacity: selectedId === post.id ? 0 : 1 }}>
                        <Album 
                          post={post} 
                          onExpand={() => setSelectedId(post.id)}
                        />
                     </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 无结果提示 */}
          {sortedYears.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">该分类下暂无文章</p>
            </div>
          )}

        </main>
      </div>

      {/* Full Screen Overlay for Selected Album */}
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
