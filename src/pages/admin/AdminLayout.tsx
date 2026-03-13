import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Menu, 
} from 'lucide-react';
import { logout, getUsername } from '../../utils/auth';
import { AdminSidebarPanel, type AdminNavItem } from '../../components/admin/AdminSidebarPanel';

const navItems: AdminNavItem[] = [
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
          className="fixed h-full z-40 shadow-sm"
        >
          <AdminSidebarPanel
            mode="desktop"
            collapsed={!isDesktopSidebarOpen}
            navItems={navItems}
            isActivePath={isActivePath}
            username={username}
            onLogout={handleLogout}
            onDesktopToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          />
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
                className="absolute left-0 top-0 h-full w-72 shadow-xl"
              >
                <AdminSidebarPanel
                  mode="mobile"
                  navItems={navItems}
                  isActivePath={isActivePath}
                  username={username}
                  onLogout={handleLogout}
                  onNavigate={handleMobileNavigate}
                  onMobileClose={() => setIsMobileSidebarOpen(false)}
                />
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
