import React, { useEffect, useState } from 'react';
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
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const username = getUsername();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateView = (matches: boolean) => {
      setIsMobileView(matches);
      if (!matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    updateView(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      updateView(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActivePath = (path: string) => location.pathname.startsWith(path);
  const handleMobileNavigate = () => setIsMobileSidebarOpen(false);
  const desktopSidebarWidth = isDesktopSidebarOpen ? 256 : 80;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端侧边栏 */}
      {!isMobileView && (
        <motion.aside
          initial={false}
          animate={{ width: desktopSidebarWidth }}
          transition={{ duration: 0.3 }}
          className="bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm"
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            {isDesktopSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-gray-800"
              >
                管理后台
              </motion.span>
            )}
            <button
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isDesktopSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            >
              {isDesktopSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

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
                {isDesktopSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isDesktopSidebarOpen && isActivePath(item.path) && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all mb-1"
            >
              <Home size={20} />
              {isDesktopSidebarOpen && <span className="font-medium">返回前台</span>}
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={20} />
              {isDesktopSidebarOpen && <span className="font-medium">退出登录</span>}
            </button>

            {isDesktopSidebarOpen && username && (
              <div className="mt-3 px-3 py-2 text-xs text-gray-400">
                当前用户: {username}
              </div>
            )}
          </div>
        </motion.aside>
      )}

      {/* 移动端菜单按钮与抽屉 */}
      {isMobileView && (
        <>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 md:hidden"
            aria-label="打开侧边栏"
          >
            <Menu size={20} />
          </button>

          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="关闭侧边栏遮罩"
              />

              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute left-0 top-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl"
              >
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                  <span className="text-lg font-bold text-gray-800">管理后台</span>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="关闭侧边栏"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 py-4 px-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleMobileNavigate}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all ${
                        isActivePath(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                      {isActivePath(item.path) && (
                        <ChevronRight size={16} className="ml-auto" />
                      )}
                    </Link>
                  ))}
                </nav>

                <div className="p-3 border-t border-gray-100">
                  <a
                    href="/"
                    onClick={handleMobileNavigate}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all mb-1"
                  >
                    <Home size={20} />
                    <span className="font-medium">返回前台</span>
                  </a>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">退出登录</span>
                  </button>

                  {username && (
                    <div className="mt-3 px-3 py-2 text-xs text-gray-400">
                      当前用户: {username}
                    </div>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </>
      )}

      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isMobileView ? 0 : desktopSidebarWidth }}
      >
        <div className={isMobileView ? 'pt-16' : ''}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
