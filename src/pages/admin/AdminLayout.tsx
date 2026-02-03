import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Home, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { logout, getUsername } from '../../utils/auth';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: <FileText size={20} />, label: '文章管理', path: '/admin/posts' },
  { icon: <Image size={20} />, label: '照片管理', path: '/admin/photos' },
];

/**
 * 管理后台布局组件
 * 统一使用网站亮色主题风格
 */
export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getUsername());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActivePath = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm"
      >
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-gray-800"
            >
              管理后台
            </motion.span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all ${
                isActivePath(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {item.icon}
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
              {isSidebarOpen && isActivePath(item.path) && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {/* 底部操作 */}
        <div className="p-3 border-t border-gray-100">
          {/* 返回前台 */}
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all mb-1"
          >
            <Home size={20} />
            {isSidebarOpen && <span className="font-medium">返回前台</span>}
          </a>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">退出登录</span>}
          </button>

          {/* 用户信息 */}
          {isSidebarOpen && username && (
            <div className="mt-3 px-3 py-2 text-xs text-gray-400">
              当前用户: {username}
            </div>
          )}
        </div>
      </motion.aside>

      {/* 主内容区 */}
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? 256 : 80 }}
      >
        <Outlet />
      </main>
    </div>
  );
};
