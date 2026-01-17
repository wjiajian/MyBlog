import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

// 友链数据
interface FriendLink {
  id: string;
  name: string;
  description: string;
  avatar: string;
  url: string;
}

// 示例友链数据（可以根据需要修改）
const friends: FriendLink[] = [
  {
    id: '1',
    name: '示例博客',
    description: '这是一个示例友链',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=example1',
    url: 'https://example.com',
  },
  {
    id: '2',
    name: '示例博客',
    description: '这是一个示例友链',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=example2',
    url: 'https://example.com',
  },
  {
    id: '3',
    name: '示例博客',
    description: '这是一个示例友链',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=example3',
    url: 'https://example.com',
  },
];

export const FriendsPage: React.FC = () => {
  // 主题状态
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('blog-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('blog-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 主题样式
  const theme = {
    page: darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-gray-900',
    card: darkMode 
      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
      : 'bg-white/80 border-gray-200 hover:bg-white',
    cardTitle: darkMode ? 'text-white' : 'text-gray-900',
    cardDesc: darkMode ? 'text-white/60' : 'text-gray-600',
    backButton: darkMode 
      ? 'bg-white/10 border-white/10 text-white/70 hover:text-white hover:bg-white/15' 
      : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900',
    themeButton: darkMode
      ? 'bg-white/10 border-white/10 text-white/70 hover:text-white hover:bg-white/15'
      : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900',
    subtitle: darkMode ? 'text-white/50' : 'text-gray-500',
  };

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? '' : 'bg-editions-gradient'}`} />
      
      <div className="relative z-10">
        {/* 返回按钮 */}
        <div className="fixed top-8 left-8 z-50">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-xl border shadow-sm transition-colors cursor-pointer ${theme.backButton}`}
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回首页</span>
          </Link>
        </div>

        {/* 主题切换按钮 */}
        <div className="fixed top-8 right-8 z-50">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 backdrop-blur-md rounded-xl border shadow-sm transition-colors cursor-pointer ${theme.themeButton}`}
            title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 页面标题 */}
            <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              友情链接
            </h1>
            <p className={`mb-12 ${theme.subtitle}`}>
              这里是我的朋友们～ 感谢你们的陪伴！
            </p>

            {/* 友链卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend, index) => (
                <motion.a
                  key={friend.id}
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`group block p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer ${theme.card}`}
                >
                  <div className="flex items-start gap-4">
                    {/* 头像 */}
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* 名称 */}
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${theme.cardTitle}`}>
                          {friend.name}
                        </h3>
                        <ExternalLink 
                          size={14} 
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white/50' : 'text-gray-400'}`} 
                        />
                      </div>
                      
                      {/* 描述 */}
                      <p className={`text-sm mt-1 line-clamp-2 ${theme.cardDesc}`}>
                        {friend.description}
                      </p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* 申请友链提示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`mt-16 text-center ${theme.subtitle}`}
            >
              <p className="text-sm">
                想要交换友链？欢迎联系我！
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
