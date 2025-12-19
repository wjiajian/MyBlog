import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { posts } from './data/posts';
import { Album } from './components/Album';
import { Header } from './components/Header';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedPost = posts.find(p => p.id === selectedId);

  // Group posts by year
  const postsByYear = posts.reduce((acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  }, {} as Record<number, typeof posts>);

  const sortedYears = Object.keys(postsByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pb-32 selection:bg-white/20">
      <div className="fixed inset-0 bg-editions-gradient pointer-events-none z-0" />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-32 md:pt-40 px-6 max-w-[1600px] mx-auto">
          
          {sortedYears.map((year, index) => (
            <div key={year} className="mb-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="flex items-end gap-6 mb-12 border-b border-white/10 pb-4"
              >
                  <h2 className="text-8xl md:text-9xl font-bold tracking-tighter text-white/5">{year}</h2>
                  <span className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4 ml-[-2rem]">Edition</span>
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